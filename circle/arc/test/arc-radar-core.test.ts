import assert from "node:assert/strict";
import test from "node:test";
import { discoverSeeds, refineMarkets } from "../src/arc-radar-discovery.js";
import { fullyDilutedValue } from "../src/arc-radar-core.js";

test("FDV distinguishes unavailable metadata from a genuine zero supply", () => {
  for (const supply of [null, undefined, "", "invalid", "-1", "1.5", "9".repeat(400)]) {
    assert.equal(fullyDilutedValue(9, supply, "18"), null);
  }
  for (const decimals of [null, undefined, "", "bad", "-1", "1.5", "256"]) {
    assert.equal(fullyDilutedValue(9, "1000", decimals), null);
  }
  for (const price of [NaN, Infinity, 0, -1]) assert.equal(fullyDilutedValue(price, "1000", "0"), null);
  assert.equal(fullyDilutedValue(9, "1000000000000000000", "18"), 9);
  assert.equal(fullyDilutedValue(9, "0", "18"), 0);
  assert.equal(fullyDilutedValue(1e308, "1000", "0"), null);
});

const discoveryMarkets = [
  { pairAddress: "a", createdAt: "2026-09-07", lastTradeAt: null, totalLiquidity: 100, sellCount: 0, periods: { h24: { swapCount: 0, volumeUsdc: 0 } } },
  { pairAddress: "b", createdAt: "2026-09-06", lastTradeAt: "2026-09-07T12:00:00Z", totalLiquidity: 10, sellCount: 1, periods: { h24: { swapCount: 2, volumeUsdc: 20 } } },
  { pairAddress: "c", createdAt: "2026-09-05", lastTradeAt: "2026-09-07T13:00:00Z", totalLiquidity: 1, sellCount: 1, periods: { h24: { swapCount: 3, volumeUsdc: 30 } } },
];
const discoveryDefaults = { sort: "default" as const, minimumLiquidity: 0, traded24h: false, sellSeen: false };

test("discovery combines liquidity, recent trading, and sell filters inclusively", () => {
  assert.deepEqual(refineMarkets(discoveryMarkets, { ...discoveryDefaults, minimumLiquidity: 10, traded24h: true, sellSeen: true }).map(m => m.pairAddress), ["b"]);
  assert.equal(refineMarkets(discoveryMarkets, { ...discoveryDefaults, minimumLiquidity: 1000 }).length, 0);
  assert.equal(refineMarkets(discoveryMarkets, discoveryDefaults).length, 3);
});

test("discovery sorts volume, liquidity and trade recency without mutating the source", () => {
  for (const [sort, expected] of [["volume", ["c", "b", "a"]], ["liquidity", ["a", "b", "c"]], ["recent", ["c", "b", "a"]], ["newest", ["a", "b", "c"]]] as const) {
    assert.deepEqual(refineMarkets(discoveryMarkets, { ...discoveryDefaults, sort }).map(m => m.pairAddress), expected);
  }
  assert.deepEqual(discoveryMarkets.map(m => m.pairAddress), ["a", "b", "c"]);
});

test("discovery crosses empty pages and deduplicates pools with lookahead", async () => {
  const pages = [
    { seeds: [], nextPath: "1", stale: false },
    { seeds: [{ pairAddress: "A" }, { pairAddress: "b" }], nextPath: "2", stale: false },
    { seeds: [{ pairAddress: "a" }, { pairAddress: "c" }], nextPath: null, stale: true },
  ];
  const result = await discoverSeeds("0", 2, async path => pages[Number(path)]!);
  assert.deepEqual(result.seeds.map(s => s.pairAddress), ["A", "b"]);
  assert.equal(result.hasMore, true);
  assert.equal(result.stale, true);
  assert.equal(result.limited, false);
});

test("discovery distinguishes exhaustion from scan limits and repeated cursors", async () => {
  const end = await discoverSeeds("0", 1, async () => ({ seeds: [{ pairAddress: "a" }], nextPath: null, stale: false }));
  assert.equal(end.hasMore, false);
  assert.equal(end.limited, false);
  let calls = 0;
  const repeated = await discoverSeeds("0", 2, async () => { calls++; return { seeds: [], nextPath: "0", stale: false }; });
  assert.equal(calls, 1);
  assert.equal(repeated.limited, true);
  const capped = await discoverSeeds("0", 2, async path => ({ seeds: [], nextPath: String(Number(path) + 1), stale: false }), 2);
  assert.equal(capped.limited, true);
});

test("discovery propagates a page failure so an existing result can be retained", async () => {
  await assert.rejects(discoverSeeds("0", 15, async () => { throw new Error("Indexer unavailable"); }), /Indexer unavailable/);
});
import {
  ARC_TESTNET_USDC_ADDRESS,
  latestSyncReserves,
  swapDirection,
  swapUsdcValue,
  syncReserves,
  type RadarAddressLog,
  type RadarPair,
} from "../src/arc-radar-core.js";

const TOKEN = "0x1000000000000000000000000000000000000000";

function log(method: "Sync" | "Swap", values: Record<string, string>, timestamp = "2026-08-31T00:00:00Z", index = 1): RadarAddressLog {
  return {
    block_timestamp: timestamp,
    decoded: {
      method_call: `${method}(${Object.keys(values).join(",")})`,
      parameters: Object.entries(values).map(([name, value]) => ({ name, value })),
    },
    index,
  };
}

test("reads Sync reserves when the meme token is token0", () => {
  const pair: RadarPair = { token0: TOKEN, token1: ARC_TESTNET_USDC_ADDRESS };
  const reserves = syncReserves(log("Sync", {
    reserve0: "5000000000000000000",
    reserve1: "2500000",
  }), pair, "18");
  assert.deepEqual(reserves, { tokenReserve: 5, usdcReserve: 2.5 });
});

test("reads Sync reserves when USDC is token0", () => {
  const pair: RadarPair = { token0: ARC_TESTNET_USDC_ADDRESS, token1: TOKEN };
  const reserves = syncReserves(log("Sync", {
    reserve0: "3250000",
    reserve1: "13000000000000000000",
  }), pair, "18");
  assert.deepEqual(reserves, { tokenReserve: 13, usdcReserve: 3.25 });
});

test("selects the newest Sync by timestamp and log index", () => {
  const pair: RadarPair = { token0: TOKEN, token1: ARC_TESTNET_USDC_ADDRESS };
  const newest = latestSyncReserves([
    log("Sync", { reserve0: "1000000000000000000", reserve1: "1000000" }, "2026-08-31T00:00:00Z", 2),
    log("Sync", { reserve0: "3000000000000000000", reserve1: "6000000" }, "2026-08-31T00:01:00Z", 1),
    log("Sync", { reserve0: "2000000000000000000", reserve1: "5000000" }, "2026-08-31T00:01:00Z", 0),
  ], pair, "18");
  assert.deepEqual(newest, {
    timestamp: "2026-08-31T00:01:00Z",
    tokenReserve: 3,
    usdcReserve: 6,
  });
});

test("classifies buy and sell directions for both pair orderings", () => {
  const token0Pair: RadarPair = { token0: TOKEN, token1: ARC_TESTNET_USDC_ADDRESS };
  const usdc0Pair: RadarPair = { token0: ARC_TESTNET_USDC_ADDRESS, token1: TOKEN };
  assert.equal(swapDirection(log("Swap", { amount0In: "10", amount1In: "0", amount0Out: "0", amount1Out: "2" }), token0Pair), "sell");
  assert.equal(swapDirection(log("Swap", { amount0In: "0", amount1In: "2", amount0Out: "10", amount1Out: "0" }), token0Pair), "buy");
  assert.equal(swapDirection(log("Swap", { amount0In: "2", amount1In: "0", amount0Out: "0", amount1Out: "10" }), usdc0Pair), "buy");
  assert.equal(swapDirection(log("Swap", { amount0In: "0", amount1In: "10", amount0Out: "2", amount1Out: "0" }), usdc0Pair), "sell");
});

test("uses the USDC side of a Swap for volume", () => {
  const pair: RadarPair = { token0: TOKEN, token1: ARC_TESTNET_USDC_ADDRESS };
  const value = swapUsdcValue(log("Swap", {
    amount0In: "1000000000000000000",
    amount1In: "0",
    amount0Out: "0",
    amount1Out: "2750000",
  }), pair);
  assert.equal(value, 2.75);
});
