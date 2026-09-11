import { arcScanLink, receiptField, tableCell } from "./dom-safety.js";
import {
  PUBLIC_INVOICE_CONTRACT, createInvoiceDraft, importChainInvoice, invoiceReadAbi,
  invoiceShareUrl, readBrowserInvoices, reconcileInvoice, saveBrowserInvoice, sharedInvoiceReference,
} from "./arc-invoice-data.js";
import type { Invoice, InvoiceStatus } from "./arc-invoice-data.js";
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
  bytecode: Hash;
};

type QuoteStatus = "none" | "created" | "accepted" | "settled" | "cancelled";

type QuoteSummary = {
  seller: Address;
  buyer: Address;
  amount: bigint;
  createdAt: bigint;
  acceptedAt: bigint;
  settledAt: bigint;
  metadataURI: string;
  acceptanceURI: string;
  status: number;
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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcInvoiceAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "invoiceId", type: "bytes32" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "invoiceId", type: "bytes32" }],
    name: "cancelInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "invoiceId", type: "bytes32" }],
    name: "payInvoice",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "quoteId", type: "bytes32" },
      { internalType: "address", name: "buyer", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "quoteId", type: "bytes32" },
      { internalType: "string", name: "acceptanceURI", type: "string" },
    ],
    name: "acceptQuote",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "quoteId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
    ],
    name: "settleQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "quoteId", type: "bytes32" }],
    name: "cancelQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "quoteId", type: "bytes32" }],
    name: "getQuote",
    outputs: [
      {
        components: [
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "address", name: "buyer", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "acceptedAt", type: "uint64" },
          { internalType: "uint64", name: "settledAt", type: "uint64" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "acceptanceURI", type: "string" },
          { internalType: "enum ArcInvoice.QuoteStatus", name: "status", type: "uint8" },
        ],
        internalType: "struct ArcInvoice.Quote",
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
let account: Address | null = null;
let selectedProvider: EIP1193Provider | null = null;
let invoices: Invoice[] = [];
let selectedId = "";
let contractAddress: Address | "" = PUBLIC_INVOICE_CONTRACT;
let currentQuote: QuoteSummary | null = null;
const verifiedInvoices = new Set<string>();
let invoiceBusy = false;
let selectionVersion = 0;

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  contractSummary: document.querySelector<HTMLElement>("#contractSummary")!,
  paidVolume: document.querySelector<HTMLElement>("#paidVolume")!,
  invoiceForm: document.querySelector<HTMLFormElement>("#invoiceForm")!,
  merchantName: document.querySelector<HTMLInputElement>("#merchantName")!,
  customerName: document.querySelector<HTMLInputElement>("#customerName")!,
  customerEmail: document.querySelector<HTMLInputElement>("#customerEmail")!,
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  merchantWallet: document.querySelector<HTMLInputElement>("#merchantWallet")!,
  description: document.querySelector<HTMLTextAreaElement>("#description")!,
  dueDate: document.querySelector<HTMLInputElement>("#dueDate")!,
  refreshInvoices: document.querySelector<HTMLButtonElement>("#refreshInvoices")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  invoiceRows: document.querySelector<HTMLElement>("#invoiceRows")!,
  invoiceCount: document.querySelector<HTMLElement>("#invoiceCount")!,
  selectedStatus: document.querySelector<HTMLElement>("#selectedStatus")!,
  receipt: document.querySelector<HTMLElement>("#receipt")!,
  registerInvoice: document.querySelector<HTMLButtonElement>("#registerInvoice")!,
  payInvoice: document.querySelector<HTMLButtonElement>("#payInvoice")!,
  cancelInvoice: document.querySelector<HTMLButtonElement>("#cancelInvoice")!,
  copyLink: document.querySelector<HTMLButtonElement>("#copyLink")!,
  verification: document.querySelector<HTMLElement>("#verification")!,
  quoteTitle: document.querySelector<HTMLInputElement>("#quoteTitle")!,
  quoteBuyer: document.querySelector<HTMLInputElement>("#quoteBuyer")!,
  quoteAmount: document.querySelector<HTMLInputElement>("#quoteAmount")!,
  quoteMetadataURI: document.querySelector<HTMLInputElement>("#quoteMetadataURI")!,
  quoteAcceptanceURI: document.querySelector<HTMLInputElement>("#quoteAcceptanceURI")!,
  quoteSettlementTo: document.querySelector<HTMLInputElement>("#quoteSettlementTo")!,
  quoteId: document.querySelector<HTMLElement>("#quoteId")!,
  quoteStatus: document.querySelector<HTMLElement>("#quoteStatus")!,
  createQuote: document.querySelector<HTMLButtonElement>("#createQuote")!,
  acceptQuote: document.querySelector<HTMLButtonElement>("#acceptQuote")!,
  settleQuote: document.querySelector<HTMLButtonElement>("#settleQuote")!,
  cancelQuote: document.querySelector<HTMLButtonElement>("#cancelQuote")!,
  refreshQuote: document.querySelector<HTMLButtonElement>("#refreshQuote")!,
  stepDraft: document.querySelector<HTMLElement>("#stepDraft")!,
  stepRegistered: document.querySelector<HTMLElement>("#stepRegistered")!,
  stepPaid: document.querySelector<HTMLElement>("#stepPaid")!,
};

el.contractAddress.value = contractAddress;
el.deployContract.hidden = !["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
el.dueDate.value = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);
el.quoteTitle.value = `arc-quote-${today}`;
el.quoteBuyer.value = ZERO_ADDRESS;
el.quoteAmount.value = "0.003";
el.quoteMetadataURI.value = `local:arc-quote-${today}:metadata`;
el.quoteAcceptanceURI.value = `local:arc-quote-${today}:accepted`;
el.quoteSettlementTo.value = ZERO_ADDRESS;

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
  const legacyMetaMask = injected?.providers?.find((provider: EIP1193Provider & { isMetaMask?: boolean }) => {
    return provider.isMetaMask;
  });
  if (legacyMetaMask) return legacyMetaMask;
  if (injected?.isMetaMask) return injected;

  const announced: Array<{ provider: EIP1193Provider; name?: string; rdns?: string }> = [];
  const onAnnounce = (event: Event): void => {
    const detail = (event as CustomEvent).detail as
      | { info?: { name?: string; rdns?: string }; provider?: EIP1193Provider }
      | undefined;
    if (detail?.provider) {
      announced.push({
        provider: detail.provider,
        name: detail.info?.name,
        rdns: detail.info?.rdns,
      });
    }
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((resolve) => setTimeout(resolve, 250));
  window.removeEventListener("eip6963:announceProvider", onAnnounce);

  const metaMask = announced.find((item) => {
    const label = `${item.name ?? ""} ${item.rdns ?? ""}`.toLowerCase();
    return label.includes("metamask");
  });
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

async function assertInvoiceWallet(): Promise<void> {
  await ensureArc();
  if (!selectedProvider || !account) throw new Error("Connect your wallet first.");
  const accounts = await selectedProvider.request({ method: "eth_accounts" }) as Address[];
  const chainId = await selectedProvider.request({ method: "eth_chainId" });
  if (accounts[0]?.toLowerCase() !== account.toLowerCase() || Number(chainId) !== arcTestnet.id) {
    throw new Error("Wallet account or network changed. Reconnect before submitting.");
  }
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
    if (!el.merchantWallet.value.trim()) {
      el.merchantWallet.value = account;
    }
    if (el.quoteBuyer.value === ZERO_ADDRESS) {
      el.quoteBuyer.value = account;
    }
    if (el.quoteSettlementTo.value === ZERO_ADDRESS) {
      el.quoteSettlementTo.value = account;
    }
    await refreshBalance();
    renderQuote();
    updateActions();
    setStatus("Wallet ready.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

function selectedInvoice(): Invoice | undefined {
  return invoices.find((invoice) => invoice.id === selectedId);
}

function quoteId(): Hash {
  const title = el.quoteTitle.value.trim();
  if (!title) throw new Error("Quote title is required.");
  const seller = (account?.toLowerCase() ?? el.merchantWallet.value.trim().toLowerCase()) || ZERO_ADDRESS.toLowerCase();
  return keccak256(toBytes(`arc-quote:${seller}:${title}`));
}

function quoteStatusLabel(status: number): QuoteStatus {
  if (status === 1) return "created";
  if (status === 2) return "accepted";
  if (status === 3) return "settled";
  if (status === 4) return "cancelled";
  return "none";
}

function quoteFromRaw(value: unknown): QuoteSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<QuoteSummary>;
    return {
      seller: object.seller ?? ZERO_ADDRESS,
      buyer: object.buyer ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      acceptedAt: object.acceptedAt ?? 0n,
      settledAt: object.settledAt ?? 0n,
      metadataURI: object.metadataURI ?? "",
      acceptanceURI: object.acceptanceURI ?? "",
      status: object.status ?? 0,
    };
  }

  return {
    seller: value[0] as Address,
    buyer: value[1] as Address,
    amount: value[2] as bigint,
    createdAt: value[3] as bigint,
    acceptedAt: value[4] as bigint,
    settledAt: value[5] as bigint,
    metadataURI: value[6] as string,
    acceptanceURI: value[7] as string,
    status: Number(value[8]),
  };
}

function statusClass(status: InvoiceStatus): string {
  return `status ${status}`;
}

function statusLabel(status: InvoiceStatus): string {
  return status;
}

function renderRows(): void {
  const fragment = document.createDocumentFragment();
  for (const invoice of invoices) {
    const row = document.createElement("tr");
    const state = document.createElement("span");
    const button = document.createElement("button");
    row.dataset.selected = invoice.id === selectedId ? "true" : "false";
    state.className = statusClass(invoice.status);
    state.textContent = statusLabel(invoice.status);
    button.className = "select-row secondary";
    button.type = "button";
    button.textContent = "Select";
    button.dataset.id = invoice.id;
    button.addEventListener("click", () => selectInvoice(button.dataset.id ?? ""));
    row.append(
      tableCell(invoice.id),
      tableCell(invoice.customerName),
      tableCell(`${invoice.totalDue} USDC`),
      tableCell(state),
      tableCell(button),
    );
    fragment.append(row);
  }
  el.invoiceRows.replaceChildren(fragment);

  const open = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled").length;
  el.invoiceCount.textContent = `${open} open`;
  const volume = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + Number(invoice.totalDue), 0);
  el.paidVolume.textContent = `${volume.toFixed(2)} USDC`;
}


function renderReceipt(): void {
  const invoice = selectedInvoice();
  if (!invoice) {
    el.selectedStatus.className = "status draft";
    el.selectedStatus.textContent = "draft";
    el.receipt.replaceChildren(receiptField("Invoice", "-"), receiptField("Amount", "-"));
    return;
  }

  el.selectedStatus.className = statusClass(invoice.status);
  el.selectedStatus.textContent = statusLabel(invoice.status);
  const contract = invoice.contractAddress ?? contractAddress;
  const registration = invoice.registrationTxHash ? arcScanLink("tx", invoice.registrationTxHash, shortHash(invoice.registrationTxHash)) : "-";
  const payment = invoice.paymentTxHash ? arcScanLink("tx", invoice.paymentTxHash, shortHash(invoice.paymentTxHash)) : "-";
  const cancellation = invoice.cancellationTxHash ? arcScanLink("tx", invoice.cancellationTxHash, shortHash(invoice.cancellationTxHash)) : "-";
  const contractLink = contract ? arcScanLink("address", contract, shortHash(contract)) : "-";

  el.receipt.replaceChildren(
    receiptField("Invoice", invoice.id),
    receiptField("Total due", `${invoice.totalDue} USDC`),
    receiptField("Merchant", invoice.merchantName),
    receiptField("Customer", invoice.customerName),
    receiptField("Chain invoice id", shortHash(invoice.chainInvoiceId)),
    receiptField("Contract", contractLink),
    receiptField("Register tx", registration),
    receiptField("Payment tx", payment),
    receiptField("Cancel tx", cancellation),
  );

  el.stepDraft.classList.add("done");
  el.stepRegistered.classList.toggle(
    "done",
    invoice.status === "registered" || invoice.status === "paid" || invoice.status === "cancelled",
  );
  el.stepPaid.classList.toggle("done", invoice.status === "paid");
}

function renderQuote(): void {
  try {
    el.quoteId.textContent = quoteId();
  } catch {
    el.quoteId.textContent = "-";
  }

  if (!currentQuote || currentQuote.seller === ZERO_ADDRESS) {
    el.quoteStatus.textContent = "none";
    updateActions();
    return;
  }

  el.quoteStatus.textContent = `${quoteStatusLabel(currentQuote.status)} / ${formatEther(currentQuote.amount)} USDC`;
  updateActions();
}

function updateContractSummary(): void {
  const saved = el.contractAddress.value.trim();
  contractAddress = isAddress(saved) ? (saved as Address) : "";
  el.contractSummary.replaceChildren(
    contractAddress ? arcScanLink("address", contractAddress, shortHash(contractAddress)) : document.createTextNode("Not loaded"),
  );
}

function updateActions(): void {
  updateContractSummary();
  const invoice = selectedInvoice();
  const quoteState = currentQuote?.status ?? 0;
  const quoteExists = Boolean(currentQuote && currentQuote.seller !== ZERO_ADDRESS);
  const merchant = Boolean(invoice && account && invoice.merchantWallet.toLowerCase() === account.toLowerCase());
  const verified = Boolean(invoice && verifiedInvoices.has(invoice.id));
  el.registerInvoice.disabled = invoiceBusy || !merchant || !walletClient || !invoice || invoice.status !== "draft" || !contractAddress;
  el.payInvoice.disabled = invoiceBusy || !account || !walletClient || !invoice || invoice.status !== "registered" || !verified;
  el.cancelInvoice.disabled = invoiceBusy || !merchant || !walletClient || !invoice || invoice.status !== "registered" || !verified;
  el.copyLink.disabled = invoiceBusy || !invoice || invoice.status === "draft" || !verified || invoice.contractAddress?.toLowerCase() !== PUBLIC_INVOICE_CONTRACT;
  el.refreshInvoices.disabled = invoiceBusy;
  el.createQuote.disabled = !account || !walletClient || !contractAddress || quoteExists;
  el.acceptQuote.disabled = !account || !walletClient || !contractAddress || !quoteExists || quoteState !== 1;
  el.settleQuote.disabled = !account || !walletClient || !contractAddress || !quoteExists || quoteState !== 2;
  el.cancelQuote.disabled = !account || !walletClient || !contractAddress || !quoteExists || quoteState !== 1;
  el.refreshQuote.disabled = !contractAddress;
}

function renderInvoiceState(): void {
  renderRows();
  renderReceipt();
  updateActions();
}

function rememberInvoice(invoice: Invoice): void {
  invoices = [invoice, ...invoices.filter(item => item.id !== invoice.id)];
  saveBrowserInvoice(localStorage, invoice);
}

async function readInvoice(invoice: Pick<Invoice, "contractAddress" | "chainInvoiceId">) {
  if (!invoice.contractAddress) throw new Error("Invoice has no registered contract.");
  return publicClient.readContract({
    address: invoice.contractAddress, abi: invoiceReadAbi, functionName: "getInvoice", args: [invoice.chainInvoiceId],
  });
}

async function syncInvoice(invoice: Invoice): Promise<Invoice> {
  verifiedInvoices.delete(invoice.id);
  const updated = reconcileInvoice(invoice, await readInvoice(invoice));
  rememberInvoice(updated);
  verifiedInvoices.add(updated.id);
  return updated;
}

async function refreshSelectedInvoice(): Promise<void> {
  const invoice = selectedInvoice();
  const version = ++selectionVersion;
  el.verification.textContent = invoice?.contractAddress ? "Checking Arc Testnet..." : "Browser-only draft. Not registered on-chain.";
  if (!invoice?.contractAddress) return;
  verifiedInvoices.delete(invoice.id);
  updateActions();
  try {
    const updated = await syncInvoice(invoice);
    if (version !== selectionVersion) return;
    el.verification.textContent = updated.status === "draft" ? "Not registered on Arc Testnet." : "Status, merchant and amount verified on Arc Testnet.";
  } catch (error) {
    if (version !== selectionVersion) return;
    el.verification.textContent = "On-chain status unavailable. Payment and sharing disabled.";
    setStatus(errorMessage(error));
  } finally {
    if (version === selectionVersion) renderInvoiceState();
  }
}

function selectInvoice(id: string): void {
  if (invoiceBusy) return;
  selectedId = id;
  if (selectedId) {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("invoice", selectedId);
    window.history.replaceState(null, "", url);
  }
  renderInvoiceState();
  void refreshSelectedInvoice();
}

async function loadInvoices(): Promise<void> {
  invoices = readBrowserInvoices(localStorage);
  verifiedInvoices.clear();
  const reference = sharedInvoiceReference(window.location.href);
  if (reference) {
    setStatus("Reading shared invoice from Arc Testnet...");
    const chain = await readInvoice(reference);
    const existing = invoices.find(item => item.chainInvoiceId.toLowerCase() === reference.chainInvoiceId.toLowerCase() &&
      item.contractAddress?.toLowerCase() === reference.contractAddress);
    const imported = existing ? reconcileInvoice(existing, chain) : importChainInvoice(reference, chain);
    rememberInvoice(imported);
    selectedId = imported.id;
  }
  const requested = new URLSearchParams(window.location.search).get("invoice") ?? "";
  if (!reference && requested && !invoices.some(invoice => invoice.id === requested)) {
    selectedId = "";
    renderInvoiceState();
    throw new Error("This draft is not saved in this browser. Legacy local-server links are not public on-chain links.");
  }
  if (!selectedId && requested && invoices.some((invoice) => invoice.id === requested)) {
    selectedId = requested;
  }
  if (!invoices.some(invoice => invoice.id === selectedId)) {
    selectedId = invoices[0]?.id ?? "";
  }
  renderInvoiceState();
  setStatus(invoices.length ? "Browser history loaded. Cached statuses are checked when selected." : "No invoices saved in this browser.");
  await refreshSelectedInvoice();
}

async function createInvoice(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (invoiceBusy) return;

  const merchantWallet = el.merchantWallet.value.trim();
  if (!isAddress(merchantWallet)) {
    setStatus("Merchant wallet must be a valid EVM address.");
    return;
  }

  try {
    setStatus("Creating invoice...");
    const invoice = createInvoiceDraft({
        merchantName: el.merchantName.value.trim(),
        merchantWallet,
        customerName: el.customerName.value.trim(),
        customerEmail: el.customerEmail.value.trim(),
        amount: el.amount.value.trim(),
        description: el.description.value.trim(),
        dueDate: el.dueDate.value,
    });
    rememberInvoice(invoice);
    selectInvoice(invoice.id);
    setStatus(`Invoice ${invoice.id} saved in this browser only.`);
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function loadArtifact(): Promise<Artifact> {
  const response = await fetch("/circle/arc/public/artifacts/ArcInvoice.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("ArcInvoice artifact missing. Run npm run compile-custom.");
  }
  return response.json() as Promise<Artifact>;
}

async function deployContract(): Promise<void> {
  if (!walletClient || !account) {
    await connect();
  }
  if (!walletClient || !account) return;

  try {
    await ensureArc();
    const artifact = await loadArtifact();
    el.deployContract.disabled = true;
    setStatus("Deploying ArcInvoice contract...");
    const hash = await walletClient.deployContract({
      abi: arcInvoiceAbi,
      bytecode: artifact.bytecode,
      account,
      chain: arcTestnet,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) {
      throw new Error("Deployment receipt did not include a contract address.");
    }
    contractAddress = receipt.contractAddress;
    el.contractAddress.value = contractAddress;
    updateActions();
    setStatus(`Contract deployed at ${contractAddress}.`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    el.deployContract.disabled = false;
  }
}

async function registerInvoice(): Promise<void> {
  const invoice = selectedInvoice();
  if (invoiceBusy || !invoice || !walletClient || !account || !contractAddress) return;
  const target = invoice.contractAddress ?? contractAddress;
  let submittedHash: Hash | undefined;

  try {
    invoiceBusy = true;
    updateActions();
    if (invoice.status !== "draft") throw new Error("Only a draft can be registered.");
    if (invoice.merchantWallet.toLowerCase() !== account.toLowerCase()) {
      throw new Error("Connect the merchant wallet listed on this invoice before registering it on Arc.");
    }
    await assertInvoiceWallet();
    const current = { ...invoice, contractAddress: target };
    const chain = await readInvoice(current);
    if (chain.status !== 0) {
      rememberInvoice(reconcileInvoice(current, chain));
      throw new Error("Invoice already exists on Arc. State refreshed; no duplicate transaction submitted.");
    }
    rememberInvoice(current);
    setStatus("Registering invoice on Arc...");
    const metadataURI = `urn:arcinvoice:${invoice.chainInvoiceId}`;
    const hash = await walletClient.writeContract({
      address: target,
      abi: arcInvoiceAbi,
      functionName: "createInvoice",
      args: [invoice.chainInvoiceId, parseEther(invoice.totalDue), metadataURI],
      account,
      chain: arcTestnet,
    });
    submittedHash = hash;
    const pending = { ...current, registrationTxHash: hash };
    rememberInvoice(pending);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("Registration reverted on-chain.");
    await syncInvoice(pending);
    setStatus(`Invoice registered: ${hash}`);
  } catch (error) {
    setStatus(`${errorMessage(error)}${submittedHash ? ` Transaction: ${submittedHash}. Refresh state before retrying.` : ""}`);
  } finally {
    invoiceBusy = false;
    renderInvoiceState();
    await refreshSelectedInvoice();
  }
}

async function payInvoice(): Promise<void> {
  const invoice = selectedInvoice();
  if (invoiceBusy || !invoice || !walletClient || !account || !invoice.contractAddress) return;
  let submittedHash: Hash | undefined;

  try {
    invoiceBusy = true;
    updateActions();
    await assertInvoiceWallet();
    const current = await syncInvoice(invoice);
    if (current.status !== "registered") throw new Error("Invoice is no longer payable.");
    setStatus("Submitting USDC payment...");
    const hash = await walletClient.writeContract({
      address: invoice.contractAddress,
      abi: arcInvoiceAbi,
      functionName: "payInvoice",
      args: [invoice.chainInvoiceId],
      value: parseEther(current.totalDue),
      account,
      chain: arcTestnet,
    });
    submittedHash = hash;
    const pending = { ...current, paymentTxHash: hash };
    rememberInvoice(pending);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("Payment reverted on-chain.");
    await syncInvoice(pending);
    await refreshBalance();
    setStatus(`Payment confirmed: ${hash}`);
  } catch (error) {
    setStatus(`${errorMessage(error)}${submittedHash ? ` Transaction: ${submittedHash}. Refresh state before retrying.` : ""}`);
  } finally {
    invoiceBusy = false;
    renderInvoiceState();
    await refreshSelectedInvoice();
  }
}

async function cancelInvoice(): Promise<void> {
  const invoice = selectedInvoice();
  if (invoiceBusy || !invoice || !walletClient || !account || !invoice.contractAddress) return;
  let submittedHash: Hash | undefined;

  try {
    invoiceBusy = true;
    updateActions();
    if (invoice.merchantWallet.toLowerCase() !== account.toLowerCase()) {
      throw new Error("Connect the merchant wallet listed on this invoice before cancelling it.");
    }
    await assertInvoiceWallet();
    const current = await syncInvoice(invoice);
    if (current.status !== "registered") throw new Error("Invoice is no longer cancellable.");
    setStatus("Cancelling invoice on Arc...");
    const hash = await walletClient.writeContract({
      address: invoice.contractAddress,
      abi: arcInvoiceAbi,
      functionName: "cancelInvoice",
      args: [invoice.chainInvoiceId],
      account,
      chain: arcTestnet,
    });
    submittedHash = hash;
    const pending = { ...current, cancellationTxHash: hash };
    rememberInvoice(pending);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("Cancellation reverted on-chain.");
    await syncInvoice(pending);
    setStatus(`Invoice cancelled: ${hash}`);
  } catch (error) {
    setStatus(`${errorMessage(error)}${submittedHash ? ` Transaction: ${submittedHash}. Refresh state before retrying.` : ""}`);
  } finally {
    invoiceBusy = false;
    renderInvoiceState();
    await refreshSelectedInvoice();
  }
}

async function refreshQuote(): Promise<void> {
  if (!contractAddress) {
    setStatus("Deploy or load an ArcInvoice contract first.");
    return;
  }

  try {
    setStatus("Reading quote state...");
    const rawQuote = await publicClient.readContract({
      address: contractAddress,
      abi: arcInvoiceAbi,
      functionName: "getQuote",
      args: [quoteId()],
    });
    currentQuote = quoteFromRaw(rawQuote);
    renderQuote();
    setStatus("Quote state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createQuote(): Promise<void> {
  if (!walletClient || !account || !contractAddress) return;

  try {
    await ensureArc();
    const buyer = el.quoteBuyer.value.trim();
    const metadataURI = el.quoteMetadataURI.value.trim();
    if (!isAddress(buyer)) throw new Error("Quote buyer must be a valid EVM address.");
    if (!metadataURI) throw new Error("Quote metadata URI is required.");

    el.createQuote.disabled = true;
    setStatus("Creating quote on Arc...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInvoiceAbi,
      functionName: "createQuote",
      args: [quoteId(), buyer as Address, parseEther(el.quoteAmount.value.trim()), metadataURI],
      account,
      chain: arcTestnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshQuote();
    setStatus(`Quote created: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function acceptQuote(): Promise<void> {
  if (!walletClient || !account || !contractAddress) return;

  try {
    await ensureArc();
    const acceptanceURI = el.quoteAcceptanceURI.value.trim();
    if (!acceptanceURI) throw new Error("Quote acceptance URI is required.");

    el.acceptQuote.disabled = true;
    setStatus("Accepting quote...");
    const amount = currentQuote?.amount ?? parseEther(el.quoteAmount.value.trim());
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInvoiceAbi,
      functionName: "acceptQuote",
      args: [quoteId(), acceptanceURI],
      value: amount,
      account,
      chain: arcTestnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshQuote();
    setStatus(`Quote accepted: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function settleQuote(): Promise<void> {
  if (!walletClient || !account || !contractAddress) return;

  try {
    await ensureArc();
    const settlementTo = el.quoteSettlementTo.value.trim();
    if (!isAddress(settlementTo)) throw new Error("Quote settlement address must be valid.");

    el.settleQuote.disabled = true;
    setStatus("Settling quote...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInvoiceAbi,
      functionName: "settleQuote",
      args: [quoteId(), settlementTo as Address],
      account,
      chain: arcTestnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshQuote();
    setStatus(`Quote settled: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function cancelQuote(): Promise<void> {
  if (!walletClient || !account || !contractAddress) return;

  try {
    await ensureArc();
    el.cancelQuote.disabled = true;
    setStatus("Cancelling quote...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInvoiceAbi,
      functionName: "cancelQuote",
      args: [quoteId()],
      account,
      chain: arcTestnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshQuote();
    setStatus(`Quote cancelled: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function copyInvoiceLink(): Promise<void> {
  const invoice = selectedInvoice();
  if (!invoice || invoice.status === "draft" || !verifiedInvoices.has(invoice.id)) return;
  try {
    await navigator.clipboard.writeText(invoiceShareUrl(window.location.href, invoice).toString());
    setStatus("On-chain invoice link copied. Customer details and browser notes are not included.");
  } catch (error) { setStatus(errorMessage(error)); }
}

function saveContract(): void {
  const value = el.contractAddress.value.trim();
  if (!isAddress(value)) {
    setStatus("Contract address must be a valid EVM address.");
    return;
  }
  contractAddress = value as Address;
  updateActions();
  setStatus("Contract loaded.");
}

el.connect.addEventListener("click", () => void connect());
el.invoiceForm.addEventListener("submit", (event) => void createInvoice(event));
el.refreshInvoices.addEventListener("click", () => void loadInvoices().catch(error => setStatus(errorMessage(error))));
el.deployContract.addEventListener("click", () => void deployContract());
el.saveContract.addEventListener("click", saveContract);
el.registerInvoice.addEventListener("click", () => void registerInvoice());
el.payInvoice.addEventListener("click", () => void payInvoice());
el.cancelInvoice.addEventListener("click", () => void cancelInvoice());
el.copyLink.addEventListener("click", () => void copyInvoiceLink());
el.createQuote.addEventListener("click", () => void createQuote());
el.acceptQuote.addEventListener("click", () => void acceptQuote());
el.settleQuote.addEventListener("click", () => void settleQuote());
el.cancelQuote.addEventListener("click", () => void cancelQuote());
el.refreshQuote.addEventListener("click", () => void refreshQuote());
el.quoteTitle.addEventListener("input", () => {
  currentQuote = null;
  renderQuote();
});
el.contractAddress.addEventListener("input", updateActions);

void loadInvoices().catch((error) => setStatus(errorMessage(error)));
updateContractSummary();
renderQuote();
