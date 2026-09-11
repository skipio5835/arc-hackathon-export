import type { RadarDexAdapter, DexLogPage, RadarPool } from "./arc-radar-dex.js";

export function readPoolRoute(url: URL): string | null {
  if (!url.searchParams.has("pool")) return null;
  const values = url.searchParams.getAll("pool");
  if (values.length !== 1 || !/^0x[0-9a-fA-F]{40}$/.test(values[0]!)) throw new Error("Invalid pool link.");
  return values[0]!.toLowerCase();
}

export function marketUrl(base: string, network: string, pool?: string): string {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set("network", network);
  if (pool) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(pool)) throw new Error("Invalid pool address.");
    url.searchParams.set("pool", pool.toLowerCase());
  }
  return url.href;
}

export type CreationPage = Omit<DexLogPage, "items"> & { items?: Array<NonNullable<DexLogPage["items"]>[number] & { address?: { hash?: string } }> };

export async function resolveLinkedPool(
  pool: string, adapters: RadarDexAdapter[],
  readAddress: (address: string) => Promise<{ creation_transaction_hash?: string | null }>,
  readLogs: (path: string) => Promise<CreationPage>,
): Promise<RadarPool> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(pool)) throw new Error("Invalid pool address.");
  const address = await readAddress(pool);
  const tx = address.creation_transaction_hash;
  if (!tx || !/^0x[0-9a-fA-F]{64}$/.test(tx)) throw new Error("Pool creation transaction is unavailable.");
  let path = `/transactions/${tx}/logs`;
  const seen = new Set<string>();
  for (let page = 0; page < 4 && !seen.has(path); page++) {
    seen.add(path);
    const logs = await readLogs(path);
    for (const adapter of adapters) {
      const items = (logs.items ?? []).filter(log => log.address?.hash?.toLowerCase() === adapter.source.factoryAddress.toLowerCase()
        && log.transaction_hash?.toLowerCase() === tx.toLowerCase());
      const found = adapter.pairSeeds({ items }).find(seed => seed.pairAddress.toLowerCase() === pool.toLowerCase());
      if (found) return found;
    }
    if (!logs.next_page_params) break;
    path = `/transactions/${tx}/logs?${new URLSearchParams(Object.entries(logs.next_page_params).map(([k, v]) => [k, String(v)]))}`;
  }
  throw new Error("No supported USDC pool was verified in the available creation logs.");
}

export function recentWatchChanges<T extends { observedAt: string; type: string }>(events: T[], since: number | null, now: number): T[] {
  return events.filter(event => event.type !== "system" && Number.isFinite(Date.parse(event.observedAt))
    && Date.parse(event.observedAt) <= now && (since === null || Date.parse(event.observedAt) > since))
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)).slice(0, 12);
}
