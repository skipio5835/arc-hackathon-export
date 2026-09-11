import test from "node:test";
import assert from "node:assert/strict";
import { marketUrl, readPoolRoute, resolveLinkedPool, recentWatchChanges, type CreationPage } from "../src/arc-radar-navigation.js";
import { createDexAdapter } from "../src/arc-radar-dex.js";
import { ARC_RADAR_TESTNET } from "../src/arc-radar-networks.js";

const pool = `0x${"ab".repeat(20)}`;
const token = `0x${"cd".repeat(20)}`;
const tx = `0x${"ef".repeat(32)}`;
const source = ARC_RADAR_TESTNET.sources[0]!;
const adapter = createDexAdapter(source, ARC_RADAR_TESTNET);
function logs(emitter = source.factoryAddress): CreationPage {
  return { items: [{ address: { hash: emitter }, transaction_hash: tx, block_timestamp: "2026-09-08T00:00:00Z",
    decoded: { method_call: "PairCreated(...)", parameters: Object.entries({ pair: pool, token0: token, token1: ARC_RADAR_TESTNET.quoteAsset.address }).map(([name, value]) => ({ name, value })) } }] };
}

test("pool links preserve deployment path but drop preview flags and fragments", () => {
  const url = marketUrl("https://example.com/circle/arc/public/arc-radar.html?ads=preview&other=1#foo", "arc-testnet", pool);
  assert.equal(url, `https://example.com/circle/arc/public/arc-radar.html?network=arc-testnet&pool=${pool}`);
  assert.equal(readPoolRoute(new URL(url)), pool);
  assert.equal(readPoolRoute(new URL(marketUrl(url, "arc-testnet"))), null);
  for (const query of ["pool=", "pool=javascript:bad", `pool=${pool}&pool=${pool}`]) assert.throws(() => readPoolRoute(new URL(`https://example.com/?${query}`)));
});

test("direct pool resolution verifies the configured factory and exact pool without market discovery", async () => {
  const seed = await resolveLinkedPool(pool, [adapter], async () => ({ creation_transaction_hash: tx }), async path => {
    assert.equal(path, `/transactions/${tx}/logs`);
    return logs();
  });
  assert.equal(seed.pairAddress, pool);
  assert.equal(seed.tokenAddress, token);
  await assert.rejects(resolveLinkedPool(pool, [adapter], async () => ({ creation_transaction_hash: tx }), async () => logs(token)), /No supported/);
  await assert.rejects(resolveLinkedPool(token, [adapter], async () => ({ creation_transaction_hash: tx }), async () => logs()), /No supported/);
  await assert.rejects(resolveLinkedPool(pool, [adapter], async () => ({}), async () => logs()), /unavailable/);
  await assert.rejects(resolveLinkedPool(pool, [adapter], async () => ({ creation_transaction_hash: tx }), async () => {
    const value = logs(); value.items![0]!.transaction_hash = `0x${"00".repeat(32)}`; return value;
  }), /No supported/);
});

test("creation log pagination is bounded and handles a second-page match", async () => {
  let calls = 0;
  const seed = await resolveLinkedPool(pool, [adapter], async () => ({ creation_transaction_hash: tx }), async () => ++calls === 1 ? { items: [], next_page_params: { index: 1 } } : logs());
  assert.equal(calls, 2);
  assert.equal(seed.pairAddress, pool);
  calls = 0;
  await assert.rejects(resolveLinkedPool(pool, [adapter], async () => ({ creation_transaction_hash: tx }), async () => ({ items: [], next_page_params: { index: ++calls } })), /No supported/);
  assert.equal(calls, 4);
});

test("watch digest excludes baseline, old, invalid and future events and limits output", () => {
  const now = Date.parse("2026-09-08T00:00:00Z");
  const events = Array.from({ length: 20 }, (_, i) => ({ type: "price", observedAt: new Date(now - i * 1000).toISOString() }));
  events.push({ type: "system", observedAt: new Date(now).toISOString() }, { type: "price", observedAt: "bad" }, { type: "price", observedAt: new Date(now + 1000).toISOString() });
  assert.equal(recentWatchChanges(events, null, now).length, 12);
  assert.equal(recentWatchChanges(events, now - 3000, now).length, 3);
  assert.equal(events.length, 23);
});
