import { decimalValue, latestSyncReserves, logParameter, swapDirection, swapUsdcValue, syncReserves, type RadarAddressLog, type RadarQuoteAsset, type ReserveSnapshot } from "./arc-radar-core.js";
import { discoverSeeds } from "./arc-radar-discovery.js";
import type { RadarDexSource, RadarNetwork } from "./arc-radar-networks.js";

type AddressLog = RadarAddressLog & { transaction_hash?: string };
export type DexLogPage = { items?: AddressLog[]; next_page_params?: Record<string, string | number> | null };
export type RadarPool = {
  sourceId: string;
  chainId: number;
  quoteAsset: RadarQuoteAsset;
  createdAt: string;
  creationTx: string;
  pairAddress: string;
  token0: string;
  token1: string;
  tokenAddress: string;
};
export type DexPricePoint = { price: number; timestamp: string };
export type DexTrade = { direction: "buy" | "sell"; fallbackAddress: string | null; timestamp: string; transactionHash: string; eventIndex?: number; usdcValue: number };
export type DexLiquidityEvent = { changePercent: number | null; direction: "add" | "remove"; fallbackAddress: string | null; timestamp: string; tokenAmount: number; transactionHash: string; usdcAmount: number };
export interface RadarDexAdapter {
  source: RadarDexSource;
  discoveryPath: string;
  pairSeeds(page: DexLogPage): RadarPool[];
  latestReserves(logs: AddressLog[], pool: RadarPool, decimals: string | null): ReserveSnapshot | null;
  pricePoint(log: AddressLog, pool: RadarPool, decimals: string | null): DexPricePoint | null;
  trade(log: AddressLog, pool: RadarPool): DexTrade | null;
  liquidityEvents(logs: AddressLog[], pool: RadarPool, decimals: string | null): DexLiquidityEvent[];
}

export function createDexAdapter(source: RadarDexSource, network: RadarNetwork): RadarDexAdapter {
  if (source.protocol !== "uniswap-v2") throw new Error(`Unsupported DEX protocol: ${source.protocol}`);
  if (!/^0x[0-9a-fA-F]{40}$/.test(source.factoryAddress)) throw new Error("Invalid factory address");
  const USDC_ADDRESS = network.quoteAsset.address.toLowerCase();
  function checkPool(pool: RadarPool): void {
    if (pool.chainId !== network.chainId || pool.sourceId !== source.id || pool.quoteAsset.address.toLowerCase() !== USDC_ADDRESS || pool.quoteAsset.decimals !== network.quoteAsset.decimals) {
      throw new Error("Pool does not belong to this DEX and network");
    }
  }
  function pairSeeds(response: DexLogPage): RadarPool[] {
    const seen = new Set<string>();
    const seeds: RadarPool[] = [];
    for (const log of response.items ?? []) {
      if (!log.decoded?.method_call?.startsWith("PairCreated(")) continue;
      const token0 = logParameter(log, "token0");
      const token1 = logParameter(log, "token1");
      const pairAddress = logParameter(log, "pair");
      if (![token0, token1, pairAddress].every((value) => value && /^0x[0-9a-fA-F]{40}$/.test(value))) continue;
      if (!token0 || !token1 || !pairAddress || token0.toLowerCase() === token1.toLowerCase()) continue;
      const token0Lower = token0.toLowerCase();
      const token1Lower = token1.toLowerCase();
      if (token0Lower !== USDC_ADDRESS && token1Lower !== USDC_ADDRESS) continue;
      const key = pairAddress.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      seeds.push({
        sourceId: source.id,
        chainId: network.chainId,
        quoteAsset: network.quoteAsset,
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

  function syncPrice(log: AddressLog, seed: RadarPool, tokenDecimals: string | null): DexPricePoint | null {
    const reserves = syncReserves(log, seed, tokenDecimals);
    if (!reserves || reserves.tokenReserve <= 0 || reserves.usdcReserve <= 0) return null;
    return { price: reserves.usdcReserve / reserves.tokenReserve, timestamp: log.block_timestamp ?? "" };
  }

  function liquidityEventsFromLogs(logs: AddressLog[], seed: RadarPool, tokenDecimals: string | null): DexLiquidityEvent[] {
    const syncByTransaction = new Map<string, AddressLog[]>();
    for (const log of logs) {
      if (!log.decoded?.method_call?.startsWith("Sync(") || !log.transaction_hash) continue;
      const key = log.transaction_hash.toLowerCase();
      syncByTransaction.set(key, [...(syncByTransaction.get(key) ?? []), log]);
    }
    const tokenIs0 = seed.token0.toLowerCase() !== seed.quoteAsset.address.toLowerCase();
    const events: DexLiquidityEvent[] = [];
    for (const log of logs) {
      const method = log.decoded?.method_call ?? "";
      const direction = method.startsWith("Mint(") ? "add" : method.startsWith("Burn(") ? "remove" : null;
      if (!direction || !log.transaction_hash) continue;
      const amount0 = logParameter(log, "amount0");
      const amount1 = logParameter(log, "amount1");
      if (!amount0 || !amount1) continue;
      const tokenAmount = decimalValue(tokenIs0 ? amount0 : amount1, tokenDecimals);
      const usdcAmount = decimalValue(tokenIs0 ? amount1 : amount0, seed.quoteAsset.decimals);
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
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  function tradeFromLog(log: AddressLog, seed: RadarPool): DexTrade | null {
    const direction = swapDirection(log, seed);
    if (!direction) return null;
    return {
      direction,
      fallbackAddress: logParameter(log, "to"),
      timestamp: log.block_timestamp ?? "",
      transactionHash: log.transaction_hash ?? "",
      eventIndex: log.index,
      usdcValue: swapUsdcValue(log, seed),
    };
  }
  return {
    source,
    discoveryPath: `/addresses/${source.factoryAddress}/logs`,
    pairSeeds,
    latestReserves(logs, pool, decimals) { checkPool(pool); return latestSyncReserves(logs, pool, decimals); },
    pricePoint(log, pool, decimals) { checkPool(pool); return syncPrice(log, pool, decimals); },
    trade(log, pool) { checkPool(pool); return tradeFromLog(log, pool); },
    liquidityEvents(logs, pool, decimals) { checkPool(pool); return liquidityEventsFromLogs(logs, pool, decimals); },
  };
}

export async function discoverDexPools(
  adapters: readonly RadarDexAdapter[],
  limit: number,
  readPage: (path: string) => Promise<{ data: DexLogPage; stale: boolean }>,
) {
  if (adapters.length === 0 || adapters.length > 4) throw new Error("Configure between one and four DEX sources");
  if (new Set(adapters.map(a => a.source.id)).size !== adapters.length) throw new Error("Duplicate DEX source ID");
  const pools = new Map<string, RadarPool>();
  let hasMore = false;
  let stale = false;
  let limited = false;
  for (const adapter of adapters) {
    const result = await discoverSeeds(adapter.discoveryPath, limit, async path => {
      const page = await readPage(path);
      const next = page.data.next_page_params;
      const query = next ? new URLSearchParams(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, String(value)])).toString() : "";
      return { seeds: adapter.pairSeeds(page.data), stale: page.stale, nextPath: next ? `${adapter.discoveryPath}?${query}` : null };
    });
    for (const pool of result.seeds) {
      const key = `${pool.chainId}:${pool.pairAddress.toLowerCase()}`;
      if (!pools.has(key)) pools.set(key, pool);
    }
    hasMore ||= result.hasMore;
    stale ||= result.stale;
    limited ||= result.limited;
  }
  const sorted = [...pools.values()].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || a.pairAddress.localeCompare(b.pairAddress));
  return { seeds: sorted.slice(0, limit), hasMore: hasMore || sorted.length > limit, stale, limited };
}
