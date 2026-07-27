import {
  AppKit,
  type DepositParams,
  type DepositResult,
  type EstimateSpendResult,
  type GetBalancesResult,
  type SpendParams,
  type SpendResult,
} from "@circle-fin/app-kit";
import { ArcTestnet, BaseSepolia, EthereumSepolia } from "@circle-fin/app-kit/chains";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { createPublicClient, formatEther, formatUnits, http } from "viem";
import type { EIP1193Provider } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

type WalletProvider = EIP1193Provider & {
  isMetaMask?: boolean;
  providers?: WalletProvider[];
};

type Eip6963ProviderDetail = {
  info?: {
    name?: string;
    rdns?: string;
    uuid?: string;
  };
  provider?: WalletProvider;
};

const USER_WALLET = "0x0000000000000000000000000000000000000000";
const USDC_DECIMALS = 6;

const chainMeta = {
  Arc_Testnet: {
    definition: ArcTestnet,
    chainId: "0x4cef52",
    chainName: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrl: "https://rpc.testnet.arc.network",
    explorerUrl: "https://testnet.arcscan.app",
    usdcAddress: "0x3600000000000000000000000000000000000000",
  },
  Ethereum_Sepolia: {
    definition: EthereumSepolia,
    chainId: "0xaa36a7",
    chainName: "Ethereum Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  Base_Sepolia: {
    definition: BaseSepolia,
    chainId: "0x14a34",
    chainName: "Base Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
} as const;

type SupportedChain = keyof typeof chainMeta;

const erc20Abi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

function createClient(chain: SupportedChain) {
  const meta = chainMeta[chain];
  return createPublicClient({
    chain: {
      id: Number.parseInt(meta.chainId, 16),
      name: meta.chainName,
      nativeCurrency: meta.nativeCurrency,
      rpcUrls: { default: { http: [meta.rpcUrl] } },
      blockExplorers: { default: { name: "Explorer", url: meta.explorerUrl } },
    },
    transport: http(meta.rpcUrl),
  });
}

function routeGatewayApisThroughLocalProxy(): void {
  const useProxy = new URLSearchParams(window.location.search).get("proxy") === "1";
  if (!useProxy) return;

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (rawUrl.startsWith("https://gateway-api-testnet.circle.com/")) {
      return originalFetch(rawUrl.replace("https://gateway-api-testnet.circle.com", "/circle-gateway-testnet"), init);
    }

    if (rawUrl.startsWith("https://gateway-api.circle.com/")) {
      return originalFetch(rawUrl.replace("https://gateway-api.circle.com", "/circle-gateway"), init);
    }

    return originalFetch(input, init);
  };
}

routeGatewayApisThroughLocalProxy();

const kit = new AppKit();
let adapter: Awaited<ReturnType<typeof createViemAdapterFromProvider>> | null = null;
let walletProvider: WalletProvider | null = null;
let address = "";

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  deposit: document.querySelector<HTMLButtonElement>("#deposit")!,
  checkBalance: document.querySelector<HTMLButtonElement>("#checkBalance")!,
  estimateSpend: document.querySelector<HTMLButtonElement>("#estimateSpend")!,
  spend: document.querySelector<HTMLButtonElement>("#spend")!,
  sender: document.querySelector<HTMLInputElement>("#sender")!,
  expectedAccount: document.querySelector<HTMLInputElement>("#expectedAccount")!,
  sourceChain: document.querySelector<HTMLSelectElement>("#sourceChain")!,
  destinationChain: document.querySelector<HTMLSelectElement>("#destinationChain")!,
  depositAmount: document.querySelector<HTMLInputElement>("#depositAmount")!,
  spendAmount: document.querySelector<HTMLInputElement>("#spendAmount")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  allowanceStrategy: document.querySelector<HTMLSelectElement>("#allowanceStrategy")!,
  useForwarder: document.querySelector<HTMLInputElement>("#useForwarder")!,
  sourceUsdc: document.querySelector<HTMLElement>("#sourceUsdc")!,
  sourceNative: document.querySelector<HTMLElement>("#sourceNative")!,
  destinationUsdc: document.querySelector<HTMLElement>("#destinationUsdc")!,
  unifiedConfirmed: document.querySelector<HTMLElement>("#unifiedConfirmed")!,
  unifiedPending: document.querySelector<HTMLElement>("#unifiedPending")!,
  status: document.querySelector<HTMLElement>("#status")!,
  depositBox: document.querySelector<HTMLElement>("#depositBox")!,
  balanceBox: document.querySelector<HTMLElement>("#balanceBox")!,
  estimateBox: document.querySelector<HTMLElement>("#estimateBox")!,
  spendBox: document.querySelector<HTMLElement>("#spendBox")!,
  eventLog: document.querySelector<HTMLElement>("#eventLog")!,
};

el.expectedAccount.value = USER_WALLET;
el.recipient.value = USER_WALLET;
el.depositAmount.value = "0.1";
el.spendAmount.value = "0.01";

kit.unifiedBalance.on("*", (payload) => {
  const row = document.createElement("div");
  row.textContent = stringify(payload);
  el.eventLog.prepend(row);
});

function setStatus(message: string): void {
  el.status.textContent = message;
}

function stringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => (typeof val === "bigint" ? val.toString() : val), 2);
}

function errorMessage(error: unknown): string {
  console.error(error);
  if (error instanceof Error) {
    const cause = "cause" in error && error.cause instanceof Error ? ` Cause: ${error.cause.message}` : "";
    return `${error.message}${cause}`;
  }
  return "Unknown error.";
}

function selectedSourceChain(): SupportedChain {
  return el.sourceChain.value as SupportedChain;
}

function selectedDestinationChain(): SupportedChain {
  return el.destinationChain.value as SupportedChain;
}

async function ensureChain(chain: SupportedChain): Promise<void> {
  const provider = await getWalletProvider();
  if (!provider) {
    throw new Error("MetaMask provider not found.");
  }

  const meta = chainMeta[chain];
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: meta.chainId }],
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: meta.chainId,
          chainName: meta.chainName,
          nativeCurrency: meta.nativeCurrency,
          rpcUrls: [meta.rpcUrl],
          blockExplorerUrls: [meta.explorerUrl],
        },
      ],
    });
  }
}

function injectedProvider(): WalletProvider | null {
  const ethereum = window.ethereum as WalletProvider | undefined;
  if (!ethereum) return null;
  if (ethereum.isMetaMask) return ethereum;
  return ethereum.providers?.find((provider: WalletProvider) => provider.isMetaMask) ?? ethereum;
}

async function discoverEip6963Provider(): Promise<WalletProvider | null> {
  const injected = injectedProvider();
  if (injected) return injected;

  return new Promise((resolve) => {
    const announced: WalletProvider[] = [];
    let done = false;

    const finish = (provider: WalletProvider | null) => {
      if (done) return;
      done = true;
      window.removeEventListener("eip6963:announceProvider", onProvider as EventListener);
      resolve(provider);
    };

    const onProvider = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      if (!detail?.provider) return;
      announced.push(detail.provider);

      const rdns = detail.info?.rdns?.toLowerCase() ?? "";
      const name = detail.info?.name?.toLowerCase() ?? "";
      if (detail.provider.isMetaMask || rdns.includes("metamask") || name.includes("metamask")) {
        finish(detail.provider);
      }
    };

    window.addEventListener("eip6963:announceProvider", onProvider as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    window.setTimeout(() => {
      finish(announced.find((provider) => provider.isMetaMask) ?? announced[0] ?? null);
    }, 800);
  });
}

async function getWalletProvider(): Promise<WalletProvider | null> {
  walletProvider ??= await discoverEip6963Provider();
  return walletProvider;
}

function assertExpectedAccount(account: string): void {
  const expected = el.expectedAccount.value.trim().toLowerCase();
  if (expected && account.toLowerCase() !== expected) {
    throw new Error(`Connected account must be ${el.expectedAccount.value.trim()}.`);
  }
}

async function readUsdcBalance(chain: SupportedChain, account: string): Promise<string> {
  const meta = chainMeta[chain];
  const balance = await createClient(chain).readContract({
    address: meta.usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account as `0x${string}`],
  });

  return formatUnits(balance, USDC_DECIMALS);
}

async function refreshBalances(): Promise<void> {
  if (!address) return;

  const source = selectedSourceChain();
  const destination = selectedDestinationChain();
  const recipient = el.recipient.value.trim() || address;
  const [sourceUsdc, sourceNative, destinationUsdc] = await Promise.all([
    readUsdcBalance(source, address),
    createClient(source).getBalance({ address: address as `0x${string}` }),
    readUsdcBalance(destination, recipient),
  ]);

  el.sourceUsdc.textContent = `${sourceUsdc} USDC`;
  el.sourceNative.textContent = `${formatEther(sourceNative)} ${chainMeta[source].nativeCurrency.symbol}`;
  el.destinationUsdc.textContent = `${destinationUsdc} USDC`;
}

async function connect(): Promise<void> {
  const provider = await getWalletProvider();
  if (!provider) {
    setStatus("MetaMask provider not found.");
    return;
  }

  try {
    setStatus("Connecting MetaMask...");
    await ensureChain(selectedSourceChain());
    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];

    address = accounts[0] ?? "";
    assertExpectedAccount(address);
    adapter = await createViemAdapterFromProvider({
      provider,
      capabilities: {
        supportedChains: [ArcTestnet, BaseSepolia, EthereumSepolia],
      },
    });

    el.sender.value = address;
    for (const button of [el.refresh, el.deposit, el.checkBalance, el.estimateSpend, el.spend]) {
      button.disabled = false;
    }
    await refreshBalances();
    setStatus("Ready.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

function requireAdapter(): NonNullable<typeof adapter> {
  if (!adapter) {
    throw new Error("Adapter was not initialized.");
  }
  return adapter;
}

function renderDeposit(result: DepositResult): void {
  el.depositBox.innerHTML = `
    <div><strong>amount</strong><span>${result.amount} ${result.token}</span></div>
    <div><strong>chain</strong><span>${result.chain}</span></div>
    <div><strong>txHash</strong><span>${result.txHash}</span></div>
    <div><strong>explorer</strong><span>${
      result.explorerUrl ? `<a href="${result.explorerUrl}" target="_blank" rel="noreferrer">explorer</a>` : "-"
    }</span></div>
  `;
}

function renderBalances(result: GetBalancesResult): void {
  el.unifiedConfirmed.textContent = `${result.totalConfirmedBalance} ${result.token}`;
  el.unifiedPending.textContent = `${result.totalPendingBalance ?? "0"} ${result.token}`;
  el.balanceBox.innerHTML = `
    <pre>${stringify(result)}</pre>
  `;
}

function renderEstimate(result: EstimateSpendResult): void {
  const fees = result.fees.map((fee) => `${fee.type}: ${fee.amount} ${fee.token}`).join(", ");
  el.estimateBox.innerHTML = `
    <div><strong>fees</strong><span>${fees || "-"}</span></div>
    <pre>${stringify(result)}</pre>
  `;
}

function renderSpend(result: SpendResult): void {
  const fees = result.fees?.map((fee) => `${fee.type}: ${fee.amount} ${fee.token}`).join(", ") || "-";
  const steps =
    result.steps
      ?.map((step) => {
        const link = step.explorerUrl ? `<a href="${step.explorerUrl}" target="_blank" rel="noreferrer">explorer</a>` : "-";
        return `<div><strong>${step.name}</strong><span>${step.state}</span><span>${step.txHash ?? "-"}</span><span>${link}</span></div>`;
      })
      .join("") || "";

  el.spendBox.innerHTML = `
    <div><strong>recipient</strong><span>${result.recipientAddress}</span></div>
    <div><strong>destination</strong><span>${result.destinationChain}</span></div>
    <div><strong>txHash</strong><span>${result.txHash}</span></div>
    <div><strong>fees</strong><span>${fees}</span></div>
    <div><strong>explorer</strong><span>${
      result.explorerUrl ? `<a href="${result.explorerUrl}" target="_blank" rel="noreferrer">explorer</a>` : "-"
    }</span></div>
    ${steps}
  `;
}

function depositParams(): DepositParams {
  const source = selectedSourceChain();
  return {
    from: { adapter: requireAdapter(), chain: source },
    amount: el.depositAmount.value.trim(),
    token: "USDC",
    allowanceStrategy: el.allowanceStrategy.value as "approve" | "permit" | "authorize",
  };
}

function balanceParams() {
  const source = selectedSourceChain();
  return {
    token: "USDC" as const,
    sources: { adapter: requireAdapter(), chains: [source] },
    networkType: "testnet" as const,
    includePending: true,
  };
}

function spendParams(): SpendParams {
  const source = selectedSourceChain();
  const destination = selectedDestinationChain();
  const amount = el.spendAmount.value.trim();
  const recipientAddress = el.recipient.value.trim();
  const to = el.useForwarder.checked
    ? { chain: destination, recipientAddress, useForwarder: true }
    : { adapter: requireAdapter(), chain: destination, recipientAddress };

  return {
    from: {
      adapter: requireAdapter(),
      allocations: { amount, chain: source },
    },
    to: to as SpendParams["to"],
    token: "USDC",
    amount,
  };
}

async function runDeposit(): Promise<void> {
  if (!adapter) await connect();
  const source = selectedSourceChain();
  el.deposit.disabled = true;
  try {
    await ensureChain(source);
    setStatus("Waiting for MetaMask deposit signature...");
    const result = await kit.unifiedBalance.deposit(depositParams());
    renderDeposit(result);
    await Promise.all([refreshBalances(), checkUnifiedBalance()]);
    setStatus("Deposit confirmed.");
  } catch (error) {
    setStatus(`Deposit failed: ${errorMessage(error)}`);
  } finally {
    el.deposit.disabled = false;
  }
}

async function checkUnifiedBalance(): Promise<void> {
  if (!adapter) await connect();
  try {
    setStatus("Checking Unified Balance...");
    const result = await kit.unifiedBalance.getBalances(balanceParams());
    renderBalances(result);
    setStatus("Unified Balance loaded.");
  } catch (error) {
    setStatus(`Balance check failed: ${errorMessage(error)}`);
  }
}

async function estimateSpend(): Promise<void> {
  if (!adapter) await connect();
  try {
    setStatus("Estimating Unified Balance spend...");
    const result = await kit.unifiedBalance.estimateSpend(spendParams());
    renderEstimate(result);
    setStatus("Spend estimate ready.");
  } catch (error) {
    setStatus(`Estimate failed: ${errorMessage(error)}`);
  }
}

async function runSpend(): Promise<void> {
  if (!adapter) await connect();
  const destination = selectedDestinationChain();
  el.spend.disabled = true;
  try {
    if (!el.useForwarder.checked) {
      await ensureChain(destination);
    }
    setStatus("Waiting for Unified Balance spend signature...");
    const result = await kit.unifiedBalance.spend(spendParams());
    renderSpend(result);
    await Promise.all([refreshBalances(), checkUnifiedBalance()]);
    setStatus("Spend confirmed.");
  } catch (error) {
    setStatus(`Spend failed: ${errorMessage(error)}`);
  } finally {
    el.spend.disabled = false;
  }
}

el.connect.addEventListener("click", () => void connect());
el.refresh.addEventListener("click", () => void refreshBalances());
el.deposit.addEventListener("click", () => void runDeposit());
el.checkBalance.addEventListener("click", () => void checkUnifiedBalance());
el.estimateSpend.addEventListener("click", () => void estimateSpend());
el.spend.addEventListener("click", () => void runSpend());
el.sourceChain.addEventListener("change", () => void refreshBalances());
el.destinationChain.addEventListener("change", () => void refreshBalances());
