import assert from "node:assert/strict";
import test from "node:test";
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
