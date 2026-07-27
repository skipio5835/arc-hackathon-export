import { AppKit } from "@circle-fin/app-kit";
import type { BridgeParams, BridgeResult, BridgeStep, EstimateResult } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { createPublicClient, formatEther, formatUnits, http } from "viem";
import type { EIP1193Provider } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

type BridgeChainId = BridgeParams["from"]["chain"];

const USER_WALLET = "0x0000000000000000000000000000000000000000";
const USDC_DECIMALS = 6;

const ARC_TESTNET = {
  chainId: "0x4cef52",
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

const chainMeta = {
  Arc_Testnet: {
    id: 5042002,
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrl: "https://rpc.testnet.arc.network",
    explorerUrl: "https://testnet.arcscan.app",
    usdcAddress: "0x3600000000000000000000000000000000000000",
  },
  Ethereum_Sepolia: {
    id: 11155111,
    name: "Ethereum Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  Base_Sepolia: {
    id: 84532,
    name: "Base Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
} as const;

const erc20Abi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

function routeBridgeApisThroughLocalProxy(): void {
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (rawUrl.startsWith("https://iris-api-sandbox.circle.com/")) {
      return originalFetch(rawUrl.replace("https://iris-api-sandbox.circle.com", "/circle-iris-sandbox"), init);
    }

    if (rawUrl.startsWith("https://iris-api.circle.com/")) {
      return originalFetch(rawUrl.replace("https://iris-api.circle.com", "/circle-iris"), init);
    }

    return originalFetch(input, init);
  };
}

routeBridgeApisThroughLocalProxy();

function createClient(chain: keyof typeof chainMeta) {
  const meta = chainMeta[chain];
  return createPublicClient({
    chain: {
      id: meta.id,
      name: meta.name,
      nativeCurrency: meta.nativeCurrency,
      rpcUrls: {
        default: { http: [meta.rpcUrl] },
      },
      blockExplorers: {
        default: { name: "Explorer", url: meta.explorerUrl },
      },
    },
    transport: http(meta.rpcUrl),
  });
}

const kit = new AppKit();
let adapter: Awaited<ReturnType<typeof createViemAdapterFromProvider>> | null = null;
let address = "";

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  estimate: document.querySelector<HTMLButtonElement>("#estimate")!,
  bridge: document.querySelector<HTMLButtonElement>("#bridge")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  sender: document.querySelector<HTMLInputElement>("#sender")!,
  expectedAccount: document.querySelector<HTMLInputElement>("#expectedAccount")!,
  toChain: document.querySelector<HTMLSelectElement>("#toChain")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  useForwarder: document.querySelector<HTMLInputElement>("#useForwarder")!,
  speed: document.querySelector<HTMLSelectElement>("#speed")!,
  sourceUsdc: document.querySelector<HTMLElement>("#sourceUsdc")!,
  sourceNative: document.querySelector<HTMLElement>("#sourceNative")!,
  destUsdc: document.querySelector<HTMLElement>("#destUsdc")!,
  destChainLabel: document.querySelector<HTMLElement>("#destChainLabel")!,
  estimateBox: document.querySelector<HTMLElement>("#estimateBox")!,
  resultBox: document.querySelector<HTMLElement>("#resultBox")!,
  status: document.querySelector<HTMLElement>("#status")!,
};

el.expectedAccount.value = USER_WALLET;
el.recipient.value = USER_WALLET;
el.amount.value = "0.1";

function setStatus(message: string): void {
  el.status.textContent = message;
}

function stringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, val) => (typeof val === "bigint" ? val.toString() : val),
    2,
  );
}

function errorMessage(error: unknown): string {
  console.error(error);

  if (error instanceof Error) {
    const cause = "cause" in error && error.cause instanceof Error ? ` Cause: ${error.cause.message}` : "";
    return `${error.message}${cause}`;
  }

  return "Unknown error.";
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

function assertExpectedAccount(account: string): void {
  const expected = el.expectedAccount.value.trim().toLowerCase();
  if (expected && account.toLowerCase() !== expected) {
    throw new Error(`Connected account must be ${el.expectedAccount.value.trim()}.`);
  }
}

async function readUsdcBalance(chain: keyof typeof chainMeta, account: string): Promise<string> {
  const client = createClient(chain);
  const balance = await client.readContract({
    address: chainMeta[chain].usdcAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account as `0x${string}`],
  });

  return formatUnits(balance, USDC_DECIMALS);
}

async function refreshBalances(): Promise<void> {
  if (!address) return;

  const destination = el.toChain.value as keyof typeof chainMeta;
  const arcClient = createClient("Arc_Testnet");
  const [sourceUsdc, sourceNative, destUsdc] = await Promise.all([
    readUsdcBalance("Arc_Testnet", address),
    arcClient.getBalance({ address: address as `0x${string}` }),
    readUsdcBalance(destination, el.recipient.value.trim() || address),
  ]);

  el.sourceUsdc.textContent = `${sourceUsdc} USDC`;
  el.sourceNative.textContent = `${formatEther(sourceNative)} USDC`;
  el.destUsdc.textContent = `${destUsdc} USDC`;
  el.destChainLabel.textContent = destination;
}

async function connect(): Promise<void> {
  if (!window.ethereum) {
    setStatus("MetaMask provider not found.");
    return;
  }

  try {
    setStatus("Connecting MetaMask...");
    await ensureArc();
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    address = accounts[0] ?? "";
    assertExpectedAccount(address);

    adapter = await createViemAdapterFromProvider({
      provider: window.ethereum,
    });

    el.sender.value = address;
    el.estimate.disabled = false;
    el.bridge.disabled = false;
    el.refresh.disabled = false;
    await refreshBalances();
    setStatus("Ready.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

function bridgeParams(): BridgeParams {
  if (!adapter) {
    throw new Error("Adapter was not initialized.");
  }

  const recipientAddress = el.recipient.value.trim();
  if (!recipientAddress) {
    throw new Error("Recipient address is required.");
  }

  const destinationChain = el.toChain.value as BridgeChainId;
  const to = el.useForwarder.checked
    ? { chain: destinationChain, recipientAddress, useForwarder: true }
    : { adapter, chain: destinationChain, recipientAddress };

  return {
    from: { adapter, chain: "Arc_Testnet" },
    to: to as BridgeParams["to"],
    amount: el.amount.value.trim(),
    token: "USDC",
    config: {
      transferSpeed: el.speed.value as "FAST" | "SLOW",
      batchTransactions: false,
    },
  };
}

function renderEstimate(estimate: EstimateResult): void {
  const gas = estimate.gasFees
    .map((fee) => `${fee.name}: ${fee.fees?.fee ?? "n/a"} ${fee.token}`)
    .join(", ");
  const fees = estimate.fees.map((fee) => `${fee.type}: ${fee.amount ?? "n/a"} ${fee.token}`).join(", ");

  el.estimateBox.innerHTML = `
    <div><strong>amount</strong><span>${estimate.amount} ${estimate.token}</span></div>
    <div><strong>route</strong><span>${estimate.source.chain} -> ${estimate.destination.chain}</span></div>
    <div><strong>gas</strong><span>${gas || "-"}</span></div>
    <div><strong>fees</strong><span>${fees || "-"}</span></div>
  `;
}

function stepLink(step: BridgeStep): string {
  if (step.explorerUrl) return step.explorerUrl;
  if (!step.txHash) return "";
  return `https://testnet.arcscan.app/tx/${step.txHash}`;
}

function renderResult(result: BridgeResult): void {
  const steps = result.steps
    .map((step) => {
      const explorerUrl = stepLink(step);
      return `
        <div>
          <strong>${step.name}</strong>
          <span>${step.state}</span>
          <span>${step.txHash ?? "-"}</span>
          <span>${explorerUrl ? `<a href="${explorerUrl}" target="_blank" rel="noreferrer">explorer</a>` : "-"}</span>
        </div>
      `;
    })
    .join("");

  el.resultBox.innerHTML = `
    <div><strong>state</strong><span>${result.state}</span></div>
    <div><strong>amount</strong><span>${result.amount} ${result.token}</span></div>
    <div><strong>source</strong><span>${result.source.chain.chain}</span></div>
    <div><strong>destination</strong><span>${result.destination.chain.chain}</span></div>
    ${steps}
  `;
}

async function estimateBridge(): Promise<void> {
  if (!adapter) await connect();
  if (!adapter) throw new Error("Adapter was not initialized.");

  setStatus("Estimating bridge...");
  try {
    const estimate = await kit.estimateBridge(bridgeParams());
    renderEstimate(estimate);
    setStatus("Estimate ready.");
  } catch (error) {
    el.estimateBox.innerHTML = `<pre>${stringify(error)}</pre>`;
    setStatus(`Estimate failed: ${errorMessage(error)}`);
  }
}

async function runBridge(): Promise<void> {
  if (!adapter) await connect();
  if (!adapter) throw new Error("Adapter was not initialized.");

  el.bridge.disabled = true;
  setStatus("Waiting for MetaMask approval/burn signatures...");
  try {
    await kit.estimateBridge(bridgeParams());
    const result = await kit.bridge(bridgeParams());
    renderResult(result);
    await refreshBalances();
    setStatus("Bridge flow completed.");
  } catch (error) {
    el.resultBox.innerHTML = `<pre>${stringify(error)}</pre>`;
    setStatus(`Bridge failed: ${errorMessage(error)}`);
  } finally {
    el.bridge.disabled = false;
  }
}

el.connect.addEventListener("click", () => void connect());
el.refresh.addEventListener("click", () => void refreshBalances());
el.estimate.addEventListener("click", () => void estimateBridge());
el.bridge.addEventListener("click", () => void runBridge());
el.toChain.addEventListener("change", () => void refreshBalances());
