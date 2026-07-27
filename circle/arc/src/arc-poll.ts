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

type PollSummary = {
  creator: Address;
  createdAt: bigint;
  closesAt: bigint;
  closed: boolean;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  title: string;
  metadataURI: string;
};

type VoteSummary = {
  choice: number;
  votedAt: bigint;
  reason: string;
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

const CONTRACT_KEY = "arcPoll.contractAddress";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcPollAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "pollId", type: "bytes32" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "uint64", name: "durationSeconds", type: "uint64" },
    ],
    name: "createPoll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "pollId", type: "bytes32" },
      { internalType: "uint8", name: "choice", type: "uint8" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "pollId", type: "bytes32" }],
    name: "closePoll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "pollId", type: "bytes32" }],
    name: "getPoll",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "closesAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "uint32", name: "yesVotes", type: "uint32" },
          { internalType: "uint32", name: "noVotes", type: "uint32" },
          { internalType: "uint32", name: "abstainVotes", type: "uint32" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
        ],
        internalType: "struct ArcPoll.Poll",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "pollId", type: "bytes32" },
      { internalType: "address", name: "voter", type: "address" },
    ],
    name: "getVote",
    outputs: [
      {
        components: [
          { internalType: "uint8", name: "choice", type: "uint8" },
          { internalType: "uint64", name: "votedAt", type: "uint64" },
          { internalType: "string", name: "reason", type: "string" },
        ],
        internalType: "struct ArcPoll.Vote",
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
let currentPoll: PollSummary | null = null;
let currentVote: VoteSummary | null = null;

const el = {
  choice: document.querySelector<HTMLSelectElement>("#choice")!,
  closePoll: document.querySelector<HTMLButtonElement>("#closePoll")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createPoll: document.querySelector<HTMLButtonElement>("#createPoll")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  durationMinutes: document.querySelector<HTMLInputElement>("#durationMinutes")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  pollCreator: document.querySelector<HTMLElement>("#pollCreator")!,
  pollId: document.querySelector<HTMLElement>("#pollId")!,
  pollStatus: document.querySelector<HTMLElement>("#pollStatus")!,
  reason: document.querySelector<HTMLInputElement>("#reason")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  totals: document.querySelector<HTMLElement>("#totals")!,
  vote: document.querySelector<HTMLButtonElement>("#vote")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.durationMinutes.value = "60";
el.metadataURI.value = `local:arc-poll-${today}`;
el.reason.value = "routine governance participation";
el.title.value = `arc-poll-${today}`;

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
  if (!value) return "-";
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

function pollId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Poll title is required.");
  const owner = account?.toLowerCase() ?? "0xd0c8b6025789aa6ab05d171ab0a6776feaa6d1fc";
  return keccak256(toBytes(`${owner}:${title}`));
}

function pollFromRaw(value: unknown): PollSummary {
  if (!Array.isArray(value)) {
    const object = value as {
      creator?: Address;
      createdAt?: bigint;
      closesAt?: bigint;
      closed?: boolean;
      yesVotes?: number;
      noVotes?: number;
      abstainVotes?: number;
      title?: string;
      metadataURI?: string;
    };
    return {
      creator: object.creator ?? ZERO_ADDRESS,
      createdAt: object.createdAt ?? 0n,
      closesAt: object.closesAt ?? 0n,
      closed: Boolean(object.closed),
      yesVotes: Number(object.yesVotes ?? 0),
      noVotes: Number(object.noVotes ?? 0),
      abstainVotes: Number(object.abstainVotes ?? 0),
      title: object.title ?? "",
      metadataURI: object.metadataURI ?? "",
    };
  }

  return {
    creator: value[0] as Address,
    createdAt: value[1] as bigint,
    closesAt: value[2] as bigint,
    closed: Boolean(value[3]),
    yesVotes: Number(value[4]),
    noVotes: Number(value[5]),
    abstainVotes: Number(value[6]),
    title: value[7] as string,
    metadataURI: value[8] as string,
  };
}

function voteFromRaw(value: unknown): VoteSummary {
  if (!Array.isArray(value)) {
    const object = value as { choice?: number; votedAt?: bigint; reason?: string };
    return {
      choice: Number(object.choice ?? 0),
      votedAt: object.votedAt ?? 0n,
      reason: object.reason ?? "",
    };
  }

  return {
    choice: Number(value[0]),
    votedAt: value[1] as bigint,
    reason: value[2] as string,
  };
}

function choiceLabel(choice: number): string {
  if (choice === 1) return "yes";
  if (choice === 2) return "no";
  if (choice === 3) return "abstain";
  return "not voted";
}

function updatePollIdDisplay(): void {
  try {
    el.pollId.textContent = pollId();
  } catch {
    el.pollId.textContent = "-";
  }
}

function renderPoll(): void {
  updatePollIdDisplay();

  if (!currentPoll || currentPoll.creator === ZERO_ADDRESS) {
    el.pollStatus.textContent = "not created";
    el.pollCreator.textContent = "-";
    el.totals.textContent = "yes 0 / no 0 / abstain 0";
    updateActions();
    return;
  }

  el.pollStatus.textContent = currentPoll.closed ? "closed" : "open";
  el.pollCreator.innerHTML = `<a href="${addressUrl(currentPoll.creator)}" target="_blank" rel="noreferrer">${shortValue(
    currentPoll.creator,
  )}</a>`;
  el.totals.textContent = `yes ${currentPoll.yesVotes} / no ${currentPoll.noVotes} / abstain ${currentPoll.abstainVotes} / ${choiceLabel(
    currentVote?.choice ?? 0,
  )}`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasPoll = Boolean(currentPoll && currentPoll.creator !== ZERO_ADDRESS);
  const openPoll = hasPoll && !currentPoll?.closed;

  el.closePoll.disabled = !hasWallet || !hasContract || !openPoll;
  el.createPoll.disabled = !hasWallet || !hasContract || hasPoll;
  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.vote.disabled = !hasWallet || !hasContract || !openPoll;
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
    updatePollIdDisplay();
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
    setStatus("Deploying ArcPoll...");
    const artifact = (await fetch("/public/artifacts/ArcPoll.json").then((response) => response.json())) as Artifact;
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
    setStatus(`ArcPoll deployed at ${contractAddress}.`);
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
    currentPoll = null;
    currentVote = null;
    renderPoll();
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

async function refreshPoll(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading poll state...");
    const rawPoll = await publicClient.readContract({
      address: contractAddress,
      abi: arcPollAbi,
      functionName: "getPoll",
      args: [pollId()],
    });
    currentPoll = pollFromRaw(rawPoll);

    if (account) {
      const rawVote = await publicClient.readContract({
        address: contractAddress,
        abi: arcPollAbi,
        functionName: "getVote",
        args: [pollId(), account],
      });
      currentVote = voteFromRaw(rawVote);
    }

    renderPoll();
    setStatus("Poll state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createPoll(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createPoll.disabled = true;
    const title = el.title.value.trim();
    if (!title) throw new Error("Poll title is required.");
    const durationMinutes = Number(el.durationMinutes.value.trim());
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      throw new Error("Duration minutes must be a positive integer.");
    }

    setStatus("Creating poll...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPollAbi,
      functionName: "createPoll",
      args: [pollId(), title, el.metadataURI.value.trim(), BigInt(durationMinutes * 60)],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshPoll();
    setStatus("Poll created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function castVote(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.vote.disabled = true;
    setStatus("Casting vote...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPollAbi,
      functionName: "castVote",
      args: [pollId(), Number(el.choice.value), el.reason.value.trim()],
      account,
      chain: arcTestnet,
    });
    setStatus("Vote submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshPoll();
    setStatus("Vote cast:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closePoll(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closePoll.disabled = true;
    setStatus("Closing poll...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcPollAbi,
      functionName: "closePoll",
      args: [pollId()],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshPoll();
    setStatus("Poll closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.closePoll.addEventListener("click", () => void closePoll());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createPoll.addEventListener("click", () => void createPoll());
el.deployContract.addEventListener("click", () => void deployContract());
el.refresh.addEventListener("click", () => void refreshPoll());
el.saveContract.addEventListener("click", saveContract);
el.title.addEventListener("input", () => {
  currentPoll = null;
  currentVote = null;
  renderPoll();
});
el.vote.addEventListener("click", () => void castVote());

renderPoll();
