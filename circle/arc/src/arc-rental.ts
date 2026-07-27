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

type RentalSummary = {
  owner: Address;
  renter: Address;
  payoutTo: Address;
  rentalFee: bigint;
  deposit: bigint;
  damageFee: bigint;
  paidTotal: bigint;
  createdAt: bigint;
  returnedAt: bigint;
  closed: boolean;
  canceled: boolean;
  rentalRef: string;
  metadataURI: string;
  returnURI: string;
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

const CONTRACT_KEY = "ArcRentalEscrow.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcRentalAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "rentalId", type: "bytes32" },
      { internalType: "address", name: "payoutTo", type: "address" },
      { internalType: "uint256", name: "rentalFee", type: "uint256" },
      { internalType: "uint256", name: "deposit", type: "uint256" },
      { internalType: "string", name: "rentalRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createRental",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "rentalId", type: "bytes32" }],
    name: "bookRental",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "rentalId", type: "bytes32" },
      { internalType: "uint256", name: "damageFee", type: "uint256" },
      { internalType: "address payable", name: "refundTo", type: "address" },
      { internalType: "string", name: "returnURI", type: "string" },
    ],
    name: "returnRental",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "rentalId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
      { internalType: "string", name: "cancelURI", type: "string" },
    ],
    name: "cancelRental",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "rentalId", type: "bytes32" }],
    name: "getRental",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "renter", type: "address" },
          { internalType: "address", name: "payoutTo", type: "address" },
          { internalType: "uint256", name: "rentalFee", type: "uint256" },
          { internalType: "uint256", name: "deposit", type: "uint256" },
          { internalType: "uint256", name: "damageFee", type: "uint256" },
          { internalType: "uint256", name: "paidTotal", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "returnedAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "bool", name: "canceled", type: "bool" },
          { internalType: "string", name: "rentalRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "returnURI", type: "string" },
          { internalType: "string", name: "cancelURI", type: "string" },
        ],
        internalType: "struct ArcRentalEscrow.Rental",
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
let currentRental: RentalSummary | null = null;

const el = {
  bookRental: document.querySelector<HTMLButtonElement>("#bookRental")!,
  cancelRental: document.querySelector<HTMLButtonElement>("#cancelRental")!,
  cancelURI: document.querySelector<HTMLInputElement>("#cancelURI")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createRental: document.querySelector<HTMLButtonElement>("#createRental")!,
  damageFee: document.querySelector<HTMLInputElement>("#damageFee")!,
  deposit: document.querySelector<HTMLInputElement>("#deposit")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  ownerAddress: document.querySelector<HTMLElement>("#ownerAddress")!,
  paidTotal: document.querySelector<HTMLElement>("#paidTotal")!,
  payoutTo: document.querySelector<HTMLInputElement>("#payoutTo")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  rentalFee: document.querySelector<HTMLInputElement>("#rentalFee")!,
  rentalId: document.querySelector<HTMLElement>("#rentalId")!,
  rentalStatus: document.querySelector<HTMLElement>("#rentalStatus")!,
  renterAddress: document.querySelector<HTMLElement>("#renterAddress")!,
  returnRental: document.querySelector<HTMLButtonElement>("#returnRental")!,
  returnURI: document.querySelector<HTMLInputElement>("#returnURI")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.cancelURI.value = `local:arc-rental-${today}:canceled`;
el.contractAddress.value = contractAddress;
el.damageFee.value = "0.001";
el.deposit.value = "0.004";
el.metadataURI.value = `local:arc-rental-${today}`;
el.payoutTo.value = DEFAULT_ACCOUNT;
el.refundTo.value = DEFAULT_ACCOUNT;
el.rentalFee.value = "0.002";
el.returnURI.value = `local:arc-rental-${today}:returned`;
el.title.value = `arc-rental-${today}`;

const params = new URLSearchParams(window.location.search);

function applyParam(name: string, input: HTMLInputElement): void {
  const value = params.get(name)?.trim();
  if (value) input.value = value;
}

applyParam("cancelURI", el.cancelURI);
applyParam("contract", el.contractAddress);
applyParam("damageFee", el.damageFee);
applyParam("deposit", el.deposit);
applyParam("metadataURI", el.metadataURI);
applyParam("payoutTo", el.payoutTo);
applyParam("refundTo", el.refundTo);
applyParam("rentalFee", el.rentalFee);
applyParam("returnURI", el.returnURI);
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

function rentalId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const owner = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${owner}:${title}`));
}

function rentalFromRaw(value: unknown): RentalSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<RentalSummary>;
    return {
      owner: object.owner ?? ZERO_ADDRESS,
      renter: object.renter ?? ZERO_ADDRESS,
      payoutTo: object.payoutTo ?? ZERO_ADDRESS,
      rentalFee: object.rentalFee ?? 0n,
      deposit: object.deposit ?? 0n,
      damageFee: object.damageFee ?? 0n,
      paidTotal: object.paidTotal ?? 0n,
      createdAt: object.createdAt ?? 0n,
      returnedAt: object.returnedAt ?? 0n,
      closed: Boolean(object.closed),
      canceled: Boolean(object.canceled),
      rentalRef: object.rentalRef ?? "",
      metadataURI: object.metadataURI ?? "",
      returnURI: object.returnURI ?? "",
      cancelURI: object.cancelURI ?? "",
    };
  }

  return {
    owner: value[0] as Address,
    renter: value[1] as Address,
    payoutTo: value[2] as Address,
    rentalFee: value[3] as bigint,
    deposit: value[4] as bigint,
    damageFee: value[5] as bigint,
    paidTotal: value[6] as bigint,
    createdAt: value[7] as bigint,
    returnedAt: value[8] as bigint,
    closed: Boolean(value[9]),
    canceled: Boolean(value[10]),
    rentalRef: value[11] as string,
    metadataURI: value[12] as string,
    returnURI: value[13] as string,
    cancelURI: value[14] as string,
  };
}

function updateRentalIdDisplay(): void {
  try {
    el.rentalId.textContent = rentalId();
  } catch {
    el.rentalId.textContent = "-";
  }
}

function renderRental(): void {
  updateRentalIdDisplay();

  if (!currentRental || currentRental.owner === ZERO_ADDRESS) {
    el.rentalStatus.textContent = "not created";
    el.paidTotal.textContent = "0 USDC";
    el.ownerAddress.textContent = "-";
    el.renterAddress.textContent = "-";
    updateActions();
    return;
  }

  const state = currentRental.closed
    ? currentRental.canceled
      ? "canceled"
      : "returned"
    : currentRental.renter === ZERO_ADDRESS
      ? "listed"
      : "booked";
  el.rentalStatus.textContent = state;
  el.paidTotal.textContent = `${formatEther(currentRental.paidTotal)} USDC paid, ${formatEther(
    currentRental.damageFee,
  )} USDC damage fee`;
  el.ownerAddress.innerHTML = `<a href="${addressUrl(currentRental.owner)}" target="_blank" rel="noreferrer">${shortValue(
    currentRental.owner,
  )}</a>`;
  el.renterAddress.innerHTML =
    currentRental.renter === ZERO_ADDRESS
      ? "-"
      : `<a href="${addressUrl(currentRental.renter)}" target="_blank" rel="noreferrer">${shortValue(
          currentRental.renter,
        )}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasRental = Boolean(currentRental && currentRental.owner !== ZERO_ADDRESS);
  const listed = hasRental && currentRental?.renter === ZERO_ADDRESS && !currentRental?.closed;
  const booked = hasRental && currentRental?.renter !== ZERO_ADDRESS && !currentRental?.closed;

  el.bookRental.disabled = !hasWallet || !hasContract || !listed;
  el.cancelRental.disabled = !hasWallet || !hasContract || !hasRental || Boolean(currentRental?.closed);
  el.createRental.disabled = !hasWallet || !hasContract || hasRental;
  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.returnRental.disabled = !hasWallet || !hasContract || !booked;
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

    el.payoutTo.value = account;
    el.refundTo.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateRentalIdDisplay();
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
    setStatus("Deploying ArcRentalEscrow...");
    const artifact = (await fetch("/public/artifacts/ArcRentalEscrow.json").then((response) =>
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
    setStatus(`ArcRentalEscrow deployed at ${contractAddress}.`);
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
    currentRental = null;
    renderRental();
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

async function refreshRental(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading rental state...");
    const rawRental = await publicClient.readContract({
      address: contractAddress,
      abi: arcRentalAbi,
      functionName: "getRental",
      args: [rentalId()],
    });
    currentRental = rentalFromRaw(rawRental);
    renderRental();
    setStatus("Rental state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createRental(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createRental.disabled = true;
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const payoutTo = el.payoutTo.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(payoutTo)) throw new Error("Payout address must be a valid EVM address.");
    const rentalFee = parseEther(el.rentalFee.value.trim());
    const deposit = parseEther(el.deposit.value.trim());

    setStatus("Creating rental...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcRentalAbi,
      functionName: "createRental",
      args: [rentalId(), payoutTo as Address, rentalFee, deposit, title, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshRental();
    setStatus("Rental created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function bookRental(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || !currentRental) return;

  try {
    el.bookRental.disabled = true;
    setStatus("Booking rental...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcRentalAbi,
      functionName: "bookRental",
      args: [rentalId()],
      account,
      chain: arcTestnet,
      value: currentRental.rentalFee + currentRental.deposit,
    });
    setStatus("Book submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshRental();
    setStatus("Rental booked:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function returnRental(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.returnRental.disabled = true;
    const refundTo = el.refundTo.value.trim();
    const returnURI = el.returnURI.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");
    if (!returnURI) throw new Error("Return URI is required.");
    const damageFee = parseEther(el.damageFee.value.trim());

    setStatus("Returning rental...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcRentalAbi,
      functionName: "returnRental",
      args: [rentalId(), damageFee, refundTo as Address, returnURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Return submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshRental();
    setStatus("Rental returned:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function cancelRental(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.cancelRental.disabled = true;
    const refundTo = el.refundTo.value.trim();
    const cancelURI = el.cancelURI.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");
    if (!cancelURI) throw new Error("Cancel URI is required.");

    setStatus("Canceling rental...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcRentalAbi,
      functionName: "cancelRental",
      args: [rentalId(), refundTo as Address, cancelURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Cancel submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshRental();
    setStatus("Rental canceled:", hash);
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

  await refreshRental();
  if (!currentRental || currentRental.owner === ZERO_ADDRESS) {
    await createRental();
    await refreshRental();
  }

  if (currentRental && currentRental.owner !== ZERO_ADDRESS && !currentRental.closed) {
    if (currentRental.renter === ZERO_ADDRESS) {
      await bookRental();
      await refreshRental();
    }
    if (currentRental && currentRental.renter !== ZERO_ADDRESS && !currentRental.closed) {
      await returnRental();
      await refreshRental();
    }
  }

  setStatus(`Auto flow complete for ${contractAddress}.`);
}

el.bookRental.addEventListener("click", () => void bookRental());
el.cancelRental.addEventListener("click", () => void cancelRental());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createRental.addEventListener("click", () => void createRental());
el.deployContract.addEventListener("click", () => void deployContract());
el.refresh.addEventListener("click", () => void refreshRental());
el.returnRental.addEventListener("click", () => void returnRental());
el.saveContract.addEventListener("click", saveContract);
el.title.addEventListener("input", () => {
  currentRental = null;
  renderRental();
});

renderRental();
setTimeout(() => void runAutoFlow(), 500);
