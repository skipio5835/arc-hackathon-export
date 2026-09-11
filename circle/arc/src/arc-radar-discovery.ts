export type MarketSort = "default" | "newest" | "volume" | "liquidity" | "recent";

type DiscoveryMarket = {
  pairAddress: string;
  createdAt: string;
  lastTradeAt: string | null;
  totalLiquidity: number;
  sellCount: number;
  periods: { h24: { swapCount: number; volumeUsdc: number } };
};

export type DiscoveryOptions = {
  sort: MarketSort;
  minimumLiquidity: number;
  traded24h: boolean;
  sellSeen: boolean;
};

function timestamp(value: string | null): number {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function refineMarkets<T extends DiscoveryMarket>(markets: T[], options: DiscoveryOptions): T[] {
  const result = markets.filter((market) =>
    (options.minimumLiquidity <= 0 || (Number.isFinite(market.totalLiquidity) && market.totalLiquidity >= options.minimumLiquidity))
    && (!options.traded24h || market.periods.h24.swapCount > 0)
    && (!options.sellSeen || market.sellCount > 0));
  if (options.sort === "default") return result;
  return result.sort((a, b) => {
    const difference = options.sort === "volume" ? b.periods.h24.volumeUsdc - a.periods.h24.volumeUsdc
      : options.sort === "liquidity" ? b.totalLiquidity - a.totalLiquidity
      : options.sort === "recent" ? timestamp(b.lastTradeAt) - timestamp(a.lastTradeAt) : 0;
    return difference || timestamp(b.createdAt) - timestamp(a.createdAt) || a.pairAddress.localeCompare(b.pairAddress);
  });
}

// Read one extra seed to distinguish a full result page from the end of history.
export async function discoverSeeds<T extends { pairAddress: string }>(
  firstPath: string,
  limit: number,
  readPage: (path: string) => Promise<{ seeds: T[]; nextPath: string | null; stale: boolean }>,
  maxPages = 10,
): Promise<{ seeds: T[]; hasMore: boolean; stale: boolean; limited: boolean }> {
  const found = new Map<string, T>();
  const visited = new Set<string>();
  let path: string | null = firstPath;
  let stale = false;
  while (path && visited.size < maxPages && found.size <= limit && !visited.has(path)) {
    visited.add(path);
    const page = await readPage(path);
    stale ||= page.stale;
    for (const seed of page.seeds) {
      const key = seed.pairAddress.toLowerCase();
      if (!found.has(key)) found.set(key, seed);
    }
    path = page.nextPath;
  }
  return {
    seeds: [...found.values()].slice(0, limit),
    hasMore: found.size > limit,
    stale,
    limited: Boolean(path) && found.size <= limit,
  };
}
