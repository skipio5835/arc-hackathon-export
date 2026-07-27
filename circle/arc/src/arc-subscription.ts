import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  http,
  isAddress,
  keccak256,
  parseEther,
  toBytes,
} from "viem";
import type { Address, EIP1193Provider, Hash } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

type InjectedProvider = EIP1193Provider & {
  isMetaMask?: boolean;
  providers?: Array<EIP1193Provider & { isMetaMask?: boolean }>;
};

type SubscriptionStatus = "draft" | "plan-created" | "subscribed" | "cancelled";

type SubscriptionRecord = {
  id: string;
  planId: Hash;
  merchant: Address;
  price: string;
  periodDays: number;
  cycles: number;
  metadataURI: string;
  status: SubscriptionStatus;
  contractAddress?: Address;
  planTxHash?: Hash;
  subscribeTxHash?: Hash;
  cancelTxHash?: Hash;
  paidThrough?: string;
  createdAt: string;
  updatedAt: string;
};

type Artifact = {
  abi: unknown[];
  bytecode: Hash;
};

const ARC_TESTNET = {
  chainId: "0x4cef52",
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
} as const;

const CIRCLE_WALLET = "0x78131700be4a8f2d16eeb0cba3498d2e717f2cd3" as Address;
const STORAGE_KEY = "arcSubscription.records";
const CONTRACT_KEY = "arcSubscription.contractAddress";
const DAY_SECONDS = 86_400;

const arcSubscriptionAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "planId", type: "bytes32" },
      { internalType: "address", name: "merchant", type: "address" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint64", name: "periodSeconds", type: "uint64" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createPlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "planId", type: "bytes32" },
      { internalType: "uint64", name: "cycles", type: "uint64" },
    ],
    name: "subscribe",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "planId", type: "bytes32" }],
    name: "cancelSubscription",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "planId", type: "bytes32" },
      { internalType: "address", name: "subscriber", type: "address" },
    ],
    name: "getSubscription",
    outputs: [
      {
        components: [
          { internalType: "address", name: "subscriber", type: "address" },
          { internalType: "bytes32", name: "planId", type: "bytes32" },
          { internalType: "uint64", name: "paidThrough", type: "uint64" },
          { internalType: "bool", name: "active", type: "bool" },
        ],
        internalType: "struct ArcSubscription.Subscription",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});

let walletClient: ReturnType<typeof createWalletClient> | null = null;
let selectedProvider: EIP1193Provider | null = null;
let account: Address | null = null;
let records: SubscriptionRecord[] = loadRecords();
let selectedId = records[0]?.id ?? "";
let contractAddress = (localStorage.getItem(CONTRACT_KEY) ?? "") as Address | "";

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  merchant: document.querySelector<HTMLInputElement>("#merchant")!,
  price: document.querySelector<HTMLInputElement>("#price")!,
  periodDays: document.querySelector<HTMLInputElement>("#periodDays")!,
  cycles: document.querySelector<HTMLInputElement>("#cycles")!,
  reference: document.querySelector<HTMLInputElement>("#reference")!,
  createDraft: document.querySelector<HTMLButtonElement>("#createDraft")!,
  createPlan: document.querySelector<HTMLButtonElement>("#createPlan")!,
  subscribe: document.querySelector<HTMLButtonElement>("#subscribe")!,
  cancelSubscription: document.querySelector<HTMLButtonElement>("#cancelSubscription")!,
  refreshSelected: document.querySelector<HTMLButtonElement>("#refreshSelected")!,
  subscriptionRows: document.querySelector<HTMLElement>("#subscriptionRows")!,
  selectedStatus: document.querySelector<HTMLElement>("#selectedStatus")!,
  receipt: document.querySelector<HTMLElement>("#receipt")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
};

el.contractAddress.value = contractAddress;
el.merchant.value = CIRCLE_WALLET;
el.price.value = "0.003";
el.periodDays.value = "7";
el.cycles.value = "1";
el.reference.value = `arc-subscription-${new Date().toISOString().slice(0, 10)}`;

function loadRecords(): SubscriptionRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as SubscriptionRecord[];
  } catch {
    return [];
  }
}

function saveRecords(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function selectedRecord(): SubscriptionRecord | undefined {
  return records.find((record) => record.id === selectedId);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

function shortHash(value?: string): string {
  if (!value) return "-";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function txUrl(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`;
}

function addressUrl(address: string): string {
  return `https://testnet.arcscan.app/address/${address}`;
}

function setStatus(message: string): void {
  el.statusLine.textContent = message;
}

function errorMessage(error: unknown): string {
  console.error(error);
  return error instanceof Error ? error.message : "Unknown error.";
}

async function getEthereumProvider(): Promise<EIP1193Provider> {
  const injected = window.ethereum as InjectedProvider | undefined;
  const legacyMetaMask = injected?.providers?.find((provider) => provider.isMetaMask);
  if (legacyMetaMask) return legacyMetaMask;
  if (injected?.isMetaMask) return injected;

  const announced: Array<{ provider: EIP1193Provider; name?: string; rdns?: string }> = [];
  const onAnnounce = (event: Event): void => {
    const detail = (event as CustomEvent).detail as
      | { info?: { name?: string; rdns?: string }; provider?: EIP1193Provider }
      | undefined;
    if (detail?.provider) {
      announced.push({ provider: detail.provider, name: detail.info?.name, rdns: detail.info?.rdns });
    }
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((resolve) => setTimeout(resolve, 250));
  window.removeEventListener("eip6963:announceProvider", onAnnounce);

  const metaMask = announced.find((item) => `${item.name ?? ""} ${item.rdns ?? ""}`.toLowerCase().includes("metamask"));
  if (metaMask) return metaMask.provider;
  if (injected) return injected;
  throw new Error("MetaMask provider not found.");
}

async function ensureArc(): Promise<void> {
  const provider = selectedProvider ?? (await getEthereumProvider());
  selectedProvider = provider;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET.chainId }],
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [ARC_TESTNET],
    });
  }
}

async function refreshBalance(): Promise<void> {
  if (!account) return;
  const balance = await publicClient.getBalance({ address: account });
  el.nativeBalance.textContent = `${formatEther(balance)} USDC`;
}

async function connect(): Promise<void> {
  try {
    setStatus("Connecting wallet...");
    const provider = await getEthereumProvider();
    selectedProvider = provider;
    await ensureArc();
    const accounts = (await provider.request({ method: "eth_requestAccounts" })) as Address[];
    account = accounts[0] ?? null;
    if (!account) throw new Error("No wallet account returned.");

    walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport: custom(provider),
    });

    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    await refreshBalance();
    updateActions();
    setStatus("Wallet ready.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

function randomPlanId(reference: string): Hash {
  const random = new Uint32Array(4);
  crypto.getRandomValues(random);
  return keccak256(toBytes(`${reference}:${Date.now()}:${Array.from(random).join(":")}`));
}

function statusClass(status: SubscriptionStatus): string {
  return `status ${status.replace("plan-created", "created")}`;
}

function receiptField(label: string, value: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`;
}

function renderRows(): void {
  el.subscriptionRows.innerHTML = records
    .map((record) => {
      const selected = record.id === selectedId ? "true" : "false";
      return `
        <tr data-selected="${selected}">
          <td>${escapeHtml(record.id)}</td>
          <td>${escapeHtml(record.price)} USDC</td>
          <td>${record.periodDays}d</td>
          <td><span class="${statusClass(record.status)}">${record.status}</span></td>
          <td><button class="select-row secondary" data-id="${escapeHtml(record.id)}" type="button">Select</button></td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll<HTMLButtonElement>(".select-row").forEach((button) => {
    button.addEventListener("click", () => {
      selectedId = button.dataset.id ?? "";
      render();
    });
  });
}

function renderReceipt(): void {
  const record = selectedRecord();
  if (!record) {
    el.selectedStatus.className = "status draft";
    el.selectedStatus.textContent = "draft";
    el.receipt.innerHTML = receiptField("Plan", "-") + receiptField("Price", "-");
    return;
  }

  const contract = record.contractAddress ?? contractAddress;
  const contractLink = contract
    ? `<a href="${addressUrl(contract)}" target="_blank" rel="noreferrer">${shortHash(contract)}</a>`
    : "-";
  const planTx = record.planTxHash
    ? `<a href="${txUrl(record.planTxHash)}" target="_blank" rel="noreferrer">${shortHash(record.planTxHash)}</a>`
    : "-";
  const subTx = record.subscribeTxHash
    ? `<a href="${txUrl(record.subscribeTxHash)}" target="_blank" rel="noreferrer">${shortHash(record.subscribeTxHash)}</a>`
    : "-";
  const cancelTx = record.cancelTxHash
    ? `<a href="${txUrl(record.cancelTxHash)}" target="_blank" rel="noreferrer">${shortHash(record.cancelTxHash)}</a>`
    : "-";

  el.selectedStatus.className = statusClass(record.status);
  el.selectedStatus.textContent = record.status;
  el.receipt.innerHTML = [
    receiptField("Plan ID", `<code>${record.planId}</code>`),
    receiptField("Contract", contractLink),
    receiptField("Merchant", `<code>${record.merchant}</code>`),
    receiptField("Price", `${escapeHtml(record.price)} USDC`),
    receiptField("Period", `${record.periodDays} days`),
    receiptField("Cycles", String(record.cycles)),
    receiptField("Paid through", record.paidThrough ?? "-"),
    receiptField("Plan tx", planTx),
    receiptField("Subscribe tx", subTx),
    receiptField("Cancel tx", cancelTx),
    receiptField("Metadata", escapeHtml(record.metadataURI)),
  ].join("");
}

function updateActions(): void {
  const record = selectedRecord();
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));

  el.deployContract.disabled = !hasWallet;
  el.saveContract.disabled = false;
  el.createDraft.disabled = !hasWallet;
  el.createPlan.disabled = !hasWallet || !hasContract || !record || record.status !== "draft";
  el.subscribe.disabled = !hasWallet || !hasContract || !record || record.status !== "plan-created";
  el.cancelSubscription.disabled = !hasWallet || !hasContract || !record || record.status !== "subscribed";
  el.refreshSelected.disabled = !hasContract || !record;
}

function render(): void {
  renderRows();
  renderReceipt();
  updateActions();
}

function createDraft(): void {
  if (!account) {
    setStatus("Connect MetaMask first.");
    return;
  }

  const merchant = el.merchant.value.trim();
  const price = el.price.value.trim();
  const periodDays = Number(el.periodDays.value.trim());
  const cycles = Number(el.cycles.value.trim());
  const reference = el.reference.value.trim();

  if (!isAddress(merchant)) {
    setStatus("Merchant must be a valid EVM address.");
    return;
  }
  if (!/^\d+(\.\d+)?$/.test(price) || Number(price) <= 0) {
    setStatus("Price must be a positive number.");
    return;
  }
  if (!Number.isInteger(periodDays) || periodDays <= 0) {
    setStatus("Period days must be a positive integer.");
    return;
  }
  if (!Number.isInteger(cycles) || cycles <= 0) {
    setStatus("Cycles must be a positive integer.");
    return;
  }
  if (!reference) {
    setStatus("Reference is required.");
    return;
  }

  const now = new Date().toISOString();
  const record: SubscriptionRecord = {
    id: reference,
    planId: randomPlanId(reference),
    merchant,
    price,
    periodDays,
    cycles,
    metadataURI: `local:${reference}`,
    status: "draft",
    contractAddress: contractAddress || undefined,
    createdAt: now,
    updatedAt: now,
  };

  records = [record, ...records.filter((item) => item.id !== reference)];
  selectedId = record.id;
  saveRecords();
  render();
  setStatus("Subscription draft created.");
}

async function deployContract(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account) return;

  try {
    el.deployContract.disabled = true;
    setStatus("Deploying ArcSubscription contract...");
    const artifact = (await fetch("/public/artifacts/ArcSubscription.json").then((response) => response.json())) as Artifact;
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      account,
      chain: arcTestnet,
    });
    setStatus(`Deploy submitted: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) throw new Error("Deployment receipt did not include a contract address.");

    contractAddress = receipt.contractAddress;
    el.contractAddress.value = contractAddress;
    localStorage.setItem(CONTRACT_KEY, contractAddress);
    updateActions();
    setStatus(`ArcSubscription deployed at ${contractAddress}.`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    el.deployContract.disabled = false;
  }
}

function saveContract(): void {
  const value = el.contractAddress.value.trim();
  if (!value) {
    contractAddress = "" as Address;
    localStorage.removeItem(CONTRACT_KEY);
    updateActions();
    setStatus("Contract address cleared.");
    return;
  }
  if (!isAddress(value)) {
    setStatus("Contract address must be valid.");
    return;
  }

  contractAddress = value as Address;
  localStorage.setItem(CONTRACT_KEY, contractAddress);
  updateActions();
  setStatus("Contract address saved.");
}

function subscriptionFromRaw(value: unknown): { active: boolean; paidThrough: bigint; subscriber: Address } {
  if (Array.isArray(value)) {
    return {
      subscriber: value[0] as Address,
      paidThrough: value[2] as bigint,
      active: Boolean(value[3]),
    };
  }

  const object = value as { active?: boolean; paidThrough?: bigint; subscriber?: Address };
  return {
    subscriber: object.subscriber ?? "0x0000000000000000000000000000000000000000",
    paidThrough: object.paidThrough ?? 0n,
    active: Boolean(object.active),
  };
}

async function refreshSelected(): Promise<void> {
  const record = selectedRecord();
  if (!record || !contractAddress || !account) return;

  try {
    setStatus("Reading subscription state...");
    const rawSubscription = await publicClient.readContract({
      address: contractAddress,
      abi: arcSubscriptionAbi,
      functionName: "getSubscription",
      args: [record.planId, account],
    });
    const subscription = subscriptionFromRaw(rawSubscription);

    if (subscription.subscriber !== "0x0000000000000000000000000000000000000000") {
      record.status = subscription.active ? "subscribed" : "cancelled";
      if (subscription.paidThrough > 0n) {
        record.paidThrough = new Date(Number(subscription.paidThrough) * 1000).toISOString();
      }
    }
    record.updatedAt = new Date().toISOString();
    saveRecords();
    render();
    setStatus("Subscription state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createPlan(): Promise<void> {
  const record = selectedRecord();
  if (!record || !walletClient || !account || !contractAddress) return;

  try {
    el.createPlan.disabled = true;
    setStatus("Creating subscription plan...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSubscriptionAbi,
      functionName: "createPlan",
      args: [
        record.planId,
        record.merchant,
        parseEther(record.price),
        BigInt(record.periodDays * DAY_SECONDS),
        record.metadataURI,
      ],
      account,
      chain: arcTestnet,
    });
    setStatus(`Plan submitted: ${hash}`);
    await publicClient.waitForTransactionReceipt({ hash });

    record.status = "plan-created";
    record.contractAddress = contractAddress;
    record.planTxHash = hash;
    record.updatedAt = new Date().toISOString();
    saveRecords();
    render();
    setStatus(`Plan created: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function subscribe(): Promise<void> {
  const record = selectedRecord();
  if (!record || !walletClient || !account || !contractAddress) return;

  try {
    el.subscribe.disabled = true;
    setStatus("Paying subscription...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSubscriptionAbi,
      functionName: "subscribe",
      args: [record.planId, BigInt(record.cycles)],
      account,
      chain: arcTestnet,
      value: parseEther(record.price) * BigInt(record.cycles),
    });
    setStatus(`Subscribe submitted: ${hash}`);
    await publicClient.waitForTransactionReceipt({ hash });

    record.status = "subscribed";
    record.subscribeTxHash = hash;
    record.updatedAt = new Date().toISOString();
    saveRecords();
    await refreshBalance();
    await refreshSelected();
    setStatus(`Subscription paid: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function cancelSubscription(): Promise<void> {
  const record = selectedRecord();
  if (!record || !walletClient || !account || !contractAddress) return;

  try {
    el.cancelSubscription.disabled = true;
    setStatus("Cancelling subscription...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSubscriptionAbi,
      functionName: "cancelSubscription",
      args: [record.planId],
      account,
      chain: arcTestnet,
    });
    setStatus(`Cancel submitted: ${hash}`);
    await publicClient.waitForTransactionReceipt({ hash });

    record.status = "cancelled";
    record.cancelTxHash = hash;
    record.updatedAt = new Date().toISOString();
    saveRecords();
    render();
    setStatus(`Subscription cancelled: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.connect.addEventListener("click", () => void connect());
el.deployContract.addEventListener("click", () => void deployContract());
el.saveContract.addEventListener("click", saveContract);
el.createDraft.addEventListener("click", createDraft);
el.createPlan.addEventListener("click", () => void createPlan());
el.subscribe.addEventListener("click", () => void subscribe());
el.cancelSubscription.addEventListener("click", () => void cancelSubscription());
el.refreshSelected.addEventListener("click", () => void refreshSelected());
el.contractAddress.addEventListener("input", updateActions);

render();
