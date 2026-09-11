export type EvidenceBasis = "observed" | "estimate" | "unverified";
export type Capability = "mint" | "restrict" | "pause" | "upgrade" | "fee";
export type CapabilityFinding = { kind: Capability; functions: string[]; proxyType: string | null };
type AbiEntry = { type?: string; name?: string; stateMutability?: string };

export function detectCapabilities(address: { proxy_type?: string | null } | null, contract: { abi?: AbiEntry[] | null } | null): CapabilityFinding[] {
  const names = [...new Set((contract?.abi ?? []).filter(entry => entry.type === "function"
    && !["view", "pure"].includes(entry.stateMutability ?? "") && entry.name).map(entry => entry.name!))];
  const rules: Array<[Capability, RegExp]> = [
    ["mint", /^(?:mint|mintTo|mintBatch|increaseSupply|issue)(?:$|[A-Z_])/],
    ["restrict", /blacklist|blocklist|denylist|freeze|wipe|seize/i],
    ["pause", /^pause$|^unpause$|setPaused|emergencyPause/i],
    ["upgrade", /upgrade|changeAdmin|setImplementation|updateImplementation/i],
    ["fee", /^(?:(?:set|update|configure).*(?:fee|tax)|(?:fee|tax).*(?:set|update))/i],
  ];
  return rules.flatMap(([kind, pattern]) => {
    const functions = names.filter(name => pattern.test(name));
    const proxyType = kind === "upgrade" ? address?.proxy_type ?? null : null;
    return functions.length || proxyType ? [{ kind, functions, proxyType }] : [];
  });
}

export function capabilityText(finding: CapabilityFinding): { title: string; detail: string; basis: EvidenceBasis } {
  const labels: Record<Capability, string> = { mint: "Supply-related function names", restrict: "Restriction-related function names",
    pause: "Pause-related function names", upgrade: "Upgrade or proxy indicators", fee: "Fee-related function names" };
  const evidence = [finding.functions.length ? `ABI: ${finding.functions.join(", ")}.` : "",
    finding.proxyType ? `Explorer proxy type: ${finding.proxyType}.` : ""].filter(Boolean).join(" ");
  return { title: labels[finding.kind], basis: "unverified",
    detail: `${evidence} Names alone do not establish current permissions or execution paths. Selected getter values, when requested, appear separately under Contract state and do not confirm this capability is usable.` };
}

export function evidenceSummary(items: { basis: EvidenceBasis }[]) {
  const observed = items.filter(item => item.basis === "observed").length;
  const estimates = items.filter(item => item.basis === "estimate").length;
  const unverified = items.filter(item => item.basis === "unverified").length;
  return { observed, estimates, unverified, label: unverified ? "Checks incomplete" : "Evidence only" };
}

type BriefMarket = {
  chainId: number; tokenAddress: string; pairAddress: string; creationTx: string; createdAt: string; stale: boolean;
  historyTruncated: boolean; periods: { h1: { priceChange: number | null } }; reserveSource: string;
  liquidityEvents: Array<{ direction: string; timestamp: string; transactionHash: string; changePercent: number | null; usdcAmount: number }>;
  trades: Array<{ timestamp: string; transactionHash: string }>;
};
export type MarketBrief<T> = { market: T; basis: EvidenceBasis; kind: "liquidity" | "price" | "launch"; timestamp: string;
  title: string; transactionHash: string | null; value: number; secondaryValue?: number };

export function marketBriefs<T extends BriefMarket>(markets: T[], now: number, limit = 6): MarketBrief<T>[] {
  const withinDay = (timestamp: string) => Date.parse(timestamp) <= now && Date.parse(timestamp) > now - 86_400_000;
  const validTx = (hash: string) => /^0x[0-9a-f]{64}$/i.test(hash);
  const candidates: MarketBrief<T>[] = [];
  for (const market of markets) {
    if (market.stale) continue;
    const removed = market.liquidityEvents.filter(event => event.direction === "remove" && withinDay(event.timestamp)
      && validTx(event.transactionHash) && event.changePercent !== null && Number.isFinite(event.changePercent)
      && event.changePercent >= 10 && Number.isFinite(event.usdcAmount) && event.usdcAmount > 0)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
    if (removed) candidates.push({ market, basis: "observed", kind: "liquidity", timestamp: removed.timestamp,
      title: "Liquidity removed", transactionHash: removed.transactionHash, value: removed.usdcAmount, secondaryValue: removed.changePercent! });
    const change = market.periods.h1.priceChange;
    const latestTrade = market.trades.filter(event => withinDay(event.timestamp)).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
    if (market.reserveSource === "sync" && !market.historyTruncated && change !== null && Number.isFinite(change) && Math.abs(change) >= 30 && latestTrade
      && Date.parse(latestTrade.timestamp) > now - 3_600_000) {
      candidates.push({ market, basis: "estimate", kind: "price", timestamp: new Date(now).toISOString(),
        title: "Large 1H price move", transactionHash: null, value: change });
    }
    if (withinDay(market.createdAt) && validTx(market.creationTx) && latestTrade && Date.parse(latestTrade.timestamp) >= Date.parse(market.createdAt)) candidates.push({ market, basis: "observed", kind: "launch",
      timestamp: market.createdAt, title: "New pool with indexed trades", transactionHash: market.creationTx, value: 0 });
  }
  const priority = { liquidity: 0, price: 1, launch: 2 };
  candidates.sort((a, b) => priority[a.kind] - priority[b.kind] || Date.parse(b.timestamp) - Date.parse(a.timestamp)
    || a.market.pairAddress.localeCompare(b.market.pairAddress));
  const seen = new Set<string>();
  return candidates.filter(item => {
    const key = `${item.market.chainId}:${item.market.tokenAddress.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, Math.max(0, limit));
}

export function nextWatchBatch<T extends { pairAddress: string }>(pools: T[], checkedAt: (pool: T) => number | undefined, now: number, ttl: number, limit = 3): T[] {
  return pools.filter(pool => now - (checkedAt(pool) ?? 0) >= ttl)
    .sort((a, b) => (checkedAt(a) ?? 0) - (checkedAt(b) ?? 0) || a.pairAddress.localeCompare(b.pairAddress))
    .slice(0, limit);
}
