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

type PayrollSummary = {
  payer: Address;
  worker: Address;
  amount: bigint;
  claimedAmount: bigint;
  createdAt: bigint;
  claimAfter: bigint;
  closed: boolean;
  reference: string;
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

const CONTRACT_KEY = "arcPayrollVault.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcPayrollAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "payrollId", type: "bytes32" },
      { internalType: "address", name: "worker", type: "address" },
      { internalType: "uint64", name: "claimAfter", type: "uint64" },
      { internalType: "string", name: "reference", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createPayroll",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "payrollId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
      { internalType: "string", name: "claimURI", type: "string" },
    ],
    name: "claimPayroll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "payrollId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closePayroll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "payrollId", type: "bytes32" }],
    name: "getPayroll",
    outputs: [
      {
        components: [
          { internalType: "address", name: "payer", type: "address" },
          { internalType: "address", name: "worker", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "claimedAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "claimAfter", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "reference", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "claimURI", type: "string" },
        ],
        internalType: "struct ArcPayrollVault.Payroll",
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
let currentPayroll: PayrollSummary | null = null;

const el = {
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  claimPayroll: document.querySelector<HTMLButtonElement>("#claimPayroll")!,
  claimTo: document.querySelector<HTMLInputElement>("#claimTo")!,
  claimURI: document.querySelector<HTMLInputElement>("#claimURI")!,
  closePayroll: document.querySelector<HTMLButtonElement>("#closePayroll")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createPayroll: document.querySelector<HTMLButtonElement>("#createPayroll")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  payrollId: document.querySelector<HTMLElement>("#payrollId")!,
  payrollStatus: document.querySelector<HTMLElement>("#payrollStatus")!,
  payerAddress: document.querySelector<HTMLElement>("#payerAddress")!,
  reference: document.querySelector<HTMLInputElement>("#reference")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  valueStatus: document.querySelector<HTMLElement>("#valueStatus")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  worker: document.querySelector<HTMLInputElement>("#worker")!,
  workerAddress: document.querySelector<HTMLElement>("#workerAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.amount.value = "0.004";
el.claimTo.value = DEFAULT_ACCOUNT;
el.claimURI.value = `local:arc-payroll-${today}:claimed`;
el.contractAddress.value = contractAddress;
el.metadataURI.value = `local:arc-payroll-${today}`;
el.reference.value = `arc-payroll-${today}`;
el.refundTo.value = DEFAULT_ACCOUNT;
el.worker.value = DEFAULT_ACCOUNT;

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

function payrollId(): Hash {
  const reference = el.reference.value.trim();
  if (!reference) throw new Error("Reference is required.");
  const payer = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${payer}:${reference}`));
}

function payrollFromRaw(value: unknown): PayrollSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<PayrollSummary>;
    return {
      payer: object.payer ?? ZERO_ADDRESS,
      worker: object.worker ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      claimedAmount: object.claimedAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      claimAfter: object.claimAfter ?? 0n,
      closed: Boolean(object.closed),
      reference: object.reference ?? "",
      metadataURI: object.metadataURI ?? "",
      claimURI: object.claimURI ?? "",
    };
  }

  return {
    payer: value[0] as Address,
    worker: value[1] as Address,
    amount: value[2] as bigint,
    claimedAmount: value[3] as bigint,
    createdAt: value[4] as bigint,
    claimAfter: value[5] as bigint,
    closed: Boolean(value[6]),
    reference: value[7] as string,
    metadataURI: value[8] as string,
    claimURI: value[9] as string,
  };
}

function updatePayrollIdDisplay(): void {
  try {
    el.payrollId.textContent = payrollId();
  } catch {
    el.payrollId.textContent = "-";
  }
}

function renderPayroll(): void {
  updatePayrollIdDisplay();

  if (!currentPayroll || currentPayroll.payer === ZERO_ADDRESS) {
    el.payrollStatus.textContent = "not created";
    el.valueStatus.textContent = "0 USDC";
    el.payerAddress.textContent = "-";
    el.workerAddress.textContent = "-";
    updateActions();
    return;
  }

  const available = currentPayroll.amount - currentPayroll.claimedAmount;
  el.payrollStatus.textContent = currentPayroll.closed
    ? "closed"
    : currentPayroll.claimedAmount > 0n
      ? "claimed"
      : "funded";
  el.valueStatus.textContent = `${formatEther(currentPayroll.claimedAmount)} / ${formatEther(
    currentPayroll.amount,
  )} USDC claimed, ${formatEther(available)} USDC available`;
  el.payerAddress.innerHTML = `<a href="${addressUrl(currentPayroll.payer)}" target="_blank" rel="noreferrer">${shortValue(
    currentPayroll.payer,
  )}</a>`;
  el.workerAddress.innerHTML = `<a href="${addressUrl(
    currentPayroll.worker,
  )}" target="_blank" rel="noreferrer">${shortValue(currentPayroll.worker)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasPayroll = Boolean(currentPayroll && currentPayroll.payer !== ZERO_ADDRESS);
  const open = hasPayroll && !currentPayroll?.closed;
  const claimable = open && currentPayroll?.claimedAmount === 0n;

  el.claimPayroll.disabled = !hasWallet || !hasContract || !claimable;
  el.closePayroll.disabled = !hasWallet || !hasContract || !open;
  el.createPayroll.disabled = !hasWallet || !hasContract || hasPayroll;
  el.deployContract.disabled = !hasWallet;
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

    el.claimTo.value = account;
    el.refundTo.value = account;
    el.walletAddress.textContent = account;
    el.worker.value = account;
    el.connect.textContent = "Connected";
    updatePayrollIdDisplay();
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
    setStatus("Deploying ArcPayrollVault...");
    const artifact = (await fetch("/public/artifacts/ArcPayrollVault.json").then((response) => response.json())) as Artifact;
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
    setStatus(`ArcPayrollVault deployed at ${contractAddress}.`);
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
    currentPayroll = null;
    renderPayroll();
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

async function refreshPayroll(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading payroll state...");
    const rawPayroll = await publicClient.readContract({
      address: contractAddress,
      abi: arcPayrollAbi,
      functionName: "getPayroll",
      args: [payrollId()],
    });
    currentPayroll = payrollFromRaw(rawPayroll);
    renderPayroll();
    setStatus("Payroll state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createPayroll(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createPayroll.disabled = true;
    const worker = el.worker.value.trim();
    const reference = el.reference.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(worker)) throw new Error("Worker must be a valid EVM address.");
    if (!reference) throw new Error("Reference is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    const amount = parseEther(el.amount.value.trim());

    setStatus("Creating payroll...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPayrollAbi,
      functionName: "createPayroll",
      args: [payrollId(), worker as Address, 0n, reference, metadataURI],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshPayroll();
    setStatus("Payroll created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function claimPayroll(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.claimPayroll.disabled = true;
    const claimTo = el.claimTo.value.trim();
    const claimURI = el.claimURI.value.trim();
    if (!isAddress(claimTo)) throw new Error("Claim address must be a valid EVM address.");
    if (!claimURI) throw new Error("Claim URI is required.");

    setStatus("Claiming payroll...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPayrollAbi,
      functionName: "claimPayroll",
      args: [payrollId(), claimTo as Address, claimURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Claim submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshPayroll();
    setStatus("Payroll claimed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closePayroll(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closePayroll.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing payroll...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPayrollAbi,
      functionName: "closePayroll",
      args: [payrollId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshPayroll();
    setStatus("Payroll closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.claimPayroll.addEventListener("click", () => void claimPayroll());
el.closePayroll.addEventListener("click", () => void closePayroll());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createPayroll.addEventListener("click", () => void createPayroll());
el.deployContract.addEventListener("click", () => void deployContract());
el.refresh.addEventListener("click", () => void refreshPayroll());
el.reference.addEventListener("input", () => {
  currentPayroll = null;
  renderPayroll();
});
el.saveContract.addEventListener("click", saveContract);

renderPayroll();
