import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  http,
  isAddress,
  parseEther,
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

type PassSummary = {
  tokenId: bigint;
  active: boolean;
  expiresAt: bigint;
  handle: string;
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

const CIRCLE_WALLET = "0x78131700be4a8f2d16eeb0cba3498d2e717f2cd3" as Address;
const CONTRACT_KEY = "arcMembership.contractAddress";
const DAY_SECONDS = 86_400;

const arcMembershipAbi = [
  {
    inputs: [{ internalType: "string", name: "handle", type: "string" }],
    name: "mintPass",
    outputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint64", name: "extraDays", type: "uint64" },
    ],
    name: "renewPass",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "member", type: "address" }],
    name: "passOf",
    outputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
      { internalType: "uint64", name: "expiresAt", type: "uint64" },
      { internalType: "string", name: "handle", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mintPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renewalPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "defaultDurationSeconds",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});

let walletClient: ReturnType<typeof createWalletClient> | null = null;
let selectedProvider: EIP1193Provider | null = null;
let account: Address | null = null;
let contractAddress = (localStorage.getItem(CONTRACT_KEY) ?? "") as Address | "";
let currentPass: PassSummary | null = null;

const el = {
  approvePass: document.querySelector<HTMLButtonElement>("#approvePass")!,
  approvedAddress: document.querySelector<HTMLElement>("#approvedAddress")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  durationDays: document.querySelector<HTMLInputElement>("#durationDays")!,
  expiresAt: document.querySelector<HTMLElement>("#expiresAt")!,
  handle: document.querySelector<HTMLInputElement>("#handle")!,
  mintPass: document.querySelector<HTMLButtonElement>("#mintPass")!,
  mintPrice: document.querySelector<HTMLInputElement>("#mintPrice")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  ownerAddress: document.querySelector<HTMLElement>("#ownerAddress")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  renewalDays: document.querySelector<HTMLInputElement>("#renewalDays")!,
  renewalPrice: document.querySelector<HTMLInputElement>("#renewalPrice")!,
  renewPass: document.querySelector<HTMLButtonElement>("#renewPass")!,
  revokeApproval: document.querySelector<HTMLButtonElement>("#revokeApproval")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  spender: document.querySelector<HTMLInputElement>("#spender")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  tokenHandle: document.querySelector<HTMLElement>("#tokenHandle")!,
  tokenId: document.querySelector<HTMLInputElement>("#tokenId")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

el.contractAddress.value = contractAddress;
el.durationDays.value = "30";
el.handle.value = `arc-member-${new Date().toISOString().slice(0, 10)}`;
el.mintPrice.value = "0.003";
el.renewalDays.value = "14";
el.renewalPrice.value = "0.001";
el.spender.value = CIRCLE_WALLET;

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

function errorMessage(error: unknown): string {
  console.error(error);
  return error instanceof Error ? error.message : "Unknown error.";
}

function passFromRaw(value: unknown): PassSummary {
  if (!Array.isArray(value)) {
    const object = value as { tokenId?: bigint; active?: boolean; expiresAt?: bigint; handle?: string };
    return {
      tokenId: object.tokenId ?? 0n,
      active: Boolean(object.active),
      expiresAt: object.expiresAt ?? 0n,
      handle: object.handle ?? "",
    };
  }

  return {
    tokenId: value[0] as bigint,
    active: Boolean(value[1]),
    expiresAt: value[2] as bigint,
    handle: value[3] as string,
  };
}

function formattedDate(timestamp: bigint): string {
  if (timestamp === 0n) return "-";
  return new Date(Number(timestamp) * 1000).toISOString();
}

function validTokenId(): bigint | null {
  const value = el.tokenId.value.trim();
  if (!/^\d+$/.test(value)) return null;
  const tokenId = BigInt(value);
  return tokenId > 0n ? tokenId : null;
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const tokenId = validTokenId();

  el.deployContract.disabled = !hasWallet;
  el.mintPass.disabled = !hasWallet || !hasContract;
  el.renewPass.disabled = !hasWallet || !hasContract || tokenId === null;
  el.approvePass.disabled = !hasWallet || !hasContract || tokenId === null;
  el.revokeApproval.disabled = !hasWallet || !hasContract || tokenId === null;
  el.refresh.disabled = !hasContract;
}

function renderPass(): void {
  if (!currentPass || currentPass.tokenId === 0n) {
    el.tokenHandle.textContent = "-";
    el.expiresAt.textContent = "-";
    el.ownerAddress.textContent = "-";
    el.approvedAddress.textContent = "-";
    updateActions();
    return;
  }

  el.tokenId.value = currentPass.tokenId.toString();
  el.tokenHandle.textContent = `${currentPass.handle} (${currentPass.active ? "active" : "expired"})`;
  el.expiresAt.textContent = formattedDate(currentPass.expiresAt);
  updateActions();
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
    el.connect.textContent = "Connected";
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
    setStatus("Deploying ArcMembershipPass...");
    const artifact = (await fetch("/public/artifacts/ArcMembershipPass.json").then((response) => response.json())) as Artifact;
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: [
        account,
        parseEther(el.mintPrice.value.trim()),
        parseEther(el.renewalPrice.value.trim()),
        BigInt(Math.round(Number(el.durationDays.value.trim()) * DAY_SECONDS)),
      ],
      account,
      chain: arcTestnet,
    });
    setStatus("Deploy submitted:", hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) throw new Error("Deployment receipt did not include a contract address.");

    contractAddress = receipt.contractAddress;
    el.contractAddress.value = contractAddress;
    localStorage.setItem(CONTRACT_KEY, contractAddress);
    await refreshContractState();
    setStatus(`ArcMembershipPass deployed at ${contractAddress}.`);
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
    updateActions();
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

async function refreshContractState(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading membership state...");
    const [mintPrice, renewalPrice, durationSeconds] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi: arcMembershipAbi,
        functionName: "mintPrice",
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: arcMembershipAbi,
        functionName: "renewalPrice",
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: arcMembershipAbi,
        functionName: "defaultDurationSeconds",
      }),
    ]);

    el.mintPrice.value = formatEther(mintPrice);
    el.renewalPrice.value = formatEther(renewalPrice);
    el.durationDays.value = String(Number(durationSeconds) / DAY_SECONDS);

    if (account) {
      const rawPass = await publicClient.readContract({
        address: contractAddress,
        abi: arcMembershipAbi,
        functionName: "passOf",
        args: [account],
      });
      currentPass = passFromRaw(rawPass);

      if (currentPass.tokenId > 0n) {
        const [owner, approved] = await Promise.all([
          publicClient.readContract({
            address: contractAddress,
            abi: arcMembershipAbi,
            functionName: "ownerOf",
            args: [currentPass.tokenId],
          }),
          publicClient.readContract({
            address: contractAddress,
            abi: arcMembershipAbi,
            functionName: "getApproved",
            args: [currentPass.tokenId],
          }),
        ]);
        el.ownerAddress.innerHTML = `<a href="${addressUrl(owner)}" target="_blank" rel="noreferrer">${shortValue(owner)}</a>`;
        el.approvedAddress.textContent = approved === ZERO_ADDRESS ? "-" : approved;
      }
    }

    renderPass();
    setStatus("Membership state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function mintPass(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.mintPass.disabled = true;
    const handle = el.handle.value.trim();
    if (!handle) throw new Error("Handle is required.");

    setStatus("Minting membership pass...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMembershipAbi,
      functionName: "mintPass",
      args: [handle],
      account,
      chain: arcTestnet,
      value: parseEther(el.mintPrice.value.trim()),
    });
    setStatus("Mint submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshContractState();
    setStatus("Membership minted:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function renewPass(): Promise<void> {
  if (!walletClient || !account) await connect();
  const tokenId = validTokenId();
  if (!walletClient || !account || !contractAddress || tokenId === null) return;

  try {
    el.renewPass.disabled = true;
    const extraDays = Number(el.renewalDays.value.trim());
    if (!Number.isInteger(extraDays) || extraDays <= 0) throw new Error("Renewal days must be a positive integer.");

    setStatus("Renewing membership pass...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMembershipAbi,
      functionName: "renewPass",
      args: [tokenId, BigInt(extraDays)],
      account,
      chain: arcTestnet,
      value: parseEther(el.renewalPrice.value.trim()),
    });
    setStatus("Renew submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshContractState();
    setStatus("Membership renewed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function approvePass(): Promise<void> {
  if (!walletClient || !account) await connect();
  const tokenId = validTokenId();
  if (!walletClient || !account || !contractAddress || tokenId === null) return;

  try {
    el.approvePass.disabled = true;
    const spender = el.spender.value.trim();
    if (!isAddress(spender)) throw new Error("Spender must be a valid EVM address.");

    setStatus("Approving NFT spender...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMembershipAbi,
      functionName: "approve",
      args: [spender, tokenId],
      account,
      chain: arcTestnet,
    });
    setStatus("Approve submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshContractState();
    setStatus("NFT approval confirmed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function revokeApproval(): Promise<void> {
  if (!walletClient || !account) await connect();
  const tokenId = validTokenId();
  if (!walletClient || !account || !contractAddress || tokenId === null) return;

  try {
    el.revokeApproval.disabled = true;
    setStatus("Revoking NFT approval...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcMembershipAbi,
      functionName: "approve",
      args: [ZERO_ADDRESS, tokenId],
      account,
      chain: arcTestnet,
    });
    setStatus("Revoke submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshContractState();
    setStatus("NFT approval revoked:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.approvePass.addEventListener("click", () => void approvePass());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.deployContract.addEventListener("click", () => void deployContract());
el.mintPass.addEventListener("click", () => void mintPass());
el.refresh.addEventListener("click", () => void refreshContractState());
el.renewPass.addEventListener("click", () => void renewPass());
el.revokeApproval.addEventListener("click", () => void revokeApproval());
el.saveContract.addEventListener("click", saveContract);
el.tokenId.addEventListener("input", updateActions);

renderPass();
