import { createPublicClient, createWalletClient, custom, formatEther, http, isAddress, parseEther } from "viem";
import type { Address, EIP1193Provider, Hash } from "viem";

declare global { interface Window { ethereum?: EIP1193Provider; } }
type Artifact = { abi: readonly unknown[]; bytecode: Hash };
const arc = {
  id: 5042002, name: "Arc Testnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
} as const;
const publicClient = createPublicClient({ chain: arc, transport: http() });
const chainId = "0x4cef52";
const storageKey = "ArcRevenueSplitter.contractAddress";
let provider: EIP1193Provider | null = null;
let wallet: ReturnType<typeof createWalletClient> | null = null;
let account: Address | null = null;
let artifact: Artifact | null = null;
let contract = (localStorage.getItem(storageKey) ?? "") as Address | "";

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!, wallet: document.querySelector<HTMLElement>("#wallet")!,
  balance: document.querySelector<HTMLElement>("#balance")!, contract: document.querySelector<HTMLInputElement>("#contract")!,
  save: document.querySelector<HTMLButtonElement>("#save")!, deploy: document.querySelector<HTMLButtonElement>("#deploy")!,
  recipientA: document.querySelector<HTMLInputElement>("#recipientA")!, recipientB: document.querySelector<HTMLInputElement>("#recipientB")!,
  amountA: document.querySelector<HTMLInputElement>("#amountA")!, amountB: document.querySelector<HTMLInputElement>("#amountB")!,
  metadata: document.querySelector<HTMLInputElement>("#metadata")!, split: document.querySelector<HTMLButtonElement>("#split")!,
  status: document.querySelector<HTMLElement>("#status")!, result: document.querySelector<HTMLElement>("#result")!,
};

el.contract.value = contract;
el.amountA.value = "0.006";
el.amountB.value = "0.004";
el.metadata.value = `local:arc-revenue-split:${new Date().toISOString().slice(0, 10)}`;

function setStatus(message: string, hash?: Hash): void {
  el.status.innerHTML = hash ? `${message} <a href="https://testnet.arcscan.app/tx/${hash}" target="_blank" rel="noreferrer">ArcScan</a>` : message;
}
function requireContract(): Address {
  if (!isAddress(contract)) throw new Error("Set a valid ArcRevenueSplitter contract address first.");
  return contract;
}
async function getArtifact(): Promise<Artifact> {
  artifact ??= await fetch("./artifacts/ArcRevenueSplitter.json").then((response) => response.json()) as Artifact;
  return artifact;
}
async function connect(): Promise<void> {
  provider = window.ethereum ?? null;
  if (!provider) throw new Error("MetaMask was not found.");
  await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
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
async function deploy(): Promise<void> {
  await ensureWallet(); const compiled = await getArtifact();
  setStatus("Waiting for MetaMask: deploy ArcRevenueSplitter...");
  const hash = await wallet!.deployContract({ abi: compiled.abi as any, bytecode: compiled.bytecode } as any);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error("Deployment receipt did not include a contract address.");
  contract = receipt.contractAddress; el.contract.value = contract; localStorage.setItem(storageKey, contract);
  setStatus("ArcRevenueSplitter deployed.", hash);
}
async function splitPayment(): Promise<void> {
  await ensureWallet(); const compiled = await getArtifact();
  const recipients = [el.recipientA.value.trim(), el.recipientB.value.trim()];
  if (!recipients.every((address) => isAddress(address))) throw new Error("Both recipient addresses must be valid.");
  const amounts = [parseEther(el.amountA.value), parseEther(el.amountB.value)];
  setStatus("Waiting for MetaMask: split payment...");
  const hash = await wallet!.writeContract({
    address: requireContract(), abi: compiled.abi as any, functionName: "splitPayment",
    args: [recipients as Address[], amounts, el.metadata.value.trim()], value: amounts[0] + amounts[1],
  } as any);
  await publicClient.waitForTransactionReceipt({ hash });
  el.result.textContent = JSON.stringify({ recipients, amounts: amounts.map((amount) => formatEther(amount)), total: formatEther(amounts[0] + amounts[1]), metadataURI: el.metadata.value }, null, 2);
  setStatus("Payment split and settled directly to recipients.", hash);
}
el.connect.addEventListener("click", () => void connect().catch((error) => setStatus(error instanceof Error ? error.message : "Connection failed.")));
el.save.addEventListener("click", () => { contract = el.contract.value.trim() as Address; localStorage.setItem(storageKey, contract); setStatus("Contract address saved."); });
el.deploy.addEventListener("click", () => void deploy().catch((error) => setStatus(error instanceof Error ? error.message : "Deployment failed.")));
el.split.addEventListener("click", () => void splitPayment().catch((error) => setStatus(error instanceof Error ? error.message : "Split failed.")));
