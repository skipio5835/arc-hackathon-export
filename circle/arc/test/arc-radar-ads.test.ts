import test from "node:test";
import assert from "node:assert/strict";
import { canPreviewAds, createVisibilityCheck } from "../src/arc-radar-ads.js";

test("ad preview is off by default and requires an explicit local URL", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
    assert.equal(canPreviewAds(new URL(`http://${host}:4173/public/arc-radar.html`)), false);
    assert.equal(canPreviewAds(new URL(`http://${host}:4173/public/arc-radar.html?ads=preview`)), true);
    assert.equal(canPreviewAds(new URL(`http://${host}:4173/?ads=off`)), false);
    assert.equal(canPreviewAds(new URL(`http://${host}:4173/?ads=live`)), false);
  }
});

test("public domains, misleading hosts and non-web URLs cannot enable preview", () => {
  for (const url of [
    "https://arc-hackathon-export.vercel.app/?ads=preview",
    "https://localhost.example.com/?ads=preview",
    "https://localhost@example.com/?ads=preview",
    "http://192.168.0.1/?ads=preview",
    "file:///arc-radar.html?ads=preview",
    "ftp://localhost/?ads=preview",
  ]) assert.equal(canPreviewAds(new URL(url)), false);
});

test("preview requires continuous visibility and does not accumulate hidden time", () => {
  const check = createVisibilityCheck();
  assert.deepEqual(check(0, true), { qualified: false, remaining: 1000 });
  assert.equal(check(900, true).qualified, false);
  assert.deepEqual(check(950, false), { qualified: false, remaining: null });
  assert.equal(check(3000, true).remaining, 1000);
  assert.equal(check(3999, true).qualified, false);
  assert.deepEqual(check(4000, true), { qualified: true, remaining: null });
  assert.deepEqual(check(6000, false), { qualified: true, remaining: null });
  assert.deepEqual(check(7000, true), { qualified: true, remaining: null });
});
