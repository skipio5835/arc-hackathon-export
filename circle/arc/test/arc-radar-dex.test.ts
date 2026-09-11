import assert from "node:assert/strict";
import test from "node:test";
import { createDexAdapter, discoverDexPools, type DexLogPage } from "../src/arc-radar-dex.js";
import { ARC_RADAR_TESTNET, radarPoolKey, radarStoragePrefix, resolveRadarNetwork } from "../src/arc-radar-networks.js";
import { marketBriefs } from "../src/arc-radar-evidence.js";

const token = "0x1000000000000000000000000000000000000000";
const quote = ARC_RADAR_TESTNET.quoteAsset.address;
const poolA = "0x2000000000000000000000000000000000000000";
const poolB = "0x3000000000000000000000000000000000000000";
const source = ARC_RADAR_TESTNET.sources[0]!;
const adapter = createDexAdapter(source, ARC_RADAR_TESTNET);

function event(method: string, values: Record<string, string>, timestamp = "2026-09-08T00:00:00Z", index = 1) {
  return { block_timestamp: timestamp, index, transaction_hash: "0xabc", decoded: { method_call: `${method}(...)`, parameters: Object.entries(values).map(([name, value]) => ({ name, value })) } };
}
function poolLog(pair = poolA, token0 = token, token1 = quote, timestamp = "2026-09-08T00:00:00Z") {
  return event("PairCreated", { pair, token0, token1 }, timestamp);
}

test("network selection is explicit and an unconfigured network cannot fall back to testnet", () => {
  assert.equal(resolveRadarNetwork().chainId, 5042002);
  for (const id of ["arc-mainnet", "unknown", "__proto__"]) assert.throws(() => resolveRadarNetwork(id));
  assert.notEqual(radarStoragePrefix(ARC_RADAR_TESTNET), radarStoragePrefix({ ...ARC_RADAR_TESTNET, id: "fixture", chainId: 123 }));
  assert.notEqual(radarPoolKey(ARC_RADAR_TESTNET, poolA), radarPoolKey(ARC_RADAR_TESTNET, poolB));
  assert.equal(radarPoolKey(ARC_RADAR_TESTNET, poolA), radarPoolKey(ARC_RADAR_TESTNET, poolA.toUpperCase()));
});

test("v2 discovery rejects unsupported events, malformed addresses and pools without the quote asset", () => {
  const result = adapter.pairSeeds({ items: [
    poolLog(), poolLog(), poolLog("bad"), poolLog(poolB, token, poolA), poolLog(poolB, quote, quote),
    event("Initialize", { pair: poolB, token0: token, token1: quote }),
  ] });
  assert.equal(result.length, 1);
  assert.equal(result[0]!.sourceId, source.id);
  assert.equal(result[0]!.chainId, ARC_RADAR_TESTNET.chainId);
  assert.equal(result[0]!.tokenAddress, token);
  assert.throws(() => createDexAdapter({ ...source, protocol: "uniswap-v4" }, ARC_RADAR_TESTNET), /Unsupported/);
});

test("v2 adapter handles both quote sides, prices, and liquidity events", () => {
  for (const quoteIs0 of [false, true]) {
    const pool = adapter.pairSeeds({ items: [poolLog(poolA, quoteIs0 ? quote : token, quoteIs0 ? token : quote)] })[0]!;
    const sync = event("Sync", { reserve0: quoteIs0 ? "2000000" : "1000000000000000000", reserve1: quoteIs0 ? "1000000000000000000" : "2000000" }, undefined, 2);
    const swap = event("Swap", { amount0In: quoteIs0 ? "1000000" : "0", amount1In: quoteIs0 ? "0" : "1000000", amount0Out: quoteIs0 ? "0" : "100", amount1Out: quoteIs0 ? "100" : "0" });
    assert.equal(adapter.pricePoint(sync, pool, "18")?.price, 2);
    assert.equal(adapter.latestReserves([sync], pool, "18")?.usdcReserve, 2);
    assert.equal(adapter.trade(swap, pool)?.direction, "buy");
    assert.equal(adapter.trade(swap, pool)?.usdcValue, 1);
    const mint = event("Mint", { amount0: quoteIs0 ? "1000000" : "500000000000000000", amount1: quoteIs0 ? "500000000000000000" : "1000000" });
    const liquidity = adapter.liquidityEvents([mint, sync], pool, "18")[0]!;
    assert.equal(liquidity.usdcAmount, 1);
    assert.equal(liquidity.changePercent, 100);
    assert.throws(() => adapter.trade(swap, { ...pool, chainId: 999 }), /does not belong/);
  }
});

test("quote addresses and decimals come from network configuration", () => {
  const fixture = { ...ARC_RADAR_TESTNET, chainId: 123, quoteAsset: { ...ARC_RADAR_TESTNET.quoteAsset, address: poolB, decimals: 18 } };
  const alt = createDexAdapter(source, fixture);
  const pool = alt.pairSeeds({ items: [poolLog(poolA, token, poolB)] })[0]!;
  const sync = event("Sync", { reserve0: "1000000", reserve1: "2000000000000000000" });
  assert.equal(alt.pricePoint(sync, pool, "6")?.price, 2);
  const swap = event("Swap", { amount0In: "0", amount1In: "1000000000000000000", amount0Out: "10", amount1Out: "0" });
  assert.equal(alt.trade(swap, pool)?.usdcValue, 1);
  assert.throws(() => adapter.latestReserves([sync], pool, "6"), /does not belong/);
});

test("multiple sources merge newest pools, deduplicate addresses and apply a global limit", async () => {
  const second = createDexAdapter({ ...source, id: "second", factoryAddress: poolB }, ARC_RADAR_TESTNET);
  const readPage = async (path: string): Promise<{ data: DexLogPage; stale: boolean }> => ({
    data: { items: path === adapter.discoveryPath ? [poolLog(poolA, token, quote, "2026-09-07T00:00:00Z")] : [poolLog(poolB), poolLog(poolA, token, quote, "2026-09-07T00:00:00Z")] },
    stale: path === second.discoveryPath,
  });
  const result = await discoverDexPools([adapter, second], 1, readPage);
  assert.equal(result.seeds[0]!.pairAddress, poolB);
  assert.equal(result.hasMore, true);
  assert.equal(result.stale, true);
  const all = await discoverDexPools([adapter, second], 15, readPage);
  assert.equal(all.seeds.length, 2);
  assert.equal(all.hasMore, false);
  await assert.rejects(discoverDexPools([adapter, adapter], 15, readPage), /Duplicate/);
});

test("a source failure is surfaced instead of returning an apparently complete market list", async () => {
  await assert.rejects(discoverDexPools([adapter], 15, async () => { throw new Error("offline"); }), /offline/);
});

test("liquidity aggregation and briefs retain a removal older than the first twelve events", () => {
  const now = Date.parse("2026-09-11T00:00:00Z");
  const pool = adapter.pairSeeds({ items: [poolLog()] })[0]!;
  const logs = Array.from({ length: 13 }, (_, offset) => {
    const timestamp = new Date(now - (offset + 1) * 60_000).toISOString();
    const hash = `0x${(offset + 1).toString(16).padStart(64, "0")}`;
    return [
      { ...event(offset === 12 ? "Burn" : "Mint", { amount0: "1000000000000000000", amount1: "1000000" }, timestamp, 2), transaction_hash: hash },
      { ...event("Sync", { reserve0: "10000000000000000000", reserve1: "9000000" }, timestamp, 1), transaction_hash: hash },
    ];
  }).flat();
  const events = adapter.liquidityEvents(logs, pool, "18");
  assert.equal(events.length, 13);
  assert.equal(events.filter(event => event.direction === "add").reduce((sum, event) => sum + event.usdcAmount, 0), 12);
  assert.equal(events.filter(event => event.direction === "remove").reduce((sum, event) => sum + event.usdcAmount, 0), 1);
  const briefs = marketBriefs([{ ...pool, stale: false, historyTruncated: false, reserveSource: "sync", periods: { h1: { priceChange: null } }, trades: [], liquidityEvents: events }], now);
  assert.equal(briefs.length, 1);
  assert.equal(briefs[0]!.kind, "liquidity");
  assert.equal(briefs[0]!.value, 1);
});
