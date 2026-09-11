import test from "node:test";
import assert from "node:assert/strict";
import { observeSellEvents, groupTokenPools } from "../src/arc-radar-market-tools.js";

const hash = `0x${"ab".repeat(32)}`;
const trade = (eventIndex: number, seconds = eventIndex) => ({ direction: "sell", transactionHash: hash, eventIndex, timestamp: new Date(100_000 + seconds * 1000).toISOString() });

test("first observation and legacy migration establish a baseline without historical alerts", () => {
  assert.equal(observeSellEvents([trade(1), trade(2)]).added, 0);
  const baseline = observeSellEvents([trade(1)]).state;
  assert.equal(observeSellEvents([trade(1), trade(1)], baseline).added, 0);
});

test("equal or shrinking rolling counts still detect unseen logs within one transaction", () => {
  const baseline = observeSellEvents([trade(1), trade(2), trade(3)]).state;
  const next = observeSellEvents([trade(3), trade(4), trade(4)], baseline);
  assert.equal(next.added, 1);
  assert.equal(observeSellEvents([trade(1), trade(4)], next.state).added, 0);
  const delayed = observeSellEvents([trade(5, 0)], next.state);
  assert.equal(delayed.added, 1);
  assert.equal(observeSellEvents([{ ...trade(5, 0), transactionHash: hash.toUpperCase().replace("0X", "0x") }], delayed.state).added, 0);
});

test("missing identity is ignored and bounded retention prevents old events being counted again", () => {
  const baseline = observeSellEvents([], undefined, 2).state;
  assert.equal(observeSellEvents([{ ...trade(1), eventIndex: undefined }, { ...trade(1), transactionHash: "bad" }, { ...trade(2), direction: "buy" }], baseline).added, 0);
  const next = observeSellEvents([trade(1), trade(2), trade(3)], baseline, 2);
  assert.equal(next.added, 3);
  assert.equal(next.state.seen.length, 2);
  assert.equal(observeSellEvents([trade(1), trade(2), trade(3)], next.state, 2).added, 0);
});

test("tokens group by chain and address; representatives prefer fresh data then liquidity", () => {
  const a = { chainId: 1, tokenAddress: "0xab", pairAddress: "0x1", totalLiquidity: 10, stale: false };
  const b = { ...a, pairAddress: "0x2", totalLiquidity: 20 };
  const c = { ...a, pairAddress: "0x3", totalLiquidity: 1000, stale: true };
  const input = [a, b, c, { ...b, tokenAddress: "0xAB" }, { ...a, chainId: 2 }, { ...a, tokenAddress: "0xcd" }];
  const grouped = groupTokenPools(input);
  assert.equal(grouped.length, 3);
  assert.equal(grouped[0]!.pools.length, 3);
  assert.equal(grouped[0]!.primary.pairAddress, "0x2");
  assert.equal(input[0], a);
});
