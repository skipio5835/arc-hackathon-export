import { AppKit } from "@circle-fin/app-kit";
import type { BridgeStep, SendParams } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { createPublicClient, formatEther, formatUnits, http } from "viem";
import type { EIP1193Provider } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

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
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
} as const;

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const CIRCLE_WALLET = "0x78131700be4a8f2d16eeb0cba3498d2e717f2cd3";
const erc20Abi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});

const kit = new AppKit();
let adapter: Awaited<ReturnType<typeof createViemAdapterFromProvider>> | null = null;
let address = "";

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  send: document.querySelector<HTMLButtonElement>("#send")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  sender: document.querySelector<HTMLInputElement>("#sender")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  token: document.querySelector<HTMLInputElement>("#token")!,
  walletUsdc: document.querySelector<HTMLElement>("#walletUsdc")!,
  circleUsdc: document.querySelector<HTMLElement>("#circleUsdc")!,
  nativeUsdc: document.querySelector<HTMLElement>("#nativeUsdc")!,
  status: document.querySelector<HTMLElement>("#status")!,
  result: document.querySelector<HTMLElement>("#result")!,
};

el.recipient.value = CIRCLE_WALLET;
el.amount.value = "0.01";
el.token.value = "USDC";

function setStatus(message: string): void {
  el.status.textContent = message;
}

function txUrl(step: BridgeStep): string {
  return step.explorerUrl || (step.txHash ? `https://testnet.arcscan.app/tx/${step.txHash}` : "");
}

function renderResult(step: BridgeStep): void {
  const explorerUrl = txUrl(step);
  el.result.innerHTML = `
    <div><strong>state</strong><span>${step.state}</span></div>
    <div><strong>name</strong><span>${step.name}</span></div>
    <div><strong>txHash</strong><span>${step.txHash ?? "-"}</span></div>
    <div><strong>explorer</strong><span>${
      explorerUrl ? `<a href="${explorerUrl}" target="_blank" rel="noreferrer">${explorerUrl}</a>` : "-"
    }</span></div>
  `;
}

async function ensureArc(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask provider not found.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET.chainId }],
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [ARC_TESTNET],
    });
  }
}

async function readUsdcBalance(account: string): Promise<string> {
  const balance = await client.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account as `0x${string}`],
  });

  return formatUnits(balance, 6);
}

async function refreshBalances(): Promise<void> {
  if (!address) return;

  const [walletUsdc, circleUsdc, nativeBalance] = await Promise.all([
    readUsdcBalance(address),
    readUsdcBalance(CIRCLE_WALLET),
    client.getBalance({ address: address as `0x${string}` }),
  ]);

  el.walletUsdc.textContent = `${walletUsdc} USDC`;
  el.circleUsdc.textContent = `${circleUsdc} USDC`;
  el.nativeUsdc.textContent = `${formatEther(nativeBalance)} USDC`;
}

async function connect(): Promise<void> {
  if (!window.ethereum) {
    setStatus("MetaMask provider not found.");
    return;
  }

  setStatus("Connecting MetaMask...");
  await ensureArc();
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  address = accounts[0] ?? "";
  adapter = await createViemAdapterFromProvider({
    provider: window.ethereum,
  });

  el.sender.value = address;
  el.send.disabled = false;
  el.refresh.disabled = false;
  await refreshBalances();
  setStatus("Ready.");
}

async function sendWithAppKit(): Promise<void> {
  if (!adapter) {
    await connect();
  }

  if (!adapter) {
    throw new Error("Adapter was not initialized.");
  }

  const params: SendParams = {
    from: { adapter, chain: "Arc_Testnet" },
    to: el.recipient.value.trim(),
    amount: el.amount.value.trim(),
    token: el.token.value.trim(),
  };

  el.send.disabled = true;
  setStatus("Estimating App Kit Send...");

  try {
    await kit.estimateSend(params);
    setStatus("Waiting for MetaMask signature...");
    const result = await kit.send(params);
    renderResult(result);
    await refreshBalances();
    setStatus("Confirmed.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "App Kit Send failed.";
    setStatus(message);
  } finally {
    el.send.disabled = false;
  }
}

el.connect.addEventListener("click", () => void connect());
el.refresh.addEventListener("click", () => void refreshBalances());
el.send.addEventListener("click", () => void sendWithAppKit());
