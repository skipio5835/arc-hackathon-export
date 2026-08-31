import {
  ARC_TESTNET_USDC_ADDRESS,
  decimalValue,
  latestSyncReserves,
  logParameter,
  swapDirection,
  swapUsdcValue,
  syncReserves,
} from "./arc-radar-core.js";

const API_BASE = "https://testnet.arcscan.app/api/v2";
const EXPLORER_BASE = "https://testnet.arcscan.app";
const CACHE_PREFIX = "arc-meme-radar:v1:";
const WATCHLIST_STORAGE_KEY = `${CACHE_PREFIX}watchlist`;
const TRACKING_STORAGE_PREFIX = `${CACHE_PREFIX}tracking:v2:`;
const USDC_ADDRESS = ARC_TESTNET_USDC_ADDRESS;
const MARKET_FACTORY = "0x7483847D46Db2920DD64eFa676CF72dcF765814f";
const MARKET_LIMIT = 15;
const LOG_PAGE_LIMIT = 4;
const TRANSFER_PAGE_LIMIT = 3;
const DAY_MS = 86_400_000;
const DETAIL_CACHE_TTL_MS = 120_000;
const AUTO_REFRESH_MS = 60_000;
const BURN_ADDRESSES = new Set([
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dead",
]);

type MarketFilter = "all" | "watchlist" | "active" | "new" | "sells" | "risky";
type Capability = "mint" | "restrict" | "pause" | "upgrade" | "fee";
type WarningTone = "warning" | "info" | "good";
type PeriodKey = "m5" | "h1" | "h6" | "h24";
type WalletSignalCategory = "creator" | "whale" | "entry" | "exit";
type WalletSignalFilter = "all" | WalletSignalCategory;

type Token = {
  address_hash: string;
  decimals: string | null;
  holders_count: string | null;
  name: string | null;
  symbol: string | null;
  total_supply: string | null;
  type: string;
};

type AddressSummary = {
  hash?: string;
  is_contract?: boolean;
  is_verified?: boolean;
  name?: string | null;
};

type AddressDetails = {
  hash: string;
  implementations?: Array<{ address_hash?: string }>;
  is_verified?: boolean;
  proxy_type?: string | null;
};

type AbiEntry = {
  name?: string;
  stateMutability?: string;
  type?: string;
};

type ContractDetails = {
  abi?: AbiEntry[] | null;
  is_fully_verified?: boolean;
  is_verified?: boolean;
};

type TransactionDetails = {
  from?: AddressSummary;
};

type LogParameter = {
  name?: string;
  value?: string;
};

type AddressLog = {
  block_timestamp?: string;
  decoded?: { method_call?: string; parameters?: LogParameter[] } | null;
  index?: number;
  transaction_hash?: string;
};

type LogPageParams = Record<string, string | number>;
type LogResponse = { items?: AddressLog[]; next_page_params?: LogPageParams | null };
type TokenBalance = { token: Token; value: string };
type TokenHolder = { address?: AddressSummary; value: string };
type HolderResponse = { items?: TokenHolder[] };

type TokenTransfer = {
  from?: AddressSummary;
  log_index?: number;
  timestamp?: string;
  to?: AddressSummary;
  total?: { decimals?: string | null; value?: string | null };
  transaction_hash?: string;
  type?: string;
};

type TransferResponse = { items?: TokenTransfer[]; next_page_params?: LogPageParams | null };

type PairSeed = {
  createdAt: string;
  creationTx: string;
  pairAddress: string;
  token0: string;
  token1: string;
  tokenAddress: string;
};

type PricePoint = {
  price: number;
  timestamp: string;
};

type MarketTrade = {
  direction: "buy" | "sell";
  fallbackAddress: string | null;
  timestamp: string;
  transactionHash: string;
  usdcValue: number;
};

type LiquidityEvent = {
  changePercent: number | null;
  direction: "add" | "remove";
  fallbackAddress: string | null;
  timestamp: string;
  tokenAmount: number;
  transactionHash: string;
  usdcAmount: number;
};

type PeriodMetrics = {
  buyCount: number;
  netFlowUsdc: number;
  priceChange: number | null;
  sellCount: number;
  swapCount: number;
  volumeUsdc: number;
};

type MarketPeriods = Record<PeriodKey, PeriodMetrics>;

type MarketPair = PairSeed & {
  buyCount: number;
  currentPrice: number;
  fdv: number;
  historyTruncated: boolean;
  lastSellAt: string | null;
  lastTradeAt: string | null;
  liquidityEvents: LiquidityEvent[];
  periods: MarketPeriods;
  priceChange: number | null;
  pricePoints: PricePoint[];
  reserveSource: "sync" | "balance";
  sellCount: number;
  stale: boolean;
  swapCount: number;
  token: Token;
  tokenReserve: number;
  totalLiquidity: number;
  trades: MarketTrade[];
  usdcReserve: number;
  volumeUsdc: number;
};

type HolderPosition = {
  address: string;
  balance: number;
  isContract: boolean;
  isCreator: boolean;
  name: string | null;
  share: number | null;
};

type HolderConnection = {
  addressA: string;
  addressB: string;
  kind: "direct" | "shared-source";
  source: string | null;
  transactionHash: string | null;
};

type HolderCluster = {
  members: string[];
  share: number;
};

type ObservedAlert = {
  detail: string;
  observedAt: string;
  title: string;
  tone: "warning" | "info" | "good";
  type: "system" | "liquidity" | "price" | "holders" | "sell" | "ownership" | "lp";
};

type MarketSnapshot = {
  holderCount: number | null;
  price: number;
  sellCount: number;
  timestamp: string;
  usdcReserve: number;
};

type DetailSnapshot = {
  creatorShare: number | null;
  lpBurnedShare: number | null;
  timestamp: string;
  top10Share: number | null;
};

type TokenTracking = {
  alerts: ObservedAlert[];
  detailSnapshot?: DetailSnapshot;
  marketSnapshot?: MarketSnapshot;
  startedAt: string;
};

type WalletSignal = {
  amount: number;
  categories: WalletSignalCategory[];
  detail: string;
  fromAddress: string;
  share: number | null;
  timestamp: string;
  title: string;
  toAddress: string;
  tone: "warning" | "info" | "good";
  transactionHash: string;
};

type MarketDetail = {
  burnedTokenShare: number | null;
  capabilities: Capability[];
  contractVisible: boolean;
  creatorShare: number | null;
  holderClusters: HolderCluster[];
  holderConnections: HolderConnection[];
  holderPositions: HolderPosition[];
  lpBurnedShare: number | null;
  lpTopHolderIsContract: boolean;
  lpTopHolderShare: number | null;
  poolShare: number | null;
  top1Share: number | null;
  top5Share: number | null;
  top10Share: number | null;
  transferHistoryTruncated: boolean;
  transactionSenders: Record<string, string>;
  walletSignals: WalletSignal[];
};

type RiskWarning = {
  detail: string;
  title: string;
  tone: WarningTone;
};

type CacheEntry<T> = { data: T; savedAt: number };
type FetchResult<T> = { data: T; stale: boolean };
type LogHistory = { items: AddressLog[]; stale: boolean; truncated: boolean };
type TransferHistory = { items: TokenTransfer[]; stale: boolean; truncated: boolean };
type DetailCacheEntry = { data: MarketDetail; savedAt: number };

let markets: MarketPair[] = [];
let selectedPair = "";
let activeQuery = "";
let activeFilter: MarketFilter = "all";
let activeWalletSignalFilter: WalletSignalFilter = "all";
let loading = false;
let detailRequest = 0;
let lastRefreshAt = 0;
let watchlist = readWatchlist();
const detailCache = new Map<string, DetailCacheEntry>();

function byId<T extends Element = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as unknown as T;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svgNode<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function shortHash(value: string | null | undefined, start = 7, end = 5): string {
  if (!value) return "--";
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const value = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return value ? JSON.parse(value) as CacheEntry<T> : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Live data remains usable when browser storage is unavailable or full.
  }
}

function readWatchlist(): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(stored)) return new Set();
    return new Set(stored.filter((value): value is string => typeof value === "string").map((value) => value.toLowerCase()));
  } catch {
    return new Set();
  }
}

function saveWatchlist(): void {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([...watchlist]));
  } catch {
    // Watchlist remains available for the current tab when storage is unavailable.
  }
}

function readTracking(address: string): TokenTracking | null {
  try {
    const raw = localStorage.getItem(`${TRACKING_STORAGE_PREFIX}${address.toLowerCase()}`);
    return raw ? JSON.parse(raw) as TokenTracking : null;
  } catch {
    return null;
  }
}

function saveTracking(address: string, tracking: TokenTracking): void {
  try {
    localStorage.setItem(`${TRACKING_STORAGE_PREFIX}${address.toLowerCase()}`, JSON.stringify(tracking));
  } catch {
    // Tracking continues in memory through the current render when storage is unavailable.
  }
}

function appendObservedAlerts(tracking: TokenTracking, alerts: ObservedAlert[]): void {
  if (alerts.length === 0) return;
  tracking.alerts = [...alerts, ...(tracking.alerts ?? [])].slice(0, 30);
}

async function fetchData<T>(path: string, ttlMs: number, force = false): Promise<FetchResult<T>> {
  const key = path.replace(/[^a-z0-9]+/gi, "-");
  const cached = readCache<T>(key);
  if (!force && cached && Date.now() - cached.savedAt < ttlMs) return { data: cached.data, stale: false };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new Error(`ArcScan returned HTTP ${response.status}`);
    const data = await response.json() as T;
    writeCache(key, data);
    return { data, stale: false };
  } catch (error) {
    if (cached) return { data: cached.data, stale: true };
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchOptional<T>(path: string, ttlMs: number, force = false): Promise<T | null> {
  try {
    return (await fetchData<T>(path, ttlMs, force)).data;
  } catch {
    return null;
  }
}

async function fetchAddressLogs(address: string, ttlMs: number, force: boolean, cutoffMs: number): Promise<LogHistory> {
  const items: AddressLog[] = [];
  const seen = new Set<string>();
  let nextPath = `/addresses/${address}/logs`;
  let stale = false;
  let truncated = false;
  for (let page = 0; page < LOG_PAGE_LIMIT; page += 1) {
    const result = await fetchData<LogResponse>(nextPath, ttlMs, force);
    stale ||= result.stale;
    for (const log of result.data.items ?? []) {
      const key = `${log.transaction_hash ?? ""}:${log.index ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(log);
    }
    const oldestTimestamp = items.at(-1)?.block_timestamp;
    if (oldestTimestamp && new Date(oldestTimestamp).getTime() <= cutoffMs) break;
    const next = result.data.next_page_params;
    if (!next) break;
    if (page === LOG_PAGE_LIMIT - 1) {
      truncated = true;
      break;
    }
    const query = new URLSearchParams(Object.entries(next).map(([name, value]) => [name, String(value)])).toString();
    nextPath = `/addresses/${address}/logs?${query}`;
  }
  return { items, stale, truncated };
}

async function fetchTokenTransfers(address: string, force: boolean): Promise<TransferHistory> {
  const items: TokenTransfer[] = [];
  const seen = new Set<string>();
  let nextPath = `/tokens/${address}/transfers`;
  let stale = false;
  let truncated = false;
  for (let page = 0; page < TRANSFER_PAGE_LIMIT; page += 1) {
    const result = await fetchData<TransferResponse>(nextPath, 120_000, force);
    stale ||= result.stale;
    for (const transfer of result.data.items ?? []) {
      const key = `${transfer.transaction_hash ?? ""}:${transfer.log_index ?? ""}:${transfer.type ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(transfer);
    }
    const next = result.data.next_page_params;
    if (!next) break;
    if (page === TRANSFER_PAGE_LIMIT - 1) {
      truncated = true;
      break;
    }
    const query = new URLSearchParams(Object.entries(next).map(([name, value]) => [name, String(value)])).toString();
    nextPath = `/tokens/${address}/transfers?${query}`;
  }
  items.sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());
  return { items, stale, truncated };
}

function fullNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(number);
}

function formatValue(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return "--";
  if (value >= 1_000) return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  if (value > 0 && value < 0.01) return "<0.01";
  return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

interface PriceFormat {
  full: string;
  leadingZeros: number | null;
  significant: string;
  text: string;
}

const SUBSCRIPT_DIGITS = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];

function subscriptNumber(value: number): string {
  return String(value).split("").map((digit) => SUBSCRIPT_DIGITS[Number(digit)]).join("");
}

function formatFullPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "--";
  const exponent = Math.floor(Math.log10(value));
  const fractionDigits = exponent < 0 ? Math.min(20, Math.max(9, -exponent + 5)) : 4;
  return value.toLocaleString("en", { maximumFractionDigits: fractionDigits });
}

function priceFormat(value: number): PriceFormat {
  if (!Number.isFinite(value) || value <= 0) return { full: "--", leadingZeros: null, significant: "", text: "--" };
  const full = formatFullPrice(value);
  if (value >= 1) {
    const text = value.toLocaleString("en", { maximumFractionDigits: 4 });
    return { full, leadingZeros: null, significant: "", text };
  }
  if (value >= 0.01) {
    const text = value.toLocaleString("en", { maximumFractionDigits: 6 });
    return { full, leadingZeros: null, significant: "", text };
  }
  if (value >= 0.0001) {
    const text = value.toLocaleString("en", { maximumFractionDigits: 9 });
    return { full, leadingZeros: null, significant: "", text };
  }

  const [coefficient, exponentText] = value.toExponential(3).split("e");
  const leadingZeros = Math.max(1, -Number(exponentText) - 1);
  const significant = coefficient.replace(".", "").replace(/0+$/, "");
  return {
    full,
    leadingZeros,
    significant,
    text: `0.0${subscriptNumber(leadingZeros)}${significant}`,
  };
}

function formatPrice(value: number): string {
  return priceFormat(value).text;
}

function priceElement(value: number, includeUnit = false): HTMLElement {
  const formatted = priceFormat(value);
  const node = element("strong", "price-value");
  if (formatted.leadingZeros === null) {
    node.textContent = formatted.text;
  } else {
    node.append("0.0", element("sub", "price-zero-count", String(formatted.leadingZeros)), formatted.significant);
  }
  if (includeUnit) node.append(element("span", "price-unit", "USDC"));
  node.title = formatted.full === "--" ? "Price unavailable" : `${formatted.full} USDC`;
  node.setAttribute("aria-label", formatted.full === "--" ? "Price unavailable" : `${formatted.full} USDC`);
  return node;
}

function formatChange(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "No price history";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function compactChange(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatSignedUsdc(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 0.0005) return "0 USDC";
  return `${value > 0 ? "+" : "-"}${formatValue(Math.abs(value), 3)} USDC`;
}

function relativeTime(value: string | null | undefined): string {
  if (!value) return "--";
  const milliseconds = new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) return "--";
  const seconds = Math.max(0, Math.floor((Date.now() - milliseconds) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h`;
  if (seconds < 2_592_000) return `${Math.floor(seconds / 86_400)}d`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function pairSeeds(response: LogResponse): PairSeed[] {
  const seen = new Set<string>();
  const seeds: PairSeed[] = [];
  for (const log of response.items ?? []) {
    if (!log.decoded?.method_call?.startsWith("PairCreated(")) continue;
    const token0 = logParameter(log, "token0");
    const token1 = logParameter(log, "token1");
    const pairAddress = logParameter(log, "pair");
    if (!token0 || !token1 || !pairAddress) continue;
    const token0Lower = token0.toLowerCase();
    const token1Lower = token1.toLowerCase();
    if (token0Lower !== USDC_ADDRESS && token1Lower !== USDC_ADDRESS) continue;
    const key = pairAddress.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    seeds.push({
      createdAt: log.block_timestamp ?? "",
      creationTx: log.transaction_hash ?? "",
      pairAddress,
      token0,
      token1,
      tokenAddress: token0Lower === USDC_ADDRESS ? token1 : token0,
    });
  }
  return seeds;
}

function syncPrice(log: AddressLog, seed: PairSeed, tokenDecimals: string | null): PricePoint | null {
  const reserves = syncReserves(log, seed, tokenDecimals);
  if (!reserves || reserves.tokenReserve <= 0 || reserves.usdcReserve <= 0) return null;
  return { price: reserves.usdcReserve / reserves.tokenReserve, timestamp: log.block_timestamp ?? "" };
}

function liquidityEventsFromLogs(logs: AddressLog[], seed: PairSeed, tokenDecimals: string | null): LiquidityEvent[] {
  const syncByTransaction = new Map<string, AddressLog[]>();
  for (const log of logs) {
    if (!log.decoded?.method_call?.startsWith("Sync(") || !log.transaction_hash) continue;
    const key = log.transaction_hash.toLowerCase();
    syncByTransaction.set(key, [...(syncByTransaction.get(key) ?? []), log]);
  }
  const tokenIs0 = seed.token0.toLowerCase() !== USDC_ADDRESS;
  const events: LiquidityEvent[] = [];
  for (const log of logs) {
    const method = log.decoded?.method_call ?? "";
    const direction = method.startsWith("Mint(") ? "add" : method.startsWith("Burn(") ? "remove" : null;
    if (!direction || !log.transaction_hash) continue;
    const amount0 = logParameter(log, "amount0");
    const amount1 = logParameter(log, "amount1");
    if (!amount0 || !amount1) continue;
    const tokenAmount = decimalValue(tokenIs0 ? amount0 : amount1, tokenDecimals);
    const usdcAmount = decimalValue(tokenIs0 ? amount1 : amount0, 6);
    if (tokenAmount <= 0 && usdcAmount <= 0) continue;

    const sync = [...(syncByTransaction.get(log.transaction_hash.toLowerCase()) ?? [])]
      .sort((a, b) => Math.abs((a.index ?? 0) - (log.index ?? 0)) - Math.abs((b.index ?? 0) - (log.index ?? 0)))[0];
    const reservesAfter = sync ? syncReserves(sync, seed, tokenDecimals) : null;
    const reserveBefore = reservesAfter
      ? direction === "add" ? reservesAfter.usdcReserve - usdcAmount : reservesAfter.usdcReserve + usdcAmount
      : 0;
    const changePercent = reserveBefore > 0 ? (usdcAmount / reserveBefore) * 100 : null;
    events.push({
      changePercent,
      direction,
      fallbackAddress: logParameter(log, direction === "add" ? "sender" : "to"),
      timestamp: log.block_timestamp ?? "",
      tokenAmount,
      transactionHash: log.transaction_hash,
      usdcAmount,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 12);
}

function tradeFromLog(log: AddressLog, seed: PairSeed): MarketTrade | null {
  const direction = swapDirection(log, seed);
  if (!direction) return null;
  return {
    direction,
    fallbackAddress: logParameter(log, "to"),
    timestamp: log.block_timestamp ?? "",
    transactionHash: log.transaction_hash ?? "",
    usdcValue: swapUsdcValue(log, seed),
  };
}

function windowPriceChange(pricePoints: PricePoint[], currentPrice: number, cutoffMs: number): number | null {
  if (currentPrice <= 0 || pricePoints.length === 0) return null;
  const beforeCutoff = pricePoints.filter((point) => new Date(point.timestamp).getTime() <= cutoffMs).at(-1);
  const firstInWindow = pricePoints.find((point) => new Date(point.timestamp).getTime() > cutoffMs);
  const baseline = beforeCutoff ?? firstInWindow;
  if (!baseline || baseline.price <= 0) return null;
  return ((currentPrice - baseline.price) / baseline.price) * 100;
}

function periodMetrics(trades: MarketTrade[], pricePoints: PricePoint[], currentPrice: number, durationMs: number, nowMs: number): PeriodMetrics {
  const cutoff = nowMs - durationMs;
  const windowTrades = trades.filter((trade) => new Date(trade.timestamp).getTime() >= cutoff);
  const buys = windowTrades.filter((trade) => trade.direction === "buy");
  const sells = windowTrades.filter((trade) => trade.direction === "sell");
  return {
    buyCount: buys.length,
    netFlowUsdc: buys.reduce((sum, trade) => sum + trade.usdcValue, 0) - sells.reduce((sum, trade) => sum + trade.usdcValue, 0),
    priceChange: windowPriceChange(pricePoints, currentPrice, cutoff),
    sellCount: sells.length,
    swapCount: windowTrades.length,
    volumeUsdc: windowTrades.reduce((sum, trade) => sum + trade.usdcValue, 0),
  };
}

function marketPeriods(trades: MarketTrade[], pricePoints: PricePoint[], currentPrice: number, nowMs: number): MarketPeriods {
  return {
    m5: periodMetrics(trades, pricePoints, currentPrice, 5 * 60_000, nowMs),
    h1: periodMetrics(trades, pricePoints, currentPrice, 60 * 60_000, nowMs),
    h6: periodMetrics(trades, pricePoints, currentPrice, 6 * 60 * 60_000, nowMs),
    h24: periodMetrics(trades, pricePoints, currentPrice, DAY_MS, nowMs),
  };
}

function snapshotForMarket(market: MarketPair): MarketSnapshot {
  const holderCount = market.token.holders_count === null ? null : Number(market.token.holders_count);
  return {
    holderCount: holderCount !== null && Number.isFinite(holderCount) ? holderCount : null,
    price: market.currentPrice,
    sellCount: market.sellCount,
    timestamp: new Date().toISOString(),
    usdcReserve: market.usdcReserve,
  };
}

function startTracking(market: MarketPair): TokenTracking {
  const now = new Date().toISOString();
  const tracking: TokenTracking = readTracking(market.tokenAddress) ?? {
    alerts: [],
    startedAt: now,
  };
  if (!tracking.marketSnapshot) {
    tracking.marketSnapshot = snapshotForMarket(market);
    appendObservedAlerts(tracking, [{
      detail: "A local market and risk baseline was recorded for this token.",
      observedAt: now,
      title: "Watch started",
      tone: "info",
      type: "system",
    }]);
  }
  saveTracking(market.tokenAddress, tracking);
  return tracking;
}

function observeMarketChanges(market: MarketPair): void {
  if (market.stale || !watchlist.has(market.tokenAddress.toLowerCase())) return;
  const tracking = readTracking(market.tokenAddress) ?? startTracking(market);
  const previous = tracking.marketSnapshot;
  const next = snapshotForMarket(market);
  if (!previous) {
    tracking.marketSnapshot = next;
    saveTracking(market.tokenAddress, tracking);
    return;
  }

  const alerts: ObservedAlert[] = [];
  const observedAt = next.timestamp;
  if (previous.usdcReserve > 0) {
    const reserveChange = ((next.usdcReserve - previous.usdcReserve) / previous.usdcReserve) * 100;
    if (Math.abs(reserveChange) >= 10 && Math.abs(next.usdcReserve - previous.usdcReserve) >= 0.001) {
      alerts.push({
        detail: `USDC exit-side changed from ${formatValue(previous.usdcReserve, 3)} to ${formatValue(next.usdcReserve, 3)} (${reserveChange > 0 ? "+" : ""}${reserveChange.toFixed(1)}%).`,
        observedAt,
        title: reserveChange < 0 ? "Liquidity dropped" : "Liquidity increased",
        tone: reserveChange < 0 ? "warning" : "good",
        type: "liquidity",
      });
    }
  }
  if (previous.price > 0 && next.price > 0) {
    const priceChange = ((next.price - previous.price) / previous.price) * 100;
    if (Math.abs(priceChange) >= 30) {
      alerts.push({
        detail: `Pool price moved ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}% from the previous observed baseline.`,
        observedAt,
        title: priceChange < 0 ? "Price moved sharply down" : "Price moved sharply up",
        tone: priceChange < 0 ? "warning" : "info",
        type: "price",
      });
    }
  }
  if (next.holderCount !== null && previous.holderCount !== null && next.holderCount !== previous.holderCount) {
    const difference = next.holderCount - previous.holderCount;
    alerts.push({
      detail: `Indexed holder count changed from ${fullNumber(previous.holderCount)} to ${fullNumber(next.holderCount)}.`,
      observedAt,
      title: difference > 0 ? `${difference} holder${difference === 1 ? "" : "s"} added` : `${Math.abs(difference)} holder${difference === -1 ? "" : "s"} left`,
      tone: difference > 0 ? "good" : "warning",
      type: "holders",
    });
  }
  if (next.sellCount > previous.sellCount) {
    const difference = next.sellCount - previous.sellCount;
    alerts.push({
      detail: `${difference} additional token-to-USDC sell${difference === 1 ? " was" : "s were"} indexed.`,
      observedAt,
      title: previous.sellCount === 0 ? "First sell observed" : "New sell observed",
      tone: "good",
      type: "sell",
    });
  }
  appendObservedAlerts(tracking, alerts);
  tracking.marketSnapshot = next;
  saveTracking(market.tokenAddress, tracking);
}

function observeDetailChanges(market: MarketPair, detail: MarketDetail): void {
  if (!watchlist.has(market.tokenAddress.toLowerCase())) return;
  const tracking = readTracking(market.tokenAddress) ?? startTracking(market);
  const next: DetailSnapshot = {
    creatorShare: detail.creatorShare,
    lpBurnedShare: detail.lpBurnedShare,
    timestamp: new Date().toISOString(),
    top10Share: detail.top10Share,
  };
  const previous = tracking.detailSnapshot;
  if (previous) {
    const alerts: ObservedAlert[] = [];
    if (previous.top10Share !== null && next.top10Share !== null && Math.abs(next.top10Share - previous.top10Share) >= 3) {
      const difference = next.top10Share - previous.top10Share;
      alerts.push({
        detail: `Top 10 non-pool ownership changed from ${shareText(previous.top10Share)} to ${shareText(next.top10Share)}.`,
        observedAt: next.timestamp,
        title: difference > 0 ? "Holder concentration increased" : "Holder concentration decreased",
        tone: difference > 0 ? "warning" : "good",
        type: "ownership",
      });
    }
    if (previous.creatorShare !== null && next.creatorShare !== null && Math.abs(next.creatorShare - previous.creatorShare) >= 1) {
      const difference = next.creatorShare - previous.creatorShare;
      alerts.push({
        detail: `Pool creator holding changed from ${shareText(previous.creatorShare)} to ${shareText(next.creatorShare)}.`,
        observedAt: next.timestamp,
        title: difference < 0 ? "Pool creator reduced holdings" : "Pool creator holdings increased",
        tone: difference < 0 ? "warning" : "info",
        type: "ownership",
      });
    }
    if (previous.lpBurnedShare !== null && next.lpBurnedShare !== null && Math.abs(next.lpBurnedShare - previous.lpBurnedShare) >= 1) {
      const difference = next.lpBurnedShare - previous.lpBurnedShare;
      alerts.push({
        detail: `LP tokens held by burn addresses changed from ${shareText(previous.lpBurnedShare)} to ${shareText(next.lpBurnedShare)}.`,
        observedAt: next.timestamp,
        title: difference > 0 ? "More LP tokens burned" : "Burned LP share decreased",
        tone: difference > 0 ? "good" : "warning",
        type: "lp",
      });
    }
    appendObservedAlerts(tracking, alerts);
  }
  tracking.detailSnapshot = next;
  saveTracking(market.tokenAddress, tracking);
}

async function mapLimited<T, R>(values: T[], limit: number, mapper: (value: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(values.length);
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(values[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return output;
}

async function loadMarketPair(seed: PairSeed, force: boolean): Promise<MarketPair | null> {
  try {
    const nowMs = Date.now();
    const [tokenResult, logResult] = await Promise.all([
      fetchData<Token>(`/tokens/${seed.tokenAddress}`, 300_000, force),
      fetchAddressLogs(seed.pairAddress, 30_000, force, nowMs - DAY_MS),
    ]);
    const token = tokenResult.data;
    const logs = logResult.items;
    const latestSync = latestSyncReserves(logs, seed, token.decimals);
    let tokenReserve = latestSync?.tokenReserve ?? 0;
    let usdcReserve = latestSync?.usdcReserve ?? 0;
    let balanceStale = false;
    const reserveSource: MarketPair["reserveSource"] = latestSync ? "sync" : "balance";
    if (!latestSync) {
      const balanceResult = await fetchData<TokenBalance[]>(`/addresses/${seed.pairAddress}/token-balances`, 30_000, force);
      const tokenBalance = balanceResult.data.find((balance) => balance.token.address_hash.toLowerCase() === seed.tokenAddress.toLowerCase());
      const usdcBalance = balanceResult.data.find((balance) => balance.token.address_hash.toLowerCase() === USDC_ADDRESS);
      tokenReserve = decimalValue(tokenBalance?.value, tokenBalance?.token.decimals);
      usdcReserve = decimalValue(usdcBalance?.value, usdcBalance?.token.decimals);
      balanceStale = balanceResult.stale;
    }
    const currentPrice = tokenReserve > 0 ? usdcReserve / tokenReserve : 0;
    const supply = decimalValue(token.total_supply, token.decimals);
    const swaps = logs.filter((log) => log.decoded?.method_call?.startsWith("Swap("));
    const trades = swaps
      .map((log) => tradeFromLog(log, seed))
      .filter((trade): trade is MarketTrade => trade !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const buys = trades.filter((trade) => trade.direction === "buy");
    const sells = trades.filter((trade) => trade.direction === "sell");
    const liquidityEvents = liquidityEventsFromLogs(logs, seed, token.decimals);
    const pricePoints = logs
      .map((log) => syncPrice(log, seed, token.decimals))
      .filter((point): point is PricePoint => point !== null)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (currentPrice > 0 && pricePoints.length === 0) pricePoints.push({ price: currentPrice, timestamp: seed.createdAt });
    const firstPrice = pricePoints[0]?.price;
    const priceChange = firstPrice && currentPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : null;
    const market: MarketPair = {
      ...seed,
      buyCount: buys.length,
      currentPrice,
      fdv: currentPrice * supply,
      historyTruncated: logResult.truncated,
      lastSellAt: sells[0]?.timestamp ?? null,
      lastTradeAt: trades[0]?.timestamp ?? null,
      liquidityEvents,
      periods: marketPeriods(trades, pricePoints, currentPrice, nowMs),
      priceChange,
      pricePoints,
      reserveSource,
      sellCount: sells.length,
      stale: tokenResult.stale || logResult.stale || balanceStale,
      swapCount: trades.length,
      token,
      tokenReserve,
      totalLiquidity: usdcReserve * 2,
      trades,
      usdcReserve,
      volumeUsdc: trades.reduce((sum, trade) => sum + trade.usdcValue, 0),
    };
    observeMarketChanges(market);
    return market;
  } catch {
    return null;
  }
}

function lightweightRisk(market: MarketPair): number {
  return (market.sellCount === 0 ? 2 : 0) + (market.usdcReserve < 10 ? 2 : market.usdcReserve < 100 ? 1 : 0);
}

function visibleMarkets(): MarketPair[] {
  const query = activeQuery.toLowerCase();
  const filtered = markets.filter((market) => {
    const matchesQuery = !query || [market.token.name, market.token.symbol, market.tokenAddress, market.pairAddress]
      .some((value) => value?.toLowerCase().includes(query));
    if (!matchesQuery) return false;
    if (activeFilter === "watchlist") return watchlist.has(market.tokenAddress.toLowerCase());
    if (activeFilter === "active") return market.periods.h24.swapCount > 0;
    if (activeFilter === "new") return Date.now() - new Date(market.createdAt).getTime() <= 7 * 86_400_000;
    if (activeFilter === "sells") return market.sellCount > 0;
    if (activeFilter === "risky") return lightweightRisk(market) >= 2;
    return true;
  });
  return filtered.sort((a, b) => {
    if (activeFilter === "active") return b.periods.h24.volumeUsdc - a.periods.h24.volumeUsdc
      || b.periods.h24.swapCount - a.periods.h24.swapCount
      || new Date(b.lastTradeAt ?? 0).getTime() - new Date(a.lastTradeAt ?? 0).getTime();
    if (activeFilter === "sells") return b.sellCount - a.sellCount;
    if (activeFilter === "risky") return lightweightRisk(b) - lightweightRisk(a);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function renderMarketSummary(): void {
  const shown = visibleMarkets();
  const trades = shown.reduce((sum, market) => sum + market.swapCount, 0);
  const liquidity = shown.reduce((sum, market) => sum + market.totalLiquidity, 0);
  const partial = shown.filter((market) => market.historyTruncated).length;
  byId("marketSummary").textContent = `${shown.length} newest pools · ${trades} indexed swaps · ${formatValue(liquidity)} USDC liquidity${partial > 0 ? ` · ${partial} partial histories` : ""}`;
}

function renderMarketPulse(): void {
  const period = markets.map((market) => market.periods.h24);
  const volume = period.reduce((sum, metrics) => sum + metrics.volumeUsdc, 0);
  const buys = period.reduce((sum, metrics) => sum + metrics.buyCount, 0);
  const sells = period.reduce((sum, metrics) => sum + metrics.sellCount, 0);
  const netFlow = period.reduce((sum, metrics) => sum + metrics.netFlowUsdc, 0);
  const newest = [...markets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const sellVerified = markets.filter((market) => market.sellCount > 0).length;
  const partial = markets.filter((market) => market.historyTruncated).length;

  byId("pulseVolume").textContent = `${formatValue(volume, 3)} USDC`;
  byId("pulseTrades").textContent = `${buys} / ${sells}`;
  const net = byId("pulseNetFlow");
  net.textContent = formatSignedUsdc(netFlow);
  net.className = changeClass(netFlow);
  byId("pulseNewest").textContent = newest ? newest.token.symbol || newest.token.name || "Unknown" : "--";
  byId("pulseNewestAge").textContent = newest ? `${relativeTime(newest.createdAt)} old` : "No pool indexed";
  byId("pulseSellVerified").textContent = `${sellVerified} / ${markets.length}`;
  const swapTotal = buys + sells;
  const coverage = partial > 0 ? ` · ${partial} pool${partial === 1 ? "" : "s"} partial` : "";
  byId("pulseStatus").textContent = swapTotal > 0 ? `${swapTotal} swaps indexed in the last 24 hours${coverage}` : `No swaps indexed in the available 24-hour history${coverage}`;
}

function changeClass(value: number | null): string {
  if (value === null || Math.abs(value) < 0.05) return "neutral";
  return value > 0 ? "positive" : "negative";
}

function renderMarketRows(): void {
  const container = byId("marketRows");
  container.replaceChildren();
  const shown = visibleMarkets();
  renderMarketSummary();
  renderMarketPulse();
  if (shown.length === 0) {
    const message = activeFilter === "active"
      ? "No token has indexed trading activity in the last 24 hours."
      : activeFilter === "watchlist" ? "No token is currently on this browser's watchlist." : "No token matches this view.";
    container.append(element("div", "market-loading-row", message));
    return;
  }
  for (const market of shown) {
    const row = element("button", "market-row");
    row.type = "button";
    const isSelected = selectedPair === market.pairAddress.toLowerCase();
    row.classList.toggle("selected", isSelected);
    row.classList.toggle("risky", lightweightRisk(market) >= 2);
    row.setAttribute("aria-pressed", String(isSelected));
    row.setAttribute("aria-label", `Open ${market.token.symbol || market.token.name || "token"} market`);

    const identity = element("span", "market-token");
    const icon = element("span", "market-token-icon", (market.token.symbol || market.token.name || "?").slice(0, 2).toUpperCase());
    const copy = element("span", "market-token-copy");
    const watched = watchlist.has(market.tokenAddress.toLowerCase());
    copy.append(
      element("strong", watched ? "watched-token" : "", `${watched ? "★ " : ""}${market.token.symbol || "Unknown"}`),
      element("span", "", market.token.name || shortHash(market.tokenAddress)),
      element("small", "", `${fullNumber(market.token.holders_count)} holders`),
    );
    identity.append(icon, copy);

    const price = element("span", "market-cell price-cell");
    price.append(priceElement(market.currentPrice), element("small", changeClass(market.periods.m5.priceChange), `5M ${compactChange(market.periods.m5.priceChange)}`));
    const pulse = element("span", "market-cell pulse-cell");
    pulse.append(
      element("strong", changeClass(market.periods.h1.priceChange), `1H ${compactChange(market.periods.h1.priceChange)}`),
      element("small", changeClass(market.periods.h24.priceChange), `24H ${compactChange(market.periods.h24.priceChange)} · ${formatValue(market.periods.h24.volumeUsdc, 3)} USDC${market.historyTruncated ? " · partial" : ""}`),
    );
    const liquidity = element("span", "market-cell");
    liquidity.append(element("strong", "", `${formatValue(market.totalLiquidity)} USDC`), element("small", "", `${formatValue(market.usdcReserve)} exit side`));

    const flow = element("span", "row-flow");
    const counts = element("strong");
    counts.append(element("span", "positive", `B ${market.buyCount}`), element("span", "negative", `S ${market.sellCount}`));
    const track = element("span", "mini-flow-track");
    const total = Math.max(1, market.buyCount + market.sellCount);
    const buyBar = element("span");
    const sellBar = element("span");
    buyBar.style.width = `${(market.buyCount / total) * 100}%`;
    sellBar.style.width = `${(market.sellCount / total) * 100}%`;
    track.append(buyBar, sellBar);
    flow.append(counts, track, element("small", "", `${formatValue(market.volumeUsdc, 3)} USDC`));

    const age = element("span", "market-cell");
    age.append(element("strong", "", relativeTime(market.createdAt)), element("small", "", market.lastTradeAt ? `trade ${relativeTime(market.lastTradeAt)}` : "no trades"));
    row.append(identity, price, pulse, liquidity, flow, age);
    row.addEventListener("click", () => void selectMarket(market, true));
    container.append(row);
  }
}

function holderShare(raw: string | number | null | undefined, totalSupply: string | null | undefined): number | null {
  const amount = Number(raw);
  const total = Number(totalSupply);
  if (!Number.isFinite(amount) || !Number.isFinite(total) || total <= 0) return null;
  return (amount / total) * 100;
}

function classifyWalletSignals(
  market: MarketPair,
  transfers: TokenTransfer[],
  holders: TokenHolder[],
  creatorAddress: string | null,
): WalletSignal[] {
  const pair = market.pairAddress.toLowerCase();
  const creator = creatorAddress?.toLowerCase() ?? null;
  const currentHolders = new Set(holders
    .filter((holder) => Number(holder.value || 0) > 0 && holder.address?.hash)
    .map((holder) => holder.address!.hash!.toLowerCase()));
  const topHolders = new Set(holders
    .filter((holder) => {
      const hash = holder.address?.hash?.toLowerCase();
      return Boolean(hash && hash !== pair && !BURN_ADDRESSES.has(hash));
    })
    .slice(0, 10)
    .map((holder) => holder.address!.hash!.toLowerCase()));
  const chronological = [...transfers].sort((a, b) => new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime());
  const seenReceivers = new Set<string>();
  const signals: WalletSignal[] = [];
  const createdAt = new Date(market.createdAt).getTime();

  for (const transfer of chronological) {
    if (transfer.type !== "token_transfer") continue;
    const fromAddress = transfer.from?.hash;
    const toAddress = transfer.to?.hash;
    if (!fromAddress || !toAddress || !transfer.timestamp || !transfer.transaction_hash) continue;
    const from = fromAddress.toLowerCase();
    const to = toAddress.toLowerCase();
    const firstIndexedReceipt = !seenReceivers.has(to);
    seenReceivers.add(to);

    const timestamp = new Date(transfer.timestamp).getTime();
    if (transfer.transaction_hash.toLowerCase() === market.creationTx.toLowerCase()) continue;
    if (Number.isFinite(createdAt) && timestamp < createdAt) continue;
    if (BURN_ADDRESSES.has(from) || BURN_ADDRESSES.has(to)) continue;

    const amount = decimalValue(transfer.total?.value, transfer.total?.decimals ?? market.token.decimals);
    const share = holderShare(transfer.total?.value, market.token.total_supply);
    if (amount <= 0 || share === null) continue;

    const fromPool = from === pair;
    const toPool = to === pair;
    const creatorInvolved = Boolean(creator && (from === creator || to === creator));
    const topHolderInvolved = topHolders.has(from) || topHolders.has(to);
    const fullExit = !fromPool && toPool && !currentHolders.has(from);
    const firstEntry = !toPool && !transfer.to?.is_contract && firstIndexedReceipt && currentHolders.has(to) && share >= 0.1;
    const whaleMove = share >= 1 || topHolderInvolved;
    const categories = new Set<WalletSignalCategory>();
    if (creatorInvolved) categories.add("creator");
    if (whaleMove) categories.add("whale");
    if (firstEntry) categories.add("entry");
    if (fullExit) categories.add("exit");
    if (categories.size === 0) continue;

    let title = "Wallet movement";
    let detail = "A token transfer moved between two indexed addresses.";
    let tone: WalletSignal["tone"] = "info";
    if (creatorInvolved) {
      if (from === creator && toPool) {
        title = "Pool creator sold";
        detail = "The PairCreated transaction sender moved tokens into the pool.";
        tone = "warning";
      } else if (to === creator && fromPool) {
        title = "Pool creator bought";
        detail = "The PairCreated transaction sender acquired tokens from the pool.";
        tone = "info";
      } else if (from === creator) {
        title = "Pool creator sent tokens";
        detail = "The PairCreated transaction sender transferred tokens to another address.";
        tone = "warning";
      } else {
        title = "Pool creator received tokens";
        detail = "Tokens moved into the PairCreated transaction sender.";
      }
    } else if (fullExit) {
      title = "Wallet fully exited";
      detail = "This wallet sold into the pool and no longer appears in the current holder index.";
      tone = "warning";
    } else if (whaleMove) {
      if (fromPool) {
        title = topHolders.has(to) ? "Top holder bought" : "Whale-sized buy";
        detail = "A large or current top holder acquired tokens from the pool.";
        tone = "good";
      } else if (toPool) {
        title = topHolders.has(from) ? "Top holder sold" : "Whale-sized sell";
        detail = "A large or current top holder moved tokens into the pool.";
        tone = "warning";
      } else {
        title = topHolders.has(from) ? "Top holder transferred" : "Large wallet transfer";
        detail = "A large token position moved directly between addresses.";
      }
    } else if (firstEntry) {
      title = "New holder entered";
      detail = "This is the wallet's first receipt in the visible indexed transfer history.";
      tone = "good";
    }

    signals.push({
      amount,
      categories: [...categories],
      detail,
      fromAddress,
      share,
      timestamp: transfer.timestamp,
      title,
      toAddress,
      tone,
      transactionHash: transfer.transaction_hash,
    });
  }

  return signals
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
}

function analyzeHolderConnections(
  market: MarketPair,
  transfers: TokenTransfer[],
  positions: HolderPosition[],
): { clusters: HolderCluster[]; connections: HolderConnection[] } {
  const positionByAddress = new Map(positions.map((position) => [position.address.toLowerCase(), position]));
  const pair = market.pairAddress.toLowerCase();
  const createdAt = new Date(market.createdAt).getTime();
  const connectionMap = new Map<string, HolderConnection>();
  const sharedSources = new Map<string, { address: string; recipients: Set<string> }>();
  const connectionKey = (addressA: string, addressB: string) => [addressA.toLowerCase(), addressB.toLowerCase()].sort().join(":");

  for (const transfer of transfers) {
    if (transfer.type !== "token_transfer" || !transfer.from?.hash || !transfer.to?.hash || !transfer.transaction_hash) continue;
    if (transfer.transaction_hash.toLowerCase() === market.creationTx.toLowerCase()) continue;
    const timestamp = new Date(transfer.timestamp ?? 0).getTime();
    if (Number.isFinite(createdAt) && timestamp < createdAt) continue;
    const from = transfer.from.hash.toLowerCase();
    const to = transfer.to.hash.toLowerCase();
    if (from === pair || to === pair || BURN_ADDRESSES.has(from) || BURN_ADDRESSES.has(to)) continue;

    if (positionByAddress.has(from) && positionByAddress.has(to) && from !== to) {
      connectionMap.set(connectionKey(from, to), {
        addressA: positionByAddress.get(from)!.address,
        addressB: positionByAddress.get(to)!.address,
        kind: "direct",
        source: null,
        transactionHash: transfer.transaction_hash,
      });
    }
    if (!transfer.from.is_contract && positionByAddress.has(to) && from !== to) {
      const source = sharedSources.get(from) ?? { address: transfer.from.hash, recipients: new Set<string>() };
      source.recipients.add(to);
      sharedSources.set(from, source);
    }
  }

  for (const source of sharedSources.values()) {
    const recipients = [...source.recipients];
    if (recipients.length < 2) continue;
    for (let left = 0; left < recipients.length - 1; left += 1) {
      for (let right = left + 1; right < recipients.length; right += 1) {
        const addressA = recipients[left];
        const addressB = recipients[right];
        const key = connectionKey(addressA, addressB);
        if (connectionMap.has(key)) continue;
        connectionMap.set(key, {
          addressA: positionByAddress.get(addressA)!.address,
          addressB: positionByAddress.get(addressB)!.address,
          kind: "shared-source",
          source: source.address,
          transactionHash: null,
        });
      }
    }
  }

  const connections = [...connectionMap.values()].slice(0, 20);
  const parent = new Map(positions.map((position) => [position.address.toLowerCase(), position.address.toLowerCase()]));
  const find = (address: string): string => {
    const current = parent.get(address) ?? address;
    if (current === address) return address;
    const root = find(current);
    parent.set(address, root);
    return root;
  };
  const union = (addressA: string, addressB: string): void => {
    const rootA = find(addressA);
    const rootB = find(addressB);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };
  connections.forEach((connection) => union(connection.addressA.toLowerCase(), connection.addressB.toLowerCase()));
  const groups = new Map<string, string[]>();
  for (const position of positions) {
    const root = find(position.address.toLowerCase());
    groups.set(root, [...(groups.get(root) ?? []), position.address]);
  }
  const clusters = [...groups.values()]
    .filter((members) => members.length > 1)
    .map((members) => ({
      members,
      share: members.reduce((sum, address) => sum + (positionByAddress.get(address.toLowerCase())?.share ?? 0), 0),
    }))
    .sort((a, b) => b.share - a.share);
  return { clusters, connections };
}

function mergeContracts(proxy: ContractDetails | null, implementation: ContractDetails | null): ContractDetails | null {
  if (!proxy && !implementation) return null;
  const abi = [...(proxy?.abi ?? []), ...(implementation?.abi ?? [])];
  const seen = new Set<string>();
  return {
    abi: abi.filter((entry) => {
      const key = `${entry.type}:${entry.name}:${entry.stateMutability}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
    is_fully_verified: Boolean(proxy?.is_fully_verified && (!implementation || implementation.is_fully_verified)),
    is_verified: Boolean(proxy?.is_verified || implementation?.is_verified),
  };
}

function contractFunctions(contract: ContractDetails | null): AbiEntry[] {
  return (contract?.abi ?? []).filter((entry) => entry.type === "function" && Boolean(entry.name));
}

function detectCapabilities(address: AddressDetails | null, contract: ContractDetails | null): Capability[] {
  const functions = contractFunctions(contract).filter((entry) => !["view", "pure"].includes(entry.stateMutability ?? ""));
  const names = functions.map((entry) => entry.name ?? "");
  const capabilities: Capability[] = [];
  const has = (pattern: RegExp) => names.some((name) => pattern.test(name));
  if (has(/^mint|mintTo|increaseSupply|issue/i)) capabilities.push("mint");
  if (has(/blacklist|blocklist|denylist|freeze|wipe|seize/i)) capabilities.push("restrict");
  if (has(/^pause$|^unpause$|setPaused|emergencyPause/i)) capabilities.push("pause");
  if (address?.proxy_type || has(/upgrade|changeAdmin|setImplementation|updateImplementation/i)) capabilities.push("upgrade");
  if (has(/^(set|update|configure).*(fee|tax)|(fee|tax).*(set|update)/i)) capabilities.push("fee");
  return capabilities;
}

async function fetchMarketDetail(market: MarketPair, force: boolean): Promise<MarketDetail> {
  const transactionHashes = [...new Set([
    ...market.trades.map((trade) => trade.transactionHash),
    ...market.liquidityEvents.map((event) => event.transactionHash),
  ].filter(Boolean))].slice(0, 12);
  const transactionRequests = mapLimited(
    transactionHashes,
    3,
    async (hash) => ({
      hash,
      transaction: await fetchOptional<TransactionDetails>(`/transactions/${hash}`, 300_000, force),
    }),
  );
  const [holderData, lpHolderData, pairToken, address, transaction, resolvedTransactions, transferHistory] = await Promise.all([
    fetchOptional<HolderResponse>(`/tokens/${market.tokenAddress}/holders`, 120_000, force),
    fetchOptional<HolderResponse>(`/tokens/${market.pairAddress}/holders`, 120_000, force),
    fetchOptional<Token>(`/tokens/${market.pairAddress}`, 300_000, force),
    fetchOptional<AddressDetails>(`/addresses/${market.tokenAddress}`, 120_000, force),
    market.creationTx ? fetchOptional<TransactionDetails>(`/transactions/${market.creationTx}`, 300_000, force) : Promise.resolve(null),
    transactionRequests,
    fetchTokenTransfers(market.tokenAddress, force).catch(() => ({ items: [], stale: false, truncated: false })),
  ]);
  const implementationAddress = address?.implementations?.[0]?.address_hash;
  const [proxyContract, implementationContract] = await Promise.all([
    address?.is_verified ? fetchOptional<ContractDetails>(`/smart-contracts/${market.tokenAddress}`, 300_000, force) : Promise.resolve(null),
    implementationAddress ? fetchOptional<ContractDetails>(`/smart-contracts/${implementationAddress}`, 300_000, force) : Promise.resolve(null),
  ]);
  const contract = mergeContracts(proxyContract, implementationContract);
  const holders = [...(holderData?.items ?? [])].sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
  const pairLower = market.pairAddress.toLowerCase();
  const creatorAddress = transaction?.from?.hash ?? null;
  const creator = creatorAddress?.toLowerCase() ?? null;
  const poolHolding = holders.find((holder) => holder.address?.hash?.toLowerCase() === pairLower);
  const burnedTokenRaw = holders
    .filter((holder) => BURN_ADDRESSES.has(holder.address?.hash?.toLowerCase() ?? ""))
    .reduce((sum, holder) => sum + Number(holder.value || 0), 0);
  const nonPoolHolders = holders.filter((holder) => {
    const hash = holder.address?.hash?.toLowerCase();
    return Boolean(hash && hash !== pairLower && !BURN_ADDRESSES.has(hash));
  });
  const holderTotal = (count: number) => nonPoolHolders
    .slice(0, count)
    .reduce((sum, holder) => sum + Number(holder.value || 0), 0);
  const top1Raw = holderTotal(1);
  const top5Raw = holderTotal(5);
  const top10Raw = nonPoolHolders.slice(0, 10).reduce((sum, holder) => sum + Number(holder.value || 0), 0);
  const creatorHolding = creator ? holders.find((holder) => holder.address?.hash?.toLowerCase() === creator) : undefined;
  const holderPositions = nonPoolHolders.slice(0, 8).flatMap<HolderPosition>((holder) => {
    const hash = holder.address?.hash;
    if (!hash) return [];
    return [{
      address: hash,
      balance: decimalValue(holder.value, market.token.decimals),
      isContract: Boolean(holder.address?.is_contract),
      isCreator: hash.toLowerCase() === creator,
      name: holder.address?.name ?? null,
      share: holderShare(holder.value, market.token.total_supply),
    }];
  });
  const lpHolders = lpHolderData?.items ?? [];
  const burnedRaw = lpHolders
    .filter((holder) => BURN_ADDRESSES.has(holder.address?.hash?.toLowerCase() ?? ""))
    .reduce((sum, holder) => sum + Number(holder.value || 0), 0);
  const nonBurnedLp = lpHolders.filter((holder) => !BURN_ADDRESSES.has(holder.address?.hash?.toLowerCase() ?? ""));
  const topLp = nonBurnedLp[0];
  const transactionSenders = Object.fromEntries(resolvedTransactions
    .filter((entry) => entry.transaction?.from?.hash)
    .map((entry) => [entry.hash.toLowerCase(), entry.transaction!.from!.hash!]));
  const walletSignals = classifyWalletSignals(market, transferHistory.items, holders, creatorAddress);
  const holderNetwork = analyzeHolderConnections(market, transferHistory.items, holderPositions);
  return {
    burnedTokenShare: holderShare(burnedTokenRaw, market.token.total_supply),
    capabilities: detectCapabilities(address, contract),
    contractVisible: contractFunctions(contract).length > 0,
    creatorShare: holderShare(creatorHolding?.value, market.token.total_supply),
    holderClusters: holderNetwork.clusters,
    holderConnections: holderNetwork.connections,
    holderPositions,
    lpBurnedShare: holderShare(burnedRaw, pairToken?.total_supply ?? null),
    lpTopHolderIsContract: Boolean(topLp?.address?.is_contract),
    lpTopHolderShare: holderShare(topLp?.value, pairToken?.total_supply ?? null),
    poolShare: holderShare(poolHolding?.value, market.token.total_supply),
    top1Share: holderShare(top1Raw, market.token.total_supply),
    top5Share: holderShare(top5Raw, market.token.total_supply),
    top10Share: holderShare(top10Raw, market.token.total_supply),
    transferHistoryTruncated: transferHistory.truncated,
    transactionSenders,
    walletSignals,
  };
}

function buildWarnings(market: MarketPair, detail: MarketDetail): RiskWarning[] {
  const warnings: RiskWarning[] = [];
  if (market.historyTruncated) warnings.push({ title: "24-hour activity is partial", detail: "The ArcScan page limit was reached, so older events in this window are not included in totals.", tone: "info" });
  if (market.reserveSource === "balance") warnings.push({ title: "Pool reserve event unavailable", detail: "Price and liquidity are using the pair's token balances because no indexed Sync event was available.", tone: "info" });
  if (market.sellCount > 0) warnings.push({ title: "A sell completed", detail: `A token-to-USDC sell was indexed ${relativeTime(market.lastSellAt)} ago. Future sells can still fail.`, tone: "good" });
  else warnings.push({ title: "No sell has been seen", detail: market.buyCount > 0 ? "Buys exist, but the indexed history does not show a token-to-USDC sell." : "The indexed history does not contain a successful sell.", tone: "warning" });
  if (market.totalLiquidity < 20) warnings.push({ title: "Extremely low liquidity", detail: `The pool contains about ${formatValue(market.totalLiquidity)} USDC total liquidity. Even small sells can move the price sharply.`, tone: "warning" });
  else if (market.totalLiquidity < 200) warnings.push({ title: "Low liquidity", detail: `The pool contains about ${formatValue(market.totalLiquidity)} USDC total liquidity.`, tone: "warning" });
  if (detail.top10Share !== null && detail.top10Share >= 50) warnings.push({ title: "A few wallets own most tokens", detail: `The top 10 non-pool holders own ${detail.top10Share.toFixed(1)}% of total supply.`, tone: "warning" });
  else if (detail.top10Share !== null && detail.top10Share >= 25) warnings.push({ title: "Holdings are concentrated", detail: `The top 10 non-pool holders own ${detail.top10Share.toFixed(1)}% of total supply.`, tone: "info" });
  if (detail.creatorShare !== null && detail.creatorShare >= 10) warnings.push({ title: "Pool creator still holds a large bag", detail: `The PairCreated transaction sender holds ${detail.creatorShare.toFixed(1)}% of total supply.`, tone: "warning" });
  if (detail.lpBurnedShare !== null && detail.lpBurnedShare >= 90) warnings.push({ title: "Liquidity tokens are mostly burned", detail: `${detail.lpBurnedShare.toFixed(1)}% of LP supply is held by burn addresses.`, tone: "good" });
  else if (detail.lpTopHolderShare !== null) warnings.push({ title: "Liquidity lock is not confirmed", detail: `One ${detail.lpTopHolderIsContract ? "contract" : "wallet"} holds ${detail.lpTopHolderShare.toFixed(1)}% of LP tokens. Removal may still be possible.`, tone: "warning" });
  else warnings.push({ title: "Liquidity lock is unknown", detail: "The current index cannot prove that liquidity is locked or burned.", tone: "info" });

  const capabilityWarnings: Record<Capability, RiskWarning> = {
    mint: { title: "More tokens can be created", detail: "The token rules allow new supply to be created after launch.", tone: "warning" },
    restrict: { title: "Wallets can be blocked or frozen", detail: "Selected holders may be stopped from moving or selling tokens.", tone: "warning" },
    pause: { title: "Transfers can be paused", detail: "A privileged wallet may be able to stop token transfers.", tone: "warning" },
    upgrade: { title: "Token rules can change", detail: "The token's behavior can be changed after launch.", tone: "warning" },
    fee: { title: "Trading fees can change", detail: "A privileged wallet may be able to modify fee or tax settings.", tone: "warning" },
  };
  detail.capabilities.forEach((capability) => warnings.push(capabilityWarnings[capability]));
  if (!detail.contractVisible) warnings.push({ title: "Some token rules are unknown", detail: "Public data was not enough to check every hidden trading rule.", tone: "info" });
  else if (detail.capabilities.length === 0) warnings.push({ title: "No obvious supply or trading controls found", detail: "Public token rules did not reveal mint, pause, blocklist, upgrade, or adjustable fee controls.", tone: "good" });
  return warnings;
}

function setDetailState(state: "empty" | "loading" | "content"): void {
  byId("marketDetailEmpty").classList.toggle("hidden", state !== "empty");
  byId("marketDetailLoading").classList.toggle("hidden", state !== "loading");
  byId("marketDetailContent").classList.toggle("hidden", state !== "content");
}

function renderPriceChart(market: MarketPair): void {
  const chart = byId<SVGSVGElement>("priceChart");
  chart.replaceChildren();
  const points = market.pricePoints;
  if (points.length === 0) {
    const label = svgNode("text", { x: "12", y: "36", class: "chart-label" });
    label.textContent = "No reserve history is available.";
    chart.append(label);
    byId("priceWindow").textContent = "No indexed reserve updates.";
    return;
  }
  const width = 440;
  const height = 180;
  const padding = { top: 16, right: 8, bottom: 12, left: 55 };
  const values = points.map((point) => point.price);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const paddingValue = Math.max((rawMax - rawMin) * 0.15, rawMax * 0.02, 1e-12);
  const min = Math.max(0, rawMin - paddingValue);
  const max = rawMax + paddingValue;
  const range = Math.max(max - min, 1e-12);
  const x = (index: number) => padding.left + (points.length === 1 ? 0.5 : index / (points.length - 1)) * (width - padding.left - padding.right);
  const y = (value: number) => padding.top + (1 - (value - min) / range) * (height - padding.top - padding.bottom);
  for (let index = 0; index < 3; index += 1) {
    const value = max - (index / 2) * range;
    const rowY = y(value);
    chart.append(svgNode("line", { x1: String(padding.left), y1: String(rowY), x2: String(width - padding.right), y2: String(rowY), class: "chart-grid" }));
    const label = svgNode("text", { x: "0", y: String(rowY + 3), class: "chart-label" });
    label.textContent = formatPrice(value);
    chart.append(label);
  }
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point.price).toFixed(2)}`).join(" ");
  const baseline = height - padding.bottom;
  chart.append(
    svgNode("path", { d: `${path} L${x(points.length - 1)},${baseline} L${x(0)},${baseline} Z`, class: "price-area" }),
    svgNode("path", { d: path, class: "price-line" }),
  );
  points.forEach((point, index) => chart.append(svgNode("circle", { cx: String(x(index)), cy: String(y(point.price)), r: "4", class: "price-dot" })));
  byId("priceWindow").textContent = `${points.length} indexed reserve update${points.length === 1 ? "" : "s"} from this pool's visible history.${market.historyTruncated ? " Older events were not included." : ""}`;
}

function renderWindowMetrics(market: MarketPair): void {
  const windows: Array<{ changeId: string; flowId: string; metrics: PeriodMetrics }> = [
    { changeId: "window5mChange", flowId: "window5mFlow", metrics: market.periods.m5 },
    { changeId: "window1hChange", flowId: "window1hFlow", metrics: market.periods.h1 },
    { changeId: "window6hChange", flowId: "window6hFlow", metrics: market.periods.h6 },
    { changeId: "window24hChange", flowId: "window24hFlow", metrics: market.periods.h24 },
  ];
  for (const window of windows) {
    const change = byId(window.changeId);
    change.textContent = compactChange(window.metrics.priceChange);
    change.className = changeClass(window.metrics.priceChange);
    byId(window.flowId).textContent = `${window.metrics.buyCount}B / ${window.metrics.sellCount}S · ${formatValue(window.metrics.volumeUsdc, 3)} USDC`;
  }
}

function renderTradeTape(market: MarketPair, detail: MarketDetail): void {
  const list = byId("tradeList");
  list.replaceChildren();
  const trades = market.trades.slice(0, 10);
  byId("detailTradeCount").textContent = trades.length > 0 ? `${trades.length} visible` : "No trades";
  if (trades.length === 0) {
    list.append(element("div", "trade-empty", "No swaps are available in the indexed history."));
    return;
  }
  for (const trade of trades) {
    const row = element("div", `trade-row ${trade.direction}`);
    const side = element("span", "trade-side", trade.direction === "buy" ? "BUY" : "SELL");
    const value = element("span", "trade-value");
    value.append(element("strong", "", `${formatValue(trade.usdcValue, 4)} USDC`), element("small", "", `${relativeTime(trade.timestamp)} ago`));
    const links = element("span", "trade-links");
    const sender = detail.transactionSenders[trade.transactionHash.toLowerCase()] ?? trade.fallbackAddress;
    if (sender) {
      const senderLink = element("a", "", shortHash(sender, 5, 4));
      senderLink.href = `${EXPLORER_BASE}/address/${sender}`;
      senderLink.target = "_blank";
      senderLink.rel = "noreferrer";
      senderLink.title = `Transaction sender: ${sender}`;
      senderLink.setAttribute("aria-label", `Transaction sender ${sender}`);
      links.append(element("span", "trade-sender-label", "Sender"), senderLink);
    } else {
      links.append(element("span", "", "Sender unknown"));
    }
    if (trade.transactionHash) {
      const txLink = element("a", "trade-tx-link", "TX");
      txLink.href = `${EXPLORER_BASE}/tx/${trade.transactionHash}`;
      txLink.target = "_blank";
      txLink.rel = "noreferrer";
      links.append(txLink);
    }
    row.append(side, value, links);
    list.append(row);
  }
}

function renderWalletSignals(market: MarketPair, detail: MarketDetail): void {
  const signals = detail.walletSignals;
  const count = (category: WalletSignalCategory) => signals.filter((signal) => signal.categories.includes(category)).length;
  byId("walletSignalCount").textContent = `${signals.length} signal${signals.length === 1 ? "" : "s"}`;
  byId("walletCreatorMoves").textContent = String(count("creator"));
  byId("walletWhaleMoves").textContent = String(count("whale"));
  byId("walletEntries").textContent = String(count("entry"));
  byId("walletExits").textContent = String(count("exit"));
  byId("walletSignalNote").textContent = detail.transferHistoryTruncated
    ? "Latest indexed transfer pages only; older wallet movements are not included. Launch distribution and mint events are excluded."
    : "Based on the latest indexed transfers. Launch distribution and mint events are excluded.";
  document.querySelectorAll<HTMLButtonElement>("[data-wallet-filter]").forEach((button) => {
    const active = button.dataset.walletFilter === activeWalletSignalFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const filter = activeWalletSignalFilter;
  const visible = filter === "all"
    ? signals
    : signals.filter((signal) => signal.categories.includes(filter));
  const list = byId("walletSignalList");
  list.replaceChildren();
  if (visible.length === 0) {
    const label = filter === "all" ? "priority wallet movement" : `${filter} movement`;
    list.append(element("div", "wallet-signal-empty", `No ${label} appears in the latest indexed transfers.`));
    return;
  }

  for (const signal of visible) {
    const row = element("div", `wallet-signal-row ${signal.tone}`);
    const head = element("div", "wallet-signal-head");
    const time = element("time", "", `${relativeTime(signal.timestamp)} ago`);
    time.dateTime = signal.timestamp;
    head.append(element("strong", "", signal.title), time);

    const meta = element("div", "wallet-signal-meta");
    const amount = element("span", "wallet-signal-amount");
    amount.append(
      element("strong", "", `${formatValue(signal.amount, 3)} ${market.token.symbol || "tokens"}`),
      element("span", "", `${shareText(signal.share)} supply`),
    );
    const links = element("span", "wallet-signal-links");
    const fromLink = element("a", "", shortHash(signal.fromAddress, 5, 4));
    fromLink.href = `${EXPLORER_BASE}/address/${signal.fromAddress}`;
    fromLink.target = "_blank";
    fromLink.rel = "noreferrer";
    fromLink.title = signal.fromAddress;
    const toLink = element("a", "", shortHash(signal.toAddress, 5, 4));
    toLink.href = `${EXPLORER_BASE}/address/${signal.toAddress}`;
    toLink.target = "_blank";
    toLink.rel = "noreferrer";
    toLink.title = signal.toAddress;
    const txLink = element("a", "", "TX");
    txLink.href = `${EXPLORER_BASE}/tx/${signal.transactionHash}`;
    txLink.target = "_blank";
    txLink.rel = "noreferrer";
    links.append(fromLink, element("span", "", "->"), toLink, txLink);
    meta.append(amount, links);
    row.append(head, element("p", "", signal.detail), meta);
    list.append(row);
  }
}

function renderLiquidityMonitor(market: MarketPair, detail: MarketDetail): void {
  const events = market.liquidityEvents;
  const cutoff = Date.now() - DAY_MS;
  const recent = events.filter((event) => new Date(event.timestamp).getTime() >= cutoff);
  const added = recent.filter((event) => event.direction === "add").reduce((sum, event) => sum + event.usdcAmount, 0);
  const removed = recent.filter((event) => event.direction === "remove").reduce((sum, event) => sum + event.usdcAmount, 0);
  byId("liquidityEventCount").textContent = `${events.length} event${events.length === 1 ? "" : "s"}`;
  byId("liquidityCurrent").textContent = formatValue(market.usdcReserve, 3);
  byId("liquidityAdded").textContent = formatValue(added, 3);
  byId("liquidityRemoved").textContent = formatValue(removed, 3);
  byId("liquidityBurned").textContent = shareText(detail.lpBurnedShare);
  if (detail.lpBurnedShare !== null && detail.lpBurnedShare >= 90) {
    byId("liquidityLpStatus").textContent = `${shareText(detail.lpBurnedShare)} of LP supply is held by burn addresses.`;
  } else if (detail.lpTopHolderShare !== null) {
    byId("liquidityLpStatus").textContent = `Top ${detail.lpTopHolderIsContract ? "contract" : "wallet"} controls ${shareText(detail.lpTopHolderShare)} of LP supply; a lock is not confirmed.`;
  } else {
    byId("liquidityLpStatus").textContent = "LP ownership is unavailable from the current index.";
  }

  const list = byId("liquidityEventList");
  list.replaceChildren();
  if (events.length === 0) {
    list.append(element("div", "liquidity-empty", "No Mint or Burn event appears in the visible pair history."));
    return;
  }
  for (const event of events.slice(0, 8)) {
    const row = element("div", `liquidity-event-row ${event.direction}`);
    const head = element("div", "liquidity-event-head");
    const time = element("time", "", `${relativeTime(event.timestamp)} ago`);
    time.dateTime = event.timestamp;
    head.append(element("strong", "", event.direction === "add" ? "Liquidity added" : "Liquidity removed"), time);

    const values = element("div", "liquidity-event-values");
    values.append(
      element("strong", "", `${formatValue(event.usdcAmount, 4)} USDC`),
      element("span", "", `${formatValue(event.tokenAmount, 3)} ${market.token.symbol || "tokens"}`),
      element("span", "", event.changePercent === null ? "Initial / unknown base" : `${event.changePercent.toFixed(1)}% of prior USDC reserve`),
    );
    const links = element("span", "liquidity-event-links");
    const wallet = detail.transactionSenders[event.transactionHash.toLowerCase()] ?? event.fallbackAddress;
    if (wallet) {
      const walletLink = element("a", "", shortHash(wallet, 5, 4));
      walletLink.href = `${EXPLORER_BASE}/address/${wallet}`;
      walletLink.target = "_blank";
      walletLink.rel = "noreferrer";
      walletLink.title = wallet;
      links.append(walletLink);
    }
    const txLink = element("a", "", "TX");
    txLink.href = `${EXPLORER_BASE}/tx/${event.transactionHash}`;
    txLink.target = "_blank";
    txLink.rel = "noreferrer";
    links.append(txLink);
    row.append(head, values, links);
    list.append(row);
  }
}

function shareText(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function renderHolders(market: MarketPair, detail: MarketDetail): void {
  byId("holderCountSummary").textContent = `${fullNumber(market.token.holders_count)} indexed`;
  byId("holderTop1").textContent = shareText(detail.top1Share);
  byId("holderTop5").textContent = shareText(detail.top5Share);
  byId("holderTop10").textContent = shareText(detail.top10Share);
  byId("holderCreator").textContent = shareText(detail.creatorShare);
  byId("holderSupplyNote").textContent = `Pool ${shareText(detail.poolShare)} · Burned ${shareText(detail.burnedTokenShare)} · rankings exclude both.`;

  const list = byId("holderList");
  list.replaceChildren();
  if (detail.holderPositions.length === 0) {
    list.append(element("div", "holder-empty", "Holder positions are unavailable from the current index."));
    return;
  }

  detail.holderPositions.forEach((position, index) => {
    const row = element("div", "holder-row");
    const rank = element("span", "holder-rank", `#${index + 1}`);
    const identity = element("div", "holder-identity");
    const addressLine = element("div", "holder-address-line");
    const address = element("a", "holder-address", position.name || shortHash(position.address, 6, 4));
    address.href = `${EXPLORER_BASE}/address/${position.address}`;
    address.target = "_blank";
    address.rel = "noreferrer";
    address.title = position.address;
    addressLine.append(address);
    if (position.isCreator) addressLine.append(element("span", "holder-tag creator", "Pool creator"));
    if (position.isContract) addressLine.append(element("span", "holder-tag contract", "Contract"));
    identity.append(addressLine, element("small", "", `${formatValue(position.balance, 3)} ${market.token.symbol || "tokens"}`));

    const ownership = element("div", "holder-ownership");
    ownership.append(element("strong", "", shareText(position.share)));
    const track = element("span", "holder-track");
    const fill = element("span", "holder-fill");
    fill.style.width = `${Math.min(100, Math.max(0, position.share ?? 0))}%`;
    track.append(fill);
    ownership.append(track);
    row.append(rank, identity, ownership);
    list.append(row);
  });
}

function renderHolderConnections(detail: MarketDetail): void {
  const connections = detail.holderConnections;
  const clusters = detail.holderClusters;
  const connectedWallets = new Set(connections.flatMap((connection) => [connection.addressA.toLowerCase(), connection.addressB.toLowerCase()]));
  byId("holderClusterSummary").textContent = connections.length === 0 ? "No links" : `${connections.length} link${connections.length === 1 ? "" : "s"}`;
  byId("clusterConnections").textContent = String(connections.length);
  byId("clusterWallets").textContent = String(connectedWallets.size);
  byId("clusterCount").textContent = String(clusters.length);
  byId("clusterLargest").textContent = clusters[0] ? shareText(clusters[0].share) : "--";

  const positionByAddress = new Map(detail.holderPositions.map((position) => [position.address.toLowerCase(), position]));
  const map = byId("holderClusterMap");
  map.replaceChildren();
  if (clusters.length === 0) {
    map.append(element("div", "cluster-empty", "No connection between current top holders appears in the visible post-launch history."));
  } else {
    clusters.forEach((cluster, index) => {
      const group = element("div", "cluster-group");
      const head = element("div", "cluster-group-head");
      head.append(
        element("strong", "", `Cluster ${index + 1}`),
        element("span", "", `${cluster.members.length} wallets · ${shareText(cluster.share)} supply`),
      );
      const nodes = element("div", "cluster-nodes");
      cluster.members.forEach((address) => {
        const position = positionByAddress.get(address.toLowerCase());
        const node = element("a", "cluster-node");
        node.href = `${EXPLORER_BASE}/address/${address}`;
        node.target = "_blank";
        node.rel = "noreferrer";
        node.title = address;
        if (position?.isCreator) node.classList.add("creator");
        if (position?.isContract) node.classList.add("contract");
        node.append(element("strong", "", shortHash(address, 4, 3)), element("span", "", shareText(position?.share ?? null)));
        nodes.append(node);
      });
      group.append(head, nodes);
      map.append(group);
    });
  }

  const list = byId("holderConnectionList");
  list.replaceChildren();
  for (const connection of connections.slice(0, 8)) {
    const row = element("div", "connection-row");
    const copy = element("div", "connection-copy");
    copy.append(
      element("strong", "", connection.kind === "direct" ? "Direct holder transfer" : "Shared funding source"),
      element("span", "", connection.kind === "direct" ? "Tokens moved directly between these top holders." : "Both top holders received tokens from the same indexed wallet."),
    );
    const links = element("span", "connection-links");
    for (const address of [connection.addressA, connection.addressB]) {
      const link = element("a", "", shortHash(address, 4, 3));
      link.href = `${EXPLORER_BASE}/address/${address}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      links.append(link);
    }
    if (connection.source) {
      const source = element("a", "", "Source");
      source.href = `${EXPLORER_BASE}/address/${connection.source}`;
      source.target = "_blank";
      source.rel = "noreferrer";
      links.append(source);
    } else if (connection.transactionHash) {
      const transaction = element("a", "", "TX");
      transaction.href = `${EXPLORER_BASE}/tx/${connection.transactionHash}`;
      transaction.target = "_blank";
      transaction.rel = "noreferrer";
      links.append(transaction);
    }
    row.append(copy, links);
    list.append(row);
  }
}

function updateWatchToggle(market: MarketPair): void {
  const watched = watchlist.has(market.tokenAddress.toLowerCase());
  const button = byId<HTMLButtonElement>("watchToggle");
  button.classList.toggle("active", watched);
  button.setAttribute("aria-pressed", String(watched));
  button.setAttribute("aria-label", watched ? "Remove token from watchlist" : "Add token to watchlist");
  button.title = watched ? "Remove from watchlist" : "Add to watchlist";
  byId("watchIcon").textContent = watched ? "★" : "☆";
}

function renderObservedAlerts(market: MarketPair): void {
  const watched = watchlist.has(market.tokenAddress.toLowerCase());
  const section = byId("observedAlertSection");
  section.classList.toggle("hidden", !watched);
  if (!watched) return;
  const tracking = readTracking(market.tokenAddress) ?? startTracking(market);
  const alerts = tracking.alerts ?? [];
  byId("observedAlertCount").textContent = `${alerts.length} event${alerts.length === 1 ? "" : "s"}`;
  const list = byId("observedAlertList");
  list.replaceChildren();
  if (alerts.length === 0) {
    list.append(element("div", "observed-alert-empty", "No material change has been observed from the saved baseline."));
  } else {
    for (const alert of alerts.slice(0, 12)) {
      const row = element("div", `observed-alert-row ${alert.tone}`);
      const head = element("div", "observed-alert-head");
      const time = element("time", "", `${relativeTime(alert.observedAt)} ago`);
      time.dateTime = alert.observedAt;
      head.append(element("strong", "", alert.title), time);
      const type = element("span", "observed-alert-type", alert.type);
      row.append(head, element("p", "", alert.detail), type);
      list.append(row);
    }
  }
  const started = new Date(tracking.startedAt);
  const baseline = Number.isFinite(started.getTime())
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(started)
    : "this browser";
  byId("observedAlertNote").textContent = `Baseline ${baseline} · stored in this browser.`;
}

function exitEstimate(market: MarketPair, supplyPercent: number): { impact: number; output: number } | null {
  const supply = decimalValue(market.token.total_supply, market.token.decimals);
  const amountIn = supply * (supplyPercent / 100);
  if (amountIn <= 0 || market.tokenReserve <= 0 || market.usdcReserve <= 0) return null;
  const amountAfterFee = amountIn * 0.997;
  const output = (amountAfterFee * market.usdcReserve) / (market.tokenReserve + amountAfterFee);
  const idealOutput = amountIn * (market.usdcReserve / market.tokenReserve);
  const impact = idealOutput > 0 ? Math.max(0, (1 - output / idealOutput) * 100) : 0;
  return { impact, output };
}

function renderExitCurve(market: MarketPair): void {
  const chart = byId<SVGSVGElement>("exitCurve");
  chart.replaceChildren();
  const percentages = [0.1, 0.5, 1, 2, 5];
  const estimates = percentages.map((percent) => ({ percent, estimate: exitEstimate(market, percent) }));
  if (estimates.some((entry) => entry.estimate === null)) {
    const label = svgNode("text", { x: "12", y: "36", class: "chart-label" });
    label.textContent = "Pool reserves are unavailable.";
    chart.append(label);
    byId("exitEstimate").textContent = "Unavailable";
    return;
  }
  const width = 440;
  const height = 170;
  const padding = { top: 16, right: 8, bottom: 12, left: 42 };
  const impacts = estimates.map((entry) => entry.estimate!.impact);
  const maxImpact = Math.max(5, Math.ceil(Math.max(...impacts) / 5) * 5);
  const x = (index: number) => padding.left + (index / (estimates.length - 1)) * (width - padding.left - padding.right);
  const y = (impact: number) => padding.top + (1 - impact / maxImpact) * (height - padding.top - padding.bottom);
  for (let index = 0; index < 3; index += 1) {
    const impact = maxImpact * (1 - index / 2);
    const rowY = y(impact);
    chart.append(svgNode("line", { x1: String(padding.left), y1: String(rowY), x2: String(width - padding.right), y2: String(rowY), class: "chart-grid" }));
    const label = svgNode("text", { x: "0", y: String(rowY + 3), class: "chart-label" });
    label.textContent = `${impact.toFixed(0)}%`;
    chart.append(label);
  }
  const path = estimates.map((entry, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(entry.estimate!.impact).toFixed(2)}`).join(" ");
  const baseline = height - padding.bottom;
  chart.append(
    svgNode("path", { d: `${path} L${x(estimates.length - 1)},${baseline} L${x(0)},${baseline} Z`, class: "exit-area" }),
    svgNode("path", { d: path, class: "exit-line" }),
  );
  estimates.forEach((entry, index) => chart.append(svgNode("circle", { cx: String(x(index)), cy: String(y(entry.estimate!.impact)), r: "4", class: "exit-dot" })));
  const onePercent = estimates.find((entry) => entry.percent === 1)!.estimate!;
  byId("exitEstimate").textContent = `1% -> ${formatValue(onePercent.output, 3)} USDC · ${onePercent.impact.toFixed(1)}% impact`;
}

function renderDetail(market: MarketPair, detail: MarketDetail): void {
  byId("marketTokenMark").textContent = (market.token.symbol || market.token.name || "?").slice(0, 2).toUpperCase();
  byId("marketTokenName").textContent = market.token.name || "Unnamed token";
  byId("marketTokenSymbol").textContent = market.token.symbol || "--";
  const tokenLink = byId<HTMLAnchorElement>("marketTokenAddress");
  tokenLink.textContent = shortHash(market.tokenAddress, 7, 5);
  tokenLink.href = `${EXPLORER_BASE}/token/${market.tokenAddress}`;
  updateWatchToggle(market);
  renderObservedAlerts(market);

  const detailPrice = byId("detailPrice");
  const formattedPrice = priceFormat(market.currentPrice);
  detailPrice.replaceChildren(...priceElement(market.currentPrice, true).childNodes);
  detailPrice.title = formattedPrice.full === "--" ? "Price unavailable" : `${formattedPrice.full} USDC`;
  detailPrice.setAttribute("aria-label", formattedPrice.full === "--" ? "Price unavailable" : `${formattedPrice.full} USDC`);
  const detailChange = byId("detailPriceChange");
  detailChange.textContent = `24H ${compactChange(market.periods.h24.priceChange)}`;
  detailChange.className = changeClass(market.periods.h24.priceChange);
  byId("detailFdv").textContent = `${formatValue(market.fdv)} USDC`;
  byId("detailLiquidity").textContent = `${formatValue(market.totalLiquidity)} USDC`;
  byId("detailLiquidityNote").textContent = `${formatValue(market.usdcReserve)} USDC exit side · ${market.reserveSource === "sync" ? "Sync reserves" : "balance fallback"}`;
  byId("detailHolders").textContent = fullNumber(market.token.holders_count);

  const change = byId("priceChange");
  change.textContent = formatChange(market.priceChange);
  change.className = changeClass(market.priceChange);
  renderWindowMetrics(market);
  renderPriceChart(market);

  const recent = market.periods.h24;
  byId("detailBuys").textContent = String(recent.buyCount);
  byId("detailSells").textContent = String(recent.sellCount);
  byId("detailVolume").textContent = `${formatValue(recent.volumeUsdc, 3)} USDC`;
  byId("detailLastTrade").textContent = market.lastTradeAt ? `${relativeTime(market.lastTradeAt)} ago` : "None";
  const totalFlow = Math.max(1, recent.buyCount + recent.sellCount);
  byId<HTMLElement>("detailBuyBar").style.width = `${(recent.buyCount / totalFlow) * 100}%`;
  byId<HTMLElement>("detailSellBar").style.width = `${(recent.sellCount / totalFlow) * 100}%`;
  renderTradeTape(market, detail);
  renderWalletSignals(market, detail);
  renderLiquidityMonitor(market, detail);
  renderHolders(market, detail);
  renderHolderConnections(detail);

  const warnings = buildWarnings(market, detail);
  const warningTotal = warnings.filter((warning) => warning.tone === "warning").length;
  byId("warningCount").textContent = `${warningTotal} flag${warningTotal === 1 ? "" : "s"}`;
  const badge = byId("riskBadge");
  badge.className = "risk-badge";
  if (warningTotal >= 4) {
    badge.classList.add("danger");
    badge.textContent = `${warningTotal} red flags`;
  } else if (warningTotal > 0) {
    badge.classList.add("caution");
    badge.textContent = `${warningTotal} flag${warningTotal === 1 ? "" : "s"}`;
  } else {
    badge.classList.add("clear");
    badge.textContent = "No major flag";
  }
  const list = byId("marketWarnings");
  list.replaceChildren();
  for (const warning of warnings) {
    const row = element("div", `warning-item ${warning.tone}`);
    const copy = element("div", "warning-copy");
    copy.append(element("strong", "", warning.title), element("span", "", warning.detail));
    row.append(element("span", "warning-dot"), copy);
    list.append(row);
  }
  renderExitCurve(market);
  setDetailState("content");
}

async function loadDetail(market: MarketPair, force = false): Promise<void> {
  const requestId = ++detailRequest;
  const key = market.tokenAddress.toLowerCase();
  if (force) detailCache.delete(key);
  const cached = detailCache.get(key);
  if (!force && cached && Date.now() - cached.savedAt < DETAIL_CACHE_TTL_MS) {
    if (requestId === detailRequest && selectedPair === market.pairAddress.toLowerCase()) renderDetail(market, cached.data);
    return;
  }
  setDetailState("loading");
  try {
    const detail = await fetchMarketDetail(market, force);
    detailCache.set(key, { data: detail, savedAt: Date.now() });
    if (requestId !== detailRequest || selectedPair !== market.pairAddress.toLowerCase()) return;
    if (!market.stale) observeDetailChanges(market, detail);
    renderDetail(market, detail);
  } catch {
    if (requestId !== detailRequest) return;
    renderDetail(market, { burnedTokenShare: null, capabilities: [], contractVisible: false, creatorShare: null, holderClusters: [], holderConnections: [], holderPositions: [], lpBurnedShare: null, lpTopHolderIsContract: false, lpTopHolderShare: null, poolShare: null, top1Share: null, top5Share: null, top10Share: null, transferHistoryTruncated: false, transactionSenders: {}, walletSignals: [] });
  }
}

async function selectMarket(market: MarketPair, scrollOnMobile: boolean): Promise<void> {
  selectedPair = market.pairAddress.toLowerCase();
  activeWalletSignalFilter = "all";
  renderMarketRows();
  await loadDetail(market);
  if (scrollOnMobile && window.matchMedia("(max-width: 960px)").matches) {
    byId("marketDetailContent").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setNotice(message?: string): void {
  const notice = byId("dataNotice");
  notice.textContent = message ?? "";
  notice.classList.toggle("hidden", !message);
}

async function loadMarkets(force: boolean): Promise<boolean> {
  const factoryLogs = await fetchData<LogResponse>(`/addresses/${MARKET_FACTORY}/logs`, 60_000, force);
  const seeds = pairSeeds(factoryLogs.data).slice(0, MARKET_LIMIT);
  const loaded = await mapLimited(seeds, 3, (seed) => loadMarketPair(seed, force));
  markets = loaded.filter((market): market is MarketPair => market !== null);
  const shown = visibleMarkets();
  if (!markets.some((market) => market.pairAddress.toLowerCase() === selectedPair)) selectedPair = markets[0]?.pairAddress.toLowerCase() ?? "";
  if (!shown.some((market) => market.pairAddress.toLowerCase() === selectedPair) && shown[0]) selectedPair = shown[0].pairAddress.toLowerCase();
  renderMarketRows();
  const selected = markets.find((market) => market.pairAddress.toLowerCase() === selectedPair);
  if (selected) void loadDetail(selected, force);
  else setDetailState("empty");
  return factoryLogs.stale || markets.some((market) => market.stale);
}

async function loadDashboard(force = false): Promise<void> {
  if (loading) return;
  loading = true;
  const refresh = byId<HTMLButtonElement>("refreshButton");
  refresh.disabled = true;
  refresh.textContent = "Refreshing";
  setNotice();
  try {
    const stale = await loadMarkets(force);
    if (stale) setNotice("Live indexing is temporarily unavailable. Showing the latest cached market snapshot.");
    byId("lastUpdated").textContent = `${stale ? "Cached" : "Updated"} ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date())}`;
  } catch (error) {
    setNotice(error instanceof Error ? `Market data unavailable: ${error.message}` : "Market data unavailable.");
    byId("lastUpdated").textContent = "Connection unavailable";
    setDetailState("empty");
  } finally {
    lastRefreshAt = Date.now();
    loading = false;
    refresh.disabled = false;
    refresh.textContent = "Refresh";
  }
}

function applyFilter(filter: MarketFilter): void {
  activeFilter = filter;
  document.querySelectorAll<HTMLButtonElement>("[data-market-filter]").forEach((button) => {
    const active = button.dataset.marketFilter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const shown = visibleMarkets();
  if (!shown.some((market) => market.pairAddress.toLowerCase() === selectedPair)) {
    if (shown[0]) {
      selectedPair = shown[0].pairAddress.toLowerCase();
      void loadDetail(shown[0]);
    } else {
      selectedPair = "";
      setDetailState("empty");
    }
  }
  renderMarketRows();
}

function toggleSelectedWatch(): void {
  const market = markets.find((entry) => entry.pairAddress.toLowerCase() === selectedPair);
  if (!market) return;
  const key = market.tokenAddress.toLowerCase();
  if (watchlist.has(key)) {
    watchlist.delete(key);
  } else {
    watchlist.add(key);
    if (!market.stale) {
      startTracking(market);
      const detail = detailCache.get(key);
      if (detail) observeDetailChanges(market, detail.data);
    }
  }
  saveWatchlist();
  if (activeFilter === "watchlist") {
    applyFilter("watchlist");
    return;
  }
  renderMarketRows();
  updateWatchToggle(market);
  renderObservedAlerts(market);
}

function applyWalletSignalFilter(filter: WalletSignalFilter): void {
  activeWalletSignalFilter = filter;
  const market = markets.find((entry) => entry.pairAddress.toLowerCase() === selectedPair);
  const detail = market ? detailCache.get(market.tokenAddress.toLowerCase()) : undefined;
  if (market && detail) renderWalletSignals(market, detail.data);
}

function runSearch(query: string): void {
  activeQuery = query.trim().toLowerCase();
  const shown = visibleMarkets();
  renderMarketRows();
  if (shown.length === 0) {
    setNotice("No indexed Arc USDC market matches that token or address.");
    return;
  }
  setNotice();
  selectedPair = shown[0].pairAddress.toLowerCase();
  renderMarketRows();
  void loadDetail(shown[0]);
}

document.querySelectorAll<HTMLButtonElement>("[data-market-filter]").forEach((button) => {
  button.addEventListener("click", () => applyFilter((button.dataset.marketFilter ?? "all") as MarketFilter));
});
document.querySelectorAll<HTMLButtonElement>("[data-wallet-filter]").forEach((button) => {
  button.addEventListener("click", () => applyWalletSignalFilter((button.dataset.walletFilter ?? "all") as WalletSignalFilter));
});
byId<HTMLFormElement>("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(byId<HTMLInputElement>("searchInput").value);
});
byId<HTMLButtonElement>("refreshButton").addEventListener("click", () => void loadDashboard(true));
byId<HTMLButtonElement>("watchToggle").addEventListener("click", toggleSelectedWatch);

void loadDashboard();
window.setInterval(() => {
  if (!document.hidden) void loadDashboard();
}, AUTO_REFRESH_MS);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && Date.now() - lastRefreshAt >= AUTO_REFRESH_MS) void loadDashboard();
});
