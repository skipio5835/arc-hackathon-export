export const ARC_TESTNET_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

export type RadarLogParameter = {
  name?: string;
  value?: string;
};

export type RadarAddressLog = {
  block_timestamp?: string;
  decoded?: { method_call?: string; parameters?: RadarLogParameter[] } | null;
  index?: number;
};

export type RadarPair = {
  token0: string;
  token1: string;
};

export type ReserveSnapshot = {
  timestamp: string;
  tokenReserve: number;
  usdcReserve: number;
};

export function logParameter(log: RadarAddressLog, name: string): string | null {
  return log.decoded?.parameters?.find((parameter) => parameter.name === name)?.value ?? null;
}

export function decimalValue(raw: string | null | undefined, decimals: string | number | null | undefined): number {
  if (raw === null || raw === undefined || decimals === null || decimals === undefined) return 0;
  const value = Number(raw);
  const places = Number(decimals);
  if (!Number.isFinite(value) || !Number.isFinite(places)) return 0;
  return value / 10 ** places;
}

export function syncReserves(log: RadarAddressLog, pair: RadarPair, tokenDecimals: string | null): Omit<ReserveSnapshot, "timestamp"> | null {
  if (!log.decoded?.method_call?.startsWith("Sync(")) return null;
  const reserve0 = logParameter(log, "reserve0");
  const reserve1 = logParameter(log, "reserve1");
  if (!reserve0 || !reserve1) return null;
  const tokenIs0 = pair.token0.toLowerCase() !== ARC_TESTNET_USDC_ADDRESS;
  const tokenReserve = decimalValue(tokenIs0 ? reserve0 : reserve1, tokenDecimals);
  const usdcReserve = decimalValue(tokenIs0 ? reserve1 : reserve0, 6);
  if (tokenReserve < 0 || usdcReserve < 0) return null;
  return { tokenReserve, usdcReserve };
}

export function latestSyncReserves(logs: RadarAddressLog[], pair: RadarPair, tokenDecimals: string | null): ReserveSnapshot | null {
  let latest: (ReserveSnapshot & { logIndex: number; sourcePosition: number; timestampMs: number }) | null = null;
  for (const [sourcePosition, log] of logs.entries()) {
    const reserves = syncReserves(log, pair, tokenDecimals);
    if (!reserves) continue;
    const timestamp = log.block_timestamp ?? "";
    const parsedTimestamp = new Date(timestamp).getTime();
    const timestampMs = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Number.NEGATIVE_INFINITY;
    const logIndex = log.index ?? -1;
    const isNewer = !latest
      || timestampMs > latest.timestampMs
      || (timestampMs === latest.timestampMs && logIndex > latest.logIndex)
      || (timestampMs === latest.timestampMs && logIndex === latest.logIndex && sourcePosition < latest.sourcePosition);
    if (isNewer) latest = { ...reserves, logIndex, sourcePosition, timestamp, timestampMs };
  }
  if (!latest) return null;
  return { timestamp: latest.timestamp, tokenReserve: latest.tokenReserve, usdcReserve: latest.usdcReserve };
}

export function swapDirection(log: RadarAddressLog, pair: RadarPair): "buy" | "sell" | null {
  if (!log.decoded?.method_call?.startsWith("Swap(")) return null;
  try {
    const amount0In = BigInt(logParameter(log, "amount0In") ?? "0");
    const amount1In = BigInt(logParameter(log, "amount1In") ?? "0");
    const amount0Out = BigInt(logParameter(log, "amount0Out") ?? "0");
    const amount1Out = BigInt(logParameter(log, "amount1Out") ?? "0");
    const tokenIs0 = pair.token0.toLowerCase() !== ARC_TESTNET_USDC_ADDRESS;
    if (tokenIs0 && amount0In > 0n && amount1Out > 0n) return "sell";
    if (tokenIs0 && amount1In > 0n && amount0Out > 0n) return "buy";
    if (!tokenIs0 && amount1In > 0n && amount0Out > 0n) return "sell";
    if (!tokenIs0 && amount0In > 0n && amount1Out > 0n) return "buy";
  } catch {
    return null;
  }
  return null;
}

export function swapUsdcValue(log: RadarAddressLog, pair: RadarPair): number {
  try {
    const usdcIs0 = pair.token0.toLowerCase() === ARC_TESTNET_USDC_ADDRESS;
    const amountIn = BigInt(logParameter(log, usdcIs0 ? "amount0In" : "amount1In") ?? "0");
    const amountOut = BigInt(logParameter(log, usdcIs0 ? "amount0Out" : "amount1Out") ?? "0");
    return Number(amountIn + amountOut) / 1_000_000;
  } catch {
    return 0;
  }
}
