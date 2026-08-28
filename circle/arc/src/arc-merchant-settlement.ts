import { createPublicClient, createWalletClient, custom, formatEther, formatUnits, http, isAddress, parseUnits } from "viem";
import type { Address, EIP1193Provider, Hash } from "viem";
import { ARC_TESTNET, ARC_TESTNET_CHAIN } from "./arc-network";
import { assertWalletContext, escapeHtml, readStoredArray, validTokenAmount } from "./browser-security";

declare global { interface Window { ethereum?: EIP1193Provider; } }
const arc = ARC_TESTNET_CHAIN;
const tokens = { USDC: ARC_TESTNET.tokens.USDC, EURC: ARC_TESTNET.tokens.EURC } as const;
const abi = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }, { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }] as const;
const publicClient = createPublicClient({ chain: arc, transport: http() });
let provider: EIP1193Provider | null = null; let wallet: ReturnType<typeof createWalletClient> | null = null; let account: Address | null = null;
const activityKey = "ArcMerchantSettlement.activity.v1";
type Entry = { kind: string; token: string; amount: string; counterparty: string; reference: string; hash: Hash; at: string };
const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!, wallet: document.querySelector<HTMLElement>("#wallet")!, native: document.querySelector<HTMLElement>("#native")!, usdc: document.querySelector<HTMLElement>("#usdc")!, eurc: document.querySelector<HTMLElement>("#eurc")!,
  merchant: document.querySelector<HTMLInputElement>("#merchant")!, token: document.querySelector<HTMLSelectElement>("#token")!, amount: document.querySelector<HTMLInputElement>("#amount")!, reference: document.querySelector<HTMLInputElement>("#reference")!, kind: document.querySelector<HTMLSelectElement>("#kind")!, submit: document.querySelector<HTMLButtonElement>("#submit")!, status: document.querySelector<HTMLElement>("#status")!, ledger: document.querySelector<HTMLElement>("#ledger")!,
};
function setStatus(message: string, hash?: Hash): void { el.status.innerHTML = hash ? `${message} <a href="${ARC_TESTNET.explorerUrl}/tx/${hash}" target="_blank" rel="noreferrer">ArcScan receipt</a>` : message; }
function ledger(): Entry[] { return readStoredArray<Entry>(activityKey); }
function renderLedger(): void { const rows = ledger(); el.ledger.innerHTML = rows.length ? rows.map((row) => `<li><strong>${escapeHtml(row.kind)} · ${escapeHtml(row.token)} ${escapeHtml(row.amount)}</strong><span>${escapeHtml(row.reference)} · ${escapeHtml(row.counterparty)}</span><a href="${ARC_TESTNET.explorerUrl}/tx/${row.hash}" target="_blank" rel="noreferrer">${row.hash}</a><small>${new Date(row.at).toLocaleString()}</small></li>`).join("") : "<li class=\"empty\">No settlement receipts recorded.</li>"; }
async function connect(): Promise<void> { provider = window.ethereum ?? null; if (!provider) throw new Error("MetaMask was not found."); await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_TESTNET.chainIdHex }] }); const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[]; account = accounts[0] as Address; wallet = createWalletClient({ account, chain: arc, transport: custom(provider) }); el.wallet.textContent = account; el.merchant.value = account; setStatus("Merchant wallet connected."); await refresh(); }
async function refresh(): Promise<void> { if (!account) throw new Error("Connect MetaMask first."); const [native, usdc, eurc] = await Promise.all([publicClient.getBalance({ address: account }), ...Object.values(tokens).map((token) => publicClient.readContract({ address: token.address, abi, functionName: "balanceOf", args: [account!] }))]); el.native.textContent = `${formatEther(native)} USDC`; el.usdc.textContent = `${formatUnits(usdc, 6)} USDC`; el.eurc.textContent = `${formatUnits(eurc, 6)} EURC`; }
async function submitSettlement(): Promise<void> {
  if (!wallet || !account) await connect(); if (!wallet || !account) throw new Error("Wallet connection failed.");
  if (!provider) throw new Error("MetaMask provider not found."); await assertWalletContext(provider, ARC_TESTNET.chainIdHex, account);
  const merchant = el.merchant.value.trim(); const symbol = el.token.value as keyof typeof tokens; const amount = el.amount.value.trim(); const reference = el.reference.value.trim();
  if (!isAddress(merchant)) throw new Error("Enter a valid merchant or refund address."); if (!validTokenAmount(amount)) throw new Error("Enter a positive amount with up to 6 decimal places."); if (!reference || reference.length > 120) throw new Error("Enter a payment reference of 120 characters or fewer.");
  const token = tokens[symbol]; const kind = el.kind.value; setStatus(`Waiting for MetaMask: ${kind.toLowerCase()} ${symbol}...`);
  const hash = await wallet.writeContract({ chain: arc, account, address: token.address, abi, functionName: "transfer", args: [merchant as Address, parseUnits(amount, token.decimals)] });
  await publicClient.waitForTransactionReceipt({ hash }); const rows = ledger(); rows.unshift({ kind, token: symbol, amount, counterparty: merchant, reference, hash, at: new Date().toISOString() }); localStorage.setItem(activityKey, JSON.stringify(rows.slice(0, 20))); renderLedger(); await refresh(); setStatus(`${kind} confirmed.`, hash);
}
el.connect.addEventListener("click", () => void connect().catch((error) => setStatus(error instanceof Error ? error.message : "Connection failed.")));
el.submit.addEventListener("click", () => void submitSettlement().catch((error) => setStatus(error instanceof Error ? error.message : "Settlement failed.")));
renderLedger();
