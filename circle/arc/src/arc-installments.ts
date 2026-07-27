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

type AgreementSummary = {
  payer: Address;
  merchant: Address;
  installmentAmount: bigint;
  paidAmount: bigint;
  installmentCount: number;
  paidInstallments: number;
  createdAt: bigint;
  closed: boolean;
  agreementRef: string;
  metadataURI: string;
  completionURI: string;
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

const CONTRACT_KEY = "arcInstallmentPayments.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const DEFAULT_MERCHANT = "0x78131700be4a8f2d16eeb0cba3498d2e717f2cd3" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcInstallmentsAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "agreementId", type: "bytes32" },
      { internalType: "address", name: "merchant", type: "address" },
      { internalType: "uint8", name: "installmentCount", type: "uint8" },
      { internalType: "uint256", name: "installmentAmount", type: "uint256" },
      { internalType: "string", name: "agreementRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createAgreement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "agreementId", type: "bytes32" },
      { internalType: "string", name: "paymentURI", type: "string" },
    ],
    name: "payInstallment",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "agreementId", type: "bytes32" },
      { internalType: "string", name: "completionURI", type: "string" },
    ],
    name: "completeAgreement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "agreementId", type: "bytes32" }],
    name: "getAgreement",
    outputs: [
      {
        components: [
          { internalType: "address", name: "payer", type: "address" },
          { internalType: "address", name: "merchant", type: "address" },
          { internalType: "uint256", name: "installmentAmount", type: "uint256" },
          { internalType: "uint256", name: "paidAmount", type: "uint256" },
          { internalType: "uint8", name: "installmentCount", type: "uint8" },
          { internalType: "uint8", name: "paidInstallments", type: "uint8" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "agreementRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "completionURI", type: "string" },
        ],
        internalType: "struct ArcInstallmentPayments.Agreement",
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
let currentAgreement: AgreementSummary | null = null;

const el = {
  agreementId: document.querySelector<HTMLElement>("#agreementId")!,
  agreementStatus: document.querySelector<HTMLElement>("#agreementStatus")!,
  completeAgreement: document.querySelector<HTMLButtonElement>("#completeAgreement")!,
  completionURI: document.querySelector<HTMLInputElement>("#completionURI")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createAgreement: document.querySelector<HTMLButtonElement>("#createAgreement")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  installmentAmount: document.querySelector<HTMLInputElement>("#installmentAmount")!,
  installmentCount: document.querySelector<HTMLInputElement>("#installmentCount")!,
  label: document.querySelector<HTMLInputElement>("#label")!,
  merchant: document.querySelector<HTMLInputElement>("#merchant")!,
  merchantAddress: document.querySelector<HTMLElement>("#merchantAddress")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  payInstallment: document.querySelector<HTMLButtonElement>("#payInstallment")!,
  payerAddress: document.querySelector<HTMLElement>("#payerAddress")!,
  paymentURI: document.querySelector<HTMLInputElement>("#paymentURI")!,
  progressStatus: document.querySelector<HTMLElement>("#progressStatus")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  valueStatus: document.querySelector<HTMLElement>("#valueStatus")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.completionURI.value = `local:arc-installment-${today}:completed`;
el.contractAddress.value = contractAddress;
el.installmentAmount.value = "0.003";
el.installmentCount.value = "2";
el.label.value = `arc-installment-${today}`;
el.merchant.value = DEFAULT_MERCHANT;
el.metadataURI.value = `local:arc-installment-${today}`;
el.paymentURI.value = `local:arc-installment-${today}:payment-1`;

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

function agreementId(): Hash {
  const label = el.label.value.trim();
  if (!label) throw new Error("Label is required.");
  const payer = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${payer}:${label}`));
}

function agreementFromRaw(value: unknown): AgreementSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<AgreementSummary>;
    return {
      payer: object.payer ?? ZERO_ADDRESS,
      merchant: object.merchant ?? ZERO_ADDRESS,
      installmentAmount: object.installmentAmount ?? 0n,
      paidAmount: object.paidAmount ?? 0n,
      installmentCount: Number(object.installmentCount ?? 0),
      paidInstallments: Number(object.paidInstallments ?? 0),
      createdAt: object.createdAt ?? 0n,
      closed: Boolean(object.closed),
      agreementRef: object.agreementRef ?? "",
      metadataURI: object.metadataURI ?? "",
      completionURI: object.completionURI ?? "",
    };
  }

  return {
    payer: value[0] as Address,
    merchant: value[1] as Address,
    installmentAmount: value[2] as bigint,
    paidAmount: value[3] as bigint,
    installmentCount: Number(value[4]),
    paidInstallments: Number(value[5]),
    createdAt: value[6] as bigint,
    closed: Boolean(value[7]),
    agreementRef: value[8] as string,
    metadataURI: value[9] as string,
    completionURI: value[10] as string,
  };
}

function updateAgreementIdDisplay(): void {
  try {
    el.agreementId.textContent = agreementId();
  } catch {
    el.agreementId.textContent = "-";
  }
}

function nextPaymentURI(): string {
  const nextNumber = (currentAgreement?.paidInstallments ?? 0) + 1;
  return `local:${el.label.value.trim()}:payment-${nextNumber}`;
}

function renderAgreement(): void {
  updateAgreementIdDisplay();

  if (!currentAgreement || currentAgreement.payer === ZERO_ADDRESS) {
    el.agreementStatus.textContent = "not created";
    el.valueStatus.textContent = "0 USDC";
    el.progressStatus.textContent = "0 / 0";
    el.payerAddress.textContent = "-";
    el.merchantAddress.textContent = "-";
    updateActions();
    return;
  }

  const total = currentAgreement.installmentAmount * BigInt(currentAgreement.installmentCount);
  el.agreementStatus.textContent = currentAgreement.closed ? "completed" : "active";
  el.progressStatus.textContent = `${currentAgreement.paidInstallments} / ${currentAgreement.installmentCount}`;
  el.valueStatus.textContent = `${formatEther(currentAgreement.paidAmount)} / ${formatEther(total)} USDC paid`;
  el.payerAddress.innerHTML = `<a href="${addressUrl(currentAgreement.payer)}" target="_blank" rel="noreferrer">${shortValue(
    currentAgreement.payer,
  )}</a>`;
  el.merchantAddress.innerHTML = `<a href="${addressUrl(
    currentAgreement.merchant,
  )}" target="_blank" rel="noreferrer">${shortValue(currentAgreement.merchant)}</a>`;
  el.paymentURI.value = nextPaymentURI();
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasAgreement = Boolean(currentAgreement && currentAgreement.payer !== ZERO_ADDRESS);
  const open = hasAgreement && !currentAgreement?.closed;
  const unpaid = open && (currentAgreement?.paidInstallments ?? 0) < (currentAgreement?.installmentCount ?? 0);
  const completeReady =
    open && (currentAgreement?.paidInstallments ?? 0) === (currentAgreement?.installmentCount ?? Number.NaN);

  el.completeAgreement.disabled = !hasWallet || !hasContract || !completeReady;
  el.createAgreement.disabled = !hasWallet || !hasContract || hasAgreement;
  el.deployContract.disabled = !hasWallet;
  el.payInstallment.disabled = !hasWallet || !hasContract || !unpaid;
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

    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateAgreementIdDisplay();
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
    setStatus("Deploying ArcInstallmentPayments...");
    const artifact = (await fetch("/public/artifacts/ArcInstallmentPayments.json").then((response) =>
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
    setStatus(`ArcInstallmentPayments deployed at ${contractAddress}.`);
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
    currentAgreement = null;
    renderAgreement();
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

async function refreshAgreement(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading agreement state...");
    const rawAgreement = await publicClient.readContract({
      address: contractAddress,
      abi: arcInstallmentsAbi,
      functionName: "getAgreement",
      args: [agreementId()],
    });
    currentAgreement = agreementFromRaw(rawAgreement);
    renderAgreement();
    setStatus("Agreement state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createAgreement(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createAgreement.disabled = true;
    const merchant = el.merchant.value.trim();
    const label = el.label.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const installmentCount = Number(el.installmentCount.value.trim());
    const installmentAmount = parseEther(el.installmentAmount.value.trim());
    if (!isAddress(merchant)) throw new Error("Merchant must be a valid EVM address.");
    if (!Number.isInteger(installmentCount) || installmentCount <= 0 || installmentCount > 24) {
      throw new Error("Installment count must be between 1 and 24.");
    }
    if (!label) throw new Error("Label is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");

    setStatus("Creating agreement...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInstallmentsAbi,
      functionName: "createAgreement",
      args: [agreementId(), merchant as Address, installmentCount, installmentAmount, label, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshAgreement();
    setStatus("Agreement created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function payInstallment(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || !currentAgreement) return;

  try {
    el.payInstallment.disabled = true;
    const paymentURI = el.paymentURI.value.trim();
    if (!paymentURI) throw new Error("Payment URI is required.");

    setStatus("Paying installment...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInstallmentsAbi,
      functionName: "payInstallment",
      args: [agreementId(), paymentURI],
      account,
      chain: arcTestnet,
      value: currentAgreement.installmentAmount,
    });
    setStatus("Payment submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshAgreement();
    setStatus("Installment paid:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function completeAgreement(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.completeAgreement.disabled = true;
    const completionURI = el.completionURI.value.trim();
    if (!completionURI) throw new Error("Completion URI is required.");

    setStatus("Completing agreement...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInstallmentsAbi,
      functionName: "completeAgreement",
      args: [agreementId(), completionURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Completion submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshAgreement();
    setStatus("Agreement completed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.completeAgreement.addEventListener("click", () => void completeAgreement());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createAgreement.addEventListener("click", () => void createAgreement());
el.deployContract.addEventListener("click", () => void deployContract());
el.label.addEventListener("input", () => {
  currentAgreement = null;
  renderAgreement();
});
el.payInstallment.addEventListener("click", () => void payInstallment());
el.refresh.addEventListener("click", () => void refreshAgreement());
el.saveContract.addEventListener("click", saveContract);

renderAgreement();
