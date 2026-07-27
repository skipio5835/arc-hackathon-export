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

type AgreementSummary = {
  sponsor: Address;
  worker: Address;
  totalFunded: bigint;
  totalReleased: bigint;
  createdAt: bigint;
  closed: boolean;
  title: string;
  metadataURI: string;
  milestoneCount: bigint;
};

type MilestoneSummary = {
  amount: bigint;
  submitted: boolean;
  released: boolean;
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

const CONTRACT_KEY = "arcMilestone.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcMilestoneAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "agreementId", type: "bytes32" },
      { internalType: "address", name: "worker", type: "address" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createAgreement",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "agreementId", type: "bytes32" },
      { internalType: "uint256", name: "milestoneIndex", type: "uint256" },
      { internalType: "string", name: "submissionURI", type: "string" },
    ],
    name: "submitMilestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "agreementId", type: "bytes32" },
      { internalType: "uint256", name: "milestoneIndex", type: "uint256" },
    ],
    name: "releaseMilestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "agreementId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closeAgreement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "agreementId", type: "bytes32" }],
    name: "getAgreement",
    outputs: [
      {
        components: [
          { internalType: "address", name: "sponsor", type: "address" },
          { internalType: "address", name: "worker", type: "address" },
          { internalType: "uint256", name: "totalFunded", type: "uint256" },
          { internalType: "uint256", name: "totalReleased", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
        ],
        internalType: "struct ArcMilestoneAgreement.Agreement",
        name: "agreement",
        type: "tuple",
      },
      { internalType: "uint256", name: "milestoneCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "agreementId", type: "bytes32" },
      { internalType: "uint256", name: "milestoneIndex", type: "uint256" },
    ],
    name: "getMilestone",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bool", name: "submitted", type: "bool" },
          { internalType: "bool", name: "released", type: "bool" },
          { internalType: "string", name: "submissionURI", type: "string" },
        ],
        internalType: "struct ArcMilestoneAgreement.Milestone",
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
let currentAgreement: AgreementSummary | null = null;
let currentMilestone: MilestoneSummary | null = null;

const el = {
  agreementId: document.querySelector<HTMLElement>("#agreementId")!,
  agreementStatus: document.querySelector<HTMLElement>("#agreementStatus")!,
  closeAgreement: document.querySelector<HTMLButtonElement>("#closeAgreement")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createAgreement: document.querySelector<HTMLButtonElement>("#createAgreement")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  firstAmount: document.querySelector<HTMLInputElement>("#firstAmount")!,
  fundingStatus: document.querySelector<HTMLElement>("#fundingStatus")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  milestoneIndex: document.querySelector<HTMLInputElement>("#milestoneIndex")!,
  milestoneStatus: document.querySelector<HTMLElement>("#milestoneStatus")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  releaseMilestone: document.querySelector<HTMLButtonElement>("#releaseMilestone")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  secondAmount: document.querySelector<HTMLInputElement>("#secondAmount")!,
  sponsorAddress: document.querySelector<HTMLElement>("#sponsorAddress")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  submissionURI: document.querySelector<HTMLInputElement>("#submissionURI")!,
  submitMilestone: document.querySelector<HTMLButtonElement>("#submitMilestone")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  worker: document.querySelector<HTMLInputElement>("#worker")!,
  workerAddress: document.querySelector<HTMLElement>("#workerAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.firstAmount.value = "0.004";
el.metadataURI.value = `local:arc-milestone-${today}`;
el.milestoneIndex.value = "0";
el.refundTo.value = DEFAULT_ACCOUNT;
el.secondAmount.value = "0.003";
el.submissionURI.value = `local:arc-milestone-submission-${today}`;
el.title.value = `arc-milestone-${today}`;
el.worker.value = DEFAULT_ACCOUNT;

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

function agreementId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const sponsor = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${sponsor}:${title}`));
}

function agreementFromRaw(value: unknown): AgreementSummary {
  const tuple = value as readonly [unknown, bigint];
  const rawAgreement = tuple[0];
  const milestoneCount = tuple[1] ?? 0n;
  const agreement = Array.isArray(rawAgreement)
    ? {
        sponsor: rawAgreement[0] as Address,
        worker: rawAgreement[1] as Address,
        totalFunded: rawAgreement[2] as bigint,
        totalReleased: rawAgreement[3] as bigint,
        createdAt: rawAgreement[4] as bigint,
        closed: Boolean(rawAgreement[5]),
        title: rawAgreement[6] as string,
        metadataURI: rawAgreement[7] as string,
      }
    : (rawAgreement as Partial<AgreementSummary>);

  return {
    sponsor: agreement.sponsor ?? ZERO_ADDRESS,
    worker: agreement.worker ?? ZERO_ADDRESS,
    totalFunded: agreement.totalFunded ?? 0n,
    totalReleased: agreement.totalReleased ?? 0n,
    createdAt: agreement.createdAt ?? 0n,
    closed: Boolean(agreement.closed),
    title: agreement.title ?? "",
    metadataURI: agreement.metadataURI ?? "",
    milestoneCount,
  };
}

function milestoneFromRaw(value: unknown): MilestoneSummary {
  if (!Array.isArray(value)) {
    const milestone = value as Partial<MilestoneSummary>;
    return {
      amount: milestone.amount ?? 0n,
      submitted: Boolean(milestone.submitted),
      released: Boolean(milestone.released),
      submissionURI: milestone.submissionURI ?? "",
    };
  }

  return {
    amount: value[0] as bigint,
    submitted: Boolean(value[1]),
    released: Boolean(value[2]),
    submissionURI: value[3] as string,
  };
}

function updateAgreementIdDisplay(): void {
  try {
    el.agreementId.textContent = agreementId();
  } catch {
    el.agreementId.textContent = "-";
  }
}

function renderAgreement(): void {
  updateAgreementIdDisplay();

  if (!currentAgreement || currentAgreement.sponsor === ZERO_ADDRESS) {
    el.agreementStatus.textContent = "not created";
    el.fundingStatus.textContent = "0 / 0 USDC";
    el.milestoneStatus.textContent = "-";
    el.sponsorAddress.textContent = "-";
    el.workerAddress.textContent = "-";
    updateActions();
    return;
  }

  const remaining = currentAgreement.totalFunded - currentAgreement.totalReleased;
  el.agreementStatus.textContent = currentAgreement.closed ? "closed" : "active";
  el.fundingStatus.textContent = `${formatEther(currentAgreement.totalReleased)} released / ${formatEther(
    remaining,
  )} remaining`;
  el.milestoneStatus.textContent = currentMilestone
    ? `${formatEther(currentMilestone.amount)} USDC, ${currentMilestone.submitted ? "submitted" : "not submitted"}, ${
        currentMilestone.released ? "released" : "not released"
      }`
    : "-";
  el.sponsorAddress.innerHTML = `<a href="${addressUrl(currentAgreement.sponsor)}" target="_blank" rel="noreferrer">${shortValue(
    currentAgreement.sponsor,
  )}</a>`;
  el.workerAddress.innerHTML = `<a href="${addressUrl(currentAgreement.worker)}" target="_blank" rel="noreferrer">${shortValue(
    currentAgreement.worker,
  )}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasAgreement = Boolean(currentAgreement && currentAgreement.sponsor !== ZERO_ADDRESS);
  const active = hasAgreement && !currentAgreement?.closed;
  const submitted = Boolean(currentMilestone?.submitted);
  const released = Boolean(currentMilestone?.released);

  el.closeAgreement.disabled = !hasWallet || !hasContract || !active;
  el.createAgreement.disabled = !hasWallet || !hasContract || hasAgreement;
  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.releaseMilestone.disabled = !hasWallet || !hasContract || !active || !submitted || released;
  el.submitMilestone.disabled = !hasWallet || !hasContract || !active || released;
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
    el.worker.value = account;
    el.refundTo.value = account;
    el.connect.textContent = "Connected";
    updateAgreementIdDisplay();
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
    setStatus("Deploying ArcMilestoneAgreement...");
    const artifact = (await fetch("/public/artifacts/ArcMilestoneAgreement.json").then((response) =>
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
    setStatus(`ArcMilestoneAgreement deployed at ${contractAddress}.`);
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
    currentAgreement = null;
    currentMilestone = null;
    renderAgreement();
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

function selectedMilestoneIndex(): bigint {
  const parsed = Number(el.milestoneIndex.value.trim());
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error("Milestone index must be zero or a positive integer.");
  return BigInt(parsed);
}

async function refreshAgreement(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading agreement state...");
    const rawAgreement = await publicClient.readContract({
      address: contractAddress,
      abi: arcMilestoneAbi,
      functionName: "getAgreement",
      args: [agreementId()],
    });
    currentAgreement = agreementFromRaw(rawAgreement);

    if (currentAgreement.sponsor !== ZERO_ADDRESS && currentAgreement.milestoneCount > 0n) {
      const rawMilestone = await publicClient.readContract({
        address: contractAddress,
        abi: arcMilestoneAbi,
        functionName: "getMilestone",
        args: [agreementId(), selectedMilestoneIndex()],
      });
      currentMilestone = milestoneFromRaw(rawMilestone);
    } else {
      currentMilestone = null;
    }

    renderAgreement();
    setStatus("Agreement state refreshed.");
  } catch (error) {
    const message = errorMessage(error);
    if (message.includes("AgreementMissing")) {
      currentAgreement = null;
      currentMilestone = null;
      renderAgreement();
      setStatus("Agreement not created yet.");
      return;
    }
    setStatus(message);
  }
}

async function createAgreement(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createAgreement.disabled = true;
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const worker = el.worker.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(worker)) throw new Error("Worker must be a valid EVM address.");

    const firstAmount = parseEther(el.firstAmount.value.trim());
    const secondAmount = parseEther(el.secondAmount.value.trim());
    const total = firstAmount + secondAmount;

    setStatus("Creating milestone agreement...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMilestoneAbi,
      functionName: "createAgreement",
      args: [agreementId(), worker as Address, [firstAmount, secondAmount], title, metadataURI],
      account,
      chain: arcTestnet,
      value: total,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshAgreement();
    setStatus("Agreement created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function submitMilestone(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.submitMilestone.disabled = true;
    const submissionURI = el.submissionURI.value.trim();
    if (!submissionURI) throw new Error("Submission URI is required.");

    setStatus("Submitting milestone...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMilestoneAbi,
      functionName: "submitMilestone",
      args: [agreementId(), selectedMilestoneIndex(), submissionURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Submit submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshAgreement();
    setStatus("Milestone submitted:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function releaseMilestone(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.releaseMilestone.disabled = true;
    setStatus("Releasing milestone...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMilestoneAbi,
      functionName: "releaseMilestone",
      args: [agreementId(), selectedMilestoneIndex()],
      account,
      chain: arcTestnet,
    });
    setStatus("Release submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshAgreement();
    setStatus("Milestone released:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeAgreement(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeAgreement.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing agreement...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMilestoneAbi,
      functionName: "closeAgreement",
      args: [agreementId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshAgreement();
    setStatus("Agreement closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.closeAgreement.addEventListener("click", () => void closeAgreement());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createAgreement.addEventListener("click", () => void createAgreement());
el.deployContract.addEventListener("click", () => void deployContract());
el.milestoneIndex.addEventListener("input", () => void refreshAgreement());
el.refresh.addEventListener("click", () => void refreshAgreement());
el.releaseMilestone.addEventListener("click", () => void releaseMilestone());
el.saveContract.addEventListener("click", saveContract);
el.submitMilestone.addEventListener("click", () => void submitMilestone());
el.title.addEventListener("input", () => {
  currentAgreement = null;
  currentMilestone = null;
  renderAgreement();
});

renderAgreement();
