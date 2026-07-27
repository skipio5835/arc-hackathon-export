import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  http,
  isAddress,
  keccak256,
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

type WarrantySummary = {
  owner: Address;
  serviceProvider: Address;
  createdAt: bigint;
  expiresAt: bigint;
  claimedAt: bigint;
  resolvedAt: bigint;
  claimOpen: boolean;
  resolved: boolean;
  productRef: string;
  metadataURI: string;
  claimURI: string;
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

const CONTRACT_KEY = "ArcWarrantyRegistry.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcWarrantyAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "warrantyId", type: "bytes32" },
      { internalType: "address", name: "serviceProvider", type: "address" },
      { internalType: "uint64", name: "expiresAt", type: "uint64" },
      { internalType: "string", name: "productRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "registerWarranty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "warrantyId", type: "bytes32" },
      { internalType: "string", name: "claimURI", type: "string" },
    ],
    name: "openClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "warrantyId", type: "bytes32" },
      { internalType: "string", name: "resolutionURI", type: "string" },
    ],
    name: "resolveClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "warrantyId", type: "bytes32" }],
    name: "getWarranty",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "serviceProvider", type: "address" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "expiresAt", type: "uint64" },
          { internalType: "uint64", name: "claimedAt", type: "uint64" },
          { internalType: "uint64", name: "resolvedAt", type: "uint64" },
          { internalType: "bool", name: "claimOpen", type: "bool" },
          { internalType: "bool", name: "resolved", type: "bool" },
          { internalType: "string", name: "productRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "claimURI", type: "string" },
          { internalType: "string", name: "resolutionURI", type: "string" },
        ],
        internalType: "struct ArcWarrantyRegistry.Warranty",
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
let currentWarranty: WarrantySummary | null = null;

const el = {
  claimURI: document.querySelector<HTMLInputElement>("#claimURI")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  expiresDays: document.querySelector<HTMLInputElement>("#expiresDays")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  openClaim: document.querySelector<HTMLButtonElement>("#openClaim")!,
  ownerAddress: document.querySelector<HTMLElement>("#ownerAddress")!,
  productRef: document.querySelector<HTMLInputElement>("#productRef")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  registerWarranty: document.querySelector<HTMLButtonElement>("#registerWarranty")!,
  resolutionURI: document.querySelector<HTMLInputElement>("#resolutionURI")!,
  resolveClaim: document.querySelector<HTMLButtonElement>("#resolveClaim")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  serviceProvider: document.querySelector<HTMLInputElement>("#serviceProvider")!,
  serviceProviderView: document.querySelector<HTMLElement>("#serviceProviderView")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  warrantyId: document.querySelector<HTMLElement>("#warrantyId")!,
  warrantyStatus: document.querySelector<HTMLElement>("#warrantyStatus")!,
};

const today = new Date().toISOString().slice(0, 10);
el.claimURI.value = `local:arc-warranty-${today}:claim`;
el.contractAddress.value = contractAddress;
el.expiresDays.value = "0";
el.metadataURI.value = `local:arc-warranty-${today}`;
el.productRef.value = `arc-warranty-${today}`;
el.resolutionURI.value = `local:arc-warranty-${today}:resolved`;
el.serviceProvider.value = DEFAULT_ACCOUNT;
el.title.value = `arc-warranty-${today}`;

const params = new URLSearchParams(window.location.search);

function applyParam(name: string, input: HTMLInputElement): void {
  const value = params.get(name)?.trim();
  if (value) input.value = value;
}

applyParam("claimURI", el.claimURI);
applyParam("contract", el.contractAddress);
applyParam("expiresDays", el.expiresDays);
applyParam("metadataURI", el.metadataURI);
applyParam("productRef", el.productRef);
applyParam("resolutionURI", el.resolutionURI);
applyParam("serviceProvider", el.serviceProvider);
applyParam("title", el.title);

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

function warrantyId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const owner = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${owner}:${title}`));
}

function expiresAt(): bigint {
  const days = Number(el.expiresDays.value.trim() || "0");
  if (!Number.isFinite(days) || days < 0) throw new Error("Expires days must be zero or positive.");
  if (days === 0) return 0n;
  return BigInt(Math.floor(Date.now() / 1000) + Math.floor(days * 86_400));
}

function warrantyFromRaw(value: unknown): WarrantySummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<WarrantySummary>;
    return {
      owner: object.owner ?? ZERO_ADDRESS,
      serviceProvider: object.serviceProvider ?? ZERO_ADDRESS,
      createdAt: object.createdAt ?? 0n,
      expiresAt: object.expiresAt ?? 0n,
      claimedAt: object.claimedAt ?? 0n,
      resolvedAt: object.resolvedAt ?? 0n,
      claimOpen: Boolean(object.claimOpen),
      resolved: Boolean(object.resolved),
      productRef: object.productRef ?? "",
      metadataURI: object.metadataURI ?? "",
      claimURI: object.claimURI ?? "",
      resolutionURI: object.resolutionURI ?? "",
    };
  }

  return {
    owner: value[0] as Address,
    serviceProvider: value[1] as Address,
    createdAt: value[2] as bigint,
    expiresAt: value[3] as bigint,
    claimedAt: value[4] as bigint,
    resolvedAt: value[5] as bigint,
    claimOpen: Boolean(value[6]),
    resolved: Boolean(value[7]),
    productRef: value[8] as string,
    metadataURI: value[9] as string,
    claimURI: value[10] as string,
    resolutionURI: value[11] as string,
  };
}

function updateWarrantyIdDisplay(): void {
  try {
    el.warrantyId.textContent = warrantyId();
  } catch {
    el.warrantyId.textContent = "-";
  }
}

function renderWarranty(): void {
  updateWarrantyIdDisplay();

  if (!currentWarranty || currentWarranty.owner === ZERO_ADDRESS) {
    el.warrantyStatus.textContent = "not registered";
    el.ownerAddress.textContent = "-";
    el.serviceProviderView.textContent = "-";
    updateActions();
    return;
  }

  el.warrantyStatus.textContent = currentWarranty.resolved
    ? "resolved"
    : currentWarranty.claimOpen
      ? "claim open"
      : "registered";
  el.ownerAddress.innerHTML = `<a href="${addressUrl(currentWarranty.owner)}" target="_blank" rel="noreferrer">${shortValue(
    currentWarranty.owner,
  )}</a>`;
  el.serviceProviderView.innerHTML = `<a href="${addressUrl(
    currentWarranty.serviceProvider,
  )}" target="_blank" rel="noreferrer">${shortValue(currentWarranty.serviceProvider)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasWarranty = Boolean(currentWarranty && currentWarranty.owner !== ZERO_ADDRESS);
  const claimable = hasWarranty && !currentWarranty?.claimOpen && !currentWarranty?.resolved;
  const resolvable = hasWarranty && Boolean(currentWarranty?.claimOpen) && !currentWarranty?.resolved;

  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.registerWarranty.disabled = !hasWallet || !hasContract || hasWarranty;
  el.openClaim.disabled = !hasWallet || !hasContract || !claimable;
  el.resolveClaim.disabled = !hasWallet || !hasContract || !resolvable;
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

    el.serviceProvider.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateWarrantyIdDisplay();
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
    setStatus("Deploying ArcWarrantyRegistry...");
    const artifact = (await fetch("/public/artifacts/ArcWarrantyRegistry.json").then((response) =>
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
    setStatus(`ArcWarrantyRegistry deployed at ${contractAddress}.`);
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
    currentWarranty = null;
    renderWarranty();
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

async function refreshWarranty(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading warranty state...");
    const rawWarranty = await publicClient.readContract({
      address: contractAddress,
      abi: arcWarrantyAbi,
      functionName: "getWarranty",
      args: [warrantyId()],
    });
    currentWarranty = warrantyFromRaw(rawWarranty);
    renderWarranty();
    setStatus("Warranty state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function registerWarranty(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.registerWarranty.disabled = true;
    const productRef = el.productRef.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const serviceProvider = el.serviceProvider.value.trim();
    if (!productRef) throw new Error("Product ref is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(serviceProvider)) throw new Error("Service provider must be a valid EVM address.");

    setStatus("Registering warranty...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcWarrantyAbi,
      functionName: "registerWarranty",
      args: [warrantyId(), serviceProvider as Address, expiresAt(), productRef, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Register submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshWarranty();
    setStatus("Warranty registered:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function openClaim(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.openClaim.disabled = true;
    const claimURI = el.claimURI.value.trim();
    if (!claimURI) throw new Error("Claim URI is required.");

    setStatus("Opening warranty claim...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcWarrantyAbi,
      functionName: "openClaim",
      args: [warrantyId(), claimURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Claim submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshWarranty();
    setStatus("Warranty claim opened:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function resolveClaim(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.resolveClaim.disabled = true;
    const resolutionURI = el.resolutionURI.value.trim();
    if (!resolutionURI) throw new Error("Resolution URI is required.");

    setStatus("Resolving warranty claim...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcWarrantyAbi,
      functionName: "resolveClaim",
      args: [warrantyId(), resolutionURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Resolve submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshWarranty();
    setStatus("Warranty claim resolved:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function runAutoFlow(): Promise<void> {
  if (params.get("autorun") !== "1") return;

  setStatus("Auto flow starting. Approve each MetaMask request as it appears.");
  await connect();
  if (!walletClient || !account) return;

  if (!contractAddress || !isAddress(contractAddress)) {
    await deployContract();
  }
  if (!contractAddress || !isAddress(contractAddress)) return;

  await refreshWarranty();
  if (!currentWarranty || currentWarranty.owner === ZERO_ADDRESS) {
    await registerWarranty();
    await refreshWarranty();
  }

  if (currentWarranty && currentWarranty.owner !== ZERO_ADDRESS && !currentWarranty.claimOpen && !currentWarranty.resolved) {
    await openClaim();
    await refreshWarranty();
  }
  if (currentWarranty && currentWarranty.claimOpen && !currentWarranty.resolved) {
    await resolveClaim();
    await refreshWarranty();
  }

  setStatus(`Auto flow complete for ${contractAddress}.`);
}

el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.deployContract.addEventListener("click", () => void deployContract());
el.openClaim.addEventListener("click", () => void openClaim());
el.refresh.addEventListener("click", () => void refreshWarranty());
el.registerWarranty.addEventListener("click", () => void registerWarranty());
el.resolveClaim.addEventListener("click", () => void resolveClaim());
el.saveContract.addEventListener("click", saveContract);
el.title.addEventListener("input", () => {
  currentWarranty = null;
  renderWarranty();
});

renderWarranty();
setTimeout(() => void runAutoFlow(), 500);
