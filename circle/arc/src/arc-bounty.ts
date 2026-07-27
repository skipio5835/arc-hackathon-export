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

type BountySummary = {
  sponsor: Address;
  worker: Address;
  reward: bigint;
  createdAt: bigint;
  acceptedAt: bigint;
  submittedAt: bigint;
  releasedAt: bigint;
  status: number;
  title: string;
  metadataURI: string;
  submissionURI: string;
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

const CONTRACT_KEY = "arcBounty.contractAddress";
const DEFAULT_SPONSOR = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const STATUS_LABELS = ["none", "open", "accepted", "submitted", "released", "canceled"];

const arcBountyAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "bountyId", type: "bytes32" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createBounty",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "bountyId", type: "bytes32" }],
    name: "acceptBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "bountyId", type: "bytes32" },
      { internalType: "string", name: "submissionURI", type: "string" },
    ],
    name: "submitWork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "bountyId", type: "bytes32" }],
    name: "releaseBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "bountyId", type: "bytes32" }],
    name: "cancelBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "bountyId", type: "bytes32" }],
    name: "getBounty",
    outputs: [
      {
        components: [
          { internalType: "address", name: "sponsor", type: "address" },
          { internalType: "address", name: "worker", type: "address" },
          { internalType: "uint256", name: "reward", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "acceptedAt", type: "uint64" },
          { internalType: "uint64", name: "submittedAt", type: "uint64" },
          { internalType: "uint64", name: "releasedAt", type: "uint64" },
          { internalType: "enum ArcBountyBoard.Status", name: "status", type: "uint8" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "submissionURI", type: "string" },
        ],
        internalType: "struct ArcBountyBoard.Bounty",
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
let currentBounty: BountySummary | null = null;

const el = {
  acceptBounty: document.querySelector<HTMLButtonElement>("#acceptBounty")!,
  bountyId: document.querySelector<HTMLElement>("#bountyId")!,
  bountyStatus: document.querySelector<HTMLElement>("#bountyStatus")!,
  cancelBounty: document.querySelector<HTMLButtonElement>("#cancelBounty")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createBounty: document.querySelector<HTMLButtonElement>("#createBounty")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  releaseBounty: document.querySelector<HTMLButtonElement>("#releaseBounty")!,
  rewardAmount: document.querySelector<HTMLInputElement>("#rewardAmount")!,
  rewardStatus: document.querySelector<HTMLElement>("#rewardStatus")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  sponsorAddress: document.querySelector<HTMLElement>("#sponsorAddress")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  submitWork: document.querySelector<HTMLButtonElement>("#submitWork")!,
  submissionURI: document.querySelector<HTMLInputElement>("#submissionURI")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  workerAddress: document.querySelector<HTMLElement>("#workerAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.metadataURI.value = `local:arc-bounty-${today}`;
el.rewardAmount.value = "0.006";
el.submissionURI.value = `local:arc-bounty-submission-${today}`;
el.title.value = `arc-bounty-${today}`;

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

function bountyId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const sponsor = account?.toLowerCase() ?? DEFAULT_SPONSOR.toLowerCase();
  return keccak256(toBytes(`${sponsor}:${title}`));
}

function bountyFromRaw(value: unknown): BountySummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<BountySummary>;
    return {
      sponsor: object.sponsor ?? ZERO_ADDRESS,
      worker: object.worker ?? ZERO_ADDRESS,
      reward: object.reward ?? 0n,
      createdAt: object.createdAt ?? 0n,
      acceptedAt: object.acceptedAt ?? 0n,
      submittedAt: object.submittedAt ?? 0n,
      releasedAt: object.releasedAt ?? 0n,
      status: Number(object.status ?? 0),
      title: object.title ?? "",
      metadataURI: object.metadataURI ?? "",
      submissionURI: object.submissionURI ?? "",
    };
  }

  return {
    sponsor: value[0] as Address,
    worker: value[1] as Address,
    reward: value[2] as bigint,
    createdAt: value[3] as bigint,
    acceptedAt: value[4] as bigint,
    submittedAt: value[5] as bigint,
    releasedAt: value[6] as bigint,
    status: Number(value[7]),
    title: value[8] as string,
    metadataURI: value[9] as string,
    submissionURI: value[10] as string,
  };
}

function updateBountyIdDisplay(): void {
  try {
    el.bountyId.textContent = bountyId();
  } catch {
    el.bountyId.textContent = "-";
  }
}

function renderBounty(): void {
  updateBountyIdDisplay();

  if (!currentBounty || currentBounty.status === 0) {
    el.bountyStatus.textContent = "not created";
    el.rewardStatus.textContent = "0 USDC";
    el.sponsorAddress.textContent = "-";
    el.workerAddress.textContent = "-";
    updateActions();
    return;
  }

  el.bountyStatus.textContent = STATUS_LABELS[currentBounty.status] ?? `status ${currentBounty.status}`;
  el.rewardStatus.textContent = `${formatEther(currentBounty.reward)} USDC`;
  el.sponsorAddress.innerHTML = `<a href="${addressUrl(currentBounty.sponsor)}" target="_blank" rel="noreferrer">${shortValue(
    currentBounty.sponsor,
  )}</a>`;
  el.workerAddress.innerHTML =
    currentBounty.worker === ZERO_ADDRESS
      ? "-"
      : `<a href="${addressUrl(currentBounty.worker)}" target="_blank" rel="noreferrer">${shortValue(
          currentBounty.worker,
        )}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const status = currentBounty?.status ?? 0;

  el.acceptBounty.disabled = !hasWallet || !hasContract || status !== 1;
  el.cancelBounty.disabled = !hasWallet || !hasContract || status !== 1;
  el.createBounty.disabled = !hasWallet || !hasContract || status !== 0;
  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.releaseBounty.disabled = !hasWallet || !hasContract || status !== 3;
  el.submitWork.disabled = !hasWallet || !hasContract || status !== 2;
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
    updateBountyIdDisplay();
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
    setStatus("Deploying ArcBountyBoard...");
    const artifact = (await fetch("/public/artifacts/ArcBountyBoard.json").then((response) =>
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
    setStatus(`ArcBountyBoard deployed at ${contractAddress}.`);
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
    currentBounty = null;
    renderBounty();
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

async function refreshBounty(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading bounty state...");
    const rawBounty = await publicClient.readContract({
      address: contractAddress,
      abi: arcBountyAbi,
      functionName: "getBounty",
      args: [bountyId()],
    });
    currentBounty = bountyFromRaw(rawBounty);
    renderBounty();
    setStatus("Bounty state refreshed.");
  } catch (error) {
    const message = errorMessage(error);
    if (message.includes("BountyMissing")) {
      currentBounty = null;
      renderBounty();
      setStatus("Bounty not created yet.");
      return;
    }
    setStatus(message);
  }
}

async function createBounty(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createBounty.disabled = true;
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    const reward = parseEther(el.rewardAmount.value.trim());

    setStatus("Creating bounty...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcBountyAbi,
      functionName: "createBounty",
      args: [bountyId(), title, metadataURI],
      account,
      chain: arcTestnet,
      value: reward,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshBounty();
    setStatus("Bounty created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function acceptBounty(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.acceptBounty.disabled = true;
    setStatus("Accepting bounty...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcBountyAbi,
      functionName: "acceptBounty",
      args: [bountyId()],
      account,
      chain: arcTestnet,
    });
    setStatus("Accept submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBounty();
    setStatus("Bounty accepted:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function submitWork(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.submitWork.disabled = true;
    const submissionURI = el.submissionURI.value.trim();
    if (!submissionURI) throw new Error("Submission URI is required.");

    setStatus("Submitting work...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcBountyAbi,
      functionName: "submitWork",
      args: [bountyId(), submissionURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Submit submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBounty();
    setStatus("Work submitted:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function releaseBounty(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.releaseBounty.disabled = true;
    setStatus("Releasing bounty reward...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcBountyAbi,
      functionName: "releaseBounty",
      args: [bountyId()],
      account,
      chain: arcTestnet,
    });
    setStatus("Release submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshBounty();
    setStatus("Bounty released:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function cancelBounty(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.cancelBounty.disabled = true;
    setStatus("Canceling bounty...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcBountyAbi,
      functionName: "cancelBounty",
      args: [bountyId()],
      account,
      chain: arcTestnet,
    });
    setStatus("Cancel submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshBounty();
    setStatus("Bounty canceled:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.acceptBounty.addEventListener("click", () => void acceptBounty());
el.cancelBounty.addEventListener("click", () => void cancelBounty());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createBounty.addEventListener("click", () => void createBounty());
el.deployContract.addEventListener("click", () => void deployContract());
el.refresh.addEventListener("click", () => void refreshBounty());
el.releaseBounty.addEventListener("click", () => void releaseBounty());
el.saveContract.addEventListener("click", saveContract);
el.submitWork.addEventListener("click", () => void submitWork());
el.title.addEventListener("input", () => {
  currentBounty = null;
  renderBounty();
});

renderBounty();
