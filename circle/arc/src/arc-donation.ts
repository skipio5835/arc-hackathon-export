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
  creator: Address;
  treasury: Address;
  goalAmount: bigint;
  totalDonated: bigint;
  withdrawnAmount: bigint;
  createdAt: bigint;
  active: boolean;
  title: string;
  metadataURI: string;
};

type DonationSummary = {
  donor: Address;
  amount: bigint;
  donatedAt: bigint;
  message: string;
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

const CONTRACT_KEY = "arcDonationJar.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcDonationAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "campaignId", type: "bytes32" },
      { internalType: "address", name: "treasury", type: "address" },
      { internalType: "uint256", name: "goalAmount", type: "uint256" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "campaignId", type: "bytes32" },
      { internalType: "string", name: "message", type: "string" },
    ],
    name: "donate",
    outputs: [{ internalType: "uint256", name: "donationId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "campaignId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdrawCampaign",
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
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "address", name: "treasury", type: "address" },
          { internalType: "uint256", name: "goalAmount", type: "uint256" },
          { internalType: "uint256", name: "totalDonated", type: "uint256" },
          { internalType: "uint256", name: "withdrawnAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
        ],
        internalType: "struct ArcDonationJar.Campaign",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "campaignId", type: "bytes32" }],
    name: "getDonationCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "campaignId", type: "bytes32" },
      { internalType: "uint256", name: "donationId", type: "uint256" },
    ],
    name: "getDonation",
    outputs: [
      {
        components: [
          { internalType: "address", name: "donor", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint64", name: "donatedAt", type: "uint64" },
          { internalType: "string", name: "message", type: "string" },
        ],
        internalType: "struct ArcDonationJar.Donation",
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
let currentCampaign: CampaignSummary | null = null;
let donationCount = 0n;
let latestDonation: DonationSummary | null = null;

const el = {
  campaignId: document.querySelector<HTMLElement>("#campaignId")!,
  campaignStatus: document.querySelector<HTMLElement>("#campaignStatus")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createCampaign: document.querySelector<HTMLButtonElement>("#createCampaign")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  donate: document.querySelector<HTMLButtonElement>("#donate")!,
  donationAmount: document.querySelector<HTMLInputElement>("#donationAmount")!,
  donationCount: document.querySelector<HTMLElement>("#donationCount")!,
  goalAmount: document.querySelector<HTMLInputElement>("#goalAmount")!,
  latestDonation: document.querySelector<HTMLElement>("#latestDonation")!,
  message: document.querySelector<HTMLInputElement>("#message")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  treasury: document.querySelector<HTMLInputElement>("#treasury")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  withdraw: document.querySelector<HTMLButtonElement>("#withdraw")!,
  withdrawAmount: document.querySelector<HTMLInputElement>("#withdrawAmount")!,
  withdrawTo: document.querySelector<HTMLInputElement>("#withdrawTo")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.donationAmount.value = "0.004";
el.goalAmount.value = "0.02";
el.message.value = `local:arc-donation-${today}:support`;
el.metadataURI.value = `local:arc-donation-${today}`;
el.title.value = `arc-donation-${today}`;
el.treasury.value = DEFAULT_ACCOUNT;
el.withdrawAmount.value = "0.004";
el.withdrawTo.value = DEFAULT_ACCOUNT;

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

function campaignId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const creator = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${creator}:${title}`));
}

function campaignFromRaw(value: unknown): CampaignSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<CampaignSummary>;
    return {
      creator: object.creator ?? ZERO_ADDRESS,
      treasury: object.treasury ?? ZERO_ADDRESS,
      goalAmount: object.goalAmount ?? 0n,
      totalDonated: object.totalDonated ?? 0n,
      withdrawnAmount: object.withdrawnAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      active: Boolean(object.active),
      title: object.title ?? "",
      metadataURI: object.metadataURI ?? "",
    };
  }

  return {
    creator: value[0] as Address,
    treasury: value[1] as Address,
    goalAmount: value[2] as bigint,
    totalDonated: value[3] as bigint,
    withdrawnAmount: value[4] as bigint,
    createdAt: value[5] as bigint,
    active: Boolean(value[6]),
    title: value[7] as string,
    metadataURI: value[8] as string,
  };
}

function donationFromRaw(value: unknown): DonationSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<DonationSummary>;
    return {
      donor: object.donor ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      donatedAt: object.donatedAt ?? 0n,
      message: object.message ?? "",
    };
  }

  return {
    donor: value[0] as Address,
    amount: value[1] as bigint,
    donatedAt: value[2] as bigint,
    message: value[3] as string,
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

  if (!currentCampaign || currentCampaign.creator === ZERO_ADDRESS) {
    el.campaignStatus.textContent = "not created";
    el.donationCount.textContent = "0";
    el.latestDonation.textContent = "-";
    updateActions();
    return;
  }

  const available = currentCampaign.totalDonated - currentCampaign.withdrawnAmount;
  el.campaignStatus.textContent = currentCampaign.active
    ? `${formatEther(currentCampaign.totalDonated)} / ${formatEther(currentCampaign.goalAmount)} USDC`
    : "closed";
  el.donationCount.textContent = donationCount.toString();
  el.latestDonation.innerHTML = latestDonation
    ? `${formatEther(latestDonation.amount)} USDC from <a href="${addressUrl(
        latestDonation.donor,
      )}" target="_blank" rel="noreferrer">${shortValue(latestDonation.donor)}</a>`
    : `${formatEther(available)} USDC available`;
  if (available > 0n) {
    el.withdrawAmount.value = formatEther(available);
  }
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasCampaign = Boolean(currentCampaign && currentCampaign.creator !== ZERO_ADDRESS);
  const active = hasCampaign && Boolean(currentCampaign?.active);
  const available = currentCampaign ? currentCampaign.totalDonated - currentCampaign.withdrawnAmount : 0n;

  el.createCampaign.disabled = !hasWallet || !hasContract || hasCampaign;
  el.deployContract.disabled = !hasWallet;
  el.donate.disabled = !hasWallet || !hasContract || !active;
  el.refresh.disabled = !hasContract;
  el.withdraw.disabled = !hasWallet || !hasContract || !hasCampaign || available === 0n;
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
    el.treasury.value = account;
    el.withdrawTo.value = account;
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
    setStatus("Deploying ArcDonationJar...");
    const artifact = (await fetch("/public/artifacts/ArcDonationJar.json").then((response) => response.json())) as Artifact;
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
    setStatus(`ArcDonationJar deployed at ${contractAddress}.`);
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
    latestDonation = null;
    donationCount = 0n;
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
    const id = campaignId();
    const rawCampaign = await publicClient.readContract({
      address: contractAddress,
      abi: arcDonationAbi,
      functionName: "getCampaign",
      args: [id],
    });
    currentCampaign = campaignFromRaw(rawCampaign);

    donationCount = 0n;
    latestDonation = null;
    if (currentCampaign.creator !== ZERO_ADDRESS) {
      donationCount = await publicClient.readContract({
        address: contractAddress,
        abi: arcDonationAbi,
        functionName: "getDonationCount",
        args: [id],
      });

      if (donationCount > 0n) {
        const rawDonation = await publicClient.readContract({
          address: contractAddress,
          abi: arcDonationAbi,
          functionName: "getDonation",
          args: [id, donationCount],
        });
        latestDonation = donationFromRaw(rawDonation);
      }
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
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const treasury = el.treasury.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(treasury)) throw new Error("Treasury must be a valid EVM address.");
    const goalAmount = parseEther(el.goalAmount.value.trim());

    setStatus("Creating donation campaign...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcDonationAbi,
      functionName: "createCampaign",
      args: [campaignId(), treasury as Address, goalAmount, title, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshCampaign();
    setStatus("Campaign created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function donate(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress || !currentCampaign) return;

  try {
    el.donate.disabled = true;
    const message = el.message.value.trim();
    if (!message) throw new Error("Message is required.");
    const value = parseEther(el.donationAmount.value.trim());

    setStatus("Sending donation...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcDonationAbi,
      functionName: "donate",
      args: [campaignId(), message],
      account,
      chain: arcTestnet,
      value,
    });
    setStatus("Donation submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshCampaign();
    setStatus("Donation sent:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function withdraw(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.withdraw.disabled = true;
    const withdrawTo = el.withdrawTo.value.trim();
    if (!isAddress(withdrawTo)) throw new Error("Withdraw address must be a valid EVM address.");
    const amount = parseEther(el.withdrawAmount.value.trim());

    setStatus("Withdrawing donations...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcDonationAbi,
      functionName: "withdrawCampaign",
      args: [campaignId(), withdrawTo as Address, amount],
      account,
      chain: arcTestnet,
    });
    setStatus("Withdraw submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshCampaign();
    setStatus("Donation withdrawn:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createCampaign.addEventListener("click", () => void createCampaign());
el.deployContract.addEventListener("click", () => void deployContract());
el.donate.addEventListener("click", () => void donate());
el.refresh.addEventListener("click", () => void refreshCampaign());
el.saveContract.addEventListener("click", saveContract);
el.title.addEventListener("input", () => {
  currentCampaign = null;
  latestDonation = null;
  donationCount = 0n;
  renderCampaign();
});
el.withdraw.addEventListener("click", () => void withdraw());

renderCampaign();
