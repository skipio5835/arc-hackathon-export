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

type CampaignSummary = {
  owner: Address;
  totalFunded: bigint;
  totalClaimed: bigint;
  createdAt: bigint;
  closesAt: bigint;
  closed: boolean;
  label: string;
};

type AllocationSummary = {
  allocation: bigint;
  claimed: boolean;
  claimable: bigint;
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

const CONTRACT_KEY = "arcAirdrop.contractAddress";
const DEFAULT_RECIPIENT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcAirdropAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "campaignId", type: "bytes32" },
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      { internalType: "uint64", name: "durationSeconds", type: "uint64" },
      { internalType: "string", name: "label", type: "string" },
    ],
    name: "createCampaign",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "campaignId", type: "bytes32" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "campaignId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closeCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "campaignId", type: "bytes32" }],
    name: "getCampaign",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "totalFunded", type: "uint256" },
          { internalType: "uint256", name: "totalClaimed", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "closesAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "label", type: "string" },
        ],
        internalType: "struct ArcAirdropCampaign.Campaign",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "campaignId", type: "bytes32" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "getAllocation",
    outputs: [
      { internalType: "uint256", name: "allocation", type: "uint256" },
      { internalType: "bool", name: "claimed", type: "bool" },
      { internalType: "uint256", name: "claimable", type: "uint256" },
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
let currentCampaign: CampaignSummary | null = null;
let currentAllocation: AllocationSummary | null = null;

const el = {
  allocationAmount: document.querySelector<HTMLInputElement>("#allocationAmount")!,
  campaignBalance: document.querySelector<HTMLElement>("#campaignBalance")!,
  campaignId: document.querySelector<HTMLElement>("#campaignId")!,
  campaignLabel: document.querySelector<HTMLInputElement>("#campaignLabel")!,
  campaignStatus: document.querySelector<HTMLElement>("#campaignStatus")!,
  claim: document.querySelector<HTMLButtonElement>("#claim")!,
  closeCampaign: document.querySelector<HTMLButtonElement>("#closeCampaign")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createCampaign: document.querySelector<HTMLButtonElement>("#createCampaign")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  durationMinutes: document.querySelector<HTMLInputElement>("#durationMinutes")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  ownerAddress: document.querySelector<HTMLElement>("#ownerAddress")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.allocationAmount.value = "0.006";
el.campaignLabel.value = `arc-airdrop-${today}`;
el.contractAddress.value = contractAddress;
el.durationMinutes.value = "60";
el.recipient.value = DEFAULT_RECIPIENT;
el.refundTo.value = DEFAULT_RECIPIENT;

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

function campaignId(): Hash {
  const label = el.campaignLabel.value.trim();
  if (!label) throw new Error("Campaign label is required.");
  const owner = account?.toLowerCase() ?? DEFAULT_RECIPIENT.toLowerCase();
  return keccak256(toBytes(`${owner}:${label}`));
}

function campaignFromRaw(value: unknown): CampaignSummary {
  if (!Array.isArray(value)) {
    const object = value as {
      owner?: Address;
      totalFunded?: bigint;
      totalClaimed?: bigint;
      createdAt?: bigint;
      closesAt?: bigint;
      closed?: boolean;
      label?: string;
    };
    return {
      owner: object.owner ?? ZERO_ADDRESS,
      totalFunded: object.totalFunded ?? 0n,
      totalClaimed: object.totalClaimed ?? 0n,
      createdAt: object.createdAt ?? 0n,
      closesAt: object.closesAt ?? 0n,
      closed: Boolean(object.closed),
      label: object.label ?? "",
    };
  }

  return {
    owner: value[0] as Address,
    totalFunded: value[1] as bigint,
    totalClaimed: value[2] as bigint,
    createdAt: value[3] as bigint,
    closesAt: value[4] as bigint,
    closed: Boolean(value[5]),
    label: value[6] as string,
  };
}

function allocationFromRaw(value: unknown): AllocationSummary {
  if (!Array.isArray(value)) {
    const object = value as { allocation?: bigint; claimed?: boolean; claimable?: bigint };
    return {
      allocation: object.allocation ?? 0n,
      claimed: Boolean(object.claimed),
      claimable: object.claimable ?? 0n,
    };
  }

  return {
    allocation: value[0] as bigint,
    claimed: Boolean(value[1]),
    claimable: value[2] as bigint,
  };
}

function updateCampaignIdDisplay(): void {
  try {
    el.campaignId.textContent = campaignId();
  } catch {
    el.campaignId.textContent = "-";
  }
}

function renderCampaign(): void {
  updateCampaignIdDisplay();

  if (!currentCampaign || currentCampaign.owner === ZERO_ADDRESS) {
    el.campaignBalance.textContent = "0 / 0 USDC";
    el.campaignStatus.textContent = "not created";
    el.ownerAddress.textContent = "-";
    updateActions();
    return;
  }

  const remaining = currentCampaign.totalFunded - currentCampaign.totalClaimed;
  const claimable = currentAllocation?.claimable ?? 0n;
  const claimStatus = currentAllocation?.claimed ? "claimed" : claimable > 0n ? "claimable" : "no allocation";
  el.campaignBalance.textContent = `${formatEther(currentCampaign.totalClaimed)} claimed / ${formatEther(
    remaining,
  )} remaining`;
  el.campaignStatus.textContent = currentCampaign.closed ? "closed" : claimStatus;
  el.ownerAddress.innerHTML = `<a href="${addressUrl(currentCampaign.owner)}" target="_blank" rel="noreferrer">${shortValue(
    currentCampaign.owner,
  )}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasCampaign = Boolean(currentCampaign && currentCampaign.owner !== ZERO_ADDRESS);
  const openCampaign = hasCampaign && !currentCampaign?.closed;
  const claimable = (currentAllocation?.claimable ?? 0n) > 0n && !currentAllocation?.claimed;

  el.claim.disabled = !hasWallet || !hasContract || !openCampaign || !claimable;
  el.closeCampaign.disabled = !hasWallet || !hasContract || !openCampaign;
  el.createCampaign.disabled = !hasWallet || !hasContract || hasCampaign;
  el.deployContract.disabled = !hasWallet;
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

    el.walletAddress.textContent = account;
    el.recipient.value = account;
    el.refundTo.value = account;
    el.connect.textContent = "Connected";
    updateCampaignIdDisplay();
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
    setStatus("Deploying ArcAirdropCampaign...");
    const artifact = (await fetch("/public/artifacts/ArcAirdropCampaign.json").then((response) =>
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
    setStatus(`ArcAirdropCampaign deployed at ${contractAddress}.`);
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
    currentCampaign = null;
    currentAllocation = null;
    renderCampaign();
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

async function refreshCampaign(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading campaign state...");
    const rawCampaign = await publicClient.readContract({
      address: contractAddress,
      abi: arcAirdropAbi,
      functionName: "getCampaign",
      args: [campaignId()],
    });
    currentCampaign = campaignFromRaw(rawCampaign);

    const recipient = el.recipient.value.trim();
    if (isAddress(recipient)) {
      const rawAllocation = await publicClient.readContract({
        address: contractAddress,
        abi: arcAirdropAbi,
        functionName: "getAllocation",
        args: [campaignId(), recipient as Address],
      });
      currentAllocation = allocationFromRaw(rawAllocation);
    }

    renderCampaign();
    setStatus("Campaign state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createCampaign(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createCampaign.disabled = true;
    const label = el.campaignLabel.value.trim();
    const recipient = el.recipient.value.trim();
    const durationMinutes = Number(el.durationMinutes.value.trim());
    if (!label) throw new Error("Campaign label is required.");
    if (!isAddress(recipient)) throw new Error("Recipient must be a valid EVM address.");
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      throw new Error("Duration minutes must be a positive integer.");
    }

    const amount = parseEther(el.allocationAmount.value.trim());

    setStatus("Creating airdrop campaign...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAirdropAbi,
      functionName: "createCampaign",
      args: [campaignId(), [recipient as Address], [amount], BigInt(durationMinutes * 60), label],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshCampaign();
    setStatus("Campaign created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function claim(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.claim.disabled = true;
    setStatus("Claiming airdrop...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAirdropAbi,
      functionName: "claim",
      args: [campaignId()],
      account,
      chain: arcTestnet,
    });
    setStatus("Claim submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshCampaign();
    setStatus("Airdrop claimed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeCampaign(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeCampaign.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing campaign...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAirdropAbi,
      functionName: "closeCampaign",
      args: [campaignId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshCampaign();
    setStatus("Campaign closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.campaignLabel.addEventListener("input", () => {
  currentCampaign = null;
  currentAllocation = null;
  renderCampaign();
});
el.claim.addEventListener("click", () => void claim());
el.closeCampaign.addEventListener("click", () => void closeCampaign());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createCampaign.addEventListener("click", () => void createCampaign());
el.deployContract.addEventListener("click", () => void deployContract());
el.recipient.addEventListener("input", updateActions);
el.refresh.addEventListener("click", () => void refreshCampaign());
el.saveContract.addEventListener("click", saveContract);

renderCampaign();
