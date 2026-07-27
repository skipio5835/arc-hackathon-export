import { AppKit } from "@circle-fin/app-kit";
import type { SwapEstimate, SwapParams, SwapResult } from "@circle-fin/app-kit";
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

const TOKENS = {
  USDC: { address: "0x3600000000000000000000000000000000000000", decimals: 6 },
  EURC: { address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", decimals: 6 },
  cirBTC: { address: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF", decimals: 8 },
} as const;

function routeStablecoinServiceThroughLocalProxy(): void {
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (rawUrl.startsWith("https://api.circle.com/v1/stablecoinKits/")) {
      const proxiedUrl = rawUrl.replace("https://api.circle.com", "/circle-api");
      return originalFetch(proxiedUrl, init);
    }

    return originalFetch(input, init);
  };
}

routeStablecoinServiceThroughLocalProxy();

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
  estimate: document.querySelector<HTMLButtonElement>("#estimate")!,
  swap: document.querySelector<HTMLButtonElement>("#swap")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  sender: document.querySelector<HTMLInputElement>("#sender")!,
  kitKey: document.querySelector<HTMLInputElement>("#kitKey")!,
  tokenIn: document.querySelector<HTMLSelectElement>("#tokenIn")!,
  tokenOut: document.querySelector<HTMLSelectElement>("#tokenOut")!,
  amountIn: document.querySelector<HTMLInputElement>("#amountIn")!,
  usdc: document.querySelector<HTMLElement>("#usdc")!,
  eurc: document.querySelector<HTMLElement>("#eurc")!,
  cirbtc: document.querySelector<HTMLElement>("#cirbtc")!,
  native: document.querySelector<HTMLElement>("#native")!,
  estimateBox: document.querySelector<HTMLElement>("#estimateBox")!,
  resultBox: document.querySelector<HTMLElement>("#resultBox")!,
  status: document.querySelector<HTMLElement>("#status")!,
};

el.amountIn.value = "0.01";

function setStatus(message: string): void {
  el.status.textContent = message;
}

function errorMessage(error: unknown): string {
  console.error(error);

  if (error instanceof Error) {
    const cause = "cause" in error && error.cause instanceof Error ? ` Cause: ${error.cause.message}` : "";
    return `${error.message}${cause}`;
  }

  return "Unknown error.";
}

function tokenAlias(value: string): keyof typeof TOKENS {
  if (value !== "USDC" && value !== "EURC" && value !== "cirBTC") {
    throw new Error(`Unsupported token: ${value}`);
  }

  return value;
}

function kitKey(): string {
  const value = el.kitKey.value.trim();
  if (!value) {
    throw new Error("KIT_KEY is required for App Kit Swap.");
  }
  if (!value.startsWith("KIT_KEY:")) {
    throw new Error("Use a Kit Key, not a regular API key. Expected format: KIT_KEY:<keyId>:<keySecret>.");
  }

  return value;
}

function swapParams(): SwapParams {
  const tokenIn = tokenAlias(el.tokenIn.value);
  const tokenOut = tokenAlias(el.tokenOut.value);
  if (tokenIn === tokenOut) {
    throw new Error("tokenIn and tokenOut must be different.");
  }

  return {
    from: { adapter: adapter!, chain: "Arc_Testnet" },
    tokenIn,
    tokenOut,
    amountIn: el.amountIn.value.trim(),
    config: {
      kitKey: kitKey(),
      slippageBps: 300,
      allowanceStrategy: "approve",
    },
  };
}

function renderEstimate(estimate: SwapEstimate): void {
  const fees = estimate.fees?.map((fee) => `${fee.type}: ${fee.amount} ${fee.token}`).join(", ") || "-";
  el.estimateBox.innerHTML = `
    <div><strong>estimatedOutput</strong><span>${estimate.estimatedOutput.amount} ${estimate.estimatedOutput.token}</span></div>
    <div><strong>stopLimit</strong><span>${estimate.stopLimit.amount} ${estimate.stopLimit.token}</span></div>
    <div><strong>fees</strong><span>${fees}</span></div>
  `;
}

function renderResult(result: SwapResult): void {
  const fees = result.fees?.map((fee) => `${fee.type}: ${fee.amount} ${fee.token}`).join(", ") || "-";
  el.resultBox.innerHTML = `
    <div><strong>amountIn</strong><span>${result.amountIn} ${result.tokenIn}</span></div>
    <div><strong>amountOut</strong><span>${result.amountOut ?? "-"} ${result.tokenOut}</span></div>
    <div><strong>txHash</strong><span>${result.txHash}</span></div>
    <div><strong>explorer</strong><span>${
      result.explorerUrl ? `<a href="${result.explorerUrl}" target="_blank" rel="noreferrer">${result.explorerUrl}</a>` : "-"
    }</span></div>
    <div><strong>fees</strong><span>${fees}</span></div>
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

async function balanceOf(token: keyof typeof TOKENS): Promise<string> {
  const meta = TOKENS[token];
  const balance = await client.readContract({
    address: meta.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  return formatUnits(balance, meta.decimals);
}

async function refreshBalances(): Promise<void> {
  if (!address) return;

  const [usdc, eurc, cirbtc, native] = await Promise.all([
    balanceOf("USDC"),
    balanceOf("EURC"),
    balanceOf("cirBTC"),
    client.getBalance({ address: address as `0x${string}` }),
  ]);

  el.usdc.textContent = `${usdc} USDC`;
  el.eurc.textContent = `${eurc} EURC`;
  el.cirbtc.textContent = `${cirbtc} cirBTC`;
  el.native.textContent = `${formatEther(native)} USDC`;
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
  el.estimate.disabled = false;
  el.swap.disabled = false;
  el.refresh.disabled = false;
  await refreshBalances();
  setStatus("Ready.");
}

async function estimateSwap(): Promise<void> {
  if (!adapter) await connect();
  if (!adapter) throw new Error("Adapter was not initialized.");

  setStatus("Estimating swap...");
  try {
    const estimate = await kit.estimateSwap(swapParams());
    renderEstimate(estimate);
    setStatus("Estimate ready.");
  } catch (error) {
    setStatus(`Estimate failed: ${errorMessage(error)}`);
  }
}

async function runSwap(): Promise<void> {
  if (!adapter) await connect();
  if (!adapter) throw new Error("Adapter was not initialized.");

  el.swap.disabled = true;
  setStatus("Waiting for MetaMask approval/signature...");
  try {
    await kit.estimateSwap(swapParams());
    const result = await kit.swap(swapParams());
    renderResult(result);
    await refreshBalances();
    setStatus("Swap confirmed.");
  } catch (error) {
    setStatus(`Swap failed: ${errorMessage(error)}`);
  } finally {
    el.swap.disabled = false;
  }
}

el.connect.addEventListener("click", () => void connect());
el.refresh.addEventListener("click", () => void refreshBalances());
el.estimate.addEventListener("click", () => void estimateSwap());
el.swap.addEventListener("click", () => void runSwap());
