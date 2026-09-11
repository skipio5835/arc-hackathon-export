import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KOREAN, JAPANESE, copy, translate, resolveLanguage, initializeLanguage, localize } from "../src/arc-radar-i18n.js";

test("saved language wins; browser Korean/Japanese and invalid settings have deterministic fallbacks", () => {
  assert.equal(resolveLanguage("en", ["ko-KR"]), "en");
  assert.equal(resolveLanguage("ko", ["en-US"]), "ko");
  assert.equal(resolveLanguage(null, ["ko-KR"]), "ko");
  assert.equal(resolveLanguage("invalid", ["en-US", "ko-KR"]), "en");
  assert.equal(resolveLanguage(null, []), "en");
  assert.equal(resolveLanguage("ja", ["ko-KR"]), "ja");
  assert.equal(resolveLanguage("ko", ["ja-JP"]), "ko");
  assert.equal(resolveLanguage(null, ["ja-JP"]), "ja");
  assert.equal(resolveLanguage("invalid", ["JA-jp"]), "ja");
  assert.equal(resolveLanguage(null, ["en-US", "ja-JP"]), "en");
});

test("raw token names, addresses, numbers, and HTML-looking values remain literal", () => {
  const message = copy("{symbol} · {title}", { symbol: "Price", title: copy("Liquidity removed") });
  assert.equal(translate(message, "ko"), "Price · 유동성 제거");
  assert.equal(translate(message, "en"), "Price · Liquidity removed");
  assert.equal(translate(message, "ja"), "Price · 流動性の引き出し");
  for (const value of ["0xD0C8B6025789aA6AB05d171AB0a6776fEAA6D1fc", "0.000000009123", "<img src=x onerror=alert(1)>", "{title}"]) {
    assert.equal(translate(copy("{value}", { value }), "ko"), value);
    assert.equal(translate(copy("{value}", { value }), "ja"), value);
  }
  assert.equal(translate(copy("untranslated RPC error"), "ko"), "untranslated RPC error");
  assert.equal(translate(copy("untranslated RPC error"), "ja"), "untranslated RPC error");
  for (const key of ["constructor", "toString", "__proto__"]) {
    assert.equal(translate(copy(key), "ko"), key);
    assert.equal(translate(copy(key), "ja"), key);
  }
});

test("every translation keeps exactly the same interpolation fields", () => {
  const fields = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const dictionary of [KOREAN, JAPANESE]) {
    for (const [key, value] of Object.entries(dictionary)) assert.deepEqual(fields(value), fields(key), key);
  }
});

test("Japanese covers the same UI copy as Korean without empty or Korean translations", () => {
  assert.deepEqual(Object.keys(JAPANESE).sort(), Object.keys(KOREAN).sort());
  for (const [key, value] of Object.entries(JAPANESE)) {
    assert.ok(value.trim(), key);
    assert.doesNotMatch(value, /[\uac00-\ud7af]/, key);
  }
});

class TextNode {
  attributes = new Map<string, string>();
  textContent = "";
  value = "";
  disabled = false;
  onChange: ((event: unknown) => void) | undefined;
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  addEventListener(_name: string, callback: (event: unknown) => void) { this.onChange = callback; }
  set innerHTML(_value: string) { throw new Error("Translation must not render HTML"); }
}
function fixture(blocked = false, saved: string | null = "en") {
  const select = new TextNode();
  const staticLabel = new TextNode();
  staticLabel.setAttribute("data-i18n", "Refresh");
  const search = new TextNode();
  search.value = "SKIPIO";
  search.setAttribute("data-i18n-placeholder", "Search token, symbol, or contract");
  const dynamic = new TextNode();
  const untouched = new TextNode();
  untouched.textContent = "Price";
  const nodes = [staticLabel, search, dynamic, untouched];
  const values = new Map<string, string>([["arcrow:theme", "dark"], ["watchlist", "keep"]]);
  if (saved) values.set("arcrow:language", saved);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  const root = { documentElement: { lang: "en" }, getElementById: () => select,
    querySelectorAll: (query: string) => nodes.filter(node => [...query.matchAll(/\[([^\]]+)\]/g)].some(match => node.attributes.has(match[1]))) };
  let sync!: (event: unknown) => void;
  const host = { navigator: { languages: ["ko-KR"], language: "ko-KR" },
    get localStorage() { if (blocked) throw new Error("Blocked"); return storage; },
    addEventListener: (_name: string, handler: (event: unknown) => void) => { sync = handler; },
    fetch: () => { throw new Error("Language selection must not request data"); } };
  initializeLanguage(root as unknown as Document, host as unknown as Window);
  return { select, staticLabel, search, dynamic, untouched, values, root, storage,
    choose: (value: string) => { select.value = value; select.onChange!({ target: select }); },
    sync: (key: string | null, newValue: string | null) => sync({ storageArea: storage, key, newValue }) };
}

test("live language switches update only bound text, preserving data and input state", () => {
  const page = fixture();
  localize(page.dynamic as unknown as Element, copy("{symbol} · {title}", { symbol: "Price", title: copy("Liquidity removed") }));
  page.choose("ko");
  assert.equal(page.root.documentElement.lang, "ko");
  assert.equal(page.staticLabel.textContent, "새로고침");
  assert.equal(page.search.getAttribute("placeholder"), "토큰명, 심볼, 계약 주소 검색");
  assert.equal(page.search.value, "SKIPIO");
  assert.equal(page.untouched.textContent, "Price");
  assert.equal(page.dynamic.textContent, "Price · 유동성 제거");
  assert.equal(page.values.get("arcrow:language"), "ko");
  assert.equal(page.values.get("arcrow:theme"), "dark");
  assert.equal(page.values.get("watchlist"), "keep");
  localize(page.dynamic as unknown as Element, copy("B {count}", { count: 123 }));
  assert.equal(page.dynamic.textContent, "매수 123");
  page.choose("en");
  assert.equal(page.dynamic.textContent, "B 123");
  assert.equal(page.staticLabel.textContent, "Refresh");
});

test("blocked storage still works; cross-tab sync ignores theme and clear restores browser language", () => {
  const blocked = fixture(true);
  blocked.choose("en");
  assert.equal(blocked.staticLabel.textContent, "Refresh");
  blocked.choose("ja");
  assert.equal(blocked.staticLabel.textContent, "更新");
  const page = fixture();
  page.sync("arcrow:theme", "dark");
  assert.equal(page.root.documentElement.lang, "en");
  page.sync("arcrow:language", "ko");
  assert.equal(page.staticLabel.textContent, "새로고침");
  page.sync("arcrow:language", "ja");
  assert.equal(page.staticLabel.textContent, "更新");
  assert.equal(page.select.value, "ja");
  page.choose("en");
  page.sync(null, null);
  assert.equal(page.root.documentElement.lang, "ko");
});

test("saved Japanese restores and round trips without translating data or resetting controls", () => {
  const page = fixture(false, "ja");
  assert.equal(page.root.documentElement.lang, "ja");
  assert.equal(page.select.value, "ja");
  assert.equal(page.staticLabel.textContent, "更新");
  assert.equal(page.search.getAttribute("placeholder"), "トークン名・シンボル・アドレス検索");
  localize(page.dynamic as unknown as Element, copy("{symbol} · {title}", { symbol: "Price", title: copy("Liquidity removed") }));
  assert.equal(page.dynamic.textContent, "Price · 流動性の引き出し");
  page.choose("ko");
  assert.equal(page.dynamic.textContent, "Price · 유동성 제거");
  page.choose("en");
  assert.equal(page.dynamic.textContent, "Price · Liquidity removed");
  page.choose("ja");
  assert.equal(page.dynamic.textContent, "Price · 流動性の引き出し");
  assert.equal(page.search.value, "SKIPIO");
  assert.equal(page.untouched.textContent, "Price");
  assert.equal(page.values.get("arcrow:language"), "ja");
  assert.equal(page.values.get("arcrow:theme"), "dark");
  assert.equal(page.values.get("watchlist"), "keep");
});

test("all static translation markers exist and token identity fields are not marked", () => {
  const html = readFileSync(new URL("../public/arc-radar.html", import.meta.url), "utf8");
  for (const match of html.matchAll(/data-i18n(?:-(?:placeholder|title|aria-label))?="([^"]+)"/g)) {
    for (const dictionary of [KOREAN, JAPANESE]) {
      assert.ok(Object.hasOwn(dictionary, match[1].replaceAll("&quot;", '"').replaceAll("&amp;", "&")), match[1]);
    }
  }
  assert.match(html, /<option value="ja">日本語<\/option>/);
  assert.match(html, /<a class="mobile-market-back" href="#marketList" data-i18n="Back to markets">/);
  assert.match(html, /<section class="market-board" id="marketList" tabindex="-1">/);
  assert.doesNotMatch(html, /<[^>]*id="(?:marketTokenName|marketTokenSymbol|marketTokenMark|pulseNewest)"[^>]*data-i18n/);
});
