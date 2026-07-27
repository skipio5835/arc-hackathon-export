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

type ExpenseSummary = {
  owner: Address;
  payee: Address;
  targetAmount: bigint;
  totalContributed: bigint;
  totalWithdrawn: bigint;
  createdAt: bigint;
  closed: boolean;
  title: string;
  metadataURI: string;
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

const CONTRACT_KEY = "arcExpense.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcExpenseAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "expenseId", type: "bytes32" },
      { internalType: "address", name: "payee", type: "address" },
      { internalType: "uint256", name: "targetAmount", type: "uint256" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createExpense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "expenseId", type: "bytes32" }],
    name: "contribute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "expenseId", type: "bytes32" },
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
      { internalType: "bytes32", name: "expenseId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closeExpense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "expenseId", type: "bytes32" }],
    name: "getExpense",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "payee", type: "address" },
          { internalType: "uint256", name: "targetAmount", type: "uint256" },
          { internalType: "uint256", name: "totalContributed", type: "uint256" },
          { internalType: "uint256", name: "totalWithdrawn", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
        ],
        internalType: "struct ArcExpenseSplitter.Expense",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "expenseId", type: "bytes32" },
      { internalType: "address", name: "contributor", type: "address" },
    ],
    name: "getContribution",
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
let currentExpense: ExpenseSummary | null = null;
let currentContribution = 0n;

const el = {
  closeExpense: document.querySelector<HTMLButtonElement>("#closeExpense")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  contribute: document.querySelector<HTMLButtonElement>("#contribute")!,
  contributionAmount: document.querySelector<HTMLInputElement>("#contributionAmount")!,
  createExpense: document.querySelector<HTMLButtonElement>("#createExpense")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  expenseId: document.querySelector<HTMLElement>("#expenseId")!,
  expenseStatus: document.querySelector<HTMLElement>("#expenseStatus")!,
  fundingStatus: document.querySelector<HTMLElement>("#fundingStatus")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  ownerAddress: document.querySelector<HTMLElement>("#ownerAddress")!,
  payee: document.querySelector<HTMLInputElement>("#payee")!,
  payeeAddress: document.querySelector<HTMLElement>("#payeeAddress")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  targetAmount: document.querySelector<HTMLInputElement>("#targetAmount")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
  withdraw: document.querySelector<HTMLButtonElement>("#withdraw")!,
  withdrawAmount: document.querySelector<HTMLInputElement>("#withdrawAmount")!,
  withdrawTo: document.querySelector<HTMLInputElement>("#withdrawTo")!,
};

const today = new Date().toISOString().slice(0, 10);
el.contractAddress.value = contractAddress;
el.contributionAmount.value = "0.005";
el.metadataURI.value = `local:arc-expense-${today}`;
el.payee.value = DEFAULT_ACCOUNT;
el.refundTo.value = DEFAULT_ACCOUNT;
el.targetAmount.value = "0.006";
el.title.value = `arc-expense-${today}`;
el.withdrawAmount.value = "0.003";
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

function expenseId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const owner = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${owner}:${title}`));
}

function expenseFromRaw(value: unknown): ExpenseSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<ExpenseSummary>;
    return {
      owner: object.owner ?? ZERO_ADDRESS,
      payee: object.payee ?? ZERO_ADDRESS,
      targetAmount: object.targetAmount ?? 0n,
      totalContributed: object.totalContributed ?? 0n,
      totalWithdrawn: object.totalWithdrawn ?? 0n,
      createdAt: object.createdAt ?? 0n,
      closed: Boolean(object.closed),
      title: object.title ?? "",
      metadataURI: object.metadataURI ?? "",
    };
  }

  return {
    owner: value[0] as Address,
    payee: value[1] as Address,
    targetAmount: value[2] as bigint,
    totalContributed: value[3] as bigint,
    totalWithdrawn: value[4] as bigint,
    createdAt: value[5] as bigint,
    closed: Boolean(value[6]),
    title: value[7] as string,
    metadataURI: value[8] as string,
  };
}

function updateExpenseIdDisplay(): void {
  try {
    el.expenseId.textContent = expenseId();
  } catch {
    el.expenseId.textContent = "-";
  }
}

function renderExpense(): void {
  updateExpenseIdDisplay();

  if (!currentExpense || currentExpense.owner === ZERO_ADDRESS) {
    el.expenseStatus.textContent = "not created";
    el.fundingStatus.textContent = "0 / 0 USDC";
    el.ownerAddress.textContent = "-";
    el.payeeAddress.textContent = "-";
    updateActions();
    return;
  }

  const available = currentExpense.totalContributed - currentExpense.totalWithdrawn;
  el.expenseStatus.textContent = currentExpense.closed ? "closed" : "active";
  el.fundingStatus.textContent = `${formatEther(currentExpense.totalContributed)} paid / ${formatEther(
    currentExpense.targetAmount,
  )} target, ${formatEther(available)} available`;
  el.ownerAddress.innerHTML = `<a href="${addressUrl(currentExpense.owner)}" target="_blank" rel="noreferrer">${shortValue(
    currentExpense.owner,
  )}</a>`;
  el.payeeAddress.innerHTML = `<a href="${addressUrl(currentExpense.payee)}" target="_blank" rel="noreferrer">${shortValue(
    currentExpense.payee,
  )}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasExpense = Boolean(currentExpense && currentExpense.owner !== ZERO_ADDRESS);
  const active = hasExpense && !currentExpense?.closed;
  const available = currentExpense ? currentExpense.totalContributed - currentExpense.totalWithdrawn : 0n;

  el.closeExpense.disabled = !hasWallet || !hasContract || !active;
  el.contribute.disabled = !hasWallet || !hasContract || !active;
  el.createExpense.disabled = !hasWallet || !hasContract || hasExpense;
  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.withdraw.disabled = !hasWallet || !hasContract || !active || available === 0n;
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
    el.payee.value = account;
    el.withdrawTo.value = account;
    el.refundTo.value = account;
    el.connect.textContent = "Connected";
    updateExpenseIdDisplay();
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
    setStatus("Deploying ArcExpenseSplitter...");
    const artifact = (await fetch("/public/artifacts/ArcExpenseSplitter.json").then((response) =>
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
    setStatus(`ArcExpenseSplitter deployed at ${contractAddress}.`);
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
    currentExpense = null;
    currentContribution = 0n;
    renderExpense();
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

async function refreshExpense(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading expense state...");
    const rawExpense = await publicClient.readContract({
      address: contractAddress,
      abi: arcExpenseAbi,
      functionName: "getExpense",
      args: [expenseId()],
    });
    currentExpense = expenseFromRaw(rawExpense);

    if (account) {
      currentContribution = await publicClient.readContract({
        address: contractAddress,
        abi: arcExpenseAbi,
        functionName: "getContribution",
        args: [expenseId(), account],
      });
    }

    renderExpense();
    setStatus(`Expense state refreshed. Your contribution: ${formatEther(currentContribution)} USDC.`);
  } catch (error) {
    const message = errorMessage(error);
    if (message.includes("ExpenseMissing")) {
      currentExpense = null;
      currentContribution = 0n;
      renderExpense();
      setStatus("Expense not created yet.");
      return;
    }
    setStatus(message);
  }
}

async function createExpense(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createExpense.disabled = true;
    const title = el.title.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    const payee = el.payee.value.trim();
    if (!title) throw new Error("Title is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    if (!isAddress(payee)) throw new Error("Payee must be a valid EVM address.");
    const targetAmount = parseEther(el.targetAmount.value.trim());

    setStatus("Creating expense...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcExpenseAbi,
      functionName: "createExpense",
      args: [expenseId(), payee as Address, targetAmount, title, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshExpense();
    setStatus("Expense created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function contribute(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.contribute.disabled = true;
    const amount = parseEther(el.contributionAmount.value.trim());

    setStatus("Contributing to expense...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcExpenseAbi,
      functionName: "contribute",
      args: [expenseId()],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Contribution submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshExpense();
    setStatus("Contribution recorded:", hash);
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
    const amount = parseEther(el.withdrawAmount.value.trim());
    const withdrawTo = el.withdrawTo.value.trim();
    if (!isAddress(withdrawTo)) throw new Error("Withdraw address must be a valid EVM address.");

    setStatus("Withdrawing expense funds...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcExpenseAbi,
      functionName: "withdraw",
      args: [expenseId(), amount, withdrawTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Withdraw submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshExpense();
    setStatus("Expense withdrawn:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeExpense(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeExpense.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing expense...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcExpenseAbi,
      functionName: "closeExpense",
      args: [expenseId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshExpense();
    setStatus("Expense closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.closeExpense.addEventListener("click", () => void closeExpense());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.contribute.addEventListener("click", () => void contribute());
el.createExpense.addEventListener("click", () => void createExpense());
el.deployContract.addEventListener("click", () => void deployContract());
el.refresh.addEventListener("click", () => void refreshExpense());
el.saveContract.addEventListener("click", saveContract);
el.title.addEventListener("input", () => {
  currentExpense = null;
  currentContribution = 0n;
  renderExpense();
});
el.withdraw.addEventListener("click", () => void withdraw());

renderExpense();
