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

declare global { interface Window { ethereum?: EIP1193Provider; } }

type Artifact = { abi: readonly unknown[]; bytecode: Hash };
type Link = {
  merchant: Address; payer: Address; amount: bigint; createdAt: bigint; expiresAt: bigint;
  paidAt: bigint; metadataURI: string; status: number;
};

const arc = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
} as const;
const chainId = "0x4cef52";
const zero = "0x0000000000000000000000000000000000000000" as Address;
const key = "ArcPayLink.contractAddress";
const publicClient = createPublicClient({ chain: arc, transport: http() });
let wallet: ReturnType<typeof createWalletClient> | null = null;
let account: Address | null = null;
let provider: EIP1193Provider | null = null;
let artifact: Artifact | null = null;
let contract = (localStorage.getItem(key) ?? "") as Address | "";
let currentId: Hash | null = null;

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  wallet: document.querySelector<HTMLElement>("#wallet")!,
  balance: document.querySelector<HTMLElement>("#balance")!,
  contract: document.querySelector<HTMLInputElement>("#contract")!,
  save: document.querySelector<HTMLButtonElement>("#save")!,
  deploy: document.querySelector<HTMLButtonElement>("#deploy")!,
  linkId: document.querySelector<HTMLInputElement>("#linkId")!,
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  expiry: document.querySelector<HTMLInputElement>("#expiry")!,
  metadata: document.querySelector<HTMLInputElement>("#metadata")!,
  create: document.querySelector<HTMLButtonElement>("#create")!,
  load: document.querySelector<HTMLButtonElement>("#load")!,
  pay: document.querySelector<HTMLButtonElement>("#pay")!,
  cancel: document.querySelector<HTMLButtonElement>("#cancel")!,
  status: document.querySelector<HTMLElement>("#status")!,
  result: document.querySelector<HTMLElement>("#result")!,
};

function localDateTimeValue(date: Date): string { const pad = (value: number) => String(value).padStart(2, "0"); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
el.contract.value = contract;
const today = new Date().toISOString().slice(0, 10);
el.linkId.value = `arc-pay-link-${today}`;
el.amount.value = "0.01";
el.expiry.value = localDateTimeValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
el.metadata.value = `local:arc-pay-link:${today}`;

function setStatus(message: string, hash?: Hash): void {
  el.status.innerHTML = hash
    ? `${message} <a href="https://testnet.arcscan.app/tx/${hash}" target="_blank" rel="noreferrer">ArcScan</a>`
    : message;
}

function requireContract(): Address {
  if (!isAddress(contract)) throw new Error("Set a valid ArcPayLink contract address first.");
  return contract;
}

async function loadArtifact(): Promise<Artifact> {
  artifact ??= (await fetch("./artifacts/ArcPayLink.json").then((response) => response.json())) as Artifact;
  return artifact;
}

async function connect(): Promise<void> {
  const injected = window.ethereum;
  if (!injected) throw new Error("MetaMask was not found.");
  provider = injected;
  await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  account = accounts[0] as Address;
  wallet = createWalletClient({ account, chain: arc, transport: custom(provider) });
  el.wallet.textContent = account;
  el.balance.textContent = `${formatEther(await publicClient.getBalance({ address: account }))} USDC`;
  setStatus("Wallet connected.");
}

async function ensureWallet(): Promise<void> {
  if (!wallet || !account) await connect();
  if (!wallet || !account) throw new Error("Wallet connection failed.");
}

function idHash(): Hash {
  const value = el.linkId.value.trim();
  if (!value) throw new Error("Link ID is required.");
  return keccak256(toBytes(value));
}

async function createLink(): Promise<void> {
  await ensureWallet();
  const compiled = await loadArtifact();
  const address = requireContract();
  const expiresAt = BigInt(Math.floor(new Date(el.expiry.value).getTime() / 1000));
  if (!Number.isFinite(Number(expiresAt)) || expiresAt <= BigInt(Math.floor(Date.now() / 1000))) throw new Error("Expiry must be in the future.");
  setStatus("Waiting for MetaMask: create payment link...");
  const hash = await wallet!.writeContract({
    address, abi: compiled.abi as any, functionName: "createLink",
    args: [idHash(), parseEther(el.amount.value), expiresAt, el.metadata.value.trim()],
  } as any);
  await publicClient.waitForTransactionReceipt({ hash });
  currentId = idHash();
  setStatus("Payment link created.", hash);
  await loadLink();
}

async function loadLink(): Promise<void> {
  const compiled = await loadArtifact();
  const address = requireContract();
  const id = idHash();
  const link = await publicClient.readContract({ address, abi: compiled.abi as any, functionName: "getLink", args: [id] } as any) as Link;
  currentId = id;
  const statuses = ["unknown", "open", "paid", "cancelled"];
  el.result.textContent = JSON.stringify({
    linkId: id,
    merchant: link.merchant,
    payer: link.payer,
    amount: `${formatEther(link.amount)} USDC`,
    expiresAt: new Date(Number(link.expiresAt) * 1000).toISOString(),
    status: statuses[link.status] ?? "unknown",
    metadataURI: link.metadataURI,
  }, null, 2);
  el.pay.disabled = link.status !== 1 || Number(link.expiresAt) <= Math.floor(Date.now() / 1000);
  el.cancel.disabled = link.status !== 1;
  setStatus("Payment link loaded.");
}

async function payLink(): Promise<void> {
  await ensureWallet();
  const compiled = await loadArtifact();
  const address = requireContract();
  if (!currentId) await loadLink();
  setStatus("Waiting for MetaMask: pay payment link...");
  const hash = await wallet!.writeContract({
    address, abi: compiled.abi as any, functionName: "payLink", args: [currentId!], value: parseEther(el.amount.value),
  } as any);
  await publicClient.waitForTransactionReceipt({ hash });
  setStatus("Payment completed and settled to merchant.", hash);
  await loadLink();
}

async function cancelLink(): Promise<void> {
  await ensureWallet();
  const compiled = await loadArtifact();
  const hash = await wallet!.writeContract({ address: requireContract(), abi: compiled.abi as any, functionName: "cancelLink", args: [currentId ?? idHash()] } as any);
  await publicClient.waitForTransactionReceipt({ hash });
  setStatus("Payment link cancelled.", hash);
  await loadLink();
}

async function deploy(): Promise<void> {
  await ensureWallet();
  const compiled = await loadArtifact();
  setStatus("Waiting for MetaMask: deploy ArcPayLink...");
  const hash = await wallet!.deployContract({ abi: compiled.abi as any, bytecode: compiled.bytecode, args: [] } as any);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error("Deployment receipt did not include a contract address.");
  contract = receipt.contractAddress;
  el.contract.value = contract;
  localStorage.setItem(key, contract);
  setStatus("ArcPayLink deployed.", hash);
}

el.connect.addEventListener("click", () => void connect().catch((error) => setStatus(error instanceof Error ? error.message : "Connection failed.")));
el.save.addEventListener("click", () => { contract = el.contract.value.trim() as Address; localStorage.setItem(key, contract); setStatus("Contract address saved."); });
el.deploy.addEventListener("click", () => void deploy().catch((error) => setStatus(error instanceof Error ? error.message : "Deployment failed.")));
el.create.addEventListener("click", () => void createLink().catch((error) => setStatus(error instanceof Error ? error.message : "Create failed.")));
el.load.addEventListener("click", () => void loadLink().catch((error) => setStatus(error instanceof Error ? error.message : "Load failed.")));
el.pay.addEventListener("click", () => void payLink().catch((error) => setStatus(error instanceof Error ? error.message : "Payment failed.")));
el.cancel.addEventListener("click", () => void cancelLink().catch((error) => setStatus(error instanceof Error ? error.message : "Cancel failed.")));

const queryContract = new URLSearchParams(window.location.search).get("contract");
const queryId = new URLSearchParams(window.location.search).get("id");
if (queryContract && isAddress(queryContract)) { contract = queryContract; el.contract.value = contract; localStorage.setItem(key, contract); }
if (queryId) el.linkId.value = queryId;
el.pay.disabled = true;
el.cancel.disabled = true;
