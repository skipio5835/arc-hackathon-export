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

type AccessSummary = {
  requester: Address;
  approver: Address;
  createdAt: bigint;
  approvedAt: bigint;
  revokedAt: bigint;
  approved: boolean;
  revoked: boolean;
  accessRef: string;
  role: string;
  metadataURI: string;
  approvalURI: string;
  revokeURI: string;
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

const CONTRACT_KEY = "ArcAccessRegistry.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcAccessAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "accessId", type: "bytes32" },
      { internalType: "address", name: "approver", type: "address" },
      { internalType: "string", name: "accessRef", type: "string" },
      { internalType: "string", name: "role", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "requestAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "accessId", type: "bytes32" },
      { internalType: "string", name: "approvalURI", type: "string" },
    ],
    name: "approveAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "accessId", type: "bytes32" },
      { internalType: "string", name: "revokeURI", type: "string" },
    ],
    name: "revokeAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "accessId", type: "bytes32" }],
    name: "getAccess",
    outputs: [
      {
        components: [
          { internalType: "address", name: "requester", type: "address" },
          { internalType: "address", name: "approver", type: "address" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "approvedAt", type: "uint64" },
          { internalType: "uint64", name: "revokedAt", type: "uint64" },
          { internalType: "bool", name: "approved", type: "bool" },
          { internalType: "bool", name: "revoked", type: "bool" },
          { internalType: "string", name: "accessRef", type: "string" },
          { internalType: "string", name: "role", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "approvalURI", type: "string" },
          { internalType: "string", name: "revokeURI", type: "string" },
        ],
        internalType: "struct ArcAccessRegistry.AccessRecord",
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
let currentAccess: AccessSummary | null = null;

const el = {
  accessId: document.querySelector<HTMLElement>("#accessId")!,
  accessRef: document.querySelector<HTMLInputElement>("#accessRef")!,
  accessStatus: document.querySelector<HTMLElement>("#accessStatus")!,
  approvalURI: document.querySelector<HTMLInputElement>("#approvalURI")!,
  approveAccess: document.querySelector<HTMLButtonElement>("#approveAccess")!,
  approver: document.querySelector<HTMLInputElement>("#approver")!,
  approverView: document.querySelector<HTMLElement>("#approverView")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  requestAccess: document.querySelector<HTMLButtonElement>("#requestAccess")!,
  requesterView: document.querySelector<HTMLElement>("#requesterView")!,
  revokeAccess: document.querySelector<HTMLButtonElement>("#revokeAccess")!,
  revokeURI: document.querySelector<HTMLInputElement>("#revokeURI")!,
  role: document.querySelector<HTMLInputElement>("#role")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  title: document.querySelector<HTMLInputElement>("#title")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.accessRef.value = `arc-access-${today}`;
el.approvalURI.value = `local:arc-access-${today}:approved`;
el.approver.value = DEFAULT_ACCOUNT;
el.contractAddress.value = contractAddress;
el.metadataURI.value = `local:arc-access-${today}`;
el.revokeURI.value = `local:arc-access-${today}:revoked`;
el.role.value = "operator";
el.title.value = `arc-access-${today}`;

const params = new URLSearchParams(window.location.search);

function applyParam(name: string, input: HTMLInputElement): void {
  const value = params.get(name)?.trim();
  if (value) input.value = value;
}

applyParam("accessRef", el.accessRef);
applyParam("approvalURI", el.approvalURI);
applyParam("approver", el.approver);
applyParam("contract", el.contractAddress);
applyParam("metadataURI", el.metadataURI);
applyParam("revokeURI", el.revokeURI);
applyParam("role", el.role);
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

function accessId(): Hash {
  const title = el.title.value.trim();
  if (!title) throw new Error("Title is required.");
  const owner = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${owner}:${title}`));
}

function accessFromRaw(value: unknown): AccessSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<AccessSummary>;
    return {
      requester: object.requester ?? ZERO_ADDRESS,
      approver: object.approver ?? ZERO_ADDRESS,
      createdAt: object.createdAt ?? 0n,
      approvedAt: object.approvedAt ?? 0n,
      revokedAt: object.revokedAt ?? 0n,
      approved: Boolean(object.approved),
      revoked: Boolean(object.revoked),
      accessRef: object.accessRef ?? "",
      role: object.role ?? "",
      metadataURI: object.metadataURI ?? "",
      approvalURI: object.approvalURI ?? "",
      revokeURI: object.revokeURI ?? "",
    };
  }

  return {
    requester: value[0] as Address,
    approver: value[1] as Address,
    createdAt: value[2] as bigint,
    approvedAt: value[3] as bigint,
    revokedAt: value[4] as bigint,
    approved: Boolean(value[5]),
    revoked: Boolean(value[6]),
    accessRef: value[7] as string,
    role: value[8] as string,
    metadataURI: value[9] as string,
    approvalURI: value[10] as string,
    revokeURI: value[11] as string,
  };
}

function updateAccessIdDisplay(): void {
  try {
    el.accessId.textContent = accessId();
  } catch {
    el.accessId.textContent = "-";
  }
}

function renderAccess(): void {
  updateAccessIdDisplay();

  if (!currentAccess || currentAccess.requester === ZERO_ADDRESS) {
    el.accessStatus.textContent = "not requested";
    el.requesterView.textContent = "-";
    el.approverView.textContent = "-";
    updateActions();
    return;
  }

  el.accessStatus.textContent = currentAccess.revoked ? "revoked" : currentAccess.approved ? "approved" : "requested";
  el.requesterView.innerHTML = `<a href="${addressUrl(
    currentAccess.requester,
  )}" target="_blank" rel="noreferrer">${shortValue(currentAccess.requester)}</a>`;
  el.approverView.innerHTML = `<a href="${addressUrl(
    currentAccess.approver,
  )}" target="_blank" rel="noreferrer">${shortValue(currentAccess.approver)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasRecord = Boolean(currentAccess && currentAccess.requester !== ZERO_ADDRESS);
  const canApprove = hasRecord && !currentAccess?.approved && !currentAccess?.revoked;
  const canRevoke = hasRecord && Boolean(currentAccess?.approved) && !currentAccess?.revoked;

  el.deployContract.disabled = !hasWallet;
  el.refresh.disabled = !hasContract;
  el.requestAccess.disabled = !hasWallet || !hasContract || hasRecord;
  el.approveAccess.disabled = !hasWallet || !hasContract || !canApprove;
  el.revokeAccess.disabled = !hasWallet || !hasContract || !canRevoke;
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

    el.approver.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateAccessIdDisplay();
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
    setStatus("Deploying ArcAccessRegistry...");
    const artifact = (await fetch("/public/artifacts/ArcAccessRegistry.json").then((response) =>
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
    setStatus(`ArcAccessRegistry deployed at ${contractAddress}.`);
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
    currentAccess = null;
    renderAccess();
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

async function refreshAccess(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading access state...");
    const rawAccess = await publicClient.readContract({
      address: contractAddress,
      abi: arcAccessAbi,
      functionName: "getAccess",
      args: [accessId()],
    });
    currentAccess = accessFromRaw(rawAccess);
    renderAccess();
    setStatus("Access state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function requestAccess(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.requestAccess.disabled = true;
    const approver = el.approver.value.trim();
    const accessRef = el.accessRef.value.trim();
    const role = el.role.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(approver)) throw new Error("Approver must be a valid EVM address.");
    if (!accessRef || !role || !metadataURI) throw new Error("Access ref, role, and metadata URI are required.");

    setStatus("Requesting access...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAccessAbi,
      functionName: "requestAccess",
      args: [accessId(), approver as Address, accessRef, role, metadataURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Request submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshAccess();
    setStatus("Access requested:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function approveAccess(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.approveAccess.disabled = true;
    const approvalURI = el.approvalURI.value.trim();
    if (!approvalURI) throw new Error("Approval URI is required.");

    setStatus("Approving access...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAccessAbi,
      functionName: "approveAccess",
      args: [accessId(), approvalURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Approval submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshAccess();
    setStatus("Access approved:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function revokeAccess(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.revokeAccess.disabled = true;
    const revokeURI = el.revokeURI.value.trim();
    if (!revokeURI) throw new Error("Revoke URI is required.");

    setStatus("Revoking access...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcAccessAbi,
      functionName: "revokeAccess",
      args: [accessId(), revokeURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Revoke submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshAccess();
    setStatus("Access revoked:", hash);
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

  await refreshAccess();
  if (!currentAccess || currentAccess.requester === ZERO_ADDRESS) {
    await requestAccess();
    await refreshAccess();
  }

  if (currentAccess && currentAccess.requester !== ZERO_ADDRESS && !currentAccess.approved && !currentAccess.revoked) {
    await approveAccess();
    await refreshAccess();
  }
  if (currentAccess && currentAccess.approved && !currentAccess.revoked) {
    await revokeAccess();
    await refreshAccess();
  }

  setStatus(`Auto flow complete for ${contractAddress}.`);
}

el.approveAccess.addEventListener("click", () => void approveAccess());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.deployContract.addEventListener("click", () => void deployContract());
el.refresh.addEventListener("click", () => void refreshAccess());
el.requestAccess.addEventListener("click", () => void requestAccess());
el.revokeAccess.addEventListener("click", () => void revokeAccess());
el.saveContract.addEventListener("click", saveContract);
el.title.addEventListener("input", () => {
  currentAccess = null;
  renderAccess();
});

renderAccess();
setTimeout(() => void runAutoFlow(), 500);
