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

type VestingSummary = {
  funder: Address;
  beneficiary: Address;
  amount: bigint;
  claimedAmount: bigint;
  createdAt: bigint;
  unlockTime: bigint;
  closed: boolean;
  grantRef: string;
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

const CONTRACT_KEY = "arcVestingVault.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcVestingAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "grantId", type: "bytes32" },
      { internalType: "address", name: "beneficiary", type: "address" },
      { internalType: "uint64", name: "unlockTime", type: "uint64" },
      { internalType: "string", name: "grantRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createVesting",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "grantId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
      { internalType: "string", name: "claimURI", type: "string" },
    ],
    name: "claimVesting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "grantId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closeVesting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "grantId", type: "bytes32" }],
    name: "getVesting",
    outputs: [
      {
        components: [
          { internalType: "address", name: "funder", type: "address" },
          { internalType: "address", name: "beneficiary", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "claimedAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "unlockTime", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "grantRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "claimURI", type: "string" },
        ],
        internalType: "struct ArcVestingVault.VestingGrant",
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
let currentGrant: VestingSummary | null = null;

const el = {
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  beneficiary: document.querySelector<HTMLInputElement>("#beneficiary")!,
  beneficiaryAddress: document.querySelector<HTMLElement>("#beneficiaryAddress")!,
  claimTo: document.querySelector<HTMLInputElement>("#claimTo")!,
  claimURI: document.querySelector<HTMLInputElement>("#claimURI")!,
  claimVesting: document.querySelector<HTMLButtonElement>("#claimVesting")!,
  closeVesting: document.querySelector<HTMLButtonElement>("#closeVesting")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createVesting: document.querySelector<HTMLButtonElement>("#createVesting")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  funderAddress: document.querySelector<HTMLElement>("#funderAddress")!,
  grantId: document.querySelector<HTMLElement>("#grantId")!,
  label: document.querySelector<HTMLInputElement>("#label")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  valueStatus: document.querySelector<HTMLElement>("#valueStatus")!,
  vestingStatus: document.querySelector<HTMLElement>("#vestingStatus")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.amount.value = "0.005";
el.beneficiary.value = DEFAULT_ACCOUNT;
el.claimTo.value = DEFAULT_ACCOUNT;
el.claimURI.value = `local:arc-vesting-${today}:claimed`;
el.contractAddress.value = contractAddress;
el.label.value = `arc-vesting-${today}`;
el.metadataURI.value = `local:arc-vesting-${today}`;
el.refundTo.value = DEFAULT_ACCOUNT;

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

function grantId(): Hash {
  const label = el.label.value.trim();
  if (!label) throw new Error("Label is required.");
  const funder = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${funder}:${label}`));
}

function grantFromRaw(value: unknown): VestingSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<VestingSummary>;
    return {
      funder: object.funder ?? ZERO_ADDRESS,
      beneficiary: object.beneficiary ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      claimedAmount: object.claimedAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      unlockTime: object.unlockTime ?? 0n,
      closed: Boolean(object.closed),
      grantRef: object.grantRef ?? "",
      metadataURI: object.metadataURI ?? "",
      claimURI: object.claimURI ?? "",
    };
  }

  return {
    funder: value[0] as Address,
    beneficiary: value[1] as Address,
    amount: value[2] as bigint,
    claimedAmount: value[3] as bigint,
    createdAt: value[4] as bigint,
    unlockTime: value[5] as bigint,
    closed: Boolean(value[6]),
    grantRef: value[7] as string,
    metadataURI: value[8] as string,
    claimURI: value[9] as string,
  };
}

function updateGrantIdDisplay(): void {
  try {
    el.grantId.textContent = grantId();
  } catch {
    el.grantId.textContent = "-";
  }
}

function renderGrant(): void {
  updateGrantIdDisplay();

  if (!currentGrant || currentGrant.funder === ZERO_ADDRESS) {
    el.vestingStatus.textContent = "not created";
    el.valueStatus.textContent = "0 USDC";
    el.funderAddress.textContent = "-";
    el.beneficiaryAddress.textContent = "-";
    updateActions();
    return;
  }

  const available = currentGrant.amount - currentGrant.claimedAmount;
  el.vestingStatus.textContent = currentGrant.closed
    ? "closed"
    : currentGrant.claimedAmount > 0n
      ? "claimed"
      : "funded";
  el.valueStatus.textContent = `${formatEther(currentGrant.claimedAmount)} / ${formatEther(
    currentGrant.amount,
  )} USDC claimed, ${formatEther(available)} USDC locked`;
  el.funderAddress.innerHTML = `<a href="${addressUrl(currentGrant.funder)}" target="_blank" rel="noreferrer">${shortValue(
    currentGrant.funder,
  )}</a>`;
  el.beneficiaryAddress.innerHTML = `<a href="${addressUrl(
    currentGrant.beneficiary,
  )}" target="_blank" rel="noreferrer">${shortValue(currentGrant.beneficiary)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasGrant = Boolean(currentGrant && currentGrant.funder !== ZERO_ADDRESS);
  const open = hasGrant && !currentGrant?.closed;
  const claimable = open && currentGrant?.claimedAmount === 0n;

  el.claimVesting.disabled = !hasWallet || !hasContract || !claimable;
  el.closeVesting.disabled = !hasWallet || !hasContract || !open;
  el.createVesting.disabled = !hasWallet || !hasContract || hasGrant;
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

    el.beneficiary.value = account;
    el.claimTo.value = account;
    el.refundTo.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateGrantIdDisplay();
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
    setStatus("Deploying ArcVestingVault...");
    const artifact = (await fetch("/public/artifacts/ArcVestingVault.json").then((response) => response.json())) as Artifact;
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
    setStatus(`ArcVestingVault deployed at ${contractAddress}.`);
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
    currentGrant = null;
    renderGrant();
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

async function refreshVesting(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading vesting state...");
    const rawGrant = await publicClient.readContract({
      address: contractAddress,
      abi: arcVestingAbi,
      functionName: "getVesting",
      args: [grantId()],
    });
    currentGrant = grantFromRaw(rawGrant);
    renderGrant();
    setStatus("Vesting state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createVesting(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createVesting.disabled = true;
    const beneficiary = el.beneficiary.value.trim();
    const label = el.label.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(beneficiary)) throw new Error("Beneficiary must be a valid EVM address.");
    if (!label) throw new Error("Label is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    const amount = parseEther(el.amount.value.trim());

    setStatus("Creating vesting grant...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcVestingAbi,
      functionName: "createVesting",
      args: [grantId(), beneficiary as Address, 0n, label, metadataURI],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshVesting();
    setStatus("Vesting grant created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function claimVesting(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.claimVesting.disabled = true;
    const claimTo = el.claimTo.value.trim();
    const claimURI = el.claimURI.value.trim();
    if (!isAddress(claimTo)) throw new Error("Claim address must be a valid EVM address.");
    if (!claimURI) throw new Error("Claim URI is required.");

    setStatus("Claiming vesting grant...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcVestingAbi,
      functionName: "claimVesting",
      args: [grantId(), claimTo as Address, claimURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Claim submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshVesting();
    setStatus("Vesting claimed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeVesting(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeVesting.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing vesting grant...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcVestingAbi,
      functionName: "closeVesting",
      args: [grantId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshVesting();
    setStatus("Vesting closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.claimVesting.addEventListener("click", () => void claimVesting());
el.closeVesting.addEventListener("click", () => void closeVesting());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createVesting.addEventListener("click", () => void createVesting());
el.deployContract.addEventListener("click", () => void deployContract());
el.label.addEventListener("input", () => {
  currentGrant = null;
  renderGrant();
});
el.refresh.addEventListener("click", () => void refreshVesting());
el.saveContract.addEventListener("click", saveContract);

renderGrant();
