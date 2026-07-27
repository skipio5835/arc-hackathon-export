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

type ListingSummary = {
  seller: Address;
  treasury: Address;
  price: bigint;
  maxOrders: bigint;
  sold: bigint;
  fulfilled: bigint;
  refunded: bigint;
  settledAmount: bigint;
  createdAt: bigint;
  active: boolean;
  title: string;
  metadataURI: string;
};

type OrderSummary = {
  buyer: Address;
  amount: bigint;
  purchasedAt: bigint;
  fulfilled: boolean;
  refunded: boolean;
  fulfillmentURI: string;
};

type ReturnSummary = {
  requester: Address;
  requestedAt: bigint;
  reviewedAt: bigint;
  closedAt: bigint;
  accepted: boolean;
  reasonURI: string;
  reviewURI: string;
  closeURI: string;
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

const CONTRACT_KEY = "arcMarketplace.v2.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcMarketplaceAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "address", name: "treasury", type: "address" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "maxOrders", type: "uint256" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "listingId", type: "bytes32" }],
    name: "purchase",
    outputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "string", name: "fulfillmentURI", type: "string" },
    ],
    name: "fulfillOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "refundOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "string", name: "reasonURI", type: "string" },
    ],
    name: "requestReturn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "bool", name: "accepted", type: "bool" },
      { internalType: "string", name: "reviewURI", type: "string" },
    ],
    name: "reviewReturn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "string", name: "closeURI", type: "string" },
    ],
    name: "closeReturn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
    ],
    name: "settleListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "listingId", type: "bytes32" }],
    name: "getListing",
    outputs: [
      {
        components: [
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "address", name: "treasury", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "maxOrders", type: "uint256" },
          { internalType: "uint256", name: "sold", type: "uint256" },
          { internalType: "uint256", name: "fulfilled", type: "uint256" },
          { internalType: "uint256", name: "refunded", type: "uint256" },
          { internalType: "uint256", name: "settledAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
        ],
        internalType: "struct ArcMarketplaceOrders.Listing",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "uint256", name: "orderId", type: "uint256" },
    ],
    name: "getOrder",
    outputs: [
      {
        components: [
          { internalType: "address", name: "buyer", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint64", name: "purchasedAt", type: "uint64" },
          { internalType: "bool", name: "fulfilled", type: "bool" },
          { internalType: "bool", name: "refunded", type: "bool" },
          { internalType: "string", name: "fulfillmentURI", type: "string" },
        ],
        internalType: "struct ArcMarketplaceOrders.Order",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "uint256", name: "orderId", type: "uint256" },
    ],
    name: "getReturnCase",
    outputs: [
      {
        components: [
          { internalType: "address", name: "requester", type: "address" },
          { internalType: "uint64", name: "requestedAt", type: "uint64" },
          { internalType: "uint64", name: "reviewedAt", type: "uint64" },
          { internalType: "uint64", name: "closedAt", type: "uint64" },
          { internalType: "bool", name: "accepted", type: "bool" },
          { internalType: "string", name: "reasonURI", type: "string" },
          { internalType: "string", name: "reviewURI", type: "string" },
          { internalType: "string", name: "closeURI", type: "string" },
          { internalType: "enum ArcMarketplaceOrders.ReturnStatus", name: "status", type: "uint8" },
        ],
        internalType: "struct ArcMarketplaceOrders.ReturnCase",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "listingId", type: "bytes32" },
      { internalType: "address", name: "buyer", type: "address" },
    ],
    name: "getOrderOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
let currentListing: ListingSummary | null = null;
let currentOrder: OrderSummary | null = null;
let currentOrderId = 0n;
let currentReturn: ReturnSummary | null = null;

const el = {
  buyOrder: document.querySelector<HTMLButtonElement>("#buyOrder")!,
  closeReturn: document.querySelector<HTMLButtonElement>("#closeReturn")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createListing: document.querySelector<HTMLButtonElement>("#createListing")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  fulfillOrder: document.querySelector<HTMLButtonElement>("#fulfillOrder")!,
  fulfillmentURI: document.querySelector<HTMLInputElement>("#fulfillmentURI")!,
  listingId: document.querySelector<HTMLElement>("#listingId")!,
  listingStatus: document.querySelector<HTMLElement>("#listingStatus")!,
  maxOrders: document.querySelector<HTMLInputElement>("#maxOrders")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  orderId: document.querySelector<HTMLElement>("#orderId")!,
  orderIdOverride: document.querySelector<HTMLInputElement>("#orderIdOverride")!,
  orderStatus: document.querySelector<HTMLElement>("#orderStatus")!,
  price: document.querySelector<HTMLInputElement>("#price")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundOrder: document.querySelector<HTMLButtonElement>("#refundOrder")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  requestReturn: document.querySelector<HTMLButtonElement>("#requestReturn")!,
  returnAccepted: document.querySelector<HTMLInputElement>("#returnAccepted")!,
  returnCloseURI: document.querySelector<HTMLInputElement>("#returnCloseURI")!,
  returnReasonURI: document.querySelector<HTMLInputElement>("#returnReasonURI")!,
  returnReviewURI: document.querySelector<HTMLInputElement>("#returnReviewURI")!,
  returnStatus: document.querySelector<HTMLElement>("#returnStatus")!,
  reviewReturn: document.querySelector<HTMLButtonElement>("#reviewReturn")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  sellerAddress: document.querySelector<HTMLElement>("#sellerAddress")!,
  settleListing: document.querySelector<HTMLButtonElement>("#settleListing")!,
  settlementTo: document.querySelector<HTMLInputElement>("#settlementTo")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  supplyStatus: document.querySelector<HTMLElement>("#supplyStatus")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  treasury: document.querySelector<HTMLInputElement>("#treasury")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.fulfillmentURI.value = `local:arc-market-order-${today}:fulfilled`;
el.maxOrders.value = "5";
el.metadataURI.value = `local:arc-market-${today}`;
el.price.value = "0.005";
el.orderIdOverride.value = "";
el.refundTo.value = DEFAULT_ACCOUNT;
el.returnAccepted.checked = true;
el.returnCloseURI.value = `local:arc-market-return-${today}:closed`;
el.returnReasonURI.value = `local:arc-market-return-${today}:requested`;
el.returnReviewURI.value = `local:arc-market-return-${today}:approved`;
el.settlementTo.value = DEFAULT_ACCOUNT;
el.title.value = `arc-market-${today}`;
el.treasury.value = DEFAULT_ACCOUNT;

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

function listingId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const seller = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${seller}:${title}`));
}

async function waitForSuccess(hash: Hash): Promise<void> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Transaction reverted: ${hash}`);
  }
}

function selectedOrderId(): bigint {
  if (currentOrderId > 0n) return currentOrderId;
  const raw = el.orderIdOverride.value.trim();
  if (!raw) return 0n;
  const parsed = BigInt(raw);
  if (parsed < 1n) throw new Error("Order ID must be positive.");
  return parsed;
}

function listingFromRaw(value: unknown): ListingSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<ListingSummary>;
    return {
      seller: object.seller ?? ZERO_ADDRESS,
      treasury: object.treasury ?? ZERO_ADDRESS,
      price: object.price ?? 0n,
      maxOrders: object.maxOrders ?? 0n,
      sold: object.sold ?? 0n,
      fulfilled: object.fulfilled ?? 0n,
      refunded: object.refunded ?? 0n,
      settledAmount: object.settledAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      active: Boolean(object.active),
      title: object.title ?? "",
      metadataURI: object.metadataURI ?? "",
    };
  }

  return {
    seller: value[0] as Address,
    treasury: value[1] as Address,
    price: value[2] as bigint,
    maxOrders: value[3] as bigint,
    sold: value[4] as bigint,
    fulfilled: value[5] as bigint,
    refunded: value[6] as bigint,
    settledAmount: value[7] as bigint,
    createdAt: value[8] as bigint,
    active: Boolean(value[9]),
    title: value[10] as string,
    metadataURI: value[11] as string,
  };
}

function orderFromRaw(value: unknown): OrderSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<OrderSummary>;
    return {
      buyer: object.buyer ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      purchasedAt: object.purchasedAt ?? 0n,
      fulfilled: Boolean(object.fulfilled),
      refunded: Boolean(object.refunded),
      fulfillmentURI: object.fulfillmentURI ?? "",
    };
  }

  return {
    buyer: value[0] as Address,
    amount: value[1] as bigint,
    purchasedAt: value[2] as bigint,
    fulfilled: Boolean(value[3]),
    refunded: Boolean(value[4]),
    fulfillmentURI: value[5] as string,
  };
}

function returnFromRaw(value: unknown): ReturnSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<ReturnSummary>;
    return {
      requester: object.requester ?? ZERO_ADDRESS,
      requestedAt: object.requestedAt ?? 0n,
      reviewedAt: object.reviewedAt ?? 0n,
      closedAt: object.closedAt ?? 0n,
      accepted: Boolean(object.accepted),
      reasonURI: object.reasonURI ?? "",
      reviewURI: object.reviewURI ?? "",
      closeURI: object.closeURI ?? "",
      status: object.status ?? 0,
    };
  }

  return {
    requester: value[0] as Address,
    requestedAt: value[1] as bigint,
    reviewedAt: value[2] as bigint,
    closedAt: value[3] as bigint,
    accepted: Boolean(value[4]),
    reasonURI: value[5] as string,
    reviewURI: value[6] as string,
    closeURI: value[7] as string,
    status: Number(value[8]),
  };
}

function returnStatusLabel(value: ReturnSummary | null): string {
  if (!value || value.status === 0) return "none";
  if (value.status === 1) return "requested";
  if (value.status === 2) return value.accepted ? "approved" : "rejected";
  if (value.status === 3) return value.accepted ? "closed / approved" : "closed / rejected";
  return "unknown";
}

function updateListingIdDisplay(): void {
  try {
    el.listingId.textContent = listingId();
  } catch {
    el.listingId.textContent = "-";
  }
}

function renderListing(): void {
  updateListingIdDisplay();

  if (!currentListing || currentListing.seller === ZERO_ADDRESS) {
    el.listingStatus.textContent = "not created";
    el.orderId.textContent = "-";
    el.orderStatus.textContent = "none";
    el.returnStatus.textContent = "none";
    el.sellerAddress.textContent = "-";
    el.supplyStatus.textContent = "0 / 0";
    updateActions();
    return;
  }

  const gross = currentListing.price * currentListing.sold;
  const available = gross - currentListing.refunded - currentListing.settledAmount;
  el.listingStatus.textContent = currentListing.active ? "active" : "inactive";
  el.sellerAddress.innerHTML = `<a href="${addressUrl(currentListing.seller)}" target="_blank" rel="noreferrer">${shortValue(
    currentListing.seller,
  )}</a>`;
  el.supplyStatus.textContent = `${currentListing.sold.toString()} / ${currentListing.maxOrders.toString()}, ${formatEther(
    available,
  )} USDC available`;
  el.orderId.textContent = currentOrderId > 0n ? currentOrderId.toString() : "-";
  el.orderStatus.textContent = currentOrder
    ? currentOrder.refunded
      ? "refunded"
      : currentOrder.fulfilled
        ? "fulfilled"
        : "purchased"
    : "none";
  el.returnStatus.textContent = returnStatusLabel(currentReturn);
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasListing = Boolean(currentListing && currentListing.seller !== ZERO_ADDRESS);
  const active = hasListing && Boolean(currentListing?.active);
  const hasOrder = Boolean(currentOrder && currentOrder.buyer !== ZERO_ADDRESS);
  const manualOrderId = (() => {
    try {
      return selectedOrderId();
    } catch {
      return 0n;
    }
  })();
  const hasSelectedOrder = hasOrder || manualOrderId > 0n;
  const canFulfill =
    active && hasSelectedOrder && (!currentOrder || (!currentOrder.fulfilled && !currentOrder.refunded));
  const returnStatus = currentReturn?.status ?? 0;
  const gross = currentListing ? currentListing.price * currentListing.sold : 0n;
  const available = currentListing ? gross - currentListing.refunded - currentListing.settledAmount : 0n;

  el.buyOrder.disabled = !hasWallet || !hasContract || !active || hasOrder;
  el.closeReturn.disabled = !hasWallet || !hasContract || !hasSelectedOrder || (currentReturn ? returnStatus !== 2 : false);
  el.createListing.disabled = !hasWallet || !hasContract || hasListing;
  el.deployContract.disabled = !hasWallet;
  el.fulfillOrder.disabled = !hasWallet || !hasContract || !canFulfill;
  el.refresh.disabled = !hasContract;
  el.refundOrder.disabled = !hasWallet || !hasContract || !active || !hasOrder || Boolean(currentOrder?.fulfilled);
  el.requestReturn.disabled =
    !hasWallet ||
    !hasContract ||
    !hasSelectedOrder ||
    Boolean(currentOrder?.refunded) ||
    (currentOrder ? !currentOrder.fulfilled : false) ||
    returnStatus !== 0;
  el.reviewReturn.disabled = !hasWallet || !hasContract || !hasSelectedOrder || (currentReturn ? returnStatus !== 1 : false);
  el.settleListing.disabled = !hasWallet || !hasContract || !hasListing || available === 0n;
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
    el.refundTo.value = account;
    el.settlementTo.value = account;
    el.treasury.value = account;
    el.connect.textContent = "Connected";
    updateListingIdDisplay();
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
    setStatus("Deploying ArcMarketplaceOrders...");
    const artifact = (await fetch("/public/artifacts/ArcMarketplaceOrders.json").then((response) =>
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
    setStatus(`ArcMarketplaceOrders deployed at ${contractAddress}.`);
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
    currentListing = null;
    currentOrder = null;
    currentOrderId = 0n;
    currentReturn = null;
    renderListing();
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

async function refreshListing(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading listing state...");
    const id = listingId();
    const rawListing = await publicClient.readContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "getListing",
      args: [id],
    });
    currentListing = listingFromRaw(rawListing);

    currentOrderId = 0n;
    currentOrder = null;
    currentReturn = null;
    if (account) {
      try {
        currentOrderId = await publicClient.readContract({
          address: contractAddress,
          abi: arcMarketplaceAbi,
          functionName: "getOrderOf",
          args: [id, account],
        });

        if (currentOrderId > 0n) {
          const rawOrder = await publicClient.readContract({
            address: contractAddress,
            abi: arcMarketplaceAbi,
            functionName: "getOrder",
            args: [id, currentOrderId],
          });
          currentOrder = orderFromRaw(rawOrder);

          try {
            const rawReturn = await publicClient.readContract({
              address: contractAddress,
              abi: arcMarketplaceAbi,
              functionName: "getReturnCase",
              args: [id, currentOrderId],
            });
            currentReturn = returnFromRaw(rawReturn);
          } catch {
            currentReturn = null;
          }
        }
      } catch {
        currentOrderId = selectedOrderId();
      }
    }

    renderListing();
    setStatus("Listing state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createListing(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createListing.disabled = true;
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const treasury = el.treasury.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(treasury)) throw new Error("Treasury must be a valid EVM address.");
    const price = parseEther(el.price.value.trim());
    const maxOrders = BigInt(el.maxOrders.value.trim());

    setStatus("Creating listing...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "createListing",
      args: [listingId(), treasury as Address, price, maxOrders, title, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await waitForSuccess(hash);
    await refreshListing();
    setStatus("Listing created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function buyOrder(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || !currentListing) return;

  try {
    el.buyOrder.disabled = true;
    setStatus("Buying marketplace order...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "purchase",
      args: [listingId()],
      account,
      chain: arcTestnet,
      value: currentListing.price,
    });
    setStatus("Purchase submitted:", hash);
    await waitForSuccess(hash);
    await refreshBalance();
    await refreshListing();
    setStatus("Order purchased:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function fulfillOrder(): Promise<void> {
  if (!walletClient || !account) await connect();
  const orderId = selectedOrderId();
  if (!walletClient || !account || !contractAddress || orderId === 0n) return;

  try {
    el.fulfillOrder.disabled = true;
    const fulfillmentURI = el.fulfillmentURI.value.trim();
    if (!fulfillmentURI) throw new Error("Fulfillment URI is required.");

    setStatus("Fulfilling order...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "fulfillOrder",
      args: [listingId(), orderId, fulfillmentURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Fulfill submitted:", hash);
    await waitForSuccess(hash);
    await refreshListing();
    setStatus("Order fulfilled:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function refundOrder(): Promise<void> {
  if (!walletClient || !account) await connect();
  const orderId = selectedOrderId();
  if (!walletClient || !account || !contractAddress || orderId === 0n) return;

  try {
    el.refundOrder.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Refunding order...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "refundOrder",
      args: [listingId(), orderId, refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Refund submitted:", hash);
    await waitForSuccess(hash);
    await refreshBalance();
    await refreshListing();
    setStatus("Order refunded:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function requestReturn(): Promise<void> {
  if (!walletClient || !account) await connect();
  const orderId = selectedOrderId();
  if (!walletClient || !account || !contractAddress || orderId === 0n) return;

  try {
    el.requestReturn.disabled = true;
    const reasonURI = el.returnReasonURI.value.trim();
    if (!reasonURI) throw new Error("Return reason URI is required.");

    setStatus("Requesting order return...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "requestReturn",
      args: [listingId(), orderId, reasonURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Return request submitted:", hash);
    await waitForSuccess(hash);
    await refreshListing();
    setStatus("Return requested:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function reviewReturn(): Promise<void> {
  if (!walletClient || !account) await connect();
  const orderId = selectedOrderId();
  if (!walletClient || !account || !contractAddress || orderId === 0n) return;

  try {
    el.reviewReturn.disabled = true;
    const reviewURI = el.returnReviewURI.value.trim();
    if (!reviewURI) throw new Error("Return review URI is required.");

    setStatus("Reviewing order return...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "reviewReturn",
      args: [listingId(), orderId, el.returnAccepted.checked, reviewURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Return review submitted:", hash);
    await waitForSuccess(hash);
    await refreshListing();
    setStatus("Return reviewed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeReturn(): Promise<void> {
  if (!walletClient || !account) await connect();
  const orderId = selectedOrderId();
  if (!walletClient || !account || !contractAddress || orderId === 0n) return;

  try {
    el.closeReturn.disabled = true;
    const closeURI = el.returnCloseURI.value.trim();
    if (!closeURI) throw new Error("Return close URI is required.");

    setStatus("Closing order return...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "closeReturn",
      args: [listingId(), orderId, closeURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Return close submitted:", hash);
    await waitForSuccess(hash);
    await refreshListing();
    setStatus("Return closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function settleListing(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.settleListing.disabled = true;
    const settlementTo = el.settlementTo.value.trim();
    if (!isAddress(settlementTo)) throw new Error("Settlement address must be a valid EVM address.");

    setStatus("Settling listing revenue...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMarketplaceAbi,
      functionName: "settleListing",
      args: [listingId(), settlementTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Settle submitted:", hash);
    await waitForSuccess(hash);
    await refreshBalance();
    await refreshListing();
    setStatus("Listing settled:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.buyOrder.addEventListener("click", () => void buyOrder());
el.closeReturn.addEventListener("click", () => void closeReturn());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createListing.addEventListener("click", () => void createListing());
el.deployContract.addEventListener("click", () => void deployContract());
el.fulfillOrder.addEventListener("click", () => void fulfillOrder());
el.refresh.addEventListener("click", () => void refreshListing());
el.refundOrder.addEventListener("click", () => void refundOrder());
el.requestReturn.addEventListener("click", () => void requestReturn());
el.reviewReturn.addEventListener("click", () => void reviewReturn());
el.saveContract.addEventListener("click", saveContract);
el.settleListing.addEventListener("click", () => void settleListing());
el.title.addEventListener("input", () => {
  currentListing = null;
  currentOrder = null;
  currentOrderId = 0n;
  currentReturn = null;
  renderListing();
});

renderListing();
