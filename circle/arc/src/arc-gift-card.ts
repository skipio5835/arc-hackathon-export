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

type GiftCardSummary = {
  creator: Address;
  recipient: Address;
  amount: bigint;
  redeemedAmount: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  closed: boolean;
  cardRef: string;
  metadataURI: string;
  redeemURI: string;
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

const CONTRACT_KEY = "arcGiftCardVault.contractAddress";
const DEFAULT_ACCOUNT = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const arcGiftCardAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "cardId", type: "bytes32" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint64", name: "expiresAt", type: "uint64" },
      { internalType: "string", name: "cardRef", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "createGiftCard",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "cardId", type: "bytes32" },
      { internalType: "address payable", name: "to", type: "address" },
      { internalType: "string", name: "redeemURI", type: "string" },
    ],
    name: "redeemGiftCard",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "cardId", type: "bytes32" },
      { internalType: "address payable", name: "refundTo", type: "address" },
    ],
    name: "closeGiftCard",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "cardId", type: "bytes32" }],
    name: "getGiftCard",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "redeemedAmount", type: "uint256" },
          { internalType: "uint64", name: "createdAt", type: "uint64" },
          { internalType: "uint64", name: "expiresAt", type: "uint64" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "string", name: "cardRef", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "redeemURI", type: "string" },
        ],
        internalType: "struct ArcGiftCardVault.GiftCard",
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
let currentCard: GiftCardSummary | null = null;

const el = {
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  cardId: document.querySelector<HTMLElement>("#cardId")!,
  cardStatus: document.querySelector<HTMLElement>("#cardStatus")!,
  claimValue: document.querySelector<HTMLElement>("#claimValue")!,
  closeGiftCard: document.querySelector<HTMLButtonElement>("#closeGiftCard")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  contractAddress: document.querySelector<HTMLInputElement>("#contractAddress")!,
  createGiftCard: document.querySelector<HTMLButtonElement>("#createGiftCard")!,
  creatorAddress: document.querySelector<HTMLElement>("#creatorAddress")!,
  deployContract: document.querySelector<HTMLButtonElement>("#deployContract")!,
  label: document.querySelector<HTMLInputElement>("#label")!,
  metadataURI: document.querySelector<HTMLInputElement>("#metadataURI")!,
  nativeBalance: document.querySelector<HTMLElement>("#nativeBalance")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  recipientAddress: document.querySelector<HTMLElement>("#recipientAddress")!,
  redeemGiftCard: document.querySelector<HTMLButtonElement>("#redeemGiftCard")!,
  redeemTo: document.querySelector<HTMLInputElement>("#redeemTo")!,
  redeemURI: document.querySelector<HTMLInputElement>("#redeemURI")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  refundTo: document.querySelector<HTMLInputElement>("#refundTo")!,
  saveContract: document.querySelector<HTMLButtonElement>("#saveContract")!,
  statusLine: document.querySelector<HTMLElement>("#statusLine")!,
  walletAddress: document.querySelector<HTMLElement>("#walletAddress")!,
};

const today = new Date().toISOString().slice(0, 10);
el.amount.value = "0.005";
el.contractAddress.value = contractAddress;
el.label.value = `arc-gift-${today}`;
el.metadataURI.value = `local:arc-gift-${today}`;
el.recipient.value = DEFAULT_ACCOUNT;
el.redeemTo.value = DEFAULT_ACCOUNT;
el.redeemURI.value = `local:arc-gift-${today}:redeemed`;
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

function cardId(): Hash {
  const label = el.label.value.trim();
  if (!label) throw new Error("Label is required.");
  const creator = account?.toLowerCase() ?? DEFAULT_ACCOUNT.toLowerCase();
  return keccak256(toBytes(`${creator}:${label}`));
}

function cardFromRaw(value: unknown): GiftCardSummary {
  if (!Array.isArray(value)) {
    const object = value as Partial<GiftCardSummary>;
    return {
      creator: object.creator ?? ZERO_ADDRESS,
      recipient: object.recipient ?? ZERO_ADDRESS,
      amount: object.amount ?? 0n,
      redeemedAmount: object.redeemedAmount ?? 0n,
      createdAt: object.createdAt ?? 0n,
      expiresAt: object.expiresAt ?? 0n,
      closed: Boolean(object.closed),
      cardRef: object.cardRef ?? "",
      metadataURI: object.metadataURI ?? "",
      redeemURI: object.redeemURI ?? "",
    };
  }

  return {
    creator: value[0] as Address,
    recipient: value[1] as Address,
    amount: value[2] as bigint,
    redeemedAmount: value[3] as bigint,
    createdAt: value[4] as bigint,
    expiresAt: value[5] as bigint,
    closed: Boolean(value[6]),
    cardRef: value[7] as string,
    metadataURI: value[8] as string,
    redeemURI: value[9] as string,
  };
}

function updateCardIdDisplay(): void {
  try {
    el.cardId.textContent = cardId();
  } catch {
    el.cardId.textContent = "-";
  }
}

function renderCard(): void {
  updateCardIdDisplay();

  if (!currentCard || currentCard.creator === ZERO_ADDRESS) {
    el.cardStatus.textContent = "not created";
    el.claimValue.textContent = "0 USDC";
    el.creatorAddress.textContent = "-";
    el.recipientAddress.textContent = "-";
    updateActions();
    return;
  }

  const available = currentCard.amount - currentCard.redeemedAmount;
  el.cardStatus.textContent = currentCard.closed
    ? "closed"
    : currentCard.redeemedAmount > 0n
      ? "redeemed"
      : "funded";
  el.claimValue.textContent = `${formatEther(currentCard.redeemedAmount)} / ${formatEther(
    currentCard.amount,
  )} USDC redeemed, ${formatEther(available)} USDC remaining`;
  el.creatorAddress.innerHTML = `<a href="${addressUrl(currentCard.creator)}" target="_blank" rel="noreferrer">${shortValue(
    currentCard.creator,
  )}</a>`;
  el.recipientAddress.innerHTML = `<a href="${addressUrl(
    currentCard.recipient,
  )}" target="_blank" rel="noreferrer">${shortValue(currentCard.recipient)}</a>`;
  updateActions();
}

function updateActions(): void {
  const hasWallet = Boolean(walletClient && account);
  const hasContract = Boolean(contractAddress && isAddress(contractAddress));
  const hasCard = Boolean(currentCard && currentCard.creator !== ZERO_ADDRESS);
  const open = hasCard && !currentCard?.closed;
  const redeemable = open && currentCard?.redeemedAmount === 0n;

  el.closeGiftCard.disabled = !hasWallet || !hasContract || !open;
  el.createGiftCard.disabled = !hasWallet || !hasContract || hasCard;
  el.deployContract.disabled = !hasWallet;
  el.redeemGiftCard.disabled = !hasWallet || !hasContract || !redeemable;
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
    el.redeemTo.value = account;
    el.refundTo.value = account;
    el.walletAddress.textContent = account;
    el.connect.textContent = "Connected";
    updateCardIdDisplay();
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
    setStatus("Deploying ArcGiftCardVault...");
    const artifact = (await fetch("/public/artifacts/ArcGiftCardVault.json").then((response) =>
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
    setStatus(`ArcGiftCardVault deployed at ${contractAddress}.`);
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
    currentCard = null;
    renderCard();
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

async function refreshGiftCard(): Promise<void> {
  if (!contractAddress || !isAddress(contractAddress)) {
    setStatus("Deploy or paste a valid contract address first.");
    return;
  }

  try {
    setStatus("Reading gift card state...");
    const rawCard = await publicClient.readContract({
      address: contractAddress,
      abi: arcGiftCardAbi,
      functionName: "getGiftCard",
      args: [cardId()],
    });
    currentCard = cardFromRaw(rawCard);
    renderCard();
    setStatus("Gift card state refreshed.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function createGiftCard(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.createGiftCard.disabled = true;
    const recipient = el.recipient.value.trim();
    const label = el.label.value.trim();
    const metadataURI = el.metadataURI.value.trim();
    if (!isAddress(recipient)) throw new Error("Recipient must be a valid EVM address.");
    if (!label) throw new Error("Label is required.");
    if (!metadataURI) throw new Error("Metadata URI is required.");
    const amount = parseEther(el.amount.value.trim());

    setStatus("Creating gift card...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcGiftCardAbi,
      functionName: "createGiftCard",
      args: [cardId(), recipient as Address, 0n, label, metadataURI],
      account,
      chain: arcTestnet,
      value: amount,
    });
    setStatus("Create submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshGiftCard();
    setStatus("Gift card created:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function redeemGiftCard(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.redeemGiftCard.disabled = true;
    const redeemTo = el.redeemTo.value.trim();
    const redeemURI = el.redeemURI.value.trim();
    if (!isAddress(redeemTo)) throw new Error("Redeem address must be a valid EVM address.");
    if (!redeemURI) throw new Error("Redeem URI is required.");

    setStatus("Redeeming gift card...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcGiftCardAbi,
      functionName: "redeemGiftCard",
      args: [cardId(), redeemTo as Address, redeemURI],
      account,
      chain: arcTestnet,
    });
    setStatus("Redeem submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshGiftCard();
    setStatus("Gift card redeemed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

async function closeGiftCard(): Promise<void> {
  if (!walletClient || !account) await connect();
  if (!walletClient || !account || !contractAddress) return;

  try {
    el.closeGiftCard.disabled = true;
    const refundTo = el.refundTo.value.trim();
    if (!isAddress(refundTo)) throw new Error("Refund address must be a valid EVM address.");

    setStatus("Closing gift card...");
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: arcGiftCardAbi,
      functionName: "closeGiftCard",
      args: [cardId(), refundTo as Address],
      account,
      chain: arcTestnet,
    });
    setStatus("Close submitted:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalance();
    await refreshGiftCard();
    setStatus("Gift card closed:", hash);
  } catch (error) {
    setStatus(errorMessage(error));
  } finally {
    updateActions();
  }
}

el.closeGiftCard.addEventListener("click", () => void closeGiftCard());
el.connect.addEventListener("click", () => void connect());
el.contractAddress.addEventListener("input", updateActions);
el.createGiftCard.addEventListener("click", () => void createGiftCard());
el.deployContract.addEventListener("click", () => void deployContract());
el.label.addEventListener("input", () => {
  currentCard = null;
  renderCard();
});
el.redeemGiftCard.addEventListener("click", () => void redeemGiftCard());
el.refresh.addEventListener("click", () => void refreshGiftCard());
el.saveContract.addEventListener("click", saveContract);

renderCard();
