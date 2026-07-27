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

type Artifact = {
  abi: unknown[];
  bytecode: Hash;
};

type CashbackSummary = {
  creator: Address;
  recipient: Address;
  amount: bigint;
  claimedAmount: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  closed: boolean;
  CashbackRef: string;
  metadataURI: string;
  claimURI: string;
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

const CONTRACT_KEY = "ArcCashbackVault.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcCashbackAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "CashbackId", type: "bytes32" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint64", name: "expiresAt", type: "uint64" },
      { internalType: "string", name: "CashbackRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createCashback",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "CashbackId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
      { internalType: "string", name: "claimURI", type: "string" },
    ],
    name: "claimCashback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "CashbackId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closeCashback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "CashbackId", type: "bytes32" }],
    name: "getCashback",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "claimedAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "expiresAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "CashbackRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "claimURI", type: "string" },
        ],
        internalType: "struct ArcCashbackVault.Cashback",
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
let contractAddress = (localStorage.getItem(CONTRACT_KEY) ?? "") as Address | "";
let currentCashback: CashbackSummary | null = null;

const el = {
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  CashbackId: document.querySelector<HTMLElement>("#CashbackId")!,
  CashbackStatus: document.querySelector<HTMLElement>("#CashbackStatus")!,
  claimValue: document.querySelector<HTMLElement>("#claimValue")!,
  closeCashback: document.querySelector<HTMLButtonElement>("#closeCashback")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createCashback: document.querySelector<HTMLButtonElement>("#createCashback")!,
  creatorAddress: document.querySelector<HTMLElement>("#creatorAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  label: document.querySelector<HTMLInputElement>("#label")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  recipientAddress: document.querySelector<HTMLElement>("#recipientAddress")!,
  claimCashback: document.querySelector<HTMLButtonElement>("#claimCashback")!,
  claimTo: document.querySelector<HTMLInputElement>("#claimTo")!,
  claimURI: document.querySelector<HTMLInputElement>("#claimURI")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.amount.value = "0.005";
el.contractAddress.value = contractAddress;
el.label.value = `arc-cashback-${today}`;
el.metadataURI.value = `local:arc-cashback-${today}`;
el.recipient.value = DEFAULT_ACCOUNT;
el.claimTo.value = DEFAULT_ACCOUNT;
el.claimURI.value = `local:arc-cashback-${today}:claimed`;
el.refundTo.value = DEFAULT_ACCOUNT;

const params = new URLSearchParams(window.location.search);

function applyParam(name: string, input: HTMLInputElement): void {
  const value = params.get(name)?.trim();
  if (value) input.value = value;
}

applyParam("label", el.label);
applyParam("recipient", el.recipient);
applyParam("amount", el.amount);
applyParam("metadataURI", el.metadataURI);
applyParam("claimTo", el.claimTo);
applyParam("claimURI", el.claimURI);
applyParam("refundTo", el.refundTo);
applyParam("contract", el.contractAddress);

if (el.contractAddress.value && isAddress(el.contractAddress.value)) {
  contractAddress = el.contractAddress.value as Address;
  localStorage.setItem(CONTRACT_KEY, contractAddress);
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

function txUrl(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`;
}

function addressUrl(address: string): string {
  return `https://testnet.arcscan.app/address/${address}`;
}

function shortValue(value?: string): string {
  if (!value || value === ZERO_ADDRESS) return "-";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function setStatus(message: string, hash?: Hash): void {
  el.statusLine.innerHTML = hash
    ? `${escapeHtml(message)} <a href="${txUrl(hash)}" target="_blank" rel="noreferrer">${hash}</a>`
    : escapeHtml(message);
}

function errorMessage(error: unknown): string {
  console.error(error);
  return error instanceof Error ? error.message : "Unknown error.";
}

function CashbackId(): Hash {
  const label = el.label.value.trim();
  if (!label) throw new Error("Label is required.");
  const creator = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${creator}:${label}`));
}

function CashbackFromRaw(value: unknown): CashbackSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<CashbackSummary>;
    return {
      creator: object.creator ?? ZERO_ADDRESS,
      recipient: object.recipient ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      claimedAmount: object.claimedAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      expiresAt: object.expiresAt ?? 0n,
      closed: Boolean(object.closed),
      CashbackRef: object.CashbackRef ?? "",
      metadataURI: object.metadataURI ?? "",
      claimURI: object.claimURI ?? "",
    };
  }

  return {
    creator: value[0] as Address,
    recipient: value[1] as Address,
    amount: value[2] as bigint,
    claimedAmount: value[3] as bigint,
    createdAt: value[4] as bigint,
    expiresAt: value[5] as bigint,
    closed: Boolean(value[6]),
    CashbackRef: value[7] as string,
    metadataURI: value[8] as string,
    claimURI: value[9] as string,
  };
}

function updateCashbackIdDisplay(): void {
  try {
    el.CashbackId.textContent = CashbackId();
  } catch {
    el.CashbackId.textContent = "-";
  }
}

function renderCashback(): void {
  updateCashbackIdDisplay();

  if (!currentCashback || currentCashback.creator === ZERO_ADDRESS) {
    el.CashbackStatus.textContent = "not created";
    el.claimValue.textContent = "0 USDC";
    el.creatorAddress.textContent = "-";
    el.recipientAddress.textContent = "-";
    updateActions();
    return;
  }

  const available = currentCashback.amount - currentCashback.claimedAmount;
  el.CashbackStatus.textContent = currentCashback.closed
    ? "closed"
    : currentCashback.claimedAmount > 0n
      ? "claimed"
      : "funded";
  el.claimValue.textContent = `${formatEther(currentCashback.claimedAmount)} / ${formatEther(
    currentCashback.amount,
  )} USDC claimed, ${formatEther(available)} USDC remaining`;
  el.creatorAddress.innerHTML = `<a href="${addressUrl(currentCashback.creator)}" target="_blank" rel="noreferrer">${shortValue(
    currentCashback.creator,
  )}</a>`;
  el.recipientAddress.innerHTML = `<a href="${addressUrl(
    currentCashback.recipient,
  )}" target="_blank" rel="noreferrer">${shortValue(currentCashback.recipient)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasCard = Boolean(currentCashback && currentCashback.creator !== ZERO_ADDRESS);
  const open = hasCard && !currentCashback?.closed;
  const claimable = open && currentCashback?.claimedAmount === 0n;

  el.closeCashback.disabled = !hasWallet || !hasContract || !open;
  el.createCashback.disabled = !hasWallet || !hasContract || hasCard;
  el.deployContract.disabled = !hasWallet;
  el.claimCashback.disabled = !hasWallet || !hasContract || !claimable;
  el.refresh.disabled = !hasContract;
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

    el.recipient.value = account;
    el.claimTo.value = account;
    el.refundTo.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateCashbackIdDisplay();
    await refreshBalance();
    updateActions();
    setStatus("Wallet ready.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function deployContract(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account) return;

  try {
    el.deployContract.disabled = true;
    setStatus("Deploying ArcCashbackVault...");
    const artifact = (await fetch("/public/artifacts/ArcCashbackVault.json").then((response) =>
      response.json(),
    )) as Artifact;
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      account,
      chain: arcTestnet,
    });
    setStatus("Deploy submitted:", hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) throw new Error("Deployment receipt did not include a contract address.");

    contractAddress = receipt.contractAddress;
    el.contractAddress.value = contractAddress;
    localStorage.setItem(CONTRACT_KEY, contractAddress);
    setStatus(`ArcCashbackVault deployed at ${contractAddress}.`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

function saveContract(): void {
  const value = el.contractAddress.value.trim();
  if (!value) {
    contractAddress = "" as Address;
    localStorage.removeItem(CONTRACT_KEY);
    currentCashback = null;
    renderCashback();
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

async function refreshCashback(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading Cashback state...");
    const rawCard = await publicClient.readContract({
      address: contractAddress,
      abi: arcCashbackAbi,
      functionName: "getCashback",
      args: [CashbackId()],
    });
    currentCashback = CashbackFromRaw(rawCard);
    renderCashback();
    setStatus("Cashback state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createCashback(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createCashback.disabled = true;
    const recipient = el.recipient.value.trim();
    const label = el.label.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(recipient)) throw new Error("recipient must be a valid EVM address.");
    if (!label) throw new Error("Label is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    const amount = parseEther(el.amount.value.trim());

    setStatus("Creating Cashback...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcCashbackAbi,
      functionName: "createCashback",
      args: [CashbackId(), recipient as Address, 0n, label, metadataURI],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshCashback();
    setStatus("Cashback created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function claimCashback(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.claimCashback.disabled = true;
    const claimTo = el.claimTo.value.trim();
    const claimURI = el.claimURI.value.trim();
    if (!isAddress(claimTo)) throw new Error("Claim address must be a valid EVM address.");
    if (!claimURI) throw new Error("Claim URI is required.");

    setStatus("Claiming Cashback...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcCashbackAbi,
      functionName: "claimCashback",
      args: [CashbackId(), claimTo as Address, claimURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Claim submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshCashback();
    setStatus("Cashback claimed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeCashback(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeCashback.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing Cashback...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcCashbackAbi,
      functionName: "closeCashback",
      args: [CashbackId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshCashback();
    setStatus("Cashback closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.closeCashback.addEventListener("click", () => void closeCashback());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createCashback.addEventListener("click", () => void createCashback());
el.deployContract.addEventListener("click", () => void deployContract());
el.label.addEventListener("input", () => {
  currentCashback = null;
  renderCashback();
});
el.claimCashback.addEventListener("click", () => void claimCashback());
el.refresh.addEventListener("click", () => void refreshCashback());
el.saveContract.addEventListener("click", saveContract);

renderCashback();

async function runAutoFlow(): Promise<void> {
  if (params.get("autorun") !== "1") return;

  setStatus("Auto flow starting. Approve each MetaMask request as it appears.");
  await connect();
  if (!walletClient || !account) return;

  if (!contractAddress || !isAddress(contractAddress)) {
    await deployContract();
  }
  if (!contractAddress || !isAddress(contractAddress)) return;

  await refreshCashback();
  if (!currentCashback || currentCashback.creator === ZERO_ADDRESS) {
    await createCashback();
    await refreshCashback();
  }

  if (currentCashback && currentCashback.creator !== ZERO_ADDRESS && !currentCashback.closed) {
    if (currentCashback.claimedAmount === 0n) {
      await claimCashback();
      await refreshCashback();
    }
    if (currentCashback && !currentCashback.closed) {
      await closeCashback();
      await refreshCashback();
    }
  }

  setStatus(`Auto flow complete for ${contractAddress}.`);
}

setTimeout(() => void runAutoFlow(), 500);





