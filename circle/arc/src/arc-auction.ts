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

type AuctionSummary = {
  seller: Address;
  settlementTo: Address;
  highestBidder: Address;
  minBid: bigint;
  highestBid: bigint;
  settledAmount: bigint;
  bidCount: bigint;
  createdAt: bigint;
  endsAt: bigint;
  closed: boolean;
  canceled: boolean;
  title: string;
  metadataURI: string;
  settlementURI: string;
  cancelURI: string;
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

const CONTRACT_KEY = "ArcAuctionHouse.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcAuctionAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "auctionId", type: "bytes32" },
      { internalType: "address", name: "settlementTo", type: "address" },
      { internalType: "uint256", name: "minBid", type: "uint256" },
      { internalType: "uint64", name: "endsAt", type: "uint64" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "auctionId", type: "bytes32" }],
    name: "bid",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "auctionId", type: "bytes32" },
      { internalType: "string", name: "settlementURI", type: "string" },
    ],
    name: "settleAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "auctionId", type: "bytes32" },
      { internalType: "string", name: "cancelURI", type: "string" },
    ],
    name: "cancelAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "auctionId", type: "bytes32" }],
    name: "getAuction",
    outputs: [
      {
        components: [
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "address", name: "settlementTo", type: "address" },
          { internalType: "address", name: "highestBidder", type: "address" },
          { internalType: "uint256", name: "minBid", type: "uint256" },
          { internalType: "uint256", name: "highestBid", type: "uint256" },
          { internalType: "uint256", name: "settledAmount", type: "uint256" },
          { internalType: "uint256", name: "bidCount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "endsAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "bool", name: "canceled", type: "bool" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "settlementURI", type: "string" },
          { internalType: "string", name: "cancelURI", type: "string" },
        ],
        internalType: "struct ArcAuctionHouse.Auction",
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
let currentAuction: AuctionSummary | null = null;

const el = {
  auctionId: document.querySelector<HTMLElement>("#auctionId")!,
  auctionStatus: document.querySelector<HTMLElement>("#auctionStatus")!,
  bidCount: document.querySelector<HTMLElement>("#bidCount")!,
  cancelAuction: document.querySelector<HTMLButtonElement>("#cancelAuction")!,
  cancelURI: document.querySelector<HTMLInputElement>("#cancelURI")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createAuction: document.querySelector<HTMLButtonElement>("#createAuction")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  durationMinutes: document.querySelector<HTMLInputElement>("#durationMinutes")!,
  highestBid: document.querySelector<HTMLElement>("#highestBid")!,
  highestBidder: document.querySelector<HTMLElement>("#highestBidder")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  minBid: document.querySelector<HTMLInputElement>("#minBid")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  placeBid: document.querySelector<HTMLButtonElement>("#placeBid")!,
  raiseBid: document.querySelector<HTMLInputElement>("#raiseBid")!,
  raiseBidButton: document.querySelector<HTMLButtonElement>("#raiseBidButton")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  sellerAddress: document.querySelector<HTMLElement>("#sellerAddress")!,
  settleAuction: document.querySelector<HTMLButtonElement>("#settleAuction")!,
  settlementTo: document.querySelector<HTMLInputElement>("#settlementTo")!,
  settlementURI: document.querySelector<HTMLInputElement>("#settlementURI")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.durationMinutes.value = "0";
el.metadataURI.value = `local:arc-auction-${today}`;
el.minBid.value = "0.004";
el.raiseBid.value = "0.005";
el.settlementTo.value = DEFAULT_ACCOUNT;
el.settlementURI.value = `local:arc-auction-${today}:settled`;
el.cancelURI.value = `local:arc-auction-${today}:canceled`;
el.title.value = `arc-auction-${today}`;

const params = new URLSearchParams(window.location.search);

function applyParam(name: string, input: HTMLInputElement): void {
  const value = params.get(name)?.trim();
  if (value) input.value = value;
}

applyParam("contract", el.contractAddress);
applyParam("durationMinutes", el.durationMinutes);
applyParam("metadataURI", el.metadataURI);
applyParam("minBid", el.minBid);
applyParam("raiseBid", el.raiseBid);
applyParam("settlementTo", el.settlementTo);
applyParam("settlementURI", el.settlementURI);
applyParam("cancelURI", el.cancelURI);
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

async function waitForSuccess(hash: Hash, action: string) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`${action} reverted. Tx: ${hash}`);
  }
  return receipt;
}

function auctionId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const seller = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${seller}:${title}`));
}

function auctionFromRaw(value: unknown): AuctionSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<AuctionSummary>;
    return {
      seller: object.seller ?? ZERO_ADDRESS,
      settlementTo: object.settlementTo ?? ZERO_ADDRESS,
      highestBidder: object.highestBidder ?? ZERO_ADDRESS,
      minBid: object.minBid ?? 0n,
      highestBid: object.highestBid ?? 0n,
      settledAmount: object.settledAmount ?? 0n,
      bidCount: object.bidCount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      endsAt: object.endsAt ?? 0n,
      closed: Boolean(object.closed),
      canceled: Boolean(object.canceled),
      title: object.title ?? "",
      metadataURI: object.metadataURI ?? "",
      settlementURI: object.settlementURI ?? "",
      cancelURI: object.cancelURI ?? "",
    };
  }

  return {
    seller: value[0] as Address,
    settlementTo: value[1] as Address,
    highestBidder: value[2] as Address,
    minBid: value[3] as bigint,
    highestBid: value[4] as bigint,
    settledAmount: value[5] as bigint,
    bidCount: value[6] as bigint,
    createdAt: value[7] as bigint,
    endsAt: value[8] as bigint,
    closed: Boolean(value[9]),
    canceled: Boolean(value[10]),
    title: value[11] as string,
    metadataURI: value[12] as string,
    settlementURI: value[13] as string,
    cancelURI: value[14] as string,
  };
}

function updateAuctionIdDisplay(): void {
  try {
    el.auctionId.textContent = auctionId();
  } catch {
    el.auctionId.textContent = "-";
  }
}

function renderAuction(): void {
  updateAuctionIdDisplay();

  if (!currentAuction || currentAuction.seller === ZERO_ADDRESS) {
    el.auctionStatus.textContent = "not created";
    el.highestBid.textContent = "0 USDC";
    el.bidCount.textContent = "0";
    el.highestBidder.textContent = "-";
    el.sellerAddress.textContent = "-";
    updateActions();
    return;
  }

  el.auctionStatus.textContent = currentAuction.closed
    ? currentAuction.canceled
      ? "canceled"
      : "settled"
    : "open";
  el.highestBid.textContent = `${formatEther(currentAuction.highestBid)} USDC`;
  el.bidCount.textContent = currentAuction.bidCount.toString();
  el.highestBidder.innerHTML =
    currentAuction.highestBidder === ZERO_ADDRESS
      ? "-"
      : `<a href="${addressUrl(currentAuction.highestBidder)}" target="_blank" rel="noreferrer">${shortValue(
          currentAuction.highestBidder,
        )}</a>`;
  el.sellerAddress.innerHTML = `<a href="${addressUrl(currentAuction.seller)}" target="_blank" rel="noreferrer">${shortValue(
    currentAuction.seller,
  )}</a>`;
  updateActions();
}

function canSettle(): boolean {
  if (!currentAuction || currentAuction.seller === ZERO_ADDRESS || currentAuction.closed) return false;
  if (currentAuction.highestBidder === ZERO_ADDRESS) return false;
  if (currentAuction.endsAt === 0n) return true;
  return BigInt(Math.floor(Date.now() / 1000)) >= currentAuction.endsAt;
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasAuction = Boolean(currentAuction && currentAuction.seller !== ZERO_ADDRESS);
  const open = hasAuction && !currentAuction?.closed;

  el.cancelAuction.disabled = !hasWallet || !hasContract || !open;
  el.createAuction.disabled = !hasWallet || !hasContract || hasAuction;
  el.deployContract.disabled = !hasWallet;
  el.placeBid.disabled = !hasWallet || !hasContract || !open;
  el.raiseBidButton.disabled = !hasWallet || !hasContract || !open;
  el.refresh.disabled = !hasContract;
  el.settleAuction.disabled = !hasWallet || !hasContract || !canSettle();
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

    el.settlementTo.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateAuctionIdDisplay();
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
    setStatus("Deploying ArcAuctionHouse...");
    const artifact = (await fetch("/public/artifacts/ArcAuctionHouse.json").then((response) =>
      response.json(),
    )) as Artifact;
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      account,
      chain: arcTestnet,
    });
    setStatus("Deploy submitted:", hash);
    const receipt = await waitForSuccess(hash, "Deployment");
    if (!receipt.contractAddress) throw new Error("Deployment receipt did not include a contract address.");

    contractAddress = receipt.contractAddress;
    el.contractAddress.value = contractAddress;
    localStorage.setItem(CONTRACT_KEY, contractAddress);
    setStatus(`ArcAuctionHouse deployed at ${contractAddress}.`);
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
    currentAuction = null;
    renderAuction();
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

async function refreshAuction(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading auction state...");
    const rawAuction = await publicClient.readContract({
      address: contractAddress,
      abi: arcAuctionAbi,
      functionName: "getAuction",
      args: [auctionId()],
    });
    currentAuction = auctionFromRaw(rawAuction);
    renderAuction();
    setStatus("Auction state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

function endsAtValue(): bigint {
  const minutes = Number(el.durationMinutes.value.trim() || "0");
  if (!Number.isFinite(minutes) || minutes < 0) throw new Error("Duration minutes must be zero or greater.");
  if (minutes === 0) return 0n;
  return BigInt(Math.floor(Date.now() / 1000) + Math.round(minutes * 60));
}

async function createAuction(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createAuction.disabled = true;
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const settlementTo = el.settlementTo.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(settlementTo)) throw new Error("Settlement address must be a valid EVM address.");
    const minBid = parseEther(el.minBid.value.trim());

    setStatus("Creating auction...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAuctionAbi,
      functionName: "createAuction",
      args: [auctionId(), settlementTo as Address, minBid, endsAtValue(), title, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await waitForSuccess(hash, "Create auction");
    await refreshAuction();
    setStatus("Auction created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function bidAmount(amount: bigint, label: string): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    setStatus(`${label}...`);
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAuctionAbi,
      functionName: "bid",
      args: [auctionId()],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus(`${label} submitted:`, hash);
    await waitForSuccess(hash, label);
    await refreshBalance();
    await refreshAuction();
    setStatus(`${label} confirmed:`, hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function placeBid(): Promise<void> {
  el.placeBid.disabled = true;
  await bidAmount(parseEther(el.minBid.value.trim()), "Placing bid");
}

async function raiseBid(): Promise<void> {
  el.raiseBidButton.disabled = true;
  await bidAmount(parseEther(el.raiseBid.value.trim()), "Raising bid");
}

async function settleAuction(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.settleAuction.disabled = true;
    const settlementURI = el.settlementURI.value.trim();
    if (!settlementURI) throw new Error("Settlement URI is required.");

    setStatus("Settling auction...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAuctionAbi,
      functionName: "settleAuction",
      args: [auctionId(), settlementURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Settle submitted:", hash);
    await waitForSuccess(hash, "Settle auction");
    await refreshBalance();
    await refreshAuction();
    setStatus("Auction settled:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function cancelAuction(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.cancelAuction.disabled = true;
    const cancelURI = el.cancelURI.value.trim();
    if (!cancelURI) throw new Error("Cancel URI is required.");

    setStatus("Canceling auction...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAuctionAbi,
      functionName: "cancelAuction",
      args: [auctionId(), cancelURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Cancel submitted:", hash);
    await waitForSuccess(hash, "Cancel auction");
    await refreshBalance();
    await refreshAuction();
    setStatus("Auction canceled:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function runAutoFlow(): Promise<void> {
  if (params.get("autorun") !== "1") return;

  const mode = params.get("mode") === "cancel" ? "cancel" : "settle";
  setStatus("Auto flow starting. Approve each MetaMask request as it appears.");
  await connect();
  if (!walletClient || !account) return;

  if (!contractAddress || !isAddress(contractAddress)) {
    await deployContract();
  }
  if (!contractAddress || !isAddress(contractAddress)) return;

  await refreshAuction();
  if (!currentAuction || currentAuction.seller === ZERO_ADDRESS) {
    await createAuction();
    await refreshAuction();
  }

  if (currentAuction && currentAuction.seller !== ZERO_ADDRESS && !currentAuction.closed) {
    const minBid = parseEther(el.minBid.value.trim());
    const raisedBid = parseEther(el.raiseBid.value.trim());
    if (currentAuction.highestBid === 0n) {
      await bidAmount(minBid, "Placing bid");
      await refreshAuction();
    }
    if (mode === "cancel") {
      if (currentAuction && !currentAuction.closed && currentAuction.highestBidder !== ZERO_ADDRESS) {
        await cancelAuction();
        await refreshAuction();
      }
    } else if (currentAuction && currentAuction.highestBid < raisedBid) {
      await bidAmount(raisedBid, "Raising bid");
      await refreshAuction();
    }
    if (mode === "settle" && currentAuction && !currentAuction.closed && currentAuction.highestBidder !== ZERO_ADDRESS) {
      await settleAuction();
      await refreshAuction();
    }
  }

  setStatus(`Auto ${mode} flow complete for ${contractAddress}.`);
}

el.cancelAuction.addEventListener("click", () => void cancelAuction());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createAuction.addEventListener("click", () => void createAuction());
el.deployContract.addEventListener("click", () => void deployContract());
el.placeBid.addEventListener("click", () => void placeBid());
el.raiseBidButton.addEventListener("click", () => void raiseBid());
el.refresh.addEventListener("click", () => void refreshAuction());
el.saveContract.addEventListener("click", saveContract);
el.settleAuction.addEventListener("click", () => void settleAuction());
el.title.addEventListener("input", () => {
  currentAuction = null;
  renderAuction();
});

renderAuction();
setTimeout(() => void runAutoFlow(), 500);
