import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  formatUnits,
  http,
  isAddress,
  parseUnits,
} from "viem";
import type { Address, EIP1193Provider, Hash } from "viem";
import { ARC_TESTNET, ARC_TESTNET_CHAIN } from "./arc-network";
import { assertWalletContext, escapeHtml, readStoredArray, validTokenAmount } from "./browser-security";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

const arc = ARC_TESTNET_CHAIN;
const tokens = ARC_TESTNET.tokens;
const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;
const publicClient = createPublicClient({ chain: arc, transport: http() });
let provider: EIP1193Provider | null = null;
let wallet: ReturnType<typeof createWalletClient> | null = null;
let account: Address | null = null;

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  wallet: document.querySelector<HTMLElement>("#wallet")!,
  native: document.querySelector<HTMLElement>("#nativeBalance")!,
  usdc: document.querySelector<HTMLElement>("#usdcBalance")!,
  eurc: document.querySelector<HTMLElement>("#eurcBalance")!,
  usyc: document.querySelector<HTMLElement>("#usycBalance")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  token: document.querySelector<HTMLSelectElement>("#token")!,
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  send: document.querySelector<HTMLButtonElement>("#send")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  status: document.querySelector<HTMLElement>("#status")!,
  activity: document.querySelector<HTMLElement>("#activity")!,
};

type Activity = { token: string; amount: string; recipient: string; hash: Hash; createdAt: string };
const activityKey = "ArcTreasuryConsole.activity.v1";

function setStatus(message: string, hash?: Hash): void {
  el.status.innerHTML = hash
    ? `${message} <a href="${ARC_TESTNET.explorerUrl}/tx/${hash}" target="_blank" rel="noreferrer">View on ArcScan</a>`
    : message;
}

function renderActivity(): void {
  const rows = readStoredArray<Activity>(activityKey);
  el.activity.innerHTML = rows.length
    ? rows.map((row) => `<li><strong>${escapeHtml(row.token)} ${escapeHtml(row.amount)}</strong> to <code>${escapeHtml(row.recipient)}</code><br><a href="${ARC_TESTNET.explorerUrl}/tx/${row.hash}" target="_blank" rel="noreferrer">${row.hash}</a><span>${new Date(row.createdAt).toLocaleString()}</span></li>`).join("")
    : "<li class=\"empty\">No local transfers recorded yet.</li>";
}

async function connect(): Promise<void> {
  provider = window.ethereum ?? null;
  if (!provider) throw new Error("MetaMask was not found.");
  await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_TESTNET.chainIdHex }] });
  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  account = accounts[0] as Address;
  wallet = createWalletClient({ account, chain: arc, transport: custom(provider) });
  el.wallet.textContent = account;
  setStatus("Wallet connected. Reading Arc balances...");
  await refreshBalances();
}

async function refreshBalances(): Promise<void> {
  if (!account) throw new Error("Connect MetaMask first.");
  const [native, ...balances] = await Promise.all([
    publicClient.getBalance({ address: account }),
    ...Object.values(tokens).map((token) => publicClient.readContract({ address: token.address, abi: erc20Abi, functionName: "balanceOf", args: [account!] })),
  ]);
  el.native.textContent = `${formatEther(native)} USDC`;
  el.usdc.textContent = `${formatUnits(balances[0], tokens.USDC.decimals)} USDC`;
  el.eurc.textContent = `${formatUnits(balances[1], tokens.EURC.decimals)} EURC`;
  el.usyc.textContent = `${formatUnits(balances[2], tokens.USYC.decimals)} USYC`;
  setStatus("Balances refreshed.");
}

async function sendToken(): Promise<void> {
  if (!wallet || !account) await connect();
  if (!wallet || !account) throw new Error("Wallet connection failed.");
  if (!provider) throw new Error("MetaMask provider not found.");
  await assertWalletContext(provider, ARC_TESTNET.chainIdHex, account);
  const recipient = el.recipient.value.trim();
  const symbol = el.token.value as keyof typeof tokens;
  const amount = el.amount.value.trim();
  if (!isAddress(recipient)) throw new Error("Enter a valid recipient address.");
  if (!validTokenAmount(amount)) throw new Error("Enter a positive amount with up to 6 decimal places.");
  if (symbol === "USYC") throw new Error("USYC is read-only in this console because access is restricted.");
  const token = tokens[symbol];
  setStatus(`Waiting for MetaMask: send ${symbol}...`);
  const hash = await wallet.writeContract({
    chain: arc,
    account,
    address: token.address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient as Address, parseUnits(amount, token.decimals)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  const rows = readStoredArray<Activity>(activityKey);
  rows.unshift({ token: symbol, amount, recipient, hash, createdAt: new Date().toISOString() });
  localStorage.setItem(activityKey, JSON.stringify(rows.slice(0, 12)));
  renderActivity();
  await refreshBalances();
  setStatus(`${symbol} transfer confirmed.`, hash);
}

el.connect.addEventListener("click", () => void connect().catch((error) => setStatus(error instanceof Error ? error.message : "Connection failed.")));
el.refresh.addEventListener("click", () => void refreshBalances().catch((error) => setStatus(error instanceof Error ? error.message : "Refresh failed.")));
el.send.addEventListener("click", () => void sendToken().catch((error) => setStatus(error instanceof Error ? error.message : "Transfer failed.")));
renderActivity();
