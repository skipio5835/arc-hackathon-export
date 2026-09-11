import {
  decimalValue,
  fullyDilutedValue,
} from "./arc-radar-core.js";
import { refineMarkets, type DiscoveryOptions, type MarketSort } from "./arc-radar-discovery.js";
import { createDexAdapter, discoverDexPools, type RadarPool, type DexPricePoint, type DexTrade, type DexLiquidityEvent } from "./arc-radar-dex.js";
import { resolveRadarNetwork, radarStoragePrefix, radarPoolKey } from "./arc-radar-networks.js";
import { initializeAdPreview } from "./arc-radar-ads.js";
import { readPoolRoute, marketUrl, resolveLinkedPool, recentWatchChanges, type CreationPage } from "./arc-radar-navigation.js";
import { observeSellEvents, groupTokenPools, type SellObservation } from "./arc-radar-market-tools.js";
import { holderShare, holderMetrics, knownTokenPools, windowPriceChange, tradeActor, sourceState, nextOwnershipSnapshot, type SourceState } from "./arc-radar-quality.js";
import { detectCapabilities, capabilityText, evidenceSummary, marketBriefs, nextWatchBatch, type CapabilityFinding, type EvidenceBasis } from "./arc-radar-evidence.js";
import { readAuthoritySnapshot, type AuthoritySnapshot } from "./arc-radar-authority.js";
import { copy, localize, initializeLanguage, type UiCopy } from "./arc-radar-i18n.js";

let routeError = "";
const linkedPool = (() => {
  try { return readPoolRoute(new URL(location.href)); }
  catch (error) { routeError = error instanceof Error ? error.message : "Invalid pool link."; return null; }
})();

let networkError = "";
const NETWORK = (() => {
  try {
    const network = resolveRadarNetwork(new URLSearchParams(location.search).get("network") ?? undefined);
    network.sources.forEach(source => createDexAdapter(source, network));
    return network;
  }
  catch (error) { networkError = error instanceof Error ? error.message : "Network unavailable."; return null; }
})();
const dexAdapters = NETWORK ? NETWORK.sources.map(source => createDexAdapter(source, NETWORK)) : [];
const adPreview = initializeAdPreview(Boolean(NETWORK));
const API_BASE = NETWORK?.apiBase ?? "";
const EXPLORER_BASE = NETWORK?.explorerBase ?? "";
const CACHE_PREFIX = NETWORK ? radarStoragePrefix(NETWORK) : "arcrow:unavailable:";
const WATCHLIST_STORAGE_KEY = `${CACHE_PREFIX}watchlist`;
const TRACKING_STORAGE_PREFIX = `${CACHE_PREFIX}tracking:pool:v1:`;
const MARKET_LIMIT = 15;
const MAX_MARKETS = 150;
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
type HolderResponse = { items?: TokenHolder[]; next_page_params?: LogPageParams | null };

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

type PairSeed = RadarPool;

type PricePoint = DexPricePoint;

type MarketTrade = DexTrade;

type LiquidityEvent = DexLiquidityEvent;

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
  fdv: number | null;
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
  poolScope?: string;
  creatorShare: number | null;
  lpBurnedShare: number | null;
  timestamp: string;
  top10Share: number | null;
};

type TokenTracking = {
  sellObservation?: SellObservation;
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
  checkedAt: number;
  sources: { holders: SourceState; lp: SourceState; contract: SourceState; creator: SourceState; transfers: SourceState; senders: SourceState };
  holderHistoryPartial: boolean;
  lpHistoryPartial: boolean;
  poolScope: string;
  burnedTokenShare: number | null;
  capabilities: CapabilityFinding[];
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
  basis: EvidenceBasis;
  detail: string | UiCopy;
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
let marketLimit = MARKET_LIMIT;
let hasMoreMarkets = false;
let discoveryLimited = false;
let failedMarketCount = 0;
let marketLoadFailed = false;
const discoveryOptions: DiscoveryOptions = { sort: "default", minimumLiquidity: 0, traded24h: false, sellSeen: false };
let activeWalletSignalFilter: WalletSignalFilter = "all";
let loading = false;
let detailRequest = 0;
let lastRefreshAt = 0;
let watchlist = NETWORK ? readWatchlist() : new Set<string>();
const detailCache = new Map<string, DetailCacheEntry>();
const detailFlights = new Map<string, Promise<MarketDetail>>();
const authorityReads = new Map<string, { attemptedAt: number; snapshot?: AuthoritySnapshot; error?: string }>();
let authorityRunning = "";
const watchCheckAttempts = new Map<string, number>();
let watchScanRunning = false;
let lastWatchScanAt = 0;
const trackingMemory = new Map<string, TokenTracking>();
let watchReviewedAt = (() => {
  if (!NETWORK || linkedPool || routeError) return null;
  try {
    const previous = Number(localStorage.getItem(`${CACHE_PREFIX}watch-reviewed-at`) ?? localStorage.getItem(`${CACHE_PREFIX}last-market-visit`));
    const now = Date.now();
    return previous > 0 && previous <= now ? previous : null;
  } catch { return null; }
})();

function byId<T extends Element = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as unknown as T;
}

function poolCacheKey(pool: PairSeed): string {
  if (!NETWORK) throw new Error(networkError);
  return radarPoolKey(NETWORK, pool.pairAddress);
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string | UiCopy): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) {
    if (typeof text === "string") node.textContent = text;
    else localize(node, text);
  }
  return node;
}

function setCopy(id: string, message: string | UiCopy): void {
  localize(byId(id), message);
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
    const legacy = NETWORK?.id === "arc-testnet" ? localStorage.getItem("arc-meme-radar:v1:watchlist") : null;
    const stored = JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? legacy ?? "[]") as unknown;
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
  const memory = trackingMemory.get(address.toLowerCase());
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(`${TRACKING_STORAGE_PREFIX}${address.toLowerCase()}`);
    const value = raw ? JSON.parse(raw) as TokenTracking : null;
    if (!value || typeof value.startedAt !== "string" || !Array.isArray(value.alerts)) return null;
    if (value.sellObservation && !Array.isArray(value.sellObservation.seen)) value.sellObservation = undefined;
    if (value.detailSnapshot && !value.detailSnapshot.poolScope) value.detailSnapshot = undefined;
    value.alerts = value.alerts.filter(alert => alert && typeof alert.title === "string" && typeof alert.detail === "string"
      && typeof alert.observedAt === "string" && ["warning", "info", "good"].includes(alert.tone)).slice(0, 30);
    trackingMemory.set(address.toLowerCase(), value);
    return value;
  } catch {
    return null;
  }
}

function saveTracking(address: string, tracking: TokenTracking): void {
  trackingMemory.set(address.toLowerCase(), tracking);
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
  if (!NETWORK) throw new Error(networkError);
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

async function fetchOptional<T>(path: string, ttlMs: number, force = false): Promise<FetchResult<T> | null> {
  try {
    return await fetchData<T>(path, ttlMs, force);
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

function adapterFor(pool: PairSeed) {
  const adapter = dexAdapters.find(entry => entry.source.id === pool.sourceId);
  if (!adapter) throw new Error("Unknown DEX source");
  return adapter;
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
  const tracking: TokenTracking = readTracking(market.pairAddress) ?? {
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
  if (!tracking.sellObservation) tracking.sellObservation = observeSellEvents(market.trades).state;
  saveTracking(market.pairAddress, tracking);
  return tracking;
}

function observeMarketChanges(market: MarketPair): void {
  if (market.stale || !watchlist.has(market.tokenAddress.toLowerCase())) return;
  const tracking = readTracking(market.pairAddress) ?? startTracking(market);
  const previous = tracking.marketSnapshot;
  const next = snapshotForMarket(market);
  if (!previous) {
    tracking.marketSnapshot = next;
    saveTracking(market.pairAddress, tracking);
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
  const sellObservation = observeSellEvents(market.trades, tracking.sellObservation);
  tracking.sellObservation = sellObservation.state;
  if (sellObservation.added > 0) {
    const difference = sellObservation.added;
    alerts.push({
      detail: `${difference} previously unseen token-to-USDC sell event${difference === 1 ? " was" : "s were"} found in the available indexed history. This may include delayed indexing.`,
      observedAt,
      title: "Newly observed sell events",
      tone: "info",
      type: "sell",
    });
  }
  appendObservedAlerts(tracking, alerts);
  tracking.marketSnapshot = next;
  saveTracking(market.pairAddress, tracking);
}

function observeDetailChanges(market: MarketPair, detail: MarketDetail): void {
  if (market.stale || Date.now() - detail.checkedAt >= DETAIL_CACHE_TTL_MS || !watchlist.has(market.tokenAddress.toLowerCase())) return;
  const tracking = readTracking(market.pairAddress) ?? startTracking(market);
  const previous = tracking.detailSnapshot;
  const { next, comparable } = nextOwnershipSnapshot(previous, {
    creatorShare: detail.creatorShare,
    lpBurnedShare: detail.lpBurnedShare,
    timestamp: new Date().toISOString(),
    top10Share: detail.top10Share,
    poolScope: detail.poolScope,
  }, {
    creatorShare: detail.sources.holders === "fresh" && detail.sources.creator === "fresh",
    lpBurnedShare: detail.sources.lp === "fresh",
    top10Share: detail.sources.holders === "fresh",
  });
  if (previous) {
    const alerts: ObservedAlert[] = [];
    if (comparable.top10Share && previous.top10Share !== null && next.top10Share !== null && Math.abs(next.top10Share - previous.top10Share) >= 3) {
      const difference = next.top10Share - previous.top10Share;
      alerts.push({
        detail: `Top 10 non-pool ownership changed from ${shareText(previous.top10Share)} to ${shareText(next.top10Share)}.`,
        observedAt: next.timestamp,
        title: difference > 0 ? "Holder concentration increased" : "Holder concentration decreased",
        tone: difference > 0 ? "warning" : "good",
        type: "ownership",
      });
    }
    if (comparable.creatorShare && previous.creatorShare !== null && next.creatorShare !== null && Math.abs(next.creatorShare - previous.creatorShare) >= 1) {
      const difference = next.creatorShare - previous.creatorShare;
      alerts.push({
        detail: `Pool-creation sender holding changed from ${shareText(previous.creatorShare)} to ${shareText(next.creatorShare)}. This sender is not necessarily the token team.`,
        observedAt: next.timestamp,
        title: difference < 0 ? "Creation sender reduced holdings" : "Creation sender holdings increased",
        tone: difference < 0 ? "warning" : "info",
        type: "ownership",
      });
    }
    if (comparable.lpBurnedShare && previous.lpBurnedShare !== null && next.lpBurnedShare !== null && Math.abs(next.lpBurnedShare - previous.lpBurnedShare) >= 1) {
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
  saveTracking(market.pairAddress, tracking);
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
    const adapter = adapterFor(seed);
    const nowMs = Date.now();
    const [tokenResult, logResult] = await Promise.all([
      fetchData<Token>(`/tokens/${seed.tokenAddress}`, 300_000, force),
      fetchAddressLogs(seed.pairAddress, 30_000, force, nowMs - DAY_MS),
    ]);
    const token = tokenResult.data;
    const logs = logResult.items;
    const latestSync = adapter.latestReserves(logs, seed, token.decimals);
    let tokenReserve = latestSync?.tokenReserve ?? 0;
    let usdcReserve = latestSync?.usdcReserve ?? 0;
    let balanceStale = false;
    const reserveSource: MarketPair["reserveSource"] = latestSync ? "sync" : "balance";
    if (!latestSync) {
      const balanceResult = await fetchData<TokenBalance[]>(`/addresses/${seed.pairAddress}/token-balances`, 30_000, force);
      const tokenBalance = balanceResult.data.find((balance) => balance.token.address_hash.toLowerCase() === seed.tokenAddress.toLowerCase());
      const usdcBalance = balanceResult.data.find((balance) => balance.token.address_hash.toLowerCase() === seed.quoteAsset.address.toLowerCase());
      tokenReserve = decimalValue(tokenBalance?.value, tokenBalance?.token.decimals);
      usdcReserve = decimalValue(usdcBalance?.value, usdcBalance?.token.decimals);
      balanceStale = balanceResult.stale;
    }
    const currentPrice = tokenReserve > 0 ? usdcReserve / tokenReserve : 0;
    const trades = logs
      .map((log) => adapter.trade(log, seed))
      .filter((trade): trade is MarketTrade => trade !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const buys = trades.filter((trade) => trade.direction === "buy");
    const sells = trades.filter((trade) => trade.direction === "sell");
    const liquidityEvents = adapter.liquidityEvents(logs, seed, token.decimals);
    const pricePoints = logs
      .map((log) => adapter.pricePoint(log, seed, token.decimals))
      .filter((point): point is PricePoint => point !== null)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const firstPrice = pricePoints[0]?.price;
    const priceChange = firstPrice && currentPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : null;
    const market: MarketPair = {
      ...seed,
      buyCount: buys.length,
      currentPrice,
      fdv: fullyDilutedValue(currentPrice, token.total_supply, token.decimals),
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

function needsReview(market: MarketPair): boolean {
  return market.sellCount === 0 || market.usdcReserve < 10;
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
    if (activeFilter === "risky") return needsReview(market);
    return true;
  });
  const eligible = refineMarkets(filtered, { ...discoveryOptions, sort: "default" });
  const representatives = groupTokenPools(eligible).map(group => group.primary);
  return refineMarkets(representatives.sort((a, b) => {
    if (activeFilter === "active") return b.periods.h24.volumeUsdc - a.periods.h24.volumeUsdc
      || b.periods.h24.swapCount - a.periods.h24.swapCount
      || new Date(b.lastTradeAt ?? 0).getTime() - new Date(a.lastTradeAt ?? 0).getTime();
    if (activeFilter === "sells") return b.sellCount - a.sellCount;
    if (activeFilter === "risky") return a.usdcReserve - b.usdcReserve;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }), discoveryOptions);
}

function renderMarketSummary(): void {
  if (marketLoadFailed && markets.length === 0) {
    setCopy("marketSummary", "Market activity is unknown because pool data could not be loaded.");
    return;
  }
  const shown = visibleMarkets();
  const trades = shown.reduce((sum, market) => sum + market.swapCount, 0);
  const liquidity = shown.reduce((sum, market) => sum + market.totalLiquidity, 0);
  const partial = shown.filter((market) => market.historyTruncated).length;
  setCopy("marketSummary", copy("{tokens} tokens · {pools} loaded pools · representative pools: {trades} indexed swaps · {liquidity} USDC liquidity · {partial} partial histories", { tokens: shown.length, pools: markets.length, trades, liquidity: formatValue(liquidity), partial }));
}

function renderDiscoveryControls(): void {
  const button = byId<HTMLButtonElement>("loadMoreMarkets");
  button.disabled = loading || (!marketLoadFailed && (!hasMoreMarkets || marketLimit >= MAX_MARKETS));
  localize(button, loading ? "Loading pools..." : marketLoadFailed ? "Retry loading"
    : hasMoreMarkets && marketLimit < MAX_MARKETS ? "Load 15 more"
    : discoveryLimited || (hasMoreMarkets && marketLimit >= MAX_MARKETS) ? "Scan limit reached" : "No more pools");
  setCopy("discoveryCoverage", copy("{pools} pools loaded · {sources} {network} USDC market sources{limit}", { pools: markets.length, sources: dexAdapters.length, network: NETWORK?.label ?? "",
    limit: copy("{scan}{cap}{failed}", { scan: copy(discoveryLimited ? " · Scan limit reached" : ""), cap: copy(marketLimit >= MAX_MARKETS && hasMoreMarkets ? " · 150-pool limit" : ""), failed: copy(failedMarketCount ? " · {count} unavailable" : "", { count: failedMarketCount }) }) }));
  renderCoverage();
}

function renderCoverage(): void {
  const cached = markets.filter(market => market.stale).length;
  const partial = markets.filter(market => market.historyTruncated).length;
  setCopy("coverageSummary", copy("{network} · {sources} configured v2 source(s) · {pools} loaded pools · Not the whole chain", { network: NETWORK?.label ?? "--", sources: dexAdapters.length, pools: markets.length }));
  setCopy("coverageStatus", copy("{cached} cached · {partial} partial histories{failed}", { cached, partial, failed: copy(marketLoadFailed ? " · Refresh failed" : "") }));
  const sources = byId("coverageSources");
  sources.replaceChildren();
  for (const adapter of dexAdapters) {
    const link = element("a", "", `${adapter.source.label} · ${shortHash(adapter.source.factoryAddress)}`);
    link.href = `${EXPLORER_BASE}/address/${adapter.source.factoryAddress}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    sources.append(link);
  }
}

function renderMarketBrief(): void {
  const list = byId("marketBriefList");
  const expanded = list.querySelector<HTMLDetailsElement>(".brief-more")?.open ?? false;
  list.replaceChildren();
  const briefs = marketLoadFailed ? [] : marketBriefs(markets, Date.now());
  setCopy("marketBriefCount", copy("{count} tokens", { count: briefs.length }));
  if (!briefs.length) {
    list.append(element("p", "brief-empty", copy(marketLoadFailed ? "Market refresh failed. Recent changes cannot be assessed." : "No qualifying recent change in the loaded pools. This is not an all-clear.")));
    return;
  }
  const more = element("details", "brief-more");
  more.open = expanded;
  const moreList = element("div", "brief-more-list");
  more.append(element("summary", "", copy("{count} more changes", { count: Math.max(0, briefs.length - 3) })), moreList);
  for (const [index, brief] of briefs.entries()) {
    const row = element("article", "brief-row");
    const copyBlock = element("div", "brief-copy");
    const title = element("a", "", copy("{symbol} · {title}", { symbol: brief.market.token.symbol || "Token", title: copy(brief.title) }));
    title.href = marketUrl(location.href, NETWORK!.id, brief.market.pairAddress);
    const description = brief.kind === "liquidity" ? copy("{amount} USDC removed; {percent}% of prior USDC reserve.", { amount: formatValue(brief.value, 4), percent: brief.secondaryValue!.toFixed(1) })
      : brief.kind === "price" ? copy("1H reserve-price change: {change}. Not an executable quote.", { change: compactChange(brief.value) })
      : copy("Pool creation and subsequent trades appear in the available index. Not a token endorsement.");
    copyBlock.append(title, element("p", "", description), element("small", "", copy("Pool {address} · {time} ago{partial}", { address: shortHash(brief.market.pairAddress), time: relativeTime(brief.timestamp), partial: copy(brief.market.historyTruncated ? " · partial history" : "") })));
    const evidence = element("div", "brief-evidence");
    evidence.append(element("span", `evidence-label ${brief.basis}`, copy(brief.basis === "observed" ? "Indexed event" : "Calculated")));
    if (brief.transactionHash) {
      const link = element("a", "", copy("Source TX"));
      link.href = `${EXPLORER_BASE}/tx/${brief.transactionHash}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      evidence.append(link);
    }
    row.append(copyBlock, evidence);
    (index < 3 ? list : moreList).append(row);
  }
  if (briefs.length > 3) list.append(more);
}

function renderMarketPulse(): void {
  if (marketLoadFailed && markets.length === 0) {
    for (const id of ["pulseVolume", "pulseTrades", "pulseNetFlow", "pulseNewest", "pulseNewestAge", "pulseSellVerified"]) byId(id).textContent = "--";
    setCopy("pulseNewestAge", "Unavailable");
    setCopy("pulseStatus", "Market activity is unknown because pool data could not be loaded.");
    return;
  }
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
  setCopy("pulseNewestAge", newest ? copy("{time} old", { time: relativeTime(newest.createdAt) }) : "No pool indexed");
  byId("pulseSellVerified").textContent = `${sellVerified} / ${markets.length}`;
  const swapTotal = buys + sells;
  const cached = markets.filter(market => market.stale).length;
  setCopy("pulseStatus", copy("{count} swaps indexed in the last 24 hours · {partial} partial pools · {cached} cached pools", { count: swapTotal, partial, cached }));
}

function changeClass(value: number | null): string {
  if (value === null || Math.abs(value) < 0.05) return "neutral";
  return value > 0 ? "positive" : "negative";
}

function renderMarketRows(): void {
  const container = byId("marketRows");
  container.replaceChildren();
  const shown = visibleMarkets();
  adPreview.setContentAvailable(shown.length > 0);
  renderMarketSummary();
  renderMarketPulse();
  renderMarketBrief();
  renderWatchDigest();
  if (shown.length === 0) {
    const message = marketLoadFailed && markets.length === 0 ? "Market activity is unknown because pool data could not be loaded." : activeFilter === "active"
      ? "No token has indexed trading activity in the last 24 hours."
      : activeFilter === "watchlist" ? "No token is currently on this browser's watchlist." : "No token matches this view.";
    container.append(element("div", "market-loading-row", copy(message)));
    return;
  }
  for (const market of shown) {
    const row = element("button", "market-row");
    row.type = "button";
    row.title = `${adapterFor(market).source.label} · ${market.pairAddress}`;
    const selected = markets.find(entry => entry.pairAddress.toLowerCase() === selectedPair);
    const isSelected = selected?.tokenAddress.toLowerCase() === market.tokenAddress.toLowerCase();
    row.classList.toggle("selected", isSelected);
    row.setAttribute("aria-pressed", String(isSelected));
    localize(row, copy("Open {symbol} market", { symbol: market.token.symbol || market.token.name || "token" }), "aria-label");

    const identity = element("span", "market-token");
    const icon = element("span", "market-token-icon", (market.token.symbol || market.token.name || "?").slice(0, 2).toUpperCase());
    const copyBlock = element("span", "market-token-copy");
    const watched = watchlist.has(market.tokenAddress.toLowerCase());
    const poolCount = markets.filter(entry => entry.tokenAddress.toLowerCase() === market.tokenAddress.toLowerCase()).length;
    copyBlock.append(
      element("strong", watched ? "watched-token" : "", `${watched ? "★ " : ""}${market.token.symbol || "Unknown"}`),
      element("span", "", market.token.name || shortHash(market.tokenAddress)),
      element("small", "", copy("{holders} holders · {pools} pools", { holders: fullNumber(market.token.holders_count), pools: poolCount })),
      element("small", "market-data-state", copy("{state}{partial}", { state: copy(market.stale ? "Cached" : "Fetched"), partial: copy(market.historyTruncated ? " · Partial history" : "") })),
    );
    identity.append(icon, copyBlock);

    const price = element("span", "market-cell price-cell");
    price.append(priceElement(market.currentPrice), element("small", changeClass(market.periods.m5.priceChange), `5M ${compactChange(market.periods.m5.priceChange)}`));
    const pulse = element("span", "market-cell pulse-cell");
    pulse.append(
      element("strong", changeClass(market.periods.h1.priceChange), `1H ${compactChange(market.periods.h1.priceChange)}`),
      element("small", changeClass(market.periods.h24.priceChange), `24H ${compactChange(market.periods.h24.priceChange)} · ${formatValue(market.periods.h24.volumeUsdc, 3)} USDC${market.historyTruncated ? " · partial" : ""}`),
    );
    const liquidity = element("span", "market-cell");
    liquidity.append(element("strong", "", `${formatValue(market.totalLiquidity)} USDC`), element("small", "", copy("{amount} exit side", { amount: formatValue(market.usdcReserve) })));

    const flow = element("span", "row-flow");
    const counts = element("strong");
    counts.append(element("span", "positive", copy("B {count}", { count: market.buyCount })), element("span", "negative", copy("S {count}", { count: market.sellCount })));
    const track = element("span", "mini-flow-track");
    const total = Math.max(1, market.buyCount + market.sellCount);
    const buyBar = element("span");
    const sellBar = element("span");
    buyBar.style.width = `${(market.buyCount / total) * 100}%`;
    sellBar.style.width = `${(market.sellCount / total) * 100}%`;
    track.append(buyBar, sellBar);
    flow.append(counts, track, element("small", "", `${formatValue(market.volumeUsdc, 3)} USDC`));

    const age = element("span", "market-cell");
    age.append(element("strong", "", relativeTime(market.createdAt)), element("small", "", market.lastTradeAt ? copy("trade {time}", { time: relativeTime(market.lastTradeAt) }) : copy("no trades")));
    row.append(identity, price, pulse, liquidity, flow, age);
    row.addEventListener("click", () => void selectMarket(market, true));
    container.append(row);
  }
}

function classifyWalletSignals(
  market: MarketPair,
  transfers: TokenTransfer[],
  holders: TokenHolder[],
  creatorAddress: string | null,
  pools: Set<string>,
): WalletSignal[] {
  const creator = creatorAddress?.toLowerCase() ?? null;
  const currentHolders = new Set(holders
    .filter((holder) => Number(holder.value || 0) > 0 && holder.address?.hash)
    .map((holder) => holder.address!.hash!.toLowerCase()));
  const topHolders = new Set(holders
    .filter((holder) => {
      const hash = holder.address?.hash?.toLowerCase();
      return Boolean(hash && !pools.has(hash) && !BURN_ADDRESSES.has(hash));
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

    const fromPool = pools.has(from);
    const toPool = pools.has(to);
    if (fromPool && toPool) continue;
    const creatorInvolved = Boolean(creator && (from === creator || to === creator));
    const topHolderInvolved = topHolders.has(from) || topHolders.has(to);
    const poolOutflow = !fromPool && toPool;
    const firstEntry = !toPool && !transfer.to?.is_contract && firstIndexedReceipt && currentHolders.has(to) && share >= 0.1;
    const whaleMove = share >= 1 || topHolderInvolved;
    const categories = new Set<WalletSignalCategory>();
    if (creatorInvolved) categories.add("creator");
    if (whaleMove) categories.add("whale");
    if (firstEntry) categories.add("entry");
    if (poolOutflow) categories.add("exit");
    if (categories.size === 0) continue;

    let title = "Wallet movement";
    let detail = "A token transfer moved between two indexed addresses.";
    let tone: WalletSignal["tone"] = "info";
    if (creatorInvolved) {
      if (from === creator && toPool) {
        title = "Creation sender sent to pool";
        detail = "The PairCreated transaction sender moved tokens into the pool.";
        tone = "warning";
      } else if (to === creator && fromPool) {
        title = "Creation sender received from pool";
        detail = "The PairCreated transaction sender acquired tokens from the pool.";
        tone = "info";
      } else if (from === creator) {
        title = "Creation sender sent tokens";
        detail = "The PairCreated transaction sender transferred tokens to another address.";
        tone = "warning";
      } else {
        title = "Creation sender received tokens";
        detail = "Tokens moved into the PairCreated transaction sender.";
      }
    } else if (poolOutflow) {
      title = topHolders.has(from) ? "Top holder sent to pool" : "Wallet sent to pool";
      detail = "Tokens moved into a known pool. A transfer alone does not confirm a sale or a full exit.";
      tone = "warning";
    } else if (whaleMove) {
      if (fromPool) {
        title = topHolders.has(to) ? "Top holder received from pool" : "Large transfer from pool";
        detail = "Tokens moved out of a known pool; this may be a swap or a liquidity withdrawal.";
        tone = "info";
      } else {
        title = topHolders.has(from) ? "Top holder transferred" : "Large wallet transfer";
        detail = "A large token position moved directly between addresses.";
      }
    } else if (firstEntry) {
      title = "First visible receipt";
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
  pools: Set<string>,
): { clusters: HolderCluster[]; connections: HolderConnection[] } {
  const positionByAddress = new Map(positions.map((position) => [position.address.toLowerCase(), position]));
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
    if (pools.has(from) || pools.has(to) || BURN_ADDRESSES.has(from) || BURN_ADDRESSES.has(to)) continue;

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
  const [holderData, lpHolderData, pairToken, addressResult, transaction, resolvedTransactions, transferHistory] = await Promise.all([
    fetchOptional<HolderResponse>(`/tokens/${market.tokenAddress}/holders`, 120_000, force),
    fetchOptional<HolderResponse>(`/tokens/${market.pairAddress}/holders`, 120_000, force),
    fetchOptional<Token>(`/tokens/${market.pairAddress}`, 300_000, force),
    fetchOptional<AddressDetails>(`/addresses/${market.tokenAddress}`, 120_000, force),
    market.creationTx ? fetchOptional<TransactionDetails>(`/transactions/${market.creationTx}`, 300_000, force) : Promise.resolve(null),
    transactionRequests,
    fetchTokenTransfers(market.tokenAddress, force).catch(() => null),
  ]);
  const address = addressResult?.data ?? null;
  const implementationAddress = address?.implementations?.[0]?.address_hash;
  const [proxyContract, implementationContract] = await Promise.all([
    address?.is_verified ? fetchOptional<ContractDetails>(`/smart-contracts/${market.tokenAddress}`, 300_000, force) : Promise.resolve(null),
    implementationAddress ? fetchOptional<ContractDetails>(`/smart-contracts/${implementationAddress}`, 300_000, force) : Promise.resolve(null),
  ]);
  const contract = mergeContracts(proxyContract?.data ?? null, implementationContract?.data ?? null);
  const pools = knownTokenPools(market, markets);
  const ownership = holderMetrics(holderData, market.token.total_supply, pools);
  const holders = ownership.holders;
  const pairLower = market.pairAddress.toLowerCase();
  const creatorAddress = transaction?.data.from?.hash ?? null;
  const creator = creatorAddress?.toLowerCase() ?? null;
  const holderPositions = ownership.positions.slice(0, 8).flatMap<HolderPosition>((holder) => {
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
  const lp = holderMetrics(lpHolderData, pairToken?.data.total_supply ?? null, new Set());
  const topLp = lp.positions[0];
  const transactionSenders = Object.fromEntries(resolvedTransactions
    .filter((entry) => entry.transaction?.data.from?.hash)
    .map((entry) => [entry.hash.toLowerCase(), entry.transaction!.data.from!.hash!]));
  const walletSignals = classifyWalletSignals(market, transferHistory?.items ?? [], holders, creatorAddress, pools);
  const holderNetwork = analyzeHolderConnections(market, transferHistory?.items ?? [], holderPositions, pools);
  const combinedState = (...states: SourceState[]): SourceState => states.includes("unavailable") ? "unavailable" : states.includes("cached") ? "cached" : "fresh";
  const contractState = combinedState(sourceState(addressResult), sourceState(proxyContract),
    ...(implementationAddress ? [sourceState(implementationContract)] : []));
  return {
    checkedAt: Date.now(),
    sources: {
      holders: ownership.state,
      lp: combinedState(lp.state, sourceState(pairToken)),
      contract: contractFunctions(contract).length > 0 ? contractState : "unavailable",
      creator: creatorAddress ? sourceState(transaction) : "unavailable",
      transfers: transferHistory ? transferHistory.stale ? "cached" : "fresh" : "unavailable",
      senders: combinedState(...resolvedTransactions.map(entry => entry.transaction?.data.from?.hash ? sourceState(entry.transaction) : "unavailable")),
    },
    holderHistoryPartial: ownership.partial,
    lpHistoryPartial: lp.partial,
    poolScope: [...pools].sort().join(","),
    burnedTokenShare: ownership.burned,
    capabilities: detectCapabilities(address, contract),
    contractVisible: contractFunctions(contract).length > 0,
    creatorShare: ownership.shareAt(creatorAddress),
    holderClusters: holderNetwork.clusters,
    holderConnections: holderNetwork.connections,
    holderPositions,
    lpBurnedShare: lp.burned,
    lpTopHolderIsContract: Boolean(topLp?.address?.is_contract),
    lpTopHolderShare: lp.top(1),
    poolShare: ownership.shareAt(pairLower),
    top1Share: ownership.top(1),
    top5Share: ownership.top(5),
    top10Share: ownership.top(10),
    transferHistoryTruncated: transferHistory?.truncated ?? true,
    transactionSenders,
    walletSignals,
  };
}

function buildWarnings(market: MarketPair, detail: MarketDetail): RiskWarning[] {
  const warnings: RiskWarning[] = [];
  const incomplete = Object.entries(detail.sources).filter(([, state]) => state !== "fresh");
  if (incomplete.length) warnings.push({ basis: "unverified", title: "Detail checks are incomplete", detail: copy("{sources}. Missing data is not a clean risk check.", { sources: incomplete.map(([name, state]) => `${name}: ${state}`).join("; ") }), tone: "warning" });
  if (detail.holderHistoryPartial || detail.lpHistoryPartial) warnings.push({ basis: "unverified", title: "Holder index is partial", detail: "Only the first holder page is available. Unseen balances and incomplete burn totals remain unknown.", tone: "info" });
  if (market.periods.h24.priceChange === null) warnings.push({ basis: "unverified", title: "24H starting price unavailable", detail: "The 24H return is not estimated from a shorter window.", tone: "info" });
  if (market.historyTruncated) warnings.push({ basis: "unverified", title: "24-hour activity is partial", detail: "Older events beyond the ArcScan page limit are not included in totals.", tone: "info" });
  if (market.reserveSource === "balance") warnings.push({ basis: "estimate", title: "Token-balance fallback", detail: "No indexed Sync event was available. Price and liquidity are derived from the pair's token balances.", tone: "info" });
  if (market.sellCount > 0) warnings.push({ basis: "observed", title: "Sell event indexed", detail: copy("A token-to-USDC Swap was indexed {time} ago. This does not prove that any wallet can sell now.", { time: relativeTime(market.lastSellAt) }), tone: "info" });
  else warnings.push({ basis: "unverified", title: "No sell in available history", detail: "Absence of indexed sells does not prove a token is unsellable.", tone: "info" });
  if (market.totalLiquidity < 200) warnings.push({ basis: "estimate", title: "Pool liquidity below 200 USDC", detail: copy("Reserve-based estimate: {total} USDC total, {quote} USDC on the quote side. This threshold is a screening rule, not a safety rating.", { total: formatValue(market.totalLiquidity), quote: formatValue(market.usdcReserve) }), tone: "warning" });
  if (detail.top10Share !== null && detail.top10Share >= 25) warnings.push({ basis: "estimate", title: "Top-10 ownership exceeds 25%", detail: copy("{share}% of indexed supply, excluding burn addresses and known pools. Addresses are not necessarily independent owners.", { share: detail.top10Share.toFixed(1) }), tone: "warning" });
  if (detail.creatorShare !== null && detail.creatorShare >= 10) warnings.push({ basis: "estimate", title: "Pool-creation sender holds at least 10%", detail: copy("Indexed share: {share}%. This transaction sender may be a relayer; it is not proof of the token team's identity.", { share: detail.creatorShare.toFixed(1) }), tone: "info" });
  if (detail.lpBurnedShare !== null) warnings.push({ basis: "estimate", title: "LP at burn addresses", detail: copy("{share}% of indexed LP supply. This does not establish token safety or sale availability.", { share: detail.lpBurnedShare.toFixed(1) }), tone: "info" });
  warnings.push({ basis: "unverified", title: "Liquidity lock not independently checked", detail: detail.lpTopHolderShare !== null ? copy("Top indexed LP holder: {share}%. Lock contract rules and unlock times have not been checked.", { share: detail.lpTopHolderShare.toFixed(1) }) : "LP ownership or lock terms could not be established.", tone: "info" });
  detail.capabilities.forEach(finding => warnings.push({ ...capabilityText(finding), detail: copy("{evidence} Names alone do not establish current permissions or execution paths. Selected getter values, when requested, appear separately under Contract state and do not confirm this capability is usable.", {
    evidence: [finding.functions.length ? `ABI: ${finding.functions.join(", ")}.` : "", finding.proxyType ? `Explorer proxy type: ${finding.proxyType}.` : ""].filter(Boolean).join(" "),
  }), tone: "info" }));
  warnings.push({ basis: "unverified", title: "Execution paths not verified", detail: "No sell simulation or full permission audit is performed. Optional contract-state reads below report selected getter values only; they do not prove a control is usable, disabled, or absent elsewhere.", tone: "info" });
  if (!detail.contractVisible) warnings.push({ basis: "unverified", title: "Contract ABI unavailable", detail: "Supply and trading controls cannot be assessed from the available ABI.", tone: "info" });
  else if (detail.capabilities.length === 0) warnings.push({ basis: "unverified", title: "No matching ABI names", detail: "No configured function-name pattern matched. Custom logic, external contracts, or different function names may still impose restrictions.", tone: "info" });
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
  setCopy("detailTradeCount", trades.length > 0 ? copy("{count} visible", { count: trades.length }) : "No trades");
  if (trades.length === 0) {
    list.append(element("div", "trade-empty", copy("No swaps are available in the indexed history.")));
    return;
  }
  for (const trade of trades) {
    const row = element("div", `trade-row ${trade.direction}`);
    const side = element("span", "trade-side", copy(trade.direction === "buy" ? "BUY" : "SELL"));
    const value = element("span", "trade-value");
    value.append(element("strong", "", `${formatValue(trade.usdcValue, 4)} USDC`), element("small", "", `${relativeTime(trade.timestamp)} ago`));
    const links = element("span", "trade-links");
    const actor = tradeActor(detail.transactionSenders[trade.transactionHash.toLowerCase()], trade.fallbackAddress);
    if (actor) {
      const senderLink = element("a", "", shortHash(actor.address, 5, 4));
      senderLink.href = `${EXPLORER_BASE}/address/${actor.address}`;
      senderLink.target = "_blank";
      senderLink.rel = "noreferrer";
      senderLink.title = `${actor.role}: ${actor.address}`;
      senderLink.setAttribute("aria-label", `${actor.role} ${actor.address}`);
      links.append(element("span", "trade-sender-label", copy(actor.role)), senderLink);
    } else {
      links.append(element("span", "", copy("Sender unknown")));
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
  setCopy("walletSignalCount", detail.sources.transfers === "unavailable" ? "Unavailable" : copy("{count} signals", { count: signals.length }));
  byId("walletCreatorMoves").textContent = String(count("creator"));
  byId("walletWhaleMoves").textContent = String(count("whale"));
  byId("walletEntries").textContent = String(count("entry"));
  byId("walletExits").textContent = String(count("exit"));
  if (detail.sources.transfers === "unavailable") {
    for (const id of ["walletCreatorMoves", "walletWhaleMoves", "walletEntries", "walletExits"]) byId(id).textContent = "--";
  } else {
    if (detail.sources.creator === "unavailable") byId("walletCreatorMoves").textContent = "--";
    if (detail.sources.holders === "unavailable") byId("walletEntries").textContent = "--";
  }
  setCopy("walletSignalNote", copy("Transfers: {transfers}{partial}. Holders: {holders}. Pool transfers are not proof of a swap or full exit.", {
    transfers: copy(detail.sources.transfers), partial: copy(detail.transferHistoryTruncated ? "; partial history" : ""), holders: copy(detail.sources.holders),
  }));
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
    list.append(element("div", "wallet-signal-empty", copy(detail.sources.transfers === "unavailable" ? "Transfer history could not be loaded. Wallet activity is unknown." : "No wallet movement matches this filter in the available indexed transfers.")));
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
  const now = Date.now();
  const cutoff = now - DAY_MS;
  const recent = events.filter((event) => Date.parse(event.timestamp) >= cutoff && Date.parse(event.timestamp) <= now);
  const added = recent.filter((event) => event.direction === "add").reduce((sum, event) => sum + event.usdcAmount, 0);
  const removed = recent.filter((event) => event.direction === "remove").reduce((sum, event) => sum + event.usdcAmount, 0);
  setCopy("liquidityEventCount", copy("{count} events", { count: events.length }));
  setCopy("liquidityHistoryNote", copy("Showing {shown} of {count} indexed liquidity events. 24H totals use fetched events only{partial}.", {
    shown: Math.min(events.length, 8), count: events.length, partial: copy(market.historyTruncated ? "; history may be incomplete" : ""),
  }));
  byId("liquidityCurrent").textContent = formatValue(market.usdcReserve, 3);
  byId("liquidityAdded").textContent = formatValue(added, 3);
  byId("liquidityRemoved").textContent = formatValue(removed, 3);
  byId("liquidityBurned").textContent = shareText(detail.lpBurnedShare);
  const lpOwnership = detail.lpBurnedShare !== null && detail.lpBurnedShare >= 90
    ? copy("{share} of LP supply is held by burn addresses.", { share: shareText(detail.lpBurnedShare) })
    : detail.lpTopHolderShare !== null ? copy("Top {holder} controls {share} of LP supply; a lock is not confirmed.", { holder: copy(detail.lpTopHolderIsContract ? "contract" : "wallet"), share: shareText(detail.lpTopHolderShare) })
      : copy("LP ownership is unavailable from the current index.");
  setCopy("liquidityLpStatus", copy("{ownership} LP data: {state}{partial}.", {
    ownership: lpOwnership, state: copy(detail.sources.lp), partial: copy(detail.lpHistoryPartial ? "; partial holder page" : ""),
  }));

  const list = byId("liquidityEventList");
  list.replaceChildren();
  if (events.length === 0) {
    list.append(element("div", "liquidity-empty", copy("No Mint or Burn event appears in the visible pair history.")));
    return;
  }
  for (const event of events.slice(0, 8)) {
    const row = element("div", `liquidity-event-row ${event.direction}`);
    const head = element("div", "liquidity-event-head");
    const time = element("time", "", copy("{time} ago", { time: relativeTime(event.timestamp) }));
    time.dateTime = event.timestamp;
    head.append(element("strong", "", copy(event.direction === "add" ? "Liquidity added" : "Liquidity removed")), time);

    const values = element("div", "liquidity-event-values");
    values.append(
      element("strong", "", `${formatValue(event.usdcAmount, 4)} USDC`),
      element("span", "", `${formatValue(event.tokenAmount, 3)} ${market.token.symbol || "tokens"}`),
      element("span", "", event.changePercent === null ? copy("Initial / unknown base") : copy("{percent}% of prior USDC reserve", { percent: event.changePercent.toFixed(1) })),
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
  setCopy("holderCountSummary", copy("{count} indexed", { count: fullNumber(market.token.holders_count) }));
  byId("holderTop1").textContent = shareText(detail.top1Share);
  byId("holderTop5").textContent = shareText(detail.top5Share);
  byId("holderTop10").textContent = shareText(detail.top10Share);
  byId("holderCreator").textContent = shareText(detail.creatorShare);
  setCopy("holderSupplyNote", copy("Holders: {state}{partial}. Selected pool {poolShare} · Burned {burnedShare}. Rankings exclude burn addresses and {count} known same-token pool(s), not all possible pools.", {
    state: copy(detail.sources.holders), partial: copy(detail.holderHistoryPartial ? "; first page only" : ""), poolShare: shareText(detail.poolShare), burnedShare: shareText(detail.burnedTokenShare), count: detail.poolScope.split(",").filter(Boolean).length,
  }));

  const list = byId("holderList");
  list.replaceChildren();
  if (detail.holderPositions.length === 0) {
    list.append(element("div", "holder-empty", copy("Holder positions are unavailable from the current index.")));
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
    if (position.isCreator) addressLine.append(element("span", "holder-tag creator", copy("Creation sender")));
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
  const unavailable = detail.sources.holders === "unavailable" || detail.sources.transfers === "unavailable";
  setCopy("holderClusterSummary", unavailable ? "Unavailable" : connections.length === 0 ? "No visible links" : copy("{count} links", { count: connections.length }));
  byId("clusterConnections").textContent = String(connections.length);
  byId("clusterWallets").textContent = String(connectedWallets.size);
  byId("clusterCount").textContent = String(clusters.length);
  byId("clusterLargest").textContent = clusters[0] ? shareText(clusters[0].share) : "--";
  if (unavailable) {
    for (const id of ["clusterConnections", "clusterWallets", "clusterCount"]) byId(id).textContent = "--";
  }

  const positionByAddress = new Map(detail.holderPositions.map((position) => [position.address.toLowerCase(), position]));
  const map = byId("holderClusterMap");
  map.replaceChildren();
  if (clusters.length === 0) {
    map.append(element("div", "cluster-empty", unavailable ? copy("Holder connections cannot be checked without holder and transfer data.") : copy("No connection appears in the available post-launch history. Holders: {holders}; transfers: {transfers}.", { holders: copy(detail.sources.holders), transfers: copy(detail.sources.transfers) })));
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
  localize(button, watched ? "Remove token from watchlist" : "Add token to watchlist", "aria-label");
  localize(button, watched ? "Remove from watchlist" : "Add to watchlist", "title");
  byId("watchIcon").textContent = watched ? "★" : "☆";
}

function renderWatchDigest(): void {
  const section = byId("watchDigest");
  section.classList.toggle("hidden", Boolean(linkedPool));
  if (linkedPool) return;
  const watched = markets.filter(market => watchlist.has(market.tokenAddress.toLowerCase()));
  const events = watched.flatMap(market => (readTracking(market.pairAddress)?.alerts ?? []).map(alert => ({ ...alert, market })));
  const onlyNew = byId<HTMLSelectElement>("watchChangeView").value === "new";
  const recent = recentWatchChanges(events, onlyNew ? watchReviewedAt : null, Date.now());
  localize(byId("watchDigestTitle"), "Watchlist changes");
  const covered = new Set(watched.map(market => market.tokenAddress.toLowerCase())).size;
  const checked = watched.filter(market => {
    const detail = detailCache.get(poolCacheKey(market));
    return !market.stale && detail && Date.now() - detail.data.checkedAt < DETAIL_CACHE_TTL_MS
      && detail.data.sources.holders === "fresh" && detail.data.sources.lp === "fresh" && detail.data.sources.creator === "fresh";
  }).length;
  setCopy("watchDigestCoverage", copy("{covered} / {total} watched tokens loaded · {checked} / {pools} pools with recent ownership reads · {state}", { covered, total: watchlist.size, checked, pools: watched.length, state: copy(watchScanRunning ? "Checking" : document.hidden ? "Paused" : "Tab-only monitoring") }));
  setCopy("watchMonitorNote", copy("Up to 3 loaded watched pools checked per minute while this tab is visible. No monitoring while hidden or closed. {review}", { review: watchReviewedAt ? copy("Reviewed {time}.", { time: new Date(watchReviewedAt).toLocaleString() }) : copy("Not reviewed yet.") }));
  byId<HTMLButtonElement>("markWatchReviewed").disabled = recent.length === 0 || marketLoadFailed;
  const list = byId("watchDigestList");
  list.replaceChildren();
  if (!recent.length) {
    list.append(element("p", "watch-digest-empty", copy(watchlist.size === 0 ? "No watched tokens." : covered === 0 ? "Watched tokens are outside the loaded pool coverage." : "No recorded changes in this view. Gaps in observation are not proof of no activity.")));
    return;
  }
  for (const event of recent) {
    const row = element("article", `watch-digest-item ${event.tone}`);
    const title = element("a", "", `${event.market.token.symbol ?? "Token"}: ${event.title}`);
    title.href = marketUrl(location.href, NETWORK!.id, event.market.pairAddress);
    const head = element("div", "observed-alert-head");
    head.append(title, element("time", "", `Observed ${relativeTime(event.observedAt)} ago`));
    const evidence = element("a", "watch-evidence-link", event.type === "sell" ? "Indexed pool events" : "Snapshot comparison · source");
    evidence.href = `${EXPLORER_BASE}/${["ownership", "holders"].includes(event.type) ? `token/${event.market.tokenAddress}` : `address/${event.market.pairAddress}`}`;
    evidence.target = "_blank";
    evidence.rel = "noreferrer";
    row.append(head, element("p", "", event.detail), evidence, element("small", "", `Pool ${shortHash(event.market.pairAddress)}${event.market.stale ? " · cached now" : ""}`));
    list.append(row);
  }
}

async function checkWatchedPools(): Promise<void> {
  if (watchScanRunning || document.hidden || linkedPool || marketLoadFailed || Date.now() - lastWatchScanAt < AUTO_REFRESH_MS) return;
  const watched = markets.filter(market => !market.stale && watchlist.has(market.tokenAddress.toLowerCase()));
  const batch = nextWatchBatch(watched, market => Math.max(watchCheckAttempts.get(poolCacheKey(market)) ?? 0,
    detailCache.get(poolCacheKey(market))?.data.checkedAt ?? 0), Date.now(), DETAIL_CACHE_TTL_MS);
  if (!batch.length) { renderWatchDigest(); return; }
  lastWatchScanAt = Date.now();
  watchScanRunning = true;
  renderWatchDigest();
  try {
    for (const market of batch) {
      if (document.hidden) break;
      if (!watchlist.has(market.tokenAddress.toLowerCase())) continue;
      watchCheckAttempts.set(poolCacheKey(market), Date.now());
      try {
        const detail = await getMarketDetail(market, false);
        if (!marketLoadFailed && markets.includes(market)) observeDetailChanges(market, detail);
      } catch {
        // A failed read must not replace saved ownership baselines.
      }
      renderWatchDigest();
    }
  } finally {
    watchScanRunning = false;
    renderWatchDigest();
  }
}

function renderObservedAlerts(market: MarketPair): void {
  renderWatchDigest();
  const watched = watchlist.has(market.tokenAddress.toLowerCase());
  const section = byId("observedAlertSection");
  section.classList.toggle("hidden", !watched);
  if (!watched) return;
  const tracking = readTracking(market.pairAddress) ?? startTracking(market);
  const alerts = tracking.alerts ?? [];
  setCopy("observedAlertCount", copy("{count} events", { count: alerts.length }));
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
  setCopy("observedAlertNote", copy("Baseline {time} · stored in this browser.", { time: baseline }));
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
    localize(byId("exitEstimate"), "Unavailable");
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
  setCopy("exitEstimate", copy("1% -> {amount} USDC · {impact}% impact", { amount: formatValue(onePercent.output, 3), impact: onePercent.impact.toFixed(1) }));
}

function renderPoolComparison(market: MarketPair): void {
  const peers = groupTokenPools(markets.filter(entry => entry.chainId === market.chainId && entry.tokenAddress.toLowerCase() === market.tokenAddress.toLowerCase()))[0]?.pools ?? [market];
  const select = byId<HTMLSelectElement>("poolSelector");
  select.replaceChildren();
  for (const peer of peers) {
    const option = element("option", "", `${adapterFor(peer).source.label} · ${shortHash(peer.pairAddress)} · ${formatValue(peer.totalLiquidity)} USDC`);
    option.value = peer.pairAddress.toLowerCase();
    select.append(option);
  }
  select.value = market.pairAddress.toLowerCase();
  select.disabled = peers.length < 2;
  setCopy("poolComparisonNote", copy("Loaded pools: {count}. Quotes are pool-specific, not executable prices. Default: fresh data first, then highest liquidity.", { count: peers.length }));
  const list = byId("poolComparisonList");
  list.replaceChildren();
  for (const peer of peers) {
    const row = element("div", "pool-comparison-row");
    const link = element("a", "", shortHash(peer.pairAddress));
    link.href = marketUrl(location.href, NETWORK!.id, peer.pairAddress);
    link.setAttribute("aria-label", `Open pool ${peer.pairAddress}`);
    const quote = element("span");
    quote.append(priceElement(peer.currentPrice));
    row.append(link, quote, element("span", "", `${formatValue(peer.totalLiquidity)} USDC`),
      element("small", "", copy("{state}{partial} · {trade}", { state: copy(peer.stale ? "Cached" : "Fetched"), partial: copy(peer.historyTruncated ? " · Partial history" : ""), trade: peer.lastTradeAt ? copy("trade {time}", { time: relativeTime(peer.lastTradeAt) }) : copy("no trades") })));
    list.append(row);
  }
}

function renderAuthority(market: MarketPair): void {
  const key = `${market.chainId}:${market.tokenAddress.toLowerCase()}`;
  const entry = authorityReads.get(key);
  const button = byId<HTMLButtonElement>("readAuthority");
  const cooling = Boolean(entry && Date.now() - entry.attemptedAt < 60_000);
  button.disabled = !NETWORK || Boolean(authorityRunning) || cooling;
  localize(button, authorityRunning === key ? "Reading..." : entry ? "Read again" : "Read state");
  localize(button, cooling ? "Public RPC cooldown: one request per token per minute." : "Read selected contract getters without connecting a wallet", "title");
  const status = byId("authorityStatus");
  localize(status, authorityRunning === key ? "Reading verified ABI and public RPC state..."
    : entry?.error ? entry.error : entry?.snapshot?.block ? "Fixed-block snapshot. Values may have changed since this read."
      : entry?.snapshot ? "State not read: no supported verified getters available." : "No state snapshot requested.");
  const provenance = byId("authoritySource");
  const rows = byId("authorityRows");
  provenance.replaceChildren();
  rows.replaceChildren();
  const snapshot = entry?.snapshot;
  if (!snapshot) return;
  const sourceLink = (label: string, path: string) => {
    const link = element("a", "", label);
    link.href = `${EXPLORER_BASE}${path}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    return link;
  };
  provenance.append(element("span", "", `${NETWORK!.label} / Checked ${new Date(snapshot.checkedAt).toLocaleString()}`));
  if (snapshot.block) {
    provenance.append(sourceLink(`Block ${snapshot.block.number}`, `/block/${snapshot.block.number}`),
      element("span", "", `Block time ${new Date(snapshot.block.timestamp).toLocaleString()}`));
  }
  for (const address of snapshot.abiAddresses) provenance.append(sourceLink(`ABI ${shortHash(address)}`, `/address/${address}?tab=contract`));
  const unchecked = element("details", "authority-unchecked");
  const uncheckedCount = snapshot.rows.filter(item => item.state === "unsupported").length;
  unchecked.append(element("summary", "", copy("{count} checks unavailable from ABI", { count: uncheckedCount })));
  for (const item of snapshot.rows) {
    const row = element("div", "authority-row");
    const value = element("div", "authority-value");
    value.append(element("strong", "", item.state === "unsupported" || item.value === "Unavailable" ? copy(item.value) : item.value));
    if (item.addresses?.length) {
      const addresses = element("div", "authority-addresses");
      for (const address of item.addresses) addresses.append(sourceLink(address, `/address/${address}`));
      // Addresses remain inspectable in full without repeating a single getter value.
      if (item.addresses.length === 1 && item.value === item.addresses[0]) value.replaceChildren();
      value.append(addresses);
    }
    value.append(element("small", "", copy(item.note)));
    row.append(element("span", "", copy(item.label)), value);
    (item.state === "unsupported" ? unchecked : rows).append(row);
  }
  if (uncheckedCount) rows.append(unchecked);
  for (const note of snapshot.notes) rows.append(element("p", "authority-note", copy(note)));
}

async function readSelectedAuthority(): Promise<void> {
  const market = markets.find(entry => entry.pairAddress.toLowerCase() === selectedPair);
  if (!market || !NETWORK || authorityRunning) return;
  const key = `${market.chainId}:${market.tokenAddress.toLowerCase()}`;
  const previous = authorityReads.get(key);
  if (previous && Date.now() - previous.attemptedAt < 60_000) return;
  const entry: { attemptedAt: number; snapshot?: AuthoritySnapshot; error?: string } = { attemptedAt: Date.now() };
  authorityReads.set(key, entry);
  authorityRunning = key;
  renderAuthority(market);
  const renderSelected = () => {
    const current = markets.find(item => item.pairAddress.toLowerCase() === selectedPair);
    if (current) renderAuthority(current);
  };
  try { entry.snapshot = await readAuthoritySnapshot(NETWORK, market.tokenAddress); }
  catch (error) { entry.error = error instanceof Error && error.name !== "AbortError" && error.name !== "TimeoutError"
    ? error.message : "State read timed out. No current values are assumed."; }
  finally {
    authorityRunning = "";
    renderSelected();
    window.setTimeout(renderSelected, Math.max(0, 60_000 - (Date.now() - entry.attemptedAt)) + 50);
  }
}

function renderDetail(market: MarketPair, detail: MarketDetail): void {
  renderAuthority(market);
  renderPoolComparison(market);
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
  setCopy("detailFdv", market.fdv === null ? "Unavailable" : copy("{value} USDC", { value: formatValue(market.fdv) }));
  byId("detailLiquidity").textContent = `${formatValue(market.totalLiquidity)} USDC`;
  setCopy("detailLiquidityNote", copy("{amount} USDC exit side · {source}", { amount: formatValue(market.usdcReserve), source: copy(market.reserveSource === "sync" ? "Sync reserves" : "balance fallback") }));
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
  setCopy("detailLastTrade", market.lastTradeAt ? copy("{time} ago", { time: relativeTime(market.lastTradeAt) }) : "None");
  const totalFlow = Math.max(1, recent.buyCount + recent.sellCount);
  byId<HTMLElement>("detailBuyBar").style.width = `${(recent.buyCount / totalFlow) * 100}%`;
  byId<HTMLElement>("detailSellBar").style.width = `${(recent.sellCount / totalFlow) * 100}%`;
  renderTradeTape(market, detail);
  renderWalletSignals(market, detail);
  renderLiquidityMonitor(market, detail);
  renderHolders(market, detail);
  renderHolderConnections(detail);

  const warnings = buildWarnings(market, detail);
  const summary = evidenceSummary(warnings);
  setCopy("warningCount", copy("{indexed} indexed · {calculated} calculated · {unverified} unverified", { indexed: summary.observed, calculated: summary.estimates, unverified: summary.unverified }));
  const badge = byId("riskBadge");
  badge.className = "risk-badge";
  localize(badge, summary.label);
  localize(badge, "Evidence completeness, not a risk score or safety verdict.", "title");
  setCopy("evidenceFreshness", copy("Market: {market} · Contract: {contract} · Holders: {holders} · No safety score", { market: copy(market.stale ? "Cached" : "Fetched"), contract: copy(detail.sources.contract), holders: copy(detail.sources.holders) }));
  const sources = byId("evidenceSources");
  sources.replaceChildren();
  for (const [label, path] of [["Token contract", `/address/${market.tokenAddress}?tab=contract`], ["Pool events", `/address/${market.pairAddress}?tab=logs`], ["Holder index", `/token/${market.tokenAddress}?tab=holders`]]) {
    const link = element("a", "", copy(label));
    link.href = `${EXPLORER_BASE}${path}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    sources.append(link);
  }
  const list = byId("marketWarnings");
  list.replaceChildren();
  for (const warning of warnings) {
    const row = element("div", `warning-item ${warning.tone}`);
    const copyBlock = element("div", "warning-copy");
    copyBlock.append(element("small", `evidence-label ${warning.basis}`, copy(warning.basis === "observed" ? "Indexed event" : warning.basis === "estimate" ? "Calculated" : "Unverified")), element("strong", "", copy(warning.title)), element("span", "", typeof warning.detail === "string" ? copy(warning.detail) : warning.detail));
    row.append(element("span", "warning-dot"), copyBlock);
    list.append(row);
  }
  renderExitCurve(market);
  setDetailState("content");
}

async function getMarketDetail(market: MarketPair, force: boolean): Promise<MarketDetail> {
  const key = poolCacheKey(market);
  const scope = [...knownTokenPools(market, markets)].sort().join(",");
  const cached = detailCache.get(key);
  if (!force && cached && cached.data.poolScope === scope && Date.now() - cached.data.checkedAt < DETAIL_CACHE_TTL_MS) return cached.data;
  const flightKey = `${key}:${scope}`;
  const running = detailFlights.get(flightKey);
  if (running) return running;
  const request = fetchMarketDetail(market, force).then(detail => {
    detailCache.set(key, { data: detail, savedAt: Date.now() });
    return detail;
  });
  detailFlights.set(flightKey, request);
  try { return await request; }
  finally { detailFlights.delete(flightKey); }
}

async function loadDetail(market: MarketPair, force = false): Promise<void> {
  const url = marketUrl(location.href, NETWORK!.id, market.pairAddress);
  byId<HTMLAnchorElement>("fullMarketLink").href = url;
  byId<HTMLButtonElement>("copyMarketLink").disabled = false;
  setCopy("shareMarketStatus", "");
  if (linkedPool) document.title = `${market.token.symbol ?? "Token"} | ARCROW`;
  const requestId = ++detailRequest;
  const key = poolCacheKey(market);
  const cached = detailCache.get(key);
  const poolScope = [...knownTokenPools(market, markets)].sort().join(",");
  if (!force && cached && cached.data.poolScope === poolScope && Date.now() - cached.savedAt < DETAIL_CACHE_TTL_MS) {
    if (requestId === detailRequest && selectedPair === market.pairAddress.toLowerCase()) renderDetail(market, cached.data);
    return;
  }
  setDetailState("loading");
  try {
    const detail = await getMarketDetail(market, force);
    if (requestId !== detailRequest || selectedPair !== market.pairAddress.toLowerCase()) return;
    if (!market.stale) observeDetailChanges(market, detail);
    renderDetail(market, detail);
  } catch {
    if (requestId !== detailRequest) return;
    renderDetail(market, { checkedAt: Date.now(), sources: { holders: "unavailable", lp: "unavailable", contract: "unavailable", creator: "unavailable", transfers: "unavailable", senders: "unavailable" }, poolScope, holderHistoryPartial: true, lpHistoryPartial: true, burnedTokenShare: null, capabilities: [], contractVisible: false, creatorShare: null, holderClusters: [], holderConnections: [], holderPositions: [], lpBurnedShare: null, lpTopHolderIsContract: false, lpTopHolderShare: null, poolShare: null, top1Share: null, top5Share: null, top10Share: null, transferHistoryTruncated: true, transactionSenders: {}, walletSignals: [] });
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

function setNotice(message?: string | UiCopy): void {
  const notice = byId("dataNotice");
  localize(notice, message ?? "");
  notice.classList.toggle("hidden", !message);
}

async function loadMarkets(force: boolean): Promise<boolean> {
  if (linkedPool) {
    const seed = await resolveLinkedPool(linkedPool, dexAdapters,
      async address => (await fetchData<{ creation_transaction_hash?: string | null }>(`/addresses/${address}`, 300_000, force)).data,
      async path => (await fetchData<CreationPage>(path, 300_000, force)).data);
    const market = await loadMarketPair(seed, force);
    if (!market) throw new Error("This pool's market data could not be loaded. Retry with Refresh.");
    markets = [market];
    selectedPair = market.pairAddress.toLowerCase();
    adPreview.setContentAvailable(true);
    await loadDetail(market, force);
    return market.stale;
  }
  const discovery = await discoverDexPools(dexAdapters, marketLimit, path => fetchData<LogResponse>(path, 60_000, force));
  const loaded = await mapLimited(discovery.seeds, 3, (seed) => loadMarketPair(seed, force));
  failedMarketCount = loaded.filter((market) => market === null).length;
  if (discovery.seeds.length > 0 && failedMarketCount === loaded.length) {
    throw new Error("All discovered pools failed to load. Market activity is unknown. Retry with Refresh.");
  }
  const previous = new Map(markets.map((market) => [market.pairAddress.toLowerCase(), market]));
  markets = loaded.flatMap((market, index) => {
    if (market) return [market];
    const old = previous.get(discovery.seeds[index]!.pairAddress.toLowerCase());
    return old ? [{ ...old, stale: true }] : [];
  });
  hasMoreMarkets = discovery.hasMore;
  discoveryLimited = discovery.limited;
  const shown = visibleMarkets();
  const current = markets.find(market => market.pairAddress.toLowerCase() === selectedPair);
  if (!current || !shown.some(market => market.tokenAddress.toLowerCase() === current.tokenAddress.toLowerCase())) selectedPair = shown[0]?.pairAddress.toLowerCase() ?? "";
  const selected = markets.find((market) => market.pairAddress.toLowerCase() === selectedPair);
  if (selected) void loadDetail(selected, force);
  else { detailRequest += 1; setDetailState("empty"); }
  return discovery.stale || markets.some((market) => market.stale);
}

async function loadDashboard(force = false): Promise<void> {
  if (loading || !NETWORK || routeError) return;
  loading = true;
  renderDiscoveryControls();
  const refresh = byId<HTMLButtonElement>("refreshButton");
  refresh.disabled = true;
  localize(refresh, "Refreshing");
  setNotice();
  try {
    const stale = await loadMarkets(force);
    marketLoadFailed = false;
    renderMarketRows();
    void checkWatchedPools();
    if (stale) setNotice("Live indexing is temporarily unavailable. Showing the latest cached market snapshot.");
    else if (failedMarketCount > 0) setNotice(copy("Pool loads failed: {count}. Totals cover available pools only.", { count: failedMarketCount }));
    setCopy("lastUpdated", copy("{state} {time}", { state: copy(stale ? "Cached" : failedMarketCount > 0 ? "Partial update" : "Updated"), time: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()) }));
  } catch (error) {
    marketLoadFailed = true;
    markets = markets.map(market => ({ ...market, stale: true }));
    renderMarketRows();
    adPreview.setContentAvailable(false);
    setNotice(error instanceof Error ? copy("Market data unavailable: {error}", { error: copy(error.message) }) : "Market data unavailable.");
    localize(byId("lastUpdated"), "Connection unavailable");
    detailRequest += 1;
    setDetailState("empty");
    if (linkedPool) {
      byId("marketDetailEmpty").textContent = "Pool unavailable. Use Refresh to retry or return to markets.";
      byId<HTMLButtonElement>("copyMarketLink").disabled = true;
    }
  } finally {
    lastRefreshAt = Date.now();
    loading = false;
    refresh.disabled = false;
    localize(refresh, "Refresh");
    renderDiscoveryControls();
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
      detailRequest += 1;
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
      const detail = detailCache.get(poolCacheKey(market));
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
  const detail = market ? detailCache.get(poolCacheKey(market)) : undefined;
  if (market && detail) renderWalletSignals(market, detail.data);
}

function runSearch(query: string): void {
  activeQuery = query.trim().toLowerCase();
  applyFilter(activeFilter);
  const shown = visibleMarkets();
  if (shown.length === 0) {
    setNotice("No match in the loaded pools with these filters.");
    return;
  }
  setNotice();
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
byId<HTMLButtonElement>("copyMarketLink").addEventListener("click", async () => {
  const market = markets.find(entry => entry.pairAddress.toLowerCase() === selectedPair);
  if (!market || !NETWORK) return;
  const url = marketUrl(location.href, NETWORK.id, market.pairAddress);
  try {
    await navigator.clipboard.writeText(url);
    localize(byId("shareMarketStatus"), "Link copied");
  } catch {
    localize(byId("shareMarketStatus"), "Copy unavailable. Use the Full details link.");
  }
});
byId<HTMLButtonElement>("watchToggle").addEventListener("click", toggleSelectedWatch);
byId<HTMLButtonElement>("readAuthority").addEventListener("click", () => void readSelectedAuthority());
byId<HTMLSelectElement>("watchChangeView").addEventListener("change", renderWatchDigest);
byId<HTMLButtonElement>("markWatchReviewed").addEventListener("click", () => {
  watchReviewedAt = Date.now();
  try { localStorage.setItem(`${CACHE_PREFIX}watch-reviewed-at`, String(watchReviewedAt)); } catch { /* In-memory review remains available. */ }
  renderWatchDigest();
});
byId<HTMLSelectElement>("poolSelector").addEventListener("change", () => {
  const market = markets.find(entry => entry.pairAddress.toLowerCase() === byId<HTMLSelectElement>("poolSelector").value);
  if (market && !linkedPool) void selectMarket(market, false);
});
byId<HTMLSelectElement>("marketSort").addEventListener("change", (event) => {
  discoveryOptions.sort = (event.target as HTMLSelectElement).value as MarketSort;
  applyFilter(activeFilter);
});
byId<HTMLSelectElement>("minimumLiquidity").addEventListener("change", (event) => {
  discoveryOptions.minimumLiquidity = Number((event.target as HTMLSelectElement).value);
  applyFilter(activeFilter);
});
for (const [id, key] of [["traded24h", "traded24h"], ["sellSeenOnly", "sellSeen"]] as const) {
  byId<HTMLInputElement>(id).addEventListener("change", (event) => {
    discoveryOptions[key] = (event.target as HTMLInputElement).checked;
    applyFilter(activeFilter);
  });
}
byId<HTMLButtonElement>("loadMoreMarkets").addEventListener("click", () => {
  if (loading) return;
  if (!marketLoadFailed) marketLimit = Math.min(MAX_MARKETS, marketLimit + MARKET_LIMIT);
  void loadDashboard();
});

initializeLanguage();

if (NETWORK) {
  byId<HTMLAnchorElement>("backToMarkets").href = marketUrl(location.href, NETWORK.id);
  if (linkedPool || routeError) {
    document.body.classList.add("pool-page");
    byId("poolPageNav").classList.remove("hidden");
    byId("poolPageAddress").textContent = linkedPool ? `Pool ${shortHash(linkedPool)}` : "Invalid pool link";
    byId<HTMLAnchorElement>("fullMarketLink").classList.add("hidden");
  }
  localize(document.querySelector(".status-row strong")!, copy("{network} MARKET FEED", { network: NETWORK.label.toUpperCase() }));
  document.querySelector(".chain-id")!.textContent = `CHAIN ${NETWORK.chainId}`;
  document.querySelector(".network-lockup small")!.textContent = NETWORK.testnet ? "TESTNET" : "MAINNET";
  document.querySelector(".pulse-heading .eyebrow")!.textContent = `ARCROW / ${NETWORK.label.toUpperCase()}`;
  document.querySelector(".footer-brand small")!.textContent = `ON ${NETWORK.label.toUpperCase()}`;
  document.querySelectorAll<HTMLAnchorElement>("a[data-explorer]").forEach(link => { link.href = NETWORK.explorerBase; });
  if (routeError) {
    setNotice(routeError);
    byId("marketDetailEmpty").textContent = "This pool link is invalid. Return to markets.";
    localize(byId("lastUpdated"), "Invalid link");
    byId<HTMLButtonElement>("refreshButton").disabled = true;
  } else void loadDashboard();
} else {
  setNotice(networkError);
  localize(byId("lastUpdated"), "Network unavailable");
  document.querySelector(".status-row strong")!.textContent = "ARCROW";
  document.querySelector(".live-dot")!.classList.add("hidden");
  document.querySelector(".chain-id")!.textContent = "";
  document.querySelector(".network-lockup small")!.textContent = "UNAVAILABLE";
  document.querySelector(".footer-brand small")!.textContent = "";
  byId("markets").classList.add("hidden");
  document.querySelectorAll<HTMLAnchorElement>("a[data-explorer]").forEach(link => link.removeAttribute("href"));
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button, input:not([name="arcrow-theme"]), select:not(#languageSelect)').forEach(control => { control.disabled = true; });
}
window.setInterval(() => {
  if (!document.hidden) void loadDashboard();
}, AUTO_REFRESH_MS);
document.addEventListener("visibilitychange", () => {
  if (NETWORK) renderWatchDigest();
  if (!document.hidden && Date.now() - lastRefreshAt >= AUTO_REFRESH_MS) void loadDashboard();
});
