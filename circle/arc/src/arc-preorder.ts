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

type ProductSummary = {
  seller: Address;
  treasury: Address;
  price: bigint;
  maxSupply: bigint;
  ordered: bigint;
  fulfilled: bigint;
  refunded: bigint;
  settledAmount: bigint;
  createdAt: bigint;
  active: boolean;
  title: string;
  metadataURI: string;
};

type PreorderSummary = {
  buyer: Address;
  amount: bigint;
  orderedAt: bigint;
  fulfilled: boolean;
  refunded: boolean;
  fulfillmentURI: string;
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

const CONTRACT_KEY = "arcPreorderStore.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcPreorderAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "productId", type: "bytes32" },
      { internalType: "address", name: "treasury", type: "address" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createProduct",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "productId", type: "bytes32" }],
    name: "preorder",
    outputs: [{ internalType: "uint256", name: "preorderId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "productId", type: "bytes32" },
      { internalType: "uint256", name: "preorderId", type: "uint256" },
      { internalType: "string", name: "fulfillmentURI", type: "string" },
    ],
    name: "fulfillPreorder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "productId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
    ],
    name: "settleProduct",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "productId", type: "bytes32" },
      { internalType: "uint256", name: "preorderId", type: "uint256" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "refundPreorder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "productId", type: "bytes32" }],
    name: "getProduct",
    outputs: [
      {
        components: [
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "address", name: "treasury", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "maxSupply", type: "uint256" },
          { internalType: "uint256", name: "ordered", type: "uint256" },
          { internalType: "uint256", name: "fulfilled", type: "uint256" },
          { internalType: "uint256", name: "refunded", type: "uint256" },
          { internalType: "uint256", name: "settledAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
        ],
        internalType: "struct ArcPreorderStore.Product",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "productId", type: "bytes32" },
      { internalType: "uint256", name: "preorderId", type: "uint256" },
    ],
    name: "getPreorder",
    outputs: [
      {
        components: [
          { internalType: "address", name: "buyer", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint64", name: "orderedAt", type: "uint64" },
          { internalType: "bool", name: "fulfilled", type: "bool" },
          { internalType: "bool", name: "refunded", type: "bool" },
          { internalType: "string", name: "fulfillmentURI", type: "string" },
        ],
        internalType: "struct ArcPreorderStore.Preorder",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "productId", type: "bytes32" },
      { internalType: "address", name: "buyer", type: "address" },
    ],
    name: "getPreorderOf",
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
let currentProduct: ProductSummary | null = null;
let currentPreorder: PreorderSummary | null = null;
let currentPreorderId = 0n;

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createProduct: document.querySelector<HTMLButtonElement>("#createProduct")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  fulfillPreorder: document.querySelector<HTMLButtonElement>("#fulfillPreorder")!,
  fulfillmentURI: document.querySelector<HTMLInputElement>("#fulfillmentURI")!,
  maxSupply: document.querySelector<HTMLInputElement>("#maxSupply")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  placePreorder: document.querySelector<HTMLButtonElement>("#placePreorder")!,
  preorderId: document.querySelector<HTMLElement>("#preorderId")!,
  preorderStatus: document.querySelector<HTMLElement>("#preorderStatus")!,
  price: document.querySelector<HTMLInputElement>("#price")!,
  productId: document.querySelector<HTMLElement>("#productId")!,
  productStatus: document.querySelector<HTMLElement>("#productStatus")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundPreorder: document.querySelector<HTMLButtonElement>("#refundPreorder")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  sellerAddress: document.querySelector<HTMLElement>("#sellerAddress")!,
  settleProduct: document.querySelector<HTMLButtonElement>("#settleProduct")!,
  settlementTo: document.querySelector<HTMLInputElement>("#settlementTo")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  supplyStatus: document.querySelector<HTMLElement>("#supplyStatus")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  treasury: document.querySelector<HTMLInputElement>("#treasury")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.fulfillmentURI.value = `local:arc-preorder-${today}:fulfilled`;
el.maxSupply.value = "5";
el.metadataURI.value = `local:arc-preorder-${today}`;
el.price.value = "0.005";
el.refundTo.value = DEFAULT_ACCOUNT;
el.settlementTo.value = DEFAULT_ACCOUNT;
el.title.value = `arc-preorder-${today}`;
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

function productId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const seller = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${seller}:${title}`));
}

function productFromRaw(value: unknown): ProductSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<ProductSummary>;
    return {
      seller: object.seller ?? ZERO_ADDRESS,
      treasury: object.treasury ?? ZERO_ADDRESS,
      price: object.price ?? 0n,
      maxSupply: object.maxSupply ?? 0n,
      ordered: object.ordered ?? 0n,
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
    maxSupply: value[3] as bigint,
    ordered: value[4] as bigint,
    fulfilled: value[5] as bigint,
    refunded: value[6] as bigint,
    settledAmount: value[7] as bigint,
    createdAt: value[8] as bigint,
    active: Boolean(value[9]),
    title: value[10] as string,
    metadataURI: value[11] as string,
  };
}

function preorderFromRaw(value: unknown): PreorderSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<PreorderSummary>;
    return {
      buyer: object.buyer ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      orderedAt: object.orderedAt ?? 0n,
      fulfilled: Boolean(object.fulfilled),
      refunded: Boolean(object.refunded),
      fulfillmentURI: object.fulfillmentURI ?? "",
    };
  }

  return {
    buyer: value[0] as Address,
    amount: value[1] as bigint,
    orderedAt: value[2] as bigint,
    fulfilled: Boolean(value[3]),
    refunded: Boolean(value[4]),
    fulfillmentURI: value[5] as string,
  };
}

function updateProductIdDisplay(): void {
  try {
    el.productId.textContent = productId();
  } catch {
    el.productId.textContent = "-";
  }
}

function renderProduct(): void {
  updateProductIdDisplay();

  if (!currentProduct || currentProduct.seller === ZERO_ADDRESS) {
    el.productStatus.textContent = "not created";
    el.preorderId.textContent = "-";
    el.preorderStatus.textContent = "none";
    el.sellerAddress.textContent = "-";
    el.supplyStatus.textContent = "0 / 0";
    updateActions();
    return;
  }

  const gross = currentProduct.price * currentProduct.ordered;
  const available = gross - currentProduct.refunded - currentProduct.settledAmount;
  el.productStatus.textContent = currentProduct.active ? "active" : "inactive";
  el.sellerAddress.innerHTML = `<a href="${addressUrl(currentProduct.seller)}" target="_blank" rel="noreferrer">${shortValue(
    currentProduct.seller,
  )}</a>`;
  el.supplyStatus.textContent = `${currentProduct.ordered.toString()} / ${currentProduct.maxSupply.toString()}, ${formatEther(
    available,
  )} USDC available`;
  el.preorderId.textContent = currentPreorderId > 0n ? currentPreorderId.toString() : "-";
  el.preorderStatus.textContent = currentPreorder
    ? currentPreorder.refunded
      ? "refunded"
      : currentPreorder.fulfilled
        ? "fulfilled"
        : "ordered"
    : "none";
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasProduct = Boolean(currentProduct && currentProduct.seller !== ZERO_ADDRESS);
  const active = hasProduct && Boolean(currentProduct?.active);
  const hasPreorder = Boolean(currentPreorder && currentPreorder.buyer !== ZERO_ADDRESS);
  const canFulfill = active && hasPreorder && !currentPreorder?.fulfilled && !currentPreorder?.refunded;
  const gross = currentProduct ? currentProduct.price * currentProduct.ordered : 0n;
  const available = currentProduct ? gross - currentProduct.refunded - currentProduct.settledAmount : 0n;

  el.createProduct.disabled = !hasWallet || !hasContract || hasProduct;
  el.deployContract.disabled = !hasWallet;
  el.fulfillPreorder.disabled = !hasWallet || !hasContract || !canFulfill;
  el.placePreorder.disabled = !hasWallet || !hasContract || !active || hasPreorder;
  el.refresh.disabled = !hasContract;
  el.refundPreorder.disabled = !hasWallet || !hasContract || !active || !hasPreorder || Boolean(currentPreorder?.fulfilled);
  el.settleProduct.disabled = !hasWallet || !hasContract || !hasProduct || available === 0n;
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
    updateProductIdDisplay();
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
    setStatus("Deploying ArcPreorderStore...");
    const artifact = (await fetch("/public/artifacts/ArcPreorderStore.json").then((response) =>
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
    setStatus(`ArcPreorderStore deployed at ${contractAddress}.`);
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
    currentProduct = null;
    currentPreorder = null;
    currentPreorderId = 0n;
    renderProduct();
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

async function refreshProduct(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading preorder product state...");
    const id = productId();
    const rawProduct = await publicClient.readContract({
      address: contractAddress,
      abi: arcPreorderAbi,
      functionName: "getProduct",
      args: [id],
    });
    currentProduct = productFromRaw(rawProduct);

    currentPreorderId = 0n;
    currentPreorder = null;
    if (account) {
      currentPreorderId = await publicClient.readContract({
        address: contractAddress,
        abi: arcPreorderAbi,
        functionName: "getPreorderOf",
        args: [id, account],
      });

      if (currentPreorderId > 0n) {
        const rawPreorder = await publicClient.readContract({
          address: contractAddress,
          abi: arcPreorderAbi,
          functionName: "getPreorder",
          args: [id, currentPreorderId],
        });
        currentPreorder = preorderFromRaw(rawPreorder);
      }
    }

    renderProduct();
    setStatus("Preorder product state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createProduct(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createProduct.disabled = true;
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const treasury = el.treasury.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(treasury)) throw new Error("Treasury must be a valid EVM address.");
    const price = parseEther(el.price.value.trim());
    const maxSupply = BigInt(el.maxSupply.value.trim());

    setStatus("Creating preorder product...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPreorderAbi,
      functionName: "createProduct",
      args: [productId(), treasury as Address, price, maxSupply, title, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshProduct();
    setStatus("Product created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function placePreorder(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || !currentProduct) return;

  try {
    el.placePreorder.disabled = true;
    setStatus("Placing preorder...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPreorderAbi,
      functionName: "preorder",
      args: [productId()],
      account,
      chain: arcTestnet,
      value: currentProduct.price,
    });
    setStatus("Preorder submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshProduct();
    setStatus("Preorder placed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function fulfillPreorder(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || currentPreorderId === 0n) return;

  try {
    el.fulfillPreorder.disabled = true;
    const fulfillmentURI = el.fulfillmentURI.value.trim();
    if (!fulfillmentURI) throw new Error("Fulfillment URI is required.");

    setStatus("Fulfilling preorder...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPreorderAbi,
      functionName: "fulfillPreorder",
      args: [productId(), currentPreorderId, fulfillmentURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Fulfill submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshProduct();
    setStatus("Preorder fulfilled:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function refundPreorder(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || currentPreorderId === 0n) return;

  try {
    el.refundPreorder.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Refunding preorder...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPreorderAbi,
      functionName: "refundPreorder",
      args: [productId(), currentPreorderId, refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Refund submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshProduct();
    setStatus("Preorder refunded:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function settleProduct(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.settleProduct.disabled = true;
    const settlementTo = el.settlementTo.value.trim();
    if (!isAddress(settlementTo)) throw new Error("Settlement address must be a valid EVM address.");

    setStatus("Settling preorder revenue...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPreorderAbi,
      functionName: "settleProduct",
      args: [productId(), settlementTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Settle submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshProduct();
    setStatus("Product settled:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createProduct.addEventListener("click", () => void createProduct());
el.deployContract.addEventListener("click", () => void deployContract());
el.fulfillPreorder.addEventListener("click", () => void fulfillPreorder());
el.placePreorder.addEventListener("click", () => void placePreorder());
el.refresh.addEventListener("click", () => void refreshProduct());
el.refundPreorder.addEventListener("click", () => void refundPreorder());
el.saveContract.addEventListener("click", saveContract);
el.settleProduct.addEventListener("click", () => void settleProduct());
el.title.addEventListener("input", () => {
  currentProduct = null;
  currentPreorder = null;
  currentPreorderId = 0n;
  renderProduct();
});

renderProduct();
