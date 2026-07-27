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

type EventSummary = {
  organizer: Address;
  treasury: Address;
  ticketPrice: bigint;
  maxSupply: bigint;
  sold: bigint;
  checkedIn: bigint;
  refunded: bigint;
  settledAmount: bigint;
  createdAt: bigint;
  canceled: boolean;
  title: string;
  metadataURI: string;
};

type TicketSummary = {
  holder: Address;
  purchasedAt: bigint;
  checkedIn: boolean;
  refunded: boolean;
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

const CONTRACT_KEY = "arcEventTickets.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcEventTicketsAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "eventId", type: "bytes32" },
      { internalType: "address", name: "treasury", type: "address" },
      { internalType: "uint256", name: "ticketPrice", type: "uint256" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "eventId", type: "bytes32" }],
    name: "buyTicket",
    outputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "eventId", type: "bytes32" },
      { internalType: "uint256", name: "ticketId", type: "uint256" },
    ],
    name: "checkIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "eventId", type: "bytes32" },
      { internalType: "uint256", name: "ticketId", type: "uint256" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "refundTicket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "eventId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
    ],
    name: "settleEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "eventId", type: "bytes32" }],
    name: "getEvent",
    outputs: [
      {
        components: [
          { internalType: "address", name: "organizer", type: "address" },
          { internalType: "address", name: "treasury", type: "address" },
          { internalType: "uint256", name: "ticketPrice", type: "uint256" },
          { internalType: "uint256", name: "maxSupply", type: "uint256" },
          { internalType: "uint256", name: "sold", type: "uint256" },
          { internalType: "uint256", name: "checkedIn", type: "uint256" },
          { internalType: "uint256", name: "refunded", type: "uint256" },
          { internalType: "uint256", name: "settledAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "bool", name: "canceled", type: "bool" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
        ],
        internalType: "struct ArcEventTickets.EventInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "eventId", type: "bytes32" },
      { internalType: "uint256", name: "ticketId", type: "uint256" },
    ],
    name: "getTicket",
    outputs: [
      {
        components: [
          { internalType: "address", name: "holder", type: "address" },
          { internalType: "uint64", name: "purchasedAt", type: "uint64" },
          { internalType: "bool", name: "checkedIn", type: "bool" },
          { internalType: "bool", name: "refunded", type: "bool" },
        ],
        internalType: "struct ArcEventTickets.Ticket",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "eventId", type: "bytes32" },
      { internalType: "address", name: "holder", type: "address" },
    ],
    name: "getTicketOf",
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
let currentEvent: EventSummary | null = null;
let currentTicket: TicketSummary | null = null;
let currentTicketId = 0n;

const el = {
  buyTicket: document.querySelector<HTMLButtonElement>("#buyTicket")!,
  checkIn: document.querySelector<HTMLButtonElement>("#checkIn")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createEvent: document.querySelector<HTMLButtonElement>("#createEvent")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  eventId: document.querySelector<HTMLElement>("#eventId")!,
  eventStatus: document.querySelector<HTMLElement>("#eventStatus")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  organizerAddress: document.querySelector<HTMLElement>("#organizerAddress")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundTicket: document.querySelector<HTMLButtonElement>("#refundTicket")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  settleEvent: document.querySelector<HTMLButtonElement>("#settleEvent")!,
  settlementTo: document.querySelector<HTMLInputElement>("#settlementTo")!,
  supplyStatus: document.querySelector<HTMLElement>("#supplyStatus")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  ticketId: document.querySelector<HTMLElement>("#ticketId")!,
  ticketPrice: document.querySelector<HTMLInputElement>("#ticketPrice")!,
  ticketStatus: document.querySelector<HTMLElement>("#ticketStatus")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  maxSupply: document.querySelector<HTMLInputElement>("#maxSupply")!,
  treasury: document.querySelector<HTMLInputElement>("#treasury")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.metadataURI.value = `local:arc-event-${today}`;
el.refundTo.value = DEFAULT_ACCOUNT;
el.settlementTo.value = DEFAULT_ACCOUNT;
el.ticketPrice.value = "0.004";
el.title.value = `arc-event-${today}`;
el.maxSupply.value = "5";
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

function eventId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const organizer = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${organizer}:${title}`));
}

function eventFromRaw(value: unknown): EventSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<EventSummary>;
    return {
      organizer: object.organizer ?? ZERO_ADDRESS,
      treasury: object.treasury ?? ZERO_ADDRESS,
      ticketPrice: object.ticketPrice ?? 0n,
      maxSupply: object.maxSupply ?? 0n,
      sold: object.sold ?? 0n,
      checkedIn: object.checkedIn ?? 0n,
      refunded: object.refunded ?? 0n,
      settledAmount: object.settledAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      canceled: Boolean(object.canceled),
      title: object.title ?? "",
      metadataURI: object.metadataURI ?? "",
    };
  }

  return {
    organizer: value[0] as Address,
    treasury: value[1] as Address,
    ticketPrice: value[2] as bigint,
    maxSupply: value[3] as bigint,
    sold: value[4] as bigint,
    checkedIn: value[5] as bigint,
    refunded: value[6] as bigint,
    settledAmount: value[7] as bigint,
    createdAt: value[8] as bigint,
    canceled: Boolean(value[9]),
    title: value[10] as string,
    metadataURI: value[11] as string,
  };
}

function ticketFromRaw(value: unknown): TicketSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<TicketSummary>;
    return {
      holder: object.holder ?? ZERO_ADDRESS,
      purchasedAt: object.purchasedAt ?? 0n,
      checkedIn: Boolean(object.checkedIn),
      refunded: Boolean(object.refunded),
    };
  }

  return {
    holder: value[0] as Address,
    purchasedAt: value[1] as bigint,
    checkedIn: Boolean(value[2]),
    refunded: Boolean(value[3]),
  };
}

function updateEventIdDisplay(): void {
  try {
    el.eventId.textContent = eventId();
  } catch {
    el.eventId.textContent = "-";
  }
}

function renderEvent(): void {
  updateEventIdDisplay();

  if (!currentEvent || currentEvent.organizer === ZERO_ADDRESS) {
    el.eventStatus.textContent = "not created";
    el.organizerAddress.textContent = "-";
    el.supplyStatus.textContent = "0 / 0";
    el.ticketId.textContent = "-";
    el.ticketStatus.textContent = "none";
    updateActions();
    return;
  }

  const gross = currentEvent.ticketPrice * currentEvent.sold;
  const available = gross - currentEvent.refunded - currentEvent.settledAmount;
  el.eventStatus.textContent = currentEvent.canceled ? "canceled" : "active";
  el.organizerAddress.innerHTML = `<a href="${addressUrl(currentEvent.organizer)}" target="_blank" rel="noreferrer">${shortValue(
    currentEvent.organizer,
  )}</a>`;
  el.supplyStatus.textContent = `${currentEvent.sold.toString()} / ${currentEvent.maxSupply.toString()}, ${formatEther(
    available,
  )} USDC available`;
  el.ticketId.textContent = currentTicketId > 0n ? currentTicketId.toString() : "-";
  el.ticketStatus.textContent = currentTicket
    ? currentTicket.refunded
      ? "refunded"
      : currentTicket.checkedIn
        ? "checked in"
        : "purchased"
    : "none";
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasEvent = Boolean(currentEvent && currentEvent.organizer !== ZERO_ADDRESS);
  const active = hasEvent && !currentEvent?.canceled;
  const hasTicket = Boolean(currentTicket && currentTicket.holder !== ZERO_ADDRESS);
  const canCheckIn = active && hasTicket && !currentTicket?.checkedIn && !currentTicket?.refunded;
  const gross = currentEvent ? currentEvent.ticketPrice * currentEvent.sold : 0n;
  const available = currentEvent ? gross - currentEvent.refunded - currentEvent.settledAmount : 0n;

  el.buyTicket.disabled = !hasWallet || !hasContract || !active || hasTicket;
  el.checkIn.disabled = !hasWallet || !hasContract || !canCheckIn;
  el.createEvent.disabled = !hasWallet || !hasContract || hasEvent;
  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.refundTicket.disabled = !hasWallet || !hasContract || !active || !hasTicket || Boolean(currentTicket?.checkedIn);
  el.settleEvent.disabled = !hasWallet || !hasContract || !hasEvent || available === 0n;
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
    updateEventIdDisplay();
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
    setStatus("Deploying ArcEventTickets...");
    const artifact = (await fetch("/public/artifacts/ArcEventTickets.json").then((response) =>
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
    setStatus(`ArcEventTickets deployed at ${contractAddress}.`);
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
    currentEvent = null;
    currentTicket = null;
    currentTicketId = 0n;
    renderEvent();
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

async function refreshEvent(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading event state...");
    const id = eventId();
    const rawEvent = await publicClient.readContract({
      address: contractAddress,
      abi: arcEventTicketsAbi,
      functionName: "getEvent",
      args: [id],
    });
    currentEvent = eventFromRaw(rawEvent);

    currentTicketId = 0n;
    currentTicket = null;
    if (account) {
      currentTicketId = await publicClient.readContract({
        address: contractAddress,
        abi: arcEventTicketsAbi,
        functionName: "getTicketOf",
        args: [id, account],
      });

      if (currentTicketId > 0n) {
        const rawTicket = await publicClient.readContract({
          address: contractAddress,
          abi: arcEventTicketsAbi,
          functionName: "getTicket",
          args: [id, currentTicketId],
        });
        currentTicket = ticketFromRaw(rawTicket);
      }
    }

    renderEvent();
    setStatus("Event state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createEvent(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createEvent.disabled = true;
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const treasury = el.treasury.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(treasury)) throw new Error("Treasury must be a valid EVM address.");
    const ticketPrice = parseEther(el.ticketPrice.value.trim());
    const maxSupply = BigInt(el.maxSupply.value.trim());

    setStatus("Creating event...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcEventTicketsAbi,
      functionName: "createEvent",
      args: [eventId(), treasury as Address, ticketPrice, maxSupply, title, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshEvent();
    setStatus("Event created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function buyTicket(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || !currentEvent) return;

  try {
    el.buyTicket.disabled = true;
    setStatus("Buying ticket...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcEventTicketsAbi,
      functionName: "buyTicket",
      args: [eventId()],
      account,
      chain: arcTestnet,
      value: currentEvent.ticketPrice,
    });
    setStatus("Buy submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshEvent();
    setStatus("Ticket purchased:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function checkIn(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || currentTicketId === 0n) return;

  try {
    el.checkIn.disabled = true;
    setStatus("Checking in ticket...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcEventTicketsAbi,
      functionName: "checkIn",
      args: [eventId(), currentTicketId],
      account,
      chain: arcTestnet,
    });
    setStatus("Check-in submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshEvent();
    setStatus("Ticket checked in:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function refundTicket(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || currentTicketId === 0n) return;

  try {
    el.refundTicket.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Refunding ticket...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcEventTicketsAbi,
      functionName: "refundTicket",
      args: [eventId(), currentTicketId, refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Refund submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshEvent();
    setStatus("Ticket refunded:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function settleEvent(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.settleEvent.disabled = true;
    const settlementTo = el.settlementTo.value.trim();
    if (!isAddress(settlementTo)) throw new Error("Settlement address must be a valid EVM address.");

    setStatus("Settling event revenue...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcEventTicketsAbi,
      functionName: "settleEvent",
      args: [eventId(), settlementTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Settle submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshEvent();
    setStatus("Event settled:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.buyTicket.addEventListener("click", () => void buyTicket());
el.checkIn.addEventListener("click", () => void checkIn());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createEvent.addEventListener("click", () => void createEvent());
el.deployContract.addEventListener("click", () => void deployContract());
el.refresh.addEventListener("click", () => void refreshEvent());
el.refundTicket.addEventListener("click", () => void refundTicket());
el.saveContract.addEventListener("click", saveContract);
el.settleEvent.addEventListener("click", () => void settleEvent());
el.title.addEventListener("input", () => {
  currentEvent = null;
  currentTicket = null;
  currentTicketId = 0n;
  renderEvent();
});

renderEvent();
