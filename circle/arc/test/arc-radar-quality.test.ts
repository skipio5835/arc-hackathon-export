import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { decimalValue, fullyDilutedValue } from "../src/arc-radar-core.js";
import { createDexAdapter } from "../src/arc-radar-dex.js";
import { ARC_RADAR_TESTNET } from "../src/arc-radar-networks.js";
import { copy, translate } from "../src/arc-radar-i18n.js";
import { capabilityText, detectCapabilities, nextWatchBatch } from "../src/arc-radar-evidence.js";
import { holderMetrics, holderShare, knownTokenPools, nextOwnershipSnapshot, sourceState, tradeActor, windowPriceChange } from "../src/arc-radar-quality.js";

const address = (value: number) => `0x${value.toString(16).padStart(40, "0")}`;
const holder = (id: number, value: string) => ({ address: { hash: address(id) }, value });
const selected = { chainId: 5042002, tokenAddress: address(10), pairAddress: address(1) };

test("failed or malformed holders are unknown, never zero concentration", () => {
  for (const source of [null, { data: {}, stale: false }, { data: { items: [holder(2, "invalid")] }, stale: false }]) {
    const result = holderMetrics(source, "1000", new Set());
    assert.equal(result.state, "unavailable");
    assert.equal(result.top(10), null);
    assert.equal(result.burned, null);
    assert.equal(result.shareAt(address(2)), null);
  }
  assert.equal(holderShare(null, "1000"), null);
  assert.equal(holderShare(undefined, "1000"), null);
  assert.equal(holderShare("0", "1000"), 0);
  assert.equal(holderShare("1", null), null);
});

test("all loaded same-chain same-token pools are excluded, unrelated addresses are not", () => {
  const pools = knownTokenPools(selected, [selected, { ...selected, pairAddress: address(2) },
    { ...selected, chainId: 1, pairAddress: address(3) }, { ...selected, tokenAddress: address(11), pairAddress: address(4) }]);
  assert.deepEqual([...pools], [address(1), address(2)]);
  const result = holderMetrics({ data: { items: [holder(1, "400"), holder(2, "300"), holder(3, "200"), holder(4, "100")] }, stale: false }, "1000", pools);
  assert.equal(result.top(1), 20);
  assert.equal(result.top(10), 30);
  assert.equal(result.shareAt(address(1)), 40);
  assert.equal(result.shareAt(address(5)), 0);
});

test("partial holder page does not prove missing balances, burn totals, or full rankings", () => {
  const result = holderMetrics({ data: { items: [holder(2, "100")], next_page_params: { cursor: 1 } }, stale: false }, "1000", new Set());
  assert.equal(result.top(1), 10);
  assert.equal(result.top(5), null);
  assert.equal(result.shareAt(address(3)), null);
  assert.equal(result.burned, null);
  assert.equal(result.partial, true);
});

test("stale fallback stays distinguishable from fresh and missing data", () => {
  assert.equal(sourceState(null), "unavailable");
  const source = { data: { items: [holder(2, "100")] }, stale: true };
  assert.equal(holderMetrics(source, "1000", new Set()).state, "cached");
  assert.equal(sourceState({ ...source, stale: false }), "fresh");
});

test("missing and stale observations preserve previous baselines without alerts", () => {
  const previous = { creatorShare: 30, top10Share: 80, lpBurnedShare: 90, poolScope: "a", timestamp: "before" };
  const allFresh = { creatorShare: true, top10Share: true, lpBurnedShare: true };
  const missing = nextOwnershipSnapshot(previous, { ...previous, creatorShare: null, top10Share: null, lpBurnedShare: null }, allFresh);
  assert.deepEqual(missing.next, previous);
  assert.deepEqual(Object.values(missing.comparable), [false, false, false]);
  const stale = nextOwnershipSnapshot(previous, { ...previous, top10Share: 0 }, { ...allFresh, top10Share: false });
  assert.equal(stale.next.top10Share, 80);
  assert.equal(stale.comparable.top10Share, false);
  const recovered = nextOwnershipSnapshot(stale.next, { ...previous, top10Share: 85 }, allFresh);
  assert.equal(recovered.comparable.top10Share, true);
  assert.equal(recovered.next.top10Share, 85);
});

test("newly discovered pool exclusions rebase concentration without a false reduction alert", () => {
  const previous = { creatorShare: 0, top10Share: 80, lpBurnedShare: 0, poolScope: "a", timestamp: "before" };
  const next = nextOwnershipSnapshot(previous, { ...previous, poolScope: "a,b", top10Share: 30 }, { creatorShare: true, top10Share: true, lpBurnedShare: true });
  assert.equal(next.comparable.top10Share, false);
  assert.equal(next.next.top10Share, 30);
  assert.equal(next.next.poolScope, "a,b");
});

test("window return requires a price at or before its boundary, including new pools", () => {
  const cutoff = Date.parse("2026-09-09T00:00:00Z");
  const short = [{ price: 110, timestamp: "2026-09-09T00:50:00Z" }, { price: 120, timestamp: "2026-09-09T01:00:00Z" }];
  assert.equal(windowPriceChange(short, 120, cutoff), null);
  assert.equal(windowPriceChange([], 120, cutoff), null);
  assert.equal(windowPriceChange([...short, { price: 100, timestamp: "2026-09-09T00:00:00Z" }], 120, cutoff), 20);
  assert.equal(windowPriceChange([{ price: 0, timestamp: "2026-09-08T00:00:00Z" }], 120, cutoff), null);
});

test("swap recipient fallback is never labeled as transaction sender", () => {
  assert.deepEqual(tradeActor(undefined, address(2)), { address: address(2), role: "Recipient" });
  assert.deepEqual(tradeActor(address(1), address(2)), { address: address(1), role: "Sender" });
  assert.equal(tradeActor(undefined, null), null);
});

// Exercise the real detail orchestration with fixture API responses, without a DOM or network.
const mainSource = ts.createSourceFile("arc-radar.ts", readFileSync(new URL("../src/arc-radar.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
function compileMain(names: string[]): string {
  const program = mainSource.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text ?? ""))
    .map(node => node.getText(mainSource)).join("\n");
  return ts.transpileModule(program, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}

test("real market loading preserves missing FDV instead of fabricating zero", async () => {
  const adapter = createDexAdapter(ARC_RADAR_TESTNET.sources[0]!, ARC_RADAR_TESTNET);
  const seed = { ...selected, sourceId: adapter.source.id, quoteAsset: ARC_RADAR_TESTNET.quoteAsset, token0: selected.tokenAddress, token1: ARC_RADAR_TESTNET.quoteAsset.address };
  const logs = [{ index: 1, block_timestamp: new Date().toISOString(), decoded: { method_call: "Sync(...)", parameters: [
    { name: "reserve0", value: "1000000000000000000" }, { name: "reserve1", value: "9000000" },
  ] } }];
  const script = compileMain(["loadMarketPair", "marketPeriods", "periodMetrics"]);
  const market = await runInNewContext(`${script}\nloadMarketPair(seed, true)`, {
    seed, DAY_MS: 86_400_000, decimalValue, fullyDilutedValue, windowPriceChange, adapterFor: () => adapter, observeMarketChanges: () => {},
    fetchData: async () => ({ data: { decimals: "18", total_supply: null }, stale: false }),
    fetchAddressLogs: async () => ({ items: logs, stale: false, truncated: false }),
  });
  assert.equal(market.currentPrice, 9);
  assert.equal(market.fdv, null);
  assert.equal(market.stale, false);
});

function refreshFixture(mode: "failed" | "partial" | "empty", previous = false) {
  const nodes = new Map<string, { textContent: string; disabled?: boolean }>();
  const byId = (id: string) => { if (!nodes.has(id)) nodes.set(id, { textContent: "" }); return nodes.get(id)!; };
  const notices: string[] = [];
  const renderedFailureStates: boolean[] = [];
  const script = compileMain(["loadMarkets", "loadDashboard", "mapLimited"]);
  const context: Record<string, any> = {
    copy, loading: false, NETWORK: {}, routeError: "", linkedPool: null, marketLimit: 15,
    markets: previous ? [{ ...selected, stale: false }] : [], selectedPair: "", marketLoadFailed: previous,
    dexAdapters: [], failedMarketCount: 0, hasMoreMarkets: false, discoveryLimited: false, detailRequest: 0, lastRefreshAt: 0,
    discoverDexPools: async () => ({ seeds: mode === "empty" ? [] : [selected, { ...selected, pairAddress: address(2) }], stale: false, hasMore: true, limited: false }),
    loadMarketPair: async (seed: typeof selected) => mode === "partial" && seed.pairAddress === selected.pairAddress ? { ...seed, stale: false } : null,
    visibleMarkets: () => context.markets, renderDiscoveryControls: () => {},
    renderMarketRows: () => renderedFailureStates.push(context.marketLoadFailed), checkWatchedPools: async () => {},
    loadDetail: async () => {}, setDetailState: () => {}, adPreview: { setContentAvailable: () => {} }, byId,
    localize: (node: { textContent: string }, message: string) => { node.textContent = message; },
    setCopy: (id: string, message: Parameters<typeof translate>[0]) => { byId(id).textContent = translate(message, "en"); },
    setNotice: (message?: Parameters<typeof translate>[0] | string) => notices.push(typeof message === "string" ? message : message ? translate(message, "en") : ""),
  };
  return { context, nodes, notices, renderedFailureStates, run: () => runInNewContext(`${script}\nloadDashboard(true)`, context) };
}

test("all pool loads failing is an error, preserving prior markets only as stale", async () => {
  for (const previous of [false, true]) {
    const fixture = refreshFixture("failed", previous);
    await fixture.run();
    assert.equal(fixture.context.marketLoadFailed, true);
    assert.equal(fixture.context.failedMarketCount, 2);
    assert.equal(fixture.context.markets.length, previous ? 1 : 0);
    if (previous) assert.equal(fixture.context.markets[0].stale, true);
    assert.match(fixture.notices.at(-1)!, /All discovered pools failed/);
    assert.equal(fixture.nodes.get("lastUpdated")!.textContent, "Connection unavailable");
    assert.equal(fixture.nodes.get("refreshButton")!.disabled, false);
  }
});

test("partial loading is labeled partial, and a genuine empty recovery clears the failure view", async () => {
  const partial = refreshFixture("partial");
  await partial.run();
  assert.equal(partial.context.marketLoadFailed, false);
  assert.equal(partial.context.markets.length, 1);
  assert.match(partial.nodes.get("lastUpdated")!.textContent, /^Partial update /);
  assert.match(partial.notices.at(-1)!, /Pool loads failed: 1/);
  const empty = refreshFixture("empty", true);
  await empty.run();
  assert.equal(empty.context.marketLoadFailed, false);
  assert.equal(empty.context.markets.length, 0);
  assert.deepEqual(empty.renderedFailureStates, [false]);
  assert.match(empty.nodes.get("lastUpdated")!.textContent, /^Updated /);
});

test("unavailable initial market data renders unknown activity, not zero volume", () => {
  const nodes = new Map<string, { textContent: string }>();
  const byId = (id: string) => { if (!nodes.has(id)) nodes.set(id, { textContent: "" }); return nodes.get(id)!; };
  runInNewContext(`${compileMain(["renderMarketSummary", "renderMarketPulse"])}\nrenderMarketSummary(); renderMarketPulse();`, {
    marketLoadFailed: true, markets: [], byId, setCopy: (id: string, value: string) => { byId(id).textContent = value; },
  });
  assert.equal(byId("pulseVolume").textContent, "--");
  assert.equal(byId("pulseTrades").textContent, "--");
  assert.match(byId("pulseStatus").textContent, /unknown/);
  assert.match(byId("marketSummary").textContent, /unknown/);
});

test("liquidity UI totals all fetched in-window events while rendering only eight rows", () => {
  const now = Date.now();
  const events = Array.from({ length: 13 }, (_, index) => ({ timestamp: new Date(now - (index + 1) * 60_000).toISOString(),
    direction: index === 12 ? "remove" : "add", usdcAmount: 1, tokenAmount: 1, changePercent: 10, transactionHash: `0x${index}`, fallbackAddress: null }));
  events.push({ ...events[0]!, timestamp: new Date(now - 2 * 86_400_000).toISOString(), usdcAmount: 100 },
    { ...events[0]!, timestamp: new Date(now + 86_400_000).toISOString(), usdcAmount: 100 });
  const nodes = new Map<string, any>();
  const element = () => ({ textContent: "", children: [] as unknown[], append(...children: unknown[]) { this.children.push(...children); }, replaceChildren() { this.children = []; } });
  const byId = (id: string) => { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); };
  runInNewContext(`${compileMain(["renderLiquidityMonitor"])}\nrenderLiquidityMonitor(market, detail);`, {
    market: { liquidityEvents: events, token: { symbol: "Price" }, usdcReserve: 9, historyTruncated: false },
    detail: { lpBurnedShare: null, lpTopHolderShare: null, sources: { lp: "unavailable" }, transactionSenders: {} },
    DAY_MS: 86_400_000, copy, byId, element, EXPLORER_BASE: "https://example.invalid", relativeTime: () => "1m", shortHash: (value: string) => value,
    formatValue: String, shareText: () => "--", setCopy: (id: string, value: Parameters<typeof translate>[0]) => { byId(id).textContent = translate(value, "en"); },
  });
  assert.equal(byId("liquidityAdded").textContent, "12");
  assert.equal(byId("liquidityRemoved").textContent, "1");
  assert.equal(byId("liquidityEventList").children.length, 8);
  assert.match(byId("liquidityHistoryNote").textContent, /Showing 8 of 15/);
});
const detailFunctions = new Set(["fetchOptional", "fetchTokenTransfers", "mapLimited", "fetchMarketDetail", "mergeContracts", "contractFunctions", "buildWarnings", "classifyWalletSignals", "analyzeHolderConnections"]);
const detailProgram = mainSource.statements.filter(node => ts.isFunctionDeclaration(node) && detailFunctions.has(node.name?.text ?? ""))
  .map(node => node.getText(mainSource)).join("\n");
const fixtureMarket = { ...selected, token: { total_supply: "1000", decimals: "0" }, creationTx: "0xcreation", createdAt: "2026-09-01T00:00:00Z", trades: [], liquidityEvents: [],
  sellCount: 0, totalLiquidity: 100, usdcReserve: 50, reserveSource: "sync", periods: { h24: { priceChange: null } } };
function detailFixture(mode: "failed" | "cached" | "fresh") {
  const fetchData = async (path: string) => {
    if (mode === "failed") throw new Error("fixture: HTTP 503");
    const stale = mode === "cached";
    if (path.endsWith("/holders")) return { data: { items: [holder(1, "300"), holder(2, "200"), holder(3, "500")] }, stale };
    if (path.endsWith("/transfers")) return { data: { items: [
      { type: "token_transfer", from: { hash: address(2) }, to: { hash: address(1) }, total: { value: "50", decimals: "0" }, timestamp: "2026-09-09T00:00:00Z", transaction_hash: "0xpooltopool" },
      { type: "token_transfer", from: { hash: address(4) }, to: { hash: address(1) }, total: { value: "50", decimals: "0" }, timestamp: "2026-09-09T00:01:00Z", transaction_hash: "0xtopool" },
    ] }, stale };
    if (path.startsWith("/transactions/")) return { data: { from: { hash: address(3) } }, stale };
    if (path.startsWith("/addresses/")) return { data: { is_verified: true }, stale };
    if (path.startsWith("/smart-contracts/")) return { data: { abi: [{ type: "function", name: "mint", stateMutability: "nonpayable" }] }, stale };
    return { data: { total_supply: "1000" }, stale };
  };
  const script = ts.transpileModule(detailProgram, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return runInNewContext(`${script}\nfetchMarketDetail(fixtureMarket, true).then(detail => ({...detail, warnings: buildWarnings(fixtureMarket, detail)}))`, {
    fetchData, fixtureMarket, copy, markets: [fixtureMarket, { ...fixtureMarket, pairAddress: address(2) }],
    holderMetrics, holderShare, knownTokenPools, sourceState, decimalValue, detectCapabilities, capabilityText, URLSearchParams,
    formatValue: (value: number) => String(value), relativeTime: () => "1m",
    TRANSFER_PAGE_LIMIT: 3, BURN_ADDRESSES: new Set([address(0), "0x000000000000000000000000000000000000dead"]),
  });
}

test("detail API failures retain unavailable provenance through the real fetch pipeline", async () => {
  const detail = await detailFixture("failed");
  assert.equal(detail.top10Share, null);
  assert.equal(detail.lpBurnedShare, null);
  assert.equal(detail.creatorShare, null);
  assert.equal(detail.sources.holders, "unavailable");
  assert.equal(detail.sources.transfers, "unavailable");
  assert.equal(detail.walletSignals.length, 0);
});

test("real detail pipeline retains cached source states instead of fresh ownership", async () => {
  const detail = await detailFixture("cached");
  for (const source of ["holders", "lp", "contract", "creator", "transfers"]) assert.equal(detail.sources[source], "cached");
  assert.equal(detail.top10Share, 50);
});

test("real wallet classification excludes pool-to-pool movements and never infers full exit", async () => {
  const detail = await detailFixture("fresh");
  assert.equal(detail.holderPositions.length, 1);
  assert.equal(detail.holderPositions[0].address, address(3));
  assert.equal(detail.walletSignals.length, 1);
  assert.equal(detail.walletSignals[0].title, "Wallet sent to pool");
  assert.equal(detail.holderConnections.length, 0);
});

test("real detail warnings never promote a matching mint ABI into verified supply permission", async () => {
  const detail = await detailFixture("fresh");
  const mint = detail.warnings.find((warning: { title: string }) => warning.title === "Supply-related function names");
  assert.equal(mint.basis, "unverified");
  assert.match(translate(mint.detail, "en"), /ABI: mint/);
  assert.match(translate(mint.detail, "ko"), /실행 가능하다는 뜻은 아닙니다/);
  assert.ok(detail.warnings.every((warning: { basis?: string }) => ["observed", "estimate", "unverified"].includes(warning.basis ?? "")));
  assert.ok(detail.warnings.some((warning: { title: string; detail: string }) => warning.title === "Execution paths not verified"
    && warning.detail.includes("No sell simulation or full permission audit")));
});

test("real watch scheduler bounds failed reads, cools down retries, and pauses when hidden", async () => {
  const node = mainSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "checkWatchedPools")!;
  const script = ts.transpileModule(node.getText(mainSource), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const pools = Array.from({ length: 5 }, (_, index) => ({ ...fixtureMarket, pairAddress: address(index + 20), stale: false }));
  const attempted: string[] = [];
  let observations = 0;
  const context = {
    document: { hidden: false }, linkedPool: null, marketLoadFailed: false, watchScanRunning: false, lastWatchScanAt: 0,
    AUTO_REFRESH_MS: 60_000, DETAIL_CACHE_TTL_MS: 120_000, nextWatchBatch, markets: pools,
    watchlist: new Set([fixtureMarket.tokenAddress.toLowerCase()]), watchCheckAttempts: new Map(), detailCache: new Map(),
    poolCacheKey: (pool: typeof fixtureMarket) => pool.pairAddress, renderWatchDigest: () => {},
    getMarketDetail: async (pool: typeof fixtureMarket) => { attempted.push(pool.pairAddress); throw new Error("HTTP 503"); },
    observeDetailChanges: () => { observations++; },
  };
  await runInNewContext(`${script}\ncheckWatchedPools().then(() => checkWatchedPools())`, context);
  assert.equal(attempted.length, 3);
  assert.equal(observations, 0);
  assert.equal(context.watchScanRunning, false);
  assert.equal(context.watchCheckAttempts.size, 3);
  context.document.hidden = true;
  context.lastWatchScanAt = 0;
  await runInNewContext(`${script}\ncheckWatchedPools()`, context);
  assert.equal(attempted.length, 3);
});

test("detail panel and watch scan share a concurrent request for the same pool scope", async () => {
  const node = mainSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "getMarketDetail")!;
  const script = ts.transpileModule(node.getText(mainSource), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  let requests = 0;
  const context = {
    fixtureMarket, markets: [fixtureMarket], knownTokenPools, DETAIL_CACHE_TTL_MS: 120_000,
    poolCacheKey: (pool: typeof fixtureMarket) => pool.pairAddress, detailCache: new Map(), detailFlights: new Map(),
    fetchMarketDetail: async () => { requests++; return { checkedAt: Date.now(), poolScope: fixtureMarket.pairAddress }; },
  };
  await runInNewContext(`${script}\nPromise.all([getMarketDetail(fixtureMarket, false), getMarketDetail(fixtureMarket, false)])`, context);
  assert.equal(requests, 1);
  assert.equal(context.detailCache.size, 1);
  assert.equal(context.detailFlights.size, 0);
});

test("manual state reads cool down, clear failed retries, and cannot overwrite another token", async () => {
  const node = mainSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "readSelectedAuthority")!;
  const script = ts.transpileModule(node.getText(mainSource), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const other = { ...fixtureMarket, pairAddress: address(51), tokenAddress: address(52) };
  let finish!: (value: unknown) => void;
  let requests = 0;
  const rendered: string[] = [];
  const entries = new Map<string, { attemptedAt: number; snapshot?: unknown; error?: string }>();
  const context = { markets: [fixtureMarket, other], selectedPair: fixtureMarket.pairAddress.toLowerCase(), NETWORK: {},
    authorityRunning: "", authorityReads: entries, window: { setTimeout: () => {} },
    renderAuthority: (market: typeof fixtureMarket) => rendered.push(market.tokenAddress),
    readAuthoritySnapshot: async () => { requests++; return new Promise(resolve => { finish = resolve; }); },
  };
  const pending = runInNewContext(`${script}\nreadSelectedAuthority()`, context);
  await runInNewContext(`${script}\nreadSelectedAuthority()`, context);
  assert.equal(requests, 1);
  context.selectedPair = other.pairAddress;
  finish({ marker: "original token" });
  await pending;
  assert.equal(rendered.at(-1), other.tokenAddress);
  const key = `${fixtureMarket.chainId}:${fixtureMarket.tokenAddress.toLowerCase()}`;
  assert.deepEqual(entries.get(key)?.snapshot, { marker: "original token" });
  assert.equal(entries.has(`${other.chainId}:${other.tokenAddress}`), false);
  context.selectedPair = fixtureMarket.pairAddress;
  await runInNewContext(`${script}\nreadSelectedAuthority()`, context);
  assert.equal(requests, 1);
  entries.get(key)!.attemptedAt = Date.now() - 61_000;
  context.readAuthoritySnapshot = async () => { requests++; throw new Error("RPC unavailable"); };
  await runInNewContext(`${script}\nreadSelectedAuthority()`, context);
  assert.equal(entries.get(key)?.snapshot, undefined);
  assert.ok(entries.get(key)?.error);
  await runInNewContext(`${script}\nreadSelectedAuthority()`, context);
  assert.equal(requests, 2);
});
