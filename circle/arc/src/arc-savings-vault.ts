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

type VaultSummary = {
  owner: Address;
  balance: bigint;
  goalAmount: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  closed: boolean;
  label: string;
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

const CONTRACT_KEY = "arcSavingsVault.contractAddress";
const DEFAULT_RECIPIENT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcSavingsVaultAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "vaultId", type: "bytes32" },
      { internalType: "uint256", name: "goalAmount", type: "uint256" },
      { internalType: "string", name: "label", type: "string" },
    ],
    name: "createVault",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "vaultId", type: "bytes32" }],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "vaultId", type: "bytes32" },
      { internalType: "uint256", name: "goalAmount", type: "uint256" },
      { internalType: "string", name: "label", type: "string" },
    ],
    name: "setGoal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "vaultId", type: "bytes32" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address payable", name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "vaultId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
    ],
    name: "closeVault",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "vaultId", type: "bytes32" }],
    name: "getVault",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "balance", type: "uint256" },
          { internalType: "uint256", name: "goalAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "updatedAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "label", type: "string" },
        ],
        internalType: "struct ArcSavingsVault.Vault",
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
let currentVault: VaultSummary | null = null;

const el = {
  closeVault: document.querySelector<HTMLButtonElement>("#closeVault")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createVault: document.querySelector<HTMLButtonElement>("#createVault")!,
  deposit: document.querySelector<HTMLButtonElement>("#deposit")!,
  depositAmount: document.querySelector<HTMLInputElement>("#depositAmount")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  goalAmount: document.querySelector<HTMLInputElement>("#goalAmount")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  ownerAddress: document.querySelector<HTMLElement>("#ownerAddress")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  setGoal: document.querySelector<HTMLButtonElement>("#setGoal")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  vaultBalance: document.querySelector<HTMLElement>("#vaultBalance")!,
  vaultId: document.querySelector<HTMLElement>("#vaultId")!,
  vaultLabel: document.querySelector<HTMLInputElement>("#vaultLabel")!,
  vaultStatus: document.querySelector<HTMLElement>("#vaultStatus")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  withdraw: document.querySelector<HTMLButtonElement>("#withdraw")!,
  withdrawAmount: document.querySelector<HTMLInputElement>("#withdrawAmount")!,
};

el.contractAddress.value = contractAddress;
el.depositAmount.value = "0.006";
el.goalAmount.value = "0.05";
el.recipient.value = DEFAULT_RECIPIENT;
el.vaultLabel.value = `arc-vault-${new Date().toISOString().slice(0, 10)}`;
el.withdrawAmount.value = "0.002";

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

function vaultId(): Hash {
  const label = el.vaultLabel.value.trim();
  if (!label) throw new Error("Vault label is required.");
  const owner = account?.toLowerCase() ?? DEFAULT_RECIPIENT.toLowerCase();
  return keccak256(toBytes(`${owner}:${label}`));
}

function vaultFromRaw(value: unknown): VaultSummary {
  if (!Array.isArray(value)) {
    const object = value as {
      owner?: Address;
      balance?: bigint;
      goalAmount?: bigint;
      createdAt?: bigint;
      updatedAt?: bigint;
      closed?: boolean;
      label?: string;
    };
    return {
      owner: object.owner ?? ZERO_ADDRESS,
      balance: object.balance ?? 0n,
      goalAmount: object.goalAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      updatedAt: object.updatedAt ?? 0n,
      closed: Boolean(object.closed),
      label: object.label ?? "",
    };
  }

  return {
    owner: value[0] as Address,
    balance: value[1] as bigint,
    goalAmount: value[2] as bigint,
    createdAt: value[3] as bigint,
    updatedAt: value[4] as bigint,
    closed: Boolean(value[5]),
    label: value[6] as string,
  };
}

function updateVaultIdDisplay(): void {
  try {
    el.vaultId.textContent = vaultId();
  } catch {
    el.vaultId.textContent = "-";
  }
}

function renderVault(): void {
  updateVaultIdDisplay();

  if (!currentVault || currentVault.owner === ZERO_ADDRESS) {
    el.vaultBalance.textContent = "0 USDC";
    el.vaultStatus.textContent = "not created";
    el.ownerAddress.textContent = "-";
    updateActions();
    return;
  }

  const reached = currentVault.goalAmount > 0n && currentVault.balance >= currentVault.goalAmount;
  el.vaultBalance.textContent = `${formatEther(currentVault.balance)} / ${formatEther(currentVault.goalAmount)} USDC`;
  el.vaultStatus.textContent = currentVault.closed ? "closed" : reached ? "goal reached" : "active";
  el.ownerAddress.innerHTML = `<a href="${addressUrl(currentVault.owner)}" target="_blank" rel="noreferrer">${shortValue(
    currentVault.owner,
  )}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasVault = Boolean(currentVault && currentVault.owner !== ZERO_ADDRESS && !currentVault.closed);

  el.closeVault.disabled = !hasWallet || !hasContract || !hasVault;
  el.createVault.disabled = !hasWallet || !hasContract || hasVault;
  el.deposit.disabled = !hasWallet || !hasContract || !hasVault;
  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.setGoal.disabled = !hasWallet || !hasContract || !hasVault;
  el.withdraw.disabled = !hasWallet || !hasContract || !hasVault;
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
    el.connect.textContent = "Connected";
    updateVaultIdDisplay();
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
    setStatus("Deploying ArcSavingsVault...");
    const artifact = (await fetch("/public/artifacts/ArcSavingsVault.json").then((response) => response.json())) as Artifact;
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
    setStatus(`ArcSavingsVault deployed at ${contractAddress}.`);
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
    currentVault = null;
    renderVault();
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

async function refreshVault(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading vault state...");
    const rawVault = await publicClient.readContract({
      address: contractAddress,
      abi: arcSavingsVaultAbi,
      functionName: "getVault",
      args: [vaultId()],
    });
    currentVault = vaultFromRaw(rawVault);
    renderVault();
    setStatus("Vault state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createVault(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createVault.disabled = true;
    const label = el.vaultLabel.value.trim();
    if (!label) throw new Error("Vault label is required.");

    setStatus("Creating savings vault...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSavingsVaultAbi,
      functionName: "createVault",
      args: [vaultId(), parseEther(el.goalAmount.value.trim()), label],
      account,
      chain: arcTestnet,
      value: parseEther(el.depositAmount.value.trim()),
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshVault();
    setStatus("Vault created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function deposit(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.deposit.disabled = true;
    setStatus("Depositing native USDC...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSavingsVaultAbi,
      functionName: "deposit",
      args: [vaultId()],
      account,
      chain: arcTestnet,
      value: parseEther(el.depositAmount.value.trim()),
    });
    setStatus("Deposit submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshVault();
    setStatus("Deposit confirmed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function setGoal(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.setGoal.disabled = true;
    const label = el.vaultLabel.value.trim();
    if (!label) throw new Error("Vault label is required.");

    setStatus("Updating vault goal...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSavingsVaultAbi,
      functionName: "setGoal",
      args: [vaultId(), parseEther(el.goalAmount.value.trim()), label],
      account,
      chain: arcTestnet,
    });
    setStatus("Goal update submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshVault();
    setStatus("Goal updated:", hash);
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
    const recipient = el.recipient.value.trim();
    if (!isAddress(recipient)) throw new Error("Recipient must be a valid EVM address.");

    setStatus("Withdrawing native USDC...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSavingsVaultAbi,
      functionName: "withdraw",
      args: [vaultId(), parseEther(el.withdrawAmount.value.trim()), recipient],
      account,
      chain: arcTestnet,
    });
    setStatus("Withdraw submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshVault();
    setStatus("Withdraw confirmed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeVault(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeVault.disabled = true;
    const recipient = el.recipient.value.trim();
    if (!isAddress(recipient)) throw new Error("Recipient must be a valid EVM address.");

    setStatus("Closing vault...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcSavingsVaultAbi,
      functionName: "closeVault",
      args: [vaultId(), recipient],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshVault();
    setStatus("Vault closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.closeVault.addEventListener("click", () => void closeVault());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createVault.addEventListener("click", () => void createVault());
el.deposit.addEventListener("click", () => void deposit());
el.deployContract.addEventListener("click", () => void deployContract());
el.goalAmount.addEventListener("input", updateActions);
el.refresh.addEventListener("click", () => void refreshVault());
el.saveContract.addEventListener("click", saveContract);
el.setGoal.addEventListener("click", () => void setGoal());
el.vaultLabel.addEventListener("input", () => {
  currentVault = null;
  renderVault();
});
el.withdraw.addEventListener("click", () => void withdraw());

renderVault();
