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

type TicketSummary = {
  requester: Address;
  agent: Address;
  createdAt: bigint;
  respondedAt: bigint;
  closedAt: bigint;
  responded: boolean;
  closed: boolean;
  ticketRef: string;
  category: string;
  metadataURI: string;
  responseURI: string;
  closeURI: string;
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

const CONTRACT_KEY = "ArcSupportDesk.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcSupportAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "ticketId", type: "bytes32" },
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "string", name: "ticketRef", type: "string" },
      { internalType: "string", name: "category", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createTicket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "ticketId", type: "bytes32" },
      { internalType: "string", name: "responseURI", type: "string" },
    ],
    name: "respondTicket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "ticketId", type: "bytes32" },
      { internalType: "string", name: "closeURI", type: "string" },
    ],
    name: "closeTicket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "ticketId", type: "bytes32" }],
    name: "getTicket",
    outputs: [
      {
        components: [
          { internalType: "address", name: "requester", type: "address" },
          { internalType: "address", name: "agent", type: "address" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "respondedAt", type: "uint64" },
          { internalType: "uint64", name: "closedAt", type: "uint64" },
          { internalType: "bool", name: "responded", type: "bool" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "ticketRef", type: "string" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "responseURI", type: "string" },
          { internalType: "string", name: "closeURI", type: "string" },
        ],
        internalType: "struct ArcSupportDesk.Ticket",
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
let currentTicket: TicketSummary | null = null;

const el = {
  agent: document.querySelector<HTMLInputElement>("#agent")!,
  category: document.querySelector<HTMLInputElement>("#category")!,
  closeTicket: document.querySelector<HTMLButtonElement>("#closeTicket")!,
  closeURI: document.querySelector<HTMLInputElement>("#closeURI")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createTicket: document.querySelector<HTMLButtonElement>("#createTicket")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  requestAgent: document.querySelector<HTMLElement>("#requestAgent")!,
  requestOwner: document.querySelector<HTMLElement>("#requestOwner")!,
  respondTicket: document.querySelector<HTMLButtonElement>("#respondTicket")!,
  responseURI: document.querySelector<HTMLInputElement>("#responseURI")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  ticketId: document.querySelector<HTMLElement>("#ticketId")!,
  ticketRef: document.querySelector<HTMLInputElement>("#ticketRef")!,
  ticketStatus: document.querySelector<HTMLElement>("#ticketStatus")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.agent.value = DEFAULT_ACCOUNT;
el.category.value = "product";
el.closeURI.value = `local:arc-support-${today}:closed`;
el.contractAddress.value = contractAddress;
el.metadataURI.value = `local:arc-support-${today}`;
el.responseURI.value = `local:arc-support-${today}:response`;
el.ticketRef.value = `arc-support-${today}`;
el.title.value = `arc-support-${today}`;

const params = new URLSearchParams(window.location.search);

function applyParam(name: string, input: HTMLInputElement): void {
  const value = params.get(name)?.trim();
  if (value) input.value = value;
}

applyParam("agent", el.agent);
applyParam("category", el.category);
applyParam("closeURI", el.closeURI);
applyParam("contract", el.contractAddress);
applyParam("metadataURI", el.metadataURI);
applyParam("responseURI", el.responseURI);
applyParam("ticketRef", el.ticketRef);
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

function ticketId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const owner = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${owner}:${title}`));
}

function ticketFromRaw(value: unknown): TicketSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<TicketSummary>;
    return {
      requester: object.requester ?? ZERO_ADDRESS,
      agent: object.agent ?? ZERO_ADDRESS,
      createdAt: object.createdAt ?? 0n,
      respondedAt: object.respondedAt ?? 0n,
      closedAt: object.closedAt ?? 0n,
      responded: Boolean(object.responded),
      closed: Boolean(object.closed),
      ticketRef: object.ticketRef ?? "",
      category: object.category ?? "",
      metadataURI: object.metadataURI ?? "",
      responseURI: object.responseURI ?? "",
      closeURI: object.closeURI ?? "",
    };
  }

  return {
    requester: value[0] as Address,
    agent: value[1] as Address,
    createdAt: value[2] as bigint,
    respondedAt: value[3] as bigint,
    closedAt: value[4] as bigint,
    responded: Boolean(value[5]),
    closed: Boolean(value[6]),
    ticketRef: value[7] as string,
    category: value[8] as string,
    metadataURI: value[9] as string,
    responseURI: value[10] as string,
    closeURI: value[11] as string,
  };
}

function updateTicketIdDisplay(): void {
  try {
    el.ticketId.textContent = ticketId();
  } catch {
    el.ticketId.textContent = "-";
  }
}

function renderTicket(): void {
  updateTicketIdDisplay();

  if (!currentTicket || currentTicket.requester === ZERO_ADDRESS) {
    el.ticketStatus.textContent = "not created";
    el.requestOwner.textContent = "-";
    el.requestAgent.textContent = "-";
    updateActions();
    return;
  }

  el.ticketStatus.textContent = currentTicket.closed
    ? "closed"
    : currentTicket.responded
      ? "responded"
      : "open";
  el.requestOwner.innerHTML = `<a href="${addressUrl(currentTicket.requester)}" target="_blank" rel="noreferrer">${shortValue(
    currentTicket.requester,
  )}</a>`;
  el.requestAgent.innerHTML = `<a href="${addressUrl(currentTicket.agent)}" target="_blank" rel="noreferrer">${shortValue(
    currentTicket.agent,
  )}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasTicket = Boolean(currentTicket && currentTicket.requester !== ZERO_ADDRESS);
  const canRespond = hasTicket && !currentTicket?.responded && !currentTicket?.closed;
  const canClose = hasTicket && Boolean(currentTicket?.responded) && !currentTicket?.closed;

  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.createTicket.disabled = !hasWallet || !hasContract || hasTicket;
  el.respondTicket.disabled = !hasWallet || !hasContract || !canRespond;
  el.closeTicket.disabled = !hasWallet || !hasContract || !canClose;
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

    el.agent.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateTicketIdDisplay();
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
    setStatus("Deploying ArcSupportDesk...");
    const artifact = (await fetch("/public/artifacts/ArcSupportDesk.json").then((response) =>
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
    setStatus(`ArcSupportDesk deployed at ${contractAddress}.`);
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
    currentTicket = null;
    renderTicket();
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

async function refreshTicket(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading ticket state...");
    const rawTicket = await publicClient.readContract({
      address: contractAddress,
      abi: arcSupportAbi,
      functionName: "getTicket",
      args: [ticketId()],
    });
    currentTicket = ticketFromRaw(rawTicket);
    renderTicket();
    setStatus("Ticket state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createTicket(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createTicket.disabled = true;
    const agent = el.agent.value.trim();
    const ticketRef = el.ticketRef.value.trim();
    const category = el.category.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(agent)) throw new Error("Agent must be a valid EVM address.");
    if (!ticketRef || !category || !metadataURI) throw new Error("Ticket ref, category, and metadata URI are required.");

    setStatus("Creating support ticket...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSupportAbi,
      functionName: "createTicket",
      args: [ticketId(), agent as Address, ticketRef, category, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshTicket();
    setStatus("Support ticket created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function respondTicket(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.respondTicket.disabled = true;
    const responseURI = el.responseURI.value.trim();
    if (!responseURI) throw new Error("Response URI is required.");

    setStatus("Responding to support ticket...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSupportAbi,
      functionName: "respondTicket",
      args: [ticketId(), responseURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Response submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshTicket();
    setStatus("Support ticket responded:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeTicket(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeTicket.disabled = true;
    const closeURI = el.closeURI.value.trim();
    if (!closeURI) throw new Error("Close URI is required.");

    setStatus("Closing support ticket...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSupportAbi,
      functionName: "closeTicket",
      args: [ticketId(), closeURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshTicket();
    setStatus("Support ticket closed:", hash);
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

  await refreshTicket();
  if (!currentTicket || currentTicket.requester === ZERO_ADDRESS) {
    await createTicket();
    await refreshTicket();
  }

  if (currentTicket && currentTicket.requester !== ZERO_ADDRESS && !currentTicket.responded && !currentTicket.closed) {
    await respondTicket();
    await refreshTicket();
  }
  if (currentTicket && currentTicket.responded && !currentTicket.closed) {
    await closeTicket();
    await refreshTicket();
  }

  setStatus(`Auto flow complete for ${contractAddress}.`);
}

el.closeTicket.addEventListener("click", () => void closeTicket());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createTicket.addEventListener("click", () => void createTicket());
el.deployContract.addEventListener("click", () => void deployContract());
el.refresh.addEventListener("click", () => void refreshTicket());
el.respondTicket.addEventListener("click", () => void respondTicket());
el.saveContract.addEventListener("click", saveContract);
el.title.addEventListener("input", () => {
  currentTicket = null;
  renderTicket();
});

renderTicket();
setTimeout(() => void runAutoFlow(), 500);
