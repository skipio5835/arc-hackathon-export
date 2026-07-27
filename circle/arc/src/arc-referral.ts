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

type ReferralSummary = {
  creator: Address;
  recipient: Address;
  amount: bigint;
  claimedAmount: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  closed: boolean;
  ReferralRef: string;
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

const CONTRACT_KEY = "ArcReferralVault.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcReferralAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "ReferralId", type: "bytes32" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint64", name: "expiresAt", type: "uint64" },
      { internalType: "string", name: "ReferralRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createReferral",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "ReferralId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
      { internalType: "string", name: "claimURI", type: "string" },
    ],
    name: "claimReferral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "ReferralId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closeReferral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "ReferralId", type: "bytes32" }],
    name: "getReferral",
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
          { internalType: "string", name: "ReferralRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "claimURI", type: "string" },
        ],
        internalType: "struct ArcReferralVault.Referral",
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
let currentReferral: ReferralSummary | null = null;

const el = {
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  ReferralId: document.querySelector<HTMLElement>("#ReferralId")!,
  ReferralStatus: document.querySelector<HTMLElement>("#ReferralStatus")!,
  claimValue: document.querySelector<HTMLElement>("#claimValue")!,
  closeReferral: document.querySelector<HTMLButtonElement>("#closeReferral")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createReferral: document.querySelector<HTMLButtonElement>("#createReferral")!,
  creatorAddress: document.querySelector<HTMLElement>("#creatorAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  label: document.querySelector<HTMLInputElement>("#label")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  recipientAddress: document.querySelector<HTMLElement>("#recipientAddress")!,
  claimReferral: document.querySelector<HTMLButtonElement>("#claimReferral")!,
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
el.label.value = `arc-referral-${today}`;
el.metadataURI.value = `local:arc-referral-${today}`;
el.recipient.value = DEFAULT_ACCOUNT;
el.claimTo.value = DEFAULT_ACCOUNT;
el.claimURI.value = `local:arc-referral-${today}:claimed`;
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

function ReferralId(): Hash {
  const label = el.label.value.trim();
  if (!label) throw new Error("Label is required.");
  const creator = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${creator}:${label}`));
}

function ReferralFromRaw(value: unknown): ReferralSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<ReferralSummary>;
    return {
      creator: object.creator ?? ZERO_ADDRESS,
      recipient: object.recipient ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      claimedAmount: object.claimedAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      expiresAt: object.expiresAt ?? 0n,
      closed: Boolean(object.closed),
      ReferralRef: object.ReferralRef ?? "",
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
    ReferralRef: value[7] as string,
    metadataURI: value[8] as string,
    claimURI: value[9] as string,
  };
}

function updateReferralIdDisplay(): void {
  try {
    el.ReferralId.textContent = ReferralId();
  } catch {
    el.ReferralId.textContent = "-";
  }
}

function renderReferral(): void {
  updateReferralIdDisplay();

  if (!currentReferral || currentReferral.creator === ZERO_ADDRESS) {
    el.ReferralStatus.textContent = "not created";
    el.claimValue.textContent = "0 USDC";
    el.creatorAddress.textContent = "-";
    el.recipientAddress.textContent = "-";
    updateActions();
    return;
  }

  const available = currentReferral.amount - currentReferral.claimedAmount;
  el.ReferralStatus.textContent = currentReferral.closed
    ? "closed"
    : currentReferral.claimedAmount > 0n
      ? "claimed"
      : "funded";
  el.claimValue.textContent = `${formatEther(currentReferral.claimedAmount)} / ${formatEther(
    currentReferral.amount,
  )} USDC claimed, ${formatEther(available)} USDC remaining`;
  el.creatorAddress.innerHTML = `<a href="${addressUrl(currentReferral.creator)}" target="_blank" rel="noreferrer">${shortValue(
    currentReferral.creator,
  )}</a>`;
  el.recipientAddress.innerHTML = `<a href="${addressUrl(
    currentReferral.recipient,
  )}" target="_blank" rel="noreferrer">${shortValue(currentReferral.recipient)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasCard = Boolean(currentReferral && currentReferral.creator !== ZERO_ADDRESS);
  const open = hasCard && !currentReferral?.closed;
  const claimable = open && currentReferral?.claimedAmount === 0n;

  el.closeReferral.disabled = !hasWallet || !hasContract || !open;
  el.createReferral.disabled = !hasWallet || !hasContract || hasCard;
  el.deployContract.disabled = !hasWallet;
  el.claimReferral.disabled = !hasWallet || !hasContract || !claimable;
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
    updateReferralIdDisplay();
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
    setStatus("Deploying ArcReferralVault...");
    const artifact = (await fetch("/public/artifacts/ArcReferralVault.json").then((response) =>
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
    setStatus(`ArcReferralVault deployed at ${contractAddress}.`);
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
    currentReferral = null;
    renderReferral();
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

async function refreshReferral(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading Referral state...");
    const rawCard = await publicClient.readContract({
      address: contractAddress,
      abi: arcReferralAbi,
      functionName: "getReferral",
      args: [ReferralId()],
    });
    currentReferral = ReferralFromRaw(rawCard);
    renderReferral();
    setStatus("Referral state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createReferral(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createReferral.disabled = true;
    const recipient = el.recipient.value.trim();
    const label = el.label.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(recipient)) throw new Error("recipient must be a valid EVM address.");
    if (!label) throw new Error("Label is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    const amount = parseEther(el.amount.value.trim());

    setStatus("Creating Referral...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcReferralAbi,
      functionName: "createReferral",
      args: [ReferralId(), recipient as Address, 0n, label, metadataURI],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshReferral();
    setStatus("Referral created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function claimReferral(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.claimReferral.disabled = true;
    const claimTo = el.claimTo.value.trim();
    const claimURI = el.claimURI.value.trim();
    if (!isAddress(claimTo)) throw new Error("Claim address must be a valid EVM address.");
    if (!claimURI) throw new Error("Claim URI is required.");

    setStatus("Claiming Referral...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcReferralAbi,
      functionName: "claimReferral",
      args: [ReferralId(), claimTo as Address, claimURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Claim submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshReferral();
    setStatus("Referral claimed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeReferral(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeReferral.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing Referral...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcReferralAbi,
      functionName: "closeReferral",
      args: [ReferralId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshReferral();
    setStatus("Referral closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.closeReferral.addEventListener("click", () => void closeReferral());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createReferral.addEventListener("click", () => void createReferral());
el.deployContract.addEventListener("click", () => void deployContract());
el.label.addEventListener("input", () => {
  currentReferral = null;
  renderReferral();
});
el.claimReferral.addEventListener("click", () => void claimReferral());
el.refresh.addEventListener("click", () => void refreshReferral());
el.saveContract.addEventListener("click", saveContract);

renderReferral();

async function runAutoFlow(): Promise<void> {
  if (params.get("autorun") !== "1") return;

  setStatus("Auto flow starting. Approve each MetaMask request as it appears.");
  await connect();
  if (!walletClient || !account) return;

  if (!contractAddress || !isAddress(contractAddress)) {
    await deployContract();
  }
  if (!contractAddress || !isAddress(contractAddress)) return;

  await refreshReferral();
  if (!currentReferral || currentReferral.creator === ZERO_ADDRESS) {
    await createReferral();
    await refreshReferral();
  }

  if (currentReferral && currentReferral.creator !== ZERO_ADDRESS && !currentReferral.closed) {
    if (currentReferral.claimedAmount === 0n) {
      await claimReferral();
      await refreshReferral();
    }
    if (currentReferral && !currentReferral.closed) {
      await closeReferral();
      await refreshReferral();
    }
  }

  setStatus(`Auto flow complete for ${contractAddress}.`);
}

setTimeout(() => void runAutoFlow(), 500);





