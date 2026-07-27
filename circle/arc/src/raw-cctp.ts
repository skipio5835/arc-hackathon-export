import {
  createPublicClient,
  encodeFunctionData,
  formatEther,
  formatUnits,
  http,
  isAddress,
  parseUnits,
} from "viem";
import type { Address, EIP1193Provider, Hash } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

type ChainKey = "Arc_Testnet" | "Ethereum_Sepolia" | "Base_Sepolia";
type TransferSpeed = "FAST" | "STANDARD";

type FeeQuote = {
  finalityThreshold: number;
  minimumFee: number;
  forwardFee?: {
    low?: number;
    medium?: number;
    high?: number;
  };
};

type IrisMessage = {
  message?: Hash;
  attestation?: Hash;
  eventNonce?: string;
  status?: string;
  decodedMessage?: {
    sourceDomain?: string;
    destinationDomain?: string;
    nonce?: string;
    decodedMessageBody?: {
      amount?: string;
      mintRecipient?: string;
      feeExecuted?: string;
    };
  };
};

type IrisResponse = {
  messages?: IrisMessage[];
  sourceTxHash?: Hash;
};

const USER_WALLET = "0x0000000000000000000000000000000000000000" as Address;
const USDC_DECIMALS = 6;
const BRIDGE_CONTRACT = "0xC5567a5E3370d4DBfB0540025078e283e36A363d" as Address;
const MESSAGE_TRANSMITTER_V2 = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as Address;
const ZERO_BYTES32 = `0x${"0".repeat(64)}` as Hash;

const chains = {
  Arc_Testnet: {
    id: 5042002,
    domain: 26,
    chainId: "0x4cef52",
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrl: "https://rpc.testnet.arc.network",
    explorerUrl: "https://testnet.arcscan.app",
    usdc: "0x3600000000000000000000000000000000000000" as Address,
  },
  Ethereum_Sepolia: {
    id: 11155111,
    domain: 0,
    chainId: "0xaa36a7",
    name: "Ethereum Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
  },
  Base_Sepolia: {
    id: 84532,
    domain: 6,
    chainId: "0x14a34",
    name: "Base Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
  },
} as const;

const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const bridgeContractAbi = [
  {
    type: "function",
    name: "bridgeWithPreapproval",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "bridgeParams",
        type: "tuple",
        components: [
          { name: "amount", type: "uint256" },
          { name: "maxFee", type: "uint256" },
          { name: "fee", type: "uint256" },
          { name: "mintRecipient", type: "bytes32" },
          { name: "destinationCaller", type: "bytes32" },
          { name: "burnToken", type: "address" },
          { name: "feeRecipient", type: "address" },
          { name: "destinationDomain", type: "uint32" },
          { name: "minFinalityThreshold", type: "uint32" },
        ],
      },
    ],
    outputs: [],
  },
] as const;

const messageTransmitterAbi = [
  {
    type: "function",
    name: "receiveMessage",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "event",
    name: "MessageReceived",
    inputs: [
      { name: "caller", type: "address", indexed: true },
      { name: "sourceDomain", type: "uint32", indexed: true },
      { name: "nonce", type: "uint64", indexed: true },
      { name: "sender", type: "bytes32", indexed: false },
      { name: "messageBody", type: "bytes", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MintAndWithdraw",
    inputs: [
      { name: "mintRecipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "mintToken", type: "address", indexed: true },
    ],
  },
] as const;

let account: Address | null = null;
let burnTxHash: Hash | null = null;
let message: Hash | null = null;
let attestation: Hash | null = null;
let eventNonce = "";

const el = {
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  fetchFees: document.querySelector<HTMLButtonElement>("#fetchFees")!,
  approve: document.querySelector<HTMLButtonElement>("#approve")!,
  burn: document.querySelector<HTMLButtonElement>("#burn")!,
  poll: document.querySelector<HTMLButtonElement>("#poll")!,
  mint: document.querySelector<HTMLButtonElement>("#mint")!,
  sender: document.querySelector<HTMLInputElement>("#sender")!,
  expectedAccount: document.querySelector<HTMLInputElement>("#expectedAccount")!,
  destination: document.querySelector<HTMLSelectElement>("#destination")!,
  recipient: document.querySelector<HTMLInputElement>("#recipient")!,
  amount: document.querySelector<HTMLInputElement>("#amount")!,
  speed: document.querySelector<HTMLSelectElement>("#speed")!,
  maxFee: document.querySelector<HTMLInputElement>("#maxFee")!,
  burnTxHash: document.querySelector<HTMLInputElement>("#burnTxHash")!,
  allowance: document.querySelector<HTMLElement>("#allowance")!,
  sourceUsdc: document.querySelector<HTMLElement>("#sourceUsdc")!,
  sourceNative: document.querySelector<HTMLElement>("#sourceNative")!,
  destUsdc: document.querySelector<HTMLElement>("#destUsdc")!,
  destNative: document.querySelector<HTMLElement>("#destNative")!,
  status: document.querySelector<HTMLElement>("#status")!,
  feesBox: document.querySelector<HTMLElement>("#feesBox")!,
  receipt: document.querySelector<HTMLElement>("#receipt")!,
};

el.expectedAccount.value = USER_WALLET;
el.recipient.value = USER_WALLET;
el.amount.value = "0.02";
el.maxFee.value = "0";

function createClient(chain: ChainKey) {
  const meta = chains[chain];
  return createPublicClient({
    chain: {
      id: meta.id,
      name: meta.name,
      nativeCurrency: meta.nativeCurrency,
      rpcUrls: { default: { http: [meta.rpcUrl] } },
      blockExplorers: { default: { name: "Explorer", url: meta.explorerUrl } },
    },
    transport: http(meta.rpcUrl),
  });
}

function setStatus(message: string): void {
  el.status.textContent = message;
}

function errorMessage(error: unknown): string {
  console.error(error);
  return error instanceof Error ? error.message : "Unknown error.";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char] ?? char;
  });
}

function chainExplorerTx(chain: ChainKey, hash: string): string {
  return `${chains[chain].explorerUrl}/tx/${hash}`;
}

function txLink(chain: ChainKey, hash: string): string {
  const url = chainExplorerTx(chain, hash);
  return `<a href="${url}" target="_blank" rel="noreferrer">${escapeHtml(hash)}</a>`;
}

function selectedDestination(): Exclude<ChainKey, "Arc_Testnet"> {
  return el.destination.value as Exclude<ChainKey, "Arc_Testnet">;
}

function selectedSpeed(): TransferSpeed {
  return el.speed.value as TransferSpeed;
}

function finalityThreshold(): 1000 | 2000 {
  return selectedSpeed() === "FAST" ? 1000 : 2000;
}

function parseAmountUnits(): bigint {
  const raw = el.amount.value.trim();
  if (!raw || Number(raw) <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  return parseUnits(raw, USDC_DECIMALS);
}

function parseFeeUnits(): bigint {
  const raw = el.maxFee.value.trim();
  if (!raw || Number(raw) < 0) {
    throw new Error("Max fee cannot be negative.");
  }
  return parseUnits(raw, USDC_DECIMALS);
}

function addressToBytes32(address: Address): Hash {
  return `0x${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}` as Hash;
}

async function requestWallet(method: string, params?: unknown[]): Promise<unknown> {
  if (!window.ethereum) {
    throw new Error("MetaMask provider not found.");
  }
  return window.ethereum.request({ method, params } as never);
}

async function ensureChain(chain: ChainKey): Promise<void> {
  const meta = chains[chain];
  try {
    await requestWallet("wallet_switchEthereumChain", [{ chainId: meta.chainId }]);
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await requestWallet("wallet_addEthereumChain", [
      {
        chainId: meta.chainId,
        chainName: meta.name,
        nativeCurrency: meta.nativeCurrency,
        rpcUrls: [meta.rpcUrl],
        blockExplorerUrls: [meta.explorerUrl],
      },
    ]);
  }
}

function assertExpectedAccount(address: Address): void {
  const expected = el.expectedAccount.value.trim();
  if (expected && address.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`Connected account must be ${expected}.`);
  }
}

async function ensureAccount(chain: ChainKey): Promise<Address> {
  if (!account) {
    await connect(chain);
  } else {
    await ensureChain(chain);
  }

  if (!account) {
    throw new Error("MetaMask account is not connected.");
  }
  return account;
}

async function readTokenBalance(chain: ChainKey, owner: Address): Promise<bigint> {
  return createClient(chain).readContract({
    address: chains[chain].usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  });
}

async function readAllowance(owner: Address): Promise<bigint> {
  return createClient("Arc_Testnet").readContract({
    address: chains.Arc_Testnet.usdc,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, BRIDGE_CONTRACT],
  });
}

function setButtons(enabled: boolean): void {
  el.refresh.disabled = !enabled;
  el.fetchFees.disabled = !enabled;
  el.approve.disabled = !enabled;
  el.burn.disabled = !enabled;
  el.poll.disabled = !enabled;
  el.mint.disabled = !enabled || !message || !attestation;
}

async function connect(chain: ChainKey = "Arc_Testnet"): Promise<void> {
  try {
    setStatus("Connecting MetaMask...");
    await ensureChain(chain);
    const accounts = (await requestWallet("eth_requestAccounts")) as Address[];
    const nextAccount = accounts[0];
    if (!nextAccount || !isAddress(nextAccount)) {
      throw new Error("No MetaMask account returned.");
    }

    assertExpectedAccount(nextAccount);
    account = nextAccount;
    el.sender.value = account;
    setButtons(true);
    await refreshBalances();
    setStatus("Ready.");
  } catch (error) {
    setStatus(errorMessage(error));
  }
}

async function refreshBalances(): Promise<void> {
  if (!account) return;

  const destination = selectedDestination();
  const [sourceUsdc, sourceNative, destUsdc, destNative, allowance] = await Promise.all([
    readTokenBalance("Arc_Testnet", account),
    createClient("Arc_Testnet").getBalance({ address: account }),
    readTokenBalance(destination, el.recipient.value.trim() as Address),
    createClient(destination).getBalance({ address: account }),
    readAllowance(account),
  ]);

  el.sourceUsdc.textContent = `${formatUnits(sourceUsdc, USDC_DECIMALS)} USDC`;
  el.sourceNative.textContent = `${formatEther(sourceNative)} USDC`;
  el.destUsdc.textContent = `${formatUnits(destUsdc, USDC_DECIMALS)} USDC`;
  el.destNative.textContent = `${formatEther(destNative)} ${chains[destination].nativeCurrency.symbol}`;
  el.allowance.textContent = `${formatUnits(allowance, USDC_DECIMALS)} USDC`;
}

function renderFees(quotes: FeeQuote[], selected: FeeQuote, feeUnits: bigint): void {
  const rows = quotes
    .map((quote) => {
      const label = quote.finalityThreshold === 1000 ? "FAST" : "STANDARD";
      return `<div><strong>${label}</strong><span>${quote.minimumFee} bps</span></div>`;
    })
    .join("");

  el.feesBox.innerHTML = `
    ${rows}
    <div><strong>selected</strong><span>${selected.finalityThreshold}</span></div>
    <div><strong>maxFee</strong><span>${formatUnits(feeUnits, USDC_DECIMALS)} USDC</span></div>
  `;
}

async function fetchFees(): Promise<void> {
  try {
    const amount = parseAmountUnits();
    const sourceDomain = chains.Arc_Testnet.domain;
    const destDomain = chains[selectedDestination()].domain;
    const response = await fetch(`/circle-iris-sandbox/v2/burn/USDC/fees/${sourceDomain}/${destDomain}`);
    if (!response.ok) {
      throw new Error(`Fee quote failed: HTTP ${response.status}`);
    }

    const quotes = (await response.json()) as FeeQuote[];
    const selected = quotes.find((quote) => quote.finalityThreshold === finalityThreshold());
    if (!selected) {
      throw new Error(`No fee quote for finality threshold ${finalityThreshold()}.`);
    }

    let feeUnits = (amount * BigInt(selected.minimumFee) + 9999n) / 10000n;
    if (selected.minimumFee > 0 && feeUnits === 0n) feeUnits = 1n;
    el.maxFee.value = formatUnits(feeUnits, USDC_DECIMALS);
    renderFees(quotes, selected, feeUnits);
    setStatus("CCTP fee quote ready.");
  } catch (error) {
    setStatus(`Fee quote failed: ${errorMessage(error)}`);
  }
}

async function waitForSourceTx(hash: Hash): Promise<void> {
  const receipt = await createClient("Arc_Testnet").waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Source transaction reverted: ${hash}`);
  }
}

async function waitForDestinationTx(chain: ChainKey, hash: Hash): Promise<void> {
  const receipt = await createClient(chain).waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Destination transaction reverted: ${hash}`);
  }
}

async function approveUsdc(): Promise<void> {
  try {
    const from = await ensureAccount("Arc_Testnet");
    const amount = parseAmountUnits();
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [BRIDGE_CONTRACT, amount],
    });

    setStatus("Waiting for MetaMask approval signature...");
    const hash = (await requestWallet("eth_sendTransaction", [{ from, to: chains.Arc_Testnet.usdc, data }])) as Hash;
    await waitForSourceTx(hash);
    await refreshBalances();
    renderReceipt({ approveTx: hash });
    setStatus("USDC approval confirmed.");
  } catch (error) {
    setStatus(`Approve failed: ${errorMessage(error)}`);
  }
}

async function burnForMint(): Promise<void> {
  try {
    const from = await ensureAccount("Arc_Testnet");
    const recipientRaw = el.recipient.value.trim();
    if (!isAddress(recipientRaw)) {
      throw new Error("Recipient must be a valid EVM address.");
    }

    const amount = parseAmountUnits();
    const allowance = await readAllowance(from);
    if (allowance < amount) {
      throw new Error("Allowance is lower than amount. Click Approve first.");
    }

    const destination = selectedDestination();
    const maxFee = parseFeeUnits();
    const bridgeParams = {
      amount,
      maxFee,
      fee: 0n,
      mintRecipient: addressToBytes32(recipientRaw),
      destinationCaller: ZERO_BYTES32,
      burnToken: chains.Arc_Testnet.usdc,
      feeRecipient: BRIDGE_CONTRACT,
      destinationDomain: chains[destination].domain,
      minFinalityThreshold: finalityThreshold(),
    };
    const data = encodeFunctionData({
      abi: bridgeContractAbi,
      functionName: "bridgeWithPreapproval",
      args: [bridgeParams],
    });

    setStatus("Waiting for MetaMask custom bridge burn signature...");
    burnTxHash = (await requestWallet("eth_sendTransaction", [{ from, to: BRIDGE_CONTRACT, data }])) as Hash;
    el.burnTxHash.value = burnTxHash;
    await waitForSourceTx(burnTxHash);
    eventNonce = "";
    renderReceipt({ burnTx: burnTxHash });
    await refreshBalances();
    setStatus("Custom bridge burn confirmed. Poll Iris attestation next.");
  } catch (error) {
    setStatus(`Burn failed: ${errorMessage(error)}`);
  }
}

async function fetchAttestationOnce(): Promise<IrisMessage | null> {
  const hashFromField = el.burnTxHash.value.trim();
  if (hashFromField) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(hashFromField)) {
      throw new Error("Burn tx hash must be 0x + 64 hex characters.");
    }
    burnTxHash = hashFromField as Hash;
  }

  if (!burnTxHash) {
    throw new Error("Burn tx hash is required.");
  }

  const response = await fetch(
    `/circle-iris-sandbox/v2/messages/${chains.Arc_Testnet.domain}?transactionHash=${burnTxHash}`,
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Iris returned HTTP ${response.status}`);
  }

  const body = (await response.json()) as IrisResponse;
  return body.messages?.[0] ?? null;
}

async function pollAttestation(): Promise<void> {
  try {
    setStatus("Polling Iris attestation...");
    const started = Date.now();
    while (Date.now() - started < 240_000) {
      const item = await fetchAttestationOnce();
      if (item?.message && item.attestation && item.status === "complete") {
        message = item.message;
        attestation = item.attestation;
        if (burnTxHash) el.burnTxHash.value = burnTxHash;
        eventNonce = item.eventNonce ?? item.decodedMessage?.nonce ?? eventNonce;
        renderReceipt({
          attestationStatus: item.status,
          message,
          eventNonce,
          decodedAmount: item.decodedMessage?.decodedMessageBody?.amount ?? "",
          feeExecuted: item.decodedMessage?.decodedMessageBody?.feeExecuted ?? "",
        });
        el.mint.disabled = false;
        setStatus("Attestation complete. Mint on destination next.");
        return;
      }

      const pendingStatus = item?.status ? `Iris status: ${item.status}` : "Iris message not indexed yet";
      setStatus(`${pendingStatus}. Waiting...`);
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }

    throw new Error("Timed out waiting for attestation.");
  } catch (error) {
    setStatus(`Attestation failed: ${errorMessage(error)}`);
  }
}

async function mintOnDestination(): Promise<void> {
  try {
    if (!message || !attestation) {
      throw new Error("Attestation is not ready. Poll Iris first.");
    }

    const destination = selectedDestination();
    const from = await ensureAccount(destination);
    const data = encodeFunctionData({
      abi: messageTransmitterAbi,
      functionName: "receiveMessage",
      args: [message, attestation],
    });

    setStatus(`Waiting for MetaMask mint signature on ${destination}...`);
    const mintTx = (await requestWallet("eth_sendTransaction", [
      { from, to: MESSAGE_TRANSMITTER_V2, data },
    ])) as Hash;
    await waitForDestinationTx(destination, mintTx);
    renderReceipt({ mintTx });
    await refreshBalances();
    setStatus("Raw CCTP mint confirmed.");
  } catch (error) {
    setStatus(`Mint failed: ${errorMessage(error)}`);
  }
}

function renderReceipt(next: Record<string, string>): void {
  const current = Object.fromEntries(
    Array.from(el.receipt.querySelectorAll<HTMLElement>("[data-key]")).map((node) => [
      node.dataset.key ?? "",
      node.dataset.value ?? "",
    ]),
  );
  const merged = { ...current, ...next };
  const destination = selectedDestination();
  const rows = [
    ["source", "Arc_Testnet"],
    ["destination", destination],
    ["amount", `${el.amount.value.trim()} USDC`],
    ["approveTx", merged.approveTx ? txLink("Arc_Testnet", merged.approveTx) : "-"],
    ["burnTx", merged.burnTx ? txLink("Arc_Testnet", merged.burnTx) : "-"],
    ["eventNonce", merged.eventNonce || "-"],
    ["attestationStatus", merged.attestationStatus || "-"],
    ["message", merged.message ? `<code>${escapeHtml(merged.message)}</code>` : "-"],
    ["decodedAmount", merged.decodedAmount ? `${formatUnits(BigInt(merged.decodedAmount), USDC_DECIMALS)} USDC` : "-"],
    ["feeExecuted", merged.feeExecuted ? `${formatUnits(BigInt(merged.feeExecuted), USDC_DECIMALS)} USDC` : "-"],
    ["mintTx", merged.mintTx ? txLink(destination, merged.mintTx) : "-"],
  ];

  el.receipt.innerHTML = rows
    .map(([key, value]) => {
      const rawValue = merged[key] ?? "";
      return `
        <div data-key="${escapeHtml(key)}" data-value="${escapeHtml(rawValue)}">
          <strong>${escapeHtml(key)}</strong>
          <span>${value}</span>
        </div>
      `;
    })
    .join("");
}

el.connect.addEventListener("click", () => void connect());
el.refresh.addEventListener("click", () => void refreshBalances());
el.fetchFees.addEventListener("click", () => void fetchFees());
el.approve.addEventListener("click", () => void approveUsdc());
el.burn.addEventListener("click", () => void burnForMint());
el.poll.addEventListener("click", () => void pollAttestation());
el.mint.addEventListener("click", () => void mintOnDestination());
el.destination.addEventListener("change", () => void refreshBalances());
el.speed.addEventListener("change", () => {
  el.maxFee.value = "0";
  message = null;
  attestation = null;
  setButtons(Boolean(account));
  el.feesBox.innerHTML = `<div><strong>fees</strong><span>-</span></div>`;
});
