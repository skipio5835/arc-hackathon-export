export type SourceState = "fresh" | "cached" | "unavailable";
export type Sourced<T> = { data: T; stale: boolean };

export function sourceState(result: Sourced<unknown> | null): SourceState {
  return result === null ? "unavailable" : result.stale ? "cached" : "fresh";
}

export function holderShare(raw: string | number | null | undefined, supply: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "" || !supply) return null;
  const amount = Number(raw);
  const total = Number(supply);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(total) || total <= 0) return null;
  return (amount / total) * 100;
}

type Holder = { address?: { hash?: string }; value: string };
type HolderPage<T> = { items?: T[]; next_page_params?: unknown };
const BURN = new Set(["0x0000000000000000000000000000000000000000", "0x000000000000000000000000000000000000dead"]);

export function knownTokenPools<T extends { chainId: number; tokenAddress: string; pairAddress: string }>(selected: T, loaded: T[]): Set<string> {
  return new Set([selected, ...loaded].filter(pool => pool.chainId === selected.chainId
    && pool.tokenAddress.toLowerCase() === selected.tokenAddress.toLowerCase()).map(pool => pool.pairAddress.toLowerCase()));
}

export function holderMetrics<T extends Holder>(result: Sourced<HolderPage<T>> | null, supply: string | null, pools: Set<string>) {
  const valid = result && Array.isArray(result.data.items) && result.data.items.every(holder =>
    /^0x[0-9a-f]{40}$/i.test(holder.address?.hash ?? "") && /^\d+$/.test(holder.value));
  const state = valid ? sourceState(result) : "unavailable";
  const holders = valid ? [...result.data.items!].sort((a, b) => Number(b.value) - Number(a.value)) : [];
  const partial = Boolean(result?.data.next_page_params);
  const complete = state !== "unavailable" && !partial;
  const positions = holders.filter(holder => !pools.has(holder.address!.hash!.toLowerCase()) && !BURN.has(holder.address!.hash!.toLowerCase()));
  const sum = (rows: T[]) => rows.reduce((total, holder) => total + Number(holder.value), 0);
  return {
    state: state as SourceState, partial, holders, positions,
    top: (count: number) => complete || (state !== "unavailable" && positions.length >= count)
      ? holderShare(sum(positions.slice(0, count)), supply) : null,
    shareAt: (address: string | null) => {
      if (!address || state === "unavailable") return null;
      const holder = holders.find(row => row.address!.hash!.toLowerCase() === address.toLowerCase());
      return holderShare(holder?.value ?? (complete ? 0 : null), supply);
    },
    burned: complete ? holderShare(sum(holders.filter(holder => BURN.has(holder.address!.hash!.toLowerCase()))), supply) : null,
  };
}

export function windowPriceChange(points: { price: number; timestamp: string }[], current: number, cutoff: number): number | null {
  if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(cutoff)) return null;
  // A point inside the window cannot stand in for its missing starting price.
  const baseline = points.filter(point => Number.isFinite(point.price) && point.price > 0 && Date.parse(point.timestamp) <= cutoff)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  if (!baseline) return null;
  const change = ((current - baseline.price) / baseline.price) * 100;
  return Number.isFinite(change) ? change : null;
}

export function tradeActor(sender: string | undefined, recipient: string | null | undefined) {
  return sender ? { address: sender, role: "Sender" } : recipient ? { address: recipient, role: "Recipient" } : null;
}

export type OwnershipSnapshot = {
  creatorShare: number | null;
  lpBurnedShare: number | null;
  top10Share: number | null;
  timestamp: string;
  poolScope?: string;
};

export function nextOwnershipSnapshot(previous: OwnershipSnapshot | undefined, input: OwnershipSnapshot,
  fresh: Record<"creatorShare" | "lpBurnedShare" | "top10Share", boolean>) {
  const next = { ...input };
  const comparable = { creatorShare: false, lpBurnedShare: false, top10Share: false };
  for (const key of ["creatorShare", "lpBurnedShare", "top10Share"] as const) {
    const usable = fresh[key] && input[key] !== null && Number.isFinite(input[key]);
    next[key] = usable ? input[key] : previous?.[key] ?? null;
    comparable[key] = usable && previous?.[key] !== null && previous?.[key] !== undefined && Number.isFinite(previous[key]);
  }
  // Pool discovery changes the excluded-address set, not actual ownership.
  comparable.top10Share &&= previous?.poolScope === input.poolScope;
  next.poolScope = fresh.top10Share && input.top10Share !== null ? input.poolScope : previous?.poolScope;
  return { next, comparable };
}
