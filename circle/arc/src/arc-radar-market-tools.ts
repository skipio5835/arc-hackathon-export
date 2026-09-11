export type SellRecord = { id: string; time: number };
export type SellObservation = { seen: SellRecord[]; ignoreThrough: number };
type Trade = { direction: string; transactionHash: string; eventIndex?: number; timestamp: string };

export function observeSellEvents(trades: Trade[], previous?: SellObservation, limit = 2000) {
  const floor = Number.isFinite(previous?.ignoreThrough) ? previous!.ignoreThrough : -1;
  const stored = new Map<string, SellRecord>();
  for (const record of previous?.seen ?? []) {
    if (typeof record?.id === "string" && Number.isFinite(record.time)) stored.set(record.id, record);
  }
  let added = 0;
  for (const trade of trades) {
    const time = Date.parse(trade.timestamp);
    if (trade.direction !== "sell" || !/^0x[0-9a-fA-F]{64}$/.test(trade.transactionHash)
      || !Number.isSafeInteger(trade.eventIndex) || trade.eventIndex! < 0 || !Number.isFinite(time) || time <= floor) continue;
    const id = `${trade.transactionHash.toLowerCase()}:${trade.eventIndex}`;
    if (!stored.has(id)) {
      if (previous) added++;
      stored.set(id, { id, time });
    }
  }
  const all = [...stored.values()].sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
  const removed = all.slice(limit);
  const ignoreThrough = removed.length ? Math.max(floor, removed[0]!.time) : floor;
  return { added, state: { seen: all.slice(0, limit), ignoreThrough } satisfies SellObservation };
}

type Pool = { chainId: number; tokenAddress: string; pairAddress: string; totalLiquidity: number; stale: boolean };
export function groupTokenPools<T extends Pool>(pools: T[]): Array<{ primary: T; pools: T[] }> {
  const groups = new Map<string, Map<string, T>>();
  for (const pool of pools) {
    const key = `${pool.chainId}:${pool.tokenAddress.toLowerCase()}`;
    const group = groups.get(key) ?? new Map<string, T>();
    group.set(pool.pairAddress.toLowerCase(), pool);
    groups.set(key, group);
  }
  return [...groups.values()].map(group => {
    const sorted = [...group.values()].sort((a, b) => Number(a.stale) - Number(b.stale)
      || (Number.isFinite(b.totalLiquidity) ? b.totalLiquidity : 0) - (Number.isFinite(a.totalLiquidity) ? a.totalLiquidity : 0)
      || a.pairAddress.toLowerCase().localeCompare(b.pairAddress.toLowerCase()));
    return { primary: sorted[0]!, pools: sorted };
  });
}
