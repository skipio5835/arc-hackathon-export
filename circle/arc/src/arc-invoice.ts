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

type InvoiceStatus = "draft" | "registered" | "paid" | "cancelled";

type Invoice = {
  id: string;
  chainInvoiceId: Hash;
  merchantName: string;
  merchantWallet: Address;
  customerName: string;
  customerEmail: string;
  description: string;
  amount: string;
  totalDue: string;
  dueDate: string;
  status: InvoiceStatus;
  contractAddress?: Address;
  registrationTxHash?: Hash;
  paymentTxHash?: Hash;
  cancellationTxHash?: Hash;
  payer?: Address;
  createdAt: string;
  updatedAt: string;
};

type InvoiceListResponse = {
  invoices: Invoice[];
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

const DEFAULT_CONTRACT_ADDRESS = "0xda11c8b98f17164180eed93c4b62bc60407692d1" as Address;
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
let contractAddress = (localStorage.getItem("arcinvoice.contractAddress") ?? DEFAULT_CONTRACT_ADDRESS) as Address | "";
let currentQuote: QuoteSummary | null = null;

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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
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
  el.invoiceRows.innerHTML = invoices
    .map((invoice) => {
      const selected = invoice.id === selectedId ? "true" : "false";
      return `
        <tr data-selected="${selected}">
          <td>${escapeHtml(invoice.id)}</td>
          <td>${escapeHtml(invoice.customerName)}</td>
          <td>${escapeHtml(invoice.totalDue)} USDC</td>
          <td><span class="${statusClass(invoice.status)}">${statusLabel(invoice.status)}</span></td>
          <td><button class="select-row secondary" data-id="${escapeHtml(invoice.id)}" type="button">Select</button></td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll<HTMLButtonElement>(".select-row").forEach((button) => {
    button.addEventListener("click", () => selectInvoice(button.dataset.id ?? ""));
  });

  const open = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled").length;
  el.invoiceCount.textContent = `${open} open`;
  const volume = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + Number(invoice.totalDue), 0);
  el.paidVolume.textContent = `${volume.toFixed(2)} USDC`;
}

function receiptField(label: string, value: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`;
}

function renderReceipt(): void {
  const invoice = selectedInvoice();
  if (!invoice) {
    el.selectedStatus.className = "status draft";
    el.selectedStatus.textContent = "draft";
    el.receipt.innerHTML = receiptField("Invoice", "-") + receiptField("Amount", "-");
    return;
  }

  el.selectedStatus.className = statusClass(invoice.status);
  el.selectedStatus.textContent = statusLabel(invoice.status);
  const contract = invoice.contractAddress ?? contractAddress;
  const registration = invoice.registrationTxHash
    ? `<a href="${txUrl(invoice.registrationTxHash)}" target="_blank" rel="noreferrer">${shortHash(invoice.registrationTxHash)}</a>`
    : "-";
  const payment = invoice.paymentTxHash
    ? `<a href="${txUrl(invoice.paymentTxHash)}" target="_blank" rel="noreferrer">${shortHash(invoice.paymentTxHash)}</a>`
    : "-";
  const cancellation = invoice.cancellationTxHash
    ? `<a href="${txUrl(invoice.cancellationTxHash)}" target="_blank" rel="noreferrer">${shortHash(invoice.cancellationTxHash)}</a>`
    : "-";
  const contractLink = contract
    ? `<a href="${addressUrl(contract)}" target="_blank" rel="noreferrer">${shortHash(contract)}</a>`
    : "-";

  el.receipt.innerHTML = [
    receiptField("Invoice", escapeHtml(invoice.id)),
    receiptField("Total due", `${escapeHtml(invoice.totalDue)} USDC`),
    receiptField("Merchant", escapeHtml(invoice.merchantName)),
    receiptField("Customer", escapeHtml(invoice.customerName)),
    receiptField("Chain invoice id", escapeHtml(shortHash(invoice.chainInvoiceId))),
    receiptField("Contract", contractLink),
    receiptField("Register tx", registration),
    receiptField("Payment tx", payment),
    receiptField("Cancel tx", cancellation),
  ].join("");

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
  el.contractSummary.innerHTML = contractAddress
    ? `<a href="${addressUrl(contractAddress)}" target="_blank" rel="noreferrer">${shortHash(contractAddress)}</a>`
    : "Not loaded";
}

function updateActions(): void {
  updateContractSummary();
  const invoice = selectedInvoice();
  const quoteState = currentQuote?.status ?? 0;
  const quoteExists = Boolean(currentQuote && currentQuote.seller !== ZERO_ADDRESS);
  el.registerInvoice.disabled = !account || !walletClient || !invoice || invoice.status !== "draft" || !contractAddress;
  el.payInvoice.disabled = !account || !walletClient || !invoice || invoice.status !== "registered" || !contractAddress;
  el.cancelInvoice.disabled = !account || !walletClient || !invoice || invoice.status !== "registered" || !contractAddress;
  el.copyLink.disabled = !invoice;
  el.createQuote.disabled = !account || !walletClient || !contractAddress || quoteExists;
  el.acceptQuote.disabled = !account || !walletClient || !contractAddress || !quoteExists || quoteState !== 1;
  el.settleQuote.disabled = !account || !walletClient || !contractAddress || !quoteExists || quoteState !== 2;
  el.cancelQuote.disabled = !account || !walletClient || !contractAddress || !quoteExists || quoteState !== 1;
  el.refreshQuote.disabled = !contractAddress;
}

function selectInvoice(id: string): void {
  selectedId = id;
  if (selectedId) {
    const url = new URL(window.location.href);
    url.searchParams.set("invoice", selectedId);
    window.history.replaceState(null, "", url);
  }
  renderRows();
  renderReceipt();
  updateActions();
}

async function loadInvoices(): Promise<void> {
  const payload = await requestJson<InvoiceListResponse>("/api/arcinvoice/invoices");
  invoices = payload.invoices;

  const requested = new URLSearchParams(window.location.search).get("invoice") ?? "";
  if (!selectedId && requested && invoices.some((invoice) => invoice.id === requested)) {
    selectedId = requested;
  }
  if (!selectedId && invoices.length > 0) {
    selectedId = invoices[0].id;
  }

  renderRows();
  renderReceipt();
  updateActions();
}

async function createInvoice(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const merchantWallet = el.merchantWallet.value.trim();
  if (!isAddress(merchantWallet)) {
    setStatus("Merchant wallet must be a valid EVM address.");
    return;
  }

  try {
    setStatus("Creating invoice...");
    const invoice = await requestJson<Invoice>("/api/arcinvoice/invoices", {
      method: "POST",
      body: JSON.stringify({
        merchantName: el.merchantName.value.trim(),
        merchantWallet,
        customerName: el.customerName.value.trim(),
        customerEmail: el.customerEmail.value.trim(),
        amount: el.amount.value.trim(),
        description: el.description.value.trim(),
        dueDate: el.dueDate.value,
      }),
    });
    invoices = [invoice, ...invoices.filter((item) => item.id !== invoice.id)];
    selectInvoice(invoice.id);
    setStatus(`Invoice ${invoice.id} created.`);
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
    localStorage.setItem("arcinvoice.contractAddress", contractAddress);
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
  if (!invoice || !walletClient || !account || !contractAddress) return;

  try {
    if (invoice.merchantWallet.toLowerCase() !== account.toLowerCase()) {
      throw new Error("Connect the merchant wallet listed on this invoice before registering it on Arc.");
    }
    await ensureArc();
    el.registerInvoice.disabled = true;
    setStatus("Registering invoice on Arc...");
    const metadataURI = `${window.location.origin}/api/arcinvoice/invoices/${invoice.id}`;
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInvoiceAbi,
      functionName: "createInvoice",
      args: [invoice.chainInvoiceId, parseEther(invoice.totalDue), metadataURI],
      account,
      chain: arcTestnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    const updated = await requestJson<Invoice>(`/api/arcinvoice/invoices/${invoice.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "registered",
        contractAddress,
        registrationTxHash: hash,
      }),
    });
    invoices = invoices.map((item) => (item.id === updated.id ? updated : item));
    selectInvoice(updated.id);
    setStatus(`Invoice registered: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function payInvoice(): Promise<void> {
  const invoice = selectedInvoice();
  if (!invoice || !walletClient || !account || !contractAddress) return;

  try {
    await ensureArc();
    el.payInvoice.disabled = true;
    setStatus("Submitting USDC payment...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInvoiceAbi,
      functionName: "payInvoice",
      args: [invoice.chainInvoiceId],
      value: parseEther(invoice.totalDue),
      account,
      chain: arcTestnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    const updated = await requestJson<Invoice>(`/api/arcinvoice/invoices/${invoice.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "paid",
        paymentTxHash: hash,
        payer: account,
      }),
    });
    invoices = invoices.map((item) => (item.id === updated.id ? updated : item));
    selectInvoice(updated.id);
    await refreshBalance();
    setStatus(`Payment confirmed: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function cancelInvoice(): Promise<void> {
  const invoice = selectedInvoice();
  if (!invoice || !walletClient || !account || !contractAddress) return;

  try {
    if (invoice.merchantWallet.toLowerCase() !== account.toLowerCase()) {
      throw new Error("Connect the merchant wallet listed on this invoice before cancelling it.");
    }
    await ensureArc();
    el.cancelInvoice.disabled = true;
    setStatus("Cancelling invoice on Arc...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcInvoiceAbi,
      functionName: "cancelInvoice",
      args: [invoice.chainInvoiceId],
      account,
      chain: arcTestnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    const updated = await requestJson<Invoice>(`/api/arcinvoice/invoices/${invoice.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "cancelled",
        cancellationTxHash: hash,
      }),
    });
    invoices = invoices.map((item) => (item.id === updated.id ? updated : item));
    selectInvoice(updated.id);
    setStatus(`Invoice cancelled: ${hash}`);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
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
  if (!invoice) return;
  const url = new URL(window.location.href);
  url.searchParams.set("invoice", invoice.id);
  await navigator.clipboard.writeText(url.toString());
  setStatus("Invoice link copied.");
}

function saveContract(): void {
  const value = el.contractAddress.value.trim();
  if (!isAddress(value)) {
    setStatus("Contract address must be a valid EVM address.");
    return;
  }
  contractAddress = value as Address;
  localStorage.setItem("arcinvoice.contractAddress", contractAddress);
  updateActions();
  setStatus("Contract loaded.");
}

el.connect.addEventListener("click", () => void connect());
el.invoiceForm.addEventListener("submit", (event) => void createInvoice(event));
el.refreshInvoices.addEventListener("click", () => void loadInvoices());
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
