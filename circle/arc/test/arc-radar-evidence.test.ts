import test from "node:test";
import assert from "node:assert/strict";
import { capabilityText, detectCapabilities, evidenceSummary, marketBriefs, nextWatchBatch } from "../src/arc-radar-evidence.js";

const abi = (name: string, stateMutability = "nonpayable") => ({ type: "function", name, stateMutability });
test("ABI indicators preserve names but do not certify usable permissions", () => {
  const findings = detectCapabilities(null, { abi: [abi("mint"), abi("mintTo"), abi("pause"), abi("setTax")] });
  assert.deepEqual(findings.map(finding => finding.kind), ["mint", "pause", "fee"]);
  assert.deepEqual(findings[0]!.functions, ["mint", "mintTo"]);
  for (const finding of findings) {
    const text = capabilityText(finding);
    assert.equal(text.basis, "unverified");
    assert.match(text.detail, /Names alone do not establish/);
    assert.match(text.detail, /do not confirm/);
    assert.match(text.detail, /Contract state/);
  }
});

test("read-only functions and no name match never establish safety", () => {
  assert.deepEqual(detectCapabilities(null, { abi: [abi("mintedSupply", "view"), abi("transfer")] }), []);
  assert.deepEqual(detectCapabilities(null, null), []);
  assert.equal(evidenceSummary([]).label, "Evidence only");
  assert.equal(evidenceSummary([{ basis: "unverified" }]).label, "Checks incomplete");
});

test("explorer proxy type is an unverified indicator even without ABI", () => {
  const [finding] = detectCapabilities({ proxy_type: "eip1967" }, null);
  assert.equal(finding!.kind, "upgrade");
  assert.equal(finding!.functions.length, 0);
  assert.match(capabilityText(finding!).detail, /eip1967/);
  assert.equal(capabilityText(finding!).basis, "unverified");
});

const now = Date.parse("2026-09-11T12:00:00Z");
const timestamp = (ago: number) => new Date(now - ago).toISOString();
const tx = `0x${"ab".repeat(32)}`;
const pool = {
  chainId: 5042002, tokenAddress: "0xabc", pairAddress: "0x1", creationTx: tx, createdAt: timestamp(10_000),
  stale: false, historyTruncated: false, reserveSource: "sync", periods: { h1: { priceChange: 35 as number | null } },
  trades: [{ timestamp: timestamp(1_000), transactionHash: tx }],
  liquidityEvents: [{ direction: "remove", timestamp: timestamp(2_000), transactionHash: tx, changePercent: 20, usdcAmount: 2 }],
};

test("brief prioritizes sourced liquidity removal and returns one item per token", () => {
  const result = marketBriefs([pool, { ...pool, pairAddress: "0x2", tokenAddress: "0xABC" }], now);
  assert.equal(result.length, 1);
  assert.equal(result[0]!.kind, "liquidity");
  assert.equal(result[0]!.basis, "observed");
  assert.equal(result[0]!.transactionHash, tx);
});

test("brief does not turn stale, future, invalid, or old events into recent signals", () => {
  assert.deepEqual(marketBriefs([{ ...pool, stale: true }], now), []);
  assert.deepEqual(marketBriefs([{ ...pool, createdAt: timestamp(-5_000), trades: [], liquidityEvents: [
    { ...pool.liquidityEvents[0]!, timestamp: timestamp(-5_000) },
    { ...pool.liquidityEvents[0]!, transactionHash: "bad" },
    { ...pool.liquidityEvents[0]!, timestamp: timestamp(90_000_000) },
  ] }], now), []);
});

test("price brief requires a full-window baseline, fresh Sync data, and a recent trade", () => {
  const candidate = { ...pool, liquidityEvents: [], createdAt: timestamp(90_000_000) };
  assert.equal(marketBriefs([candidate], now)[0]!.kind, "price");
  assert.equal(marketBriefs([candidate], now)[0]!.basis, "estimate");
  for (const changed of [
    { ...candidate, historyTruncated: true }, { ...candidate, reserveSource: "balance" },
    { ...candidate, periods: { h1: { priceChange: null } } },
    { ...candidate, trades: [{ timestamp: timestamp(7_200_000), transactionHash: tx }] },
  ]) assert.deepEqual(marketBriefs([changed], now), []);
});

test("brief coverage groups by chain/address, respects limits, and does not mutate inputs", () => {
  const input = [pool, { ...pool, chainId: 1 }, { ...pool, tokenAddress: "0xdef" }];
  assert.equal(marketBriefs(input, now).length, 3);
  assert.equal(marketBriefs(input, now, 2).length, 2);
  assert.equal(input[0], pool);
});

test("watch checks are bounded, cooldown-aware, and fair to unread pools", () => {
  const pools = Array.from({ length: 5 }, (_, index) => ({ pairAddress: String(index) }));
  const checked = new Map<string, number>();
  const batch = nextWatchBatch(pools, entry => checked.get(entry.pairAddress), now, 120_000);
  assert.deepEqual(batch, pools.slice(0, 3));
  batch.forEach(entry => checked.set(entry.pairAddress, now));
  assert.deepEqual(nextWatchBatch(pools, entry => checked.get(entry.pairAddress), now + 60_000, 120_000), pools.slice(3));
  pools.slice(3).forEach(entry => checked.set(entry.pairAddress, now + 60_000));
  assert.equal(nextWatchBatch(pools, entry => checked.get(entry.pairAddress), now + 90_000, 120_000).length, 0);
  assert.deepEqual(nextWatchBatch(pools, entry => checked.get(entry.pairAddress), now + 120_000, 120_000), pools.slice(0, 3));
});
