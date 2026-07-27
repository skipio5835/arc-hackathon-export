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

type RewardSummary = {
  creator: Address;
  recipient: Address;
  amount: bigint;
  claimedAmount: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  closed: boolean;
  rewardRef: string;
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

const CONTRACT_KEY = "ArcRewardVault.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcRewardAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "rewardId", type: "bytes32" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint64", name: "expiresAt", type: "uint64" },
      { internalType: "string", name: "rewardRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createReward",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "rewardId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
      { internalType: "string", name: "claimURI", type: "string" },
    ],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "rewardId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closeReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "rewardId", type: "bytes32" }],
    name: "getReward",
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
          { internalType: "string", name: "rewardRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "claimURI", type: "string" },
        ],
        internalType: "struct ArcRewardVault.Reward",
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
let currentReward: RewardSummary | null = null;

const el = {
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  rewardId: document.querySelector<HTMLElement>("#rewardId")!,
  rewardStatus: document.querySelector<HTMLElement>("#rewardStatus")!,
  claimValue: document.querySelector<HTMLElement>("#claimValue")!,
  closeReward: document.querySelector<HTMLButtonElement>("#closeReward")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createReward: document.querySelector<HTMLButtonElement>("#createReward")!,
  creatorAddress: document.querySelector<HTMLElement>("#creatorAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  label: document.querySelector<HTMLInputElement>("#label")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  recipientAddress: document.querySelector<HTMLElement>("#recipientAddress")!,
  claimReward: document.querySelector<HTMLButtonElement>("#claimReward")!,
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
el.label.value = `arc-reward-${today}`;
el.metadataURI.value = `local:arc-reward-${today}`;
el.recipient.value = DEFAULT_ACCOUNT;
el.claimTo.value = DEFAULT_ACCOUNT;
el.claimURI.value = `local:arc-reward-${today}:claimed`;
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

function rewardId(): Hash {
  const label = el.label.value.trim();
  if (!label) throw new Error("Label is required.");
  const creator = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${creator}:${label}`));
}

function rewardFromRaw(value: unknown): RewardSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<RewardSummary>;
    return {
      creator: object.creator ?? ZERO_ADDRESS,
      recipient: object.recipient ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      claimedAmount: object.claimedAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      expiresAt: object.expiresAt ?? 0n,
      closed: Boolean(object.closed),
      rewardRef: object.rewardRef ?? "",
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
    rewardRef: value[7] as string,
    metadataURI: value[8] as string,
    claimURI: value[9] as string,
  };
}

function updateRewardIdDisplay(): void {
  try {
    el.rewardId.textContent = rewardId();
  } catch {
    el.rewardId.textContent = "-";
  }
}

function renderReward(): void {
  updateRewardIdDisplay();

  if (!currentReward || currentReward.creator === ZERO_ADDRESS) {
    el.rewardStatus.textContent = "not created";
    el.claimValue.textContent = "0 USDC";
    el.creatorAddress.textContent = "-";
    el.recipientAddress.textContent = "-";
    updateActions();
    return;
  }

  const available = currentReward.amount - currentReward.claimedAmount;
  el.rewardStatus.textContent = currentReward.closed
    ? "closed"
    : currentReward.claimedAmount > 0n
      ? "claimed"
      : "funded";
  el.claimValue.textContent = `${formatEther(currentReward.claimedAmount)} / ${formatEther(
    currentReward.amount,
  )} USDC claimed, ${formatEther(available)} USDC remaining`;
  el.creatorAddress.innerHTML = `<a href="${addressUrl(currentReward.creator)}" target="_blank" rel="noreferrer">${shortValue(
    currentReward.creator,
  )}</a>`;
  el.recipientAddress.innerHTML = `<a href="${addressUrl(
    currentReward.recipient,
  )}" target="_blank" rel="noreferrer">${shortValue(currentReward.recipient)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasCard = Boolean(currentReward && currentReward.creator !== ZERO_ADDRESS);
  const open = hasCard && !currentReward?.closed;
  const claimable = open && currentReward?.claimedAmount === 0n;

  el.closeReward.disabled = !hasWallet || !hasContract || !open;
  el.createReward.disabled = !hasWallet || !hasContract || hasCard;
  el.deployContract.disabled = !hasWallet;
  el.claimReward.disabled = !hasWallet || !hasContract || !claimable;
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
    updateRewardIdDisplay();
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
    setStatus("Deploying ArcRewardVault...");
    const artifact = (await fetch("/public/artifacts/ArcRewardVault.json").then((response) =>
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
    setStatus(`ArcRewardVault deployed at ${contractAddress}.`);
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
    currentReward = null;
    renderReward();
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

async function refreshReward(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading Reward state...");
    const rawCard = await publicClient.readContract({
      address: contractAddress,
      abi: arcRewardAbi,
      functionName: "getReward",
      args: [rewardId()],
    });
    currentReward = rewardFromRaw(rawCard);
    renderReward();
    setStatus("Reward state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createReward(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createReward.disabled = true;
    const recipient = el.recipient.value.trim();
    const label = el.label.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(recipient)) throw new Error("recipient must be a valid EVM address.");
    if (!label) throw new Error("Label is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    const amount = parseEther(el.amount.value.trim());

    setStatus("Creating Reward...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcRewardAbi,
      functionName: "createReward",
      args: [rewardId(), recipient as Address, 0n, label, metadataURI],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshReward();
    setStatus("Reward created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function claimReward(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.claimReward.disabled = true;
    const claimTo = el.claimTo.value.trim();
    const claimURI = el.claimURI.value.trim();
    if (!isAddress(claimTo)) throw new Error("Claim address must be a valid EVM address.");
    if (!claimURI) throw new Error("Claim URI is required.");

    setStatus("Claiming Reward...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcRewardAbi,
      functionName: "claimReward",
      args: [rewardId(), claimTo as Address, claimURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Claim submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshReward();
    setStatus("Reward claimed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeReward(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeReward.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing Reward...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcRewardAbi,
      functionName: "closeReward",
      args: [rewardId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshReward();
    setStatus("Reward closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.closeReward.addEventListener("click", () => void closeReward());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createReward.addEventListener("click", () => void createReward());
el.deployContract.addEventListener("click", () => void deployContract());
el.label.addEventListener("input", () => {
  currentReward = null;
  renderReward();
});
el.claimReward.addEventListener("click", () => void claimReward());
el.refresh.addEventListener("click", () => void refreshReward());
el.saveContract.addEventListener("click", saveContract);

renderReward();

async function runAutoFlow(): Promise<void> {
  if (params.get("autorun") !== "1") return;

  setStatus("Auto flow starting. Approve each MetaMask request as it appears.");
  await connect();
  if (!walletClient || !account) return;

  if (!contractAddress || !isAddress(contractAddress)) {
    await deployContract();
  }
  if (!contractAddress || !isAddress(contractAddress)) return;

  await refreshReward();
  if (!currentReward || currentReward.creator === ZERO_ADDRESS) {
    await createReward();
    await refreshReward();
  }

  if (currentReward && currentReward.creator !== ZERO_ADDRESS && !currentReward.closed) {
    if (currentReward.claimedAmount === 0n) {
      await claimReward();
      await refreshReward();
    }
    if (currentReward && !currentReward.closed) {
      await closeReward();
      await refreshReward();
    }
  }

  setStatus(`Auto flow complete for ${contractAddress}.`);
}

setTimeout(() => void runAutoFlow(), 500);


