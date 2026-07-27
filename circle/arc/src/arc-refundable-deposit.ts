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

type DepositSummary = {
  payer: Address;
  beneficiary: Address;
  amount: bigint;
  createdAt: bigint;
  deadline: bigint;
  closed: boolean;
  refunded: boolean;
  depositRef: string;
  metadataURI: string;
  resolutionURI: string;
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

const CONTRACT_KEY = "arcRefundableDeposit.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const DEFAULT_BENEFICIARY = "0x78131700be4a8f2d16eeb0cba3498d2e717f2cd3" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcDepositAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "depositId", type: "bytes32" },
      { internalType: "address", name: "beneficiary", type: "address" },
      { internalType: "uint64", name: "deadline", type: "uint64" },
      { internalType: "string", name: "depositRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createDeposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "depositId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
      { internalType: "string", name: "resolutionURI", type: "string" },
    ],
    name: "refundDeposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "depositId", type: "bytes32" },
      { internalType: "address payable", name: "payoutTo", type: "address" },
      { internalType: "string", name: "resolutionURI", type: "string" },
    ],
    name: "forfeitDeposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "depositId", type: "bytes32" }],
    name: "getDeposit",
    outputs: [
      {
        components: [
          { internalType: "address", name: "payer", type: "address" },
          { internalType: "address", name: "beneficiary", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "deadline", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "bool", name: "refunded", type: "bool" },
          { internalType: "string", name: "depositRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "resolutionURI", type: "string" },
        ],
        internalType: "struct ArcRefundableDeposit.Deposit",
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
let currentDeposit: DepositSummary | null = null;

const el = {
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  beneficiary: document.querySelector<HTMLInputElement>("#beneficiary")!,
  beneficiaryAddress: document.querySelector<HTMLElement>("#beneficiaryAddress")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createDeposit: document.querySelector<HTMLButtonElement>("#createDeposit")!,
  depositId: document.querySelector<HTMLElement>("#depositId")!,
  depositStatus: document.querySelector<HTMLElement>("#depositStatus")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  forfeitDeposit: document.querySelector<HTMLButtonElement>("#forfeitDeposit")!,
  forfeitTo: document.querySelector<HTMLInputElement>("#forfeitTo")!,
  label: document.querySelector<HTMLInputElement>("#label")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  payerAddress: document.querySelector<HTMLElement>("#payerAddress")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundDeposit: document.querySelector<HTMLButtonElement>("#refundDeposit")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  resolutionURI: document.querySelector<HTMLInputElement>("#resolutionURI")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  valueStatus: document.querySelector<HTMLElement>("#valueStatus")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.amount.value = "0.004";
el.beneficiary.value = DEFAULT_BENEFICIARY;
el.contractAddress.value = contractAddress;
el.forfeitTo.value = DEFAULT_BENEFICIARY;
el.label.value = `arc-deposit-${today}`;
el.metadataURI.value = `local:arc-deposit-${today}`;
el.refundTo.value = DEFAULT_ACCOUNT;
el.resolutionURI.value = `local:arc-deposit-${today}:returned`;

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

function depositId(): Hash {
  const label = el.label.value.trim();
  if (!label) throw new Error("Label is required.");
  const payer = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${payer}:${label}`));
}

function depositFromRaw(value: unknown): DepositSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<DepositSummary>;
    return {
      payer: object.payer ?? ZERO_ADDRESS,
      beneficiary: object.beneficiary ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      deadline: object.deadline ?? 0n,
      closed: Boolean(object.closed),
      refunded: Boolean(object.refunded),
      depositRef: object.depositRef ?? "",
      metadataURI: object.metadataURI ?? "",
      resolutionURI: object.resolutionURI ?? "",
    };
  }

  return {
    payer: value[0] as Address,
    beneficiary: value[1] as Address,
    amount: value[2] as bigint,
    createdAt: value[3] as bigint,
    deadline: value[4] as bigint,
    closed: Boolean(value[5]),
    refunded: Boolean(value[6]),
    depositRef: value[7] as string,
    metadataURI: value[8] as string,
    resolutionURI: value[9] as string,
  };
}

function updateDepositIdDisplay(): void {
  try {
    el.depositId.textContent = depositId();
  } catch {
    el.depositId.textContent = "-";
  }
}

function renderDeposit(): void {
  updateDepositIdDisplay();

  if (!currentDeposit || currentDeposit.payer === ZERO_ADDRESS) {
    el.depositStatus.textContent = "not created";
    el.valueStatus.textContent = "0 USDC";
    el.payerAddress.textContent = "-";
    el.beneficiaryAddress.textContent = "-";
    updateActions();
    return;
  }

  const state = currentDeposit.closed ? (currentDeposit.refunded ? "refunded" : "forfeited") : "held";
  el.depositStatus.textContent = state;
  el.valueStatus.textContent = `${formatEther(currentDeposit.amount)} USDC ${state}`;
  el.payerAddress.innerHTML = `<a href="${addressUrl(currentDeposit.payer)}" target="_blank" rel="noreferrer">${shortValue(
    currentDeposit.payer,
  )}</a>`;
  el.beneficiaryAddress.innerHTML = `<a href="${addressUrl(
    currentDeposit.beneficiary,
  )}" target="_blank" rel="noreferrer">${shortValue(currentDeposit.beneficiary)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasDeposit = Boolean(currentDeposit && currentDeposit.payer !== ZERO_ADDRESS);
  const open = hasDeposit && !currentDeposit?.closed;

  el.createDeposit.disabled = !hasWallet || !hasContract || hasDeposit;
  el.deployContract.disabled = !hasWallet;
  el.forfeitDeposit.disabled = !hasWallet || !hasContract || !open;
  el.refresh.disabled = !hasContract;
  el.refundDeposit.disabled = !hasWallet || !hasContract || !open;
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

    el.refundTo.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateDepositIdDisplay();
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
    setStatus("Deploying ArcRefundableDeposit...");
    const artifact = (await fetch("/public/artifacts/ArcRefundableDeposit.json").then((response) =>
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
    setStatus(`ArcRefundableDeposit deployed at ${contractAddress}.`);
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
    currentDeposit = null;
    renderDeposit();
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

async function refreshDeposit(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading deposit state...");
    const rawDeposit = await publicClient.readContract({
      address: contractAddress,
      abi: arcDepositAbi,
      functionName: "getDeposit",
      args: [depositId()],
    });
    currentDeposit = depositFromRaw(rawDeposit);
    renderDeposit();
    setStatus("Deposit state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createDeposit(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createDeposit.disabled = true;
    const beneficiary = el.beneficiary.value.trim();
    const label = el.label.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(beneficiary)) throw new Error("Beneficiary must be a valid EVM address.");
    if (!label) throw new Error("Label is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    const amount = parseEther(el.amount.value.trim());

    setStatus("Creating deposit...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcDepositAbi,
      functionName: "createDeposit",
      args: [depositId(), beneficiary as Address, 0n, label, metadataURI],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshDeposit();
    setStatus("Deposit created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function refundDeposit(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.refundDeposit.disabled = true;
    const refundTo = el.refundTo.value.trim();
    const resolutionURI = el.resolutionURI.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");
    if (!resolutionURI) throw new Error("Resolution URI is required.");

    setStatus("Refunding deposit...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcDepositAbi,
      functionName: "refundDeposit",
      args: [depositId(), refundTo as Address, resolutionURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Refund submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshDeposit();
    setStatus("Deposit refunded:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function forfeitDeposit(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.forfeitDeposit.disabled = true;
    const payoutTo = el.forfeitTo.value.trim();
    const resolutionURI = el.resolutionURI.value.trim();
    if (!isAddress(payoutTo)) throw new Error("Payout address must be a valid EVM address.");
    if (!resolutionURI) throw new Error("Resolution URI is required.");

    setStatus("Forfeiting deposit...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcDepositAbi,
      functionName: "forfeitDeposit",
      args: [depositId(), payoutTo as Address, resolutionURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Forfeit submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshDeposit();
    setStatus("Deposit forfeited:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createDeposit.addEventListener("click", () => void createDeposit());
el.deployContract.addEventListener("click", () => void deployContract());
el.forfeitDeposit.addEventListener("click", () => void forfeitDeposit());
el.label.addEventListener("input", () => {
  currentDeposit = null;
  renderDeposit();
});
el.refresh.addEventListener("click", () => void refreshDeposit());
el.refundDeposit.addEventListener("click", () => void refundDeposit());
el.saveContract.addEventListener("click", saveContract);

renderDeposit();
