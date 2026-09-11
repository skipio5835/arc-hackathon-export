import assert from "node:assert/strict";
import test from "node:test";
import { buildProxyTarget } from "../scripts/proxy-target.js";

test("builds a Circle API target with the original path and query", () => {
  const target = buildProxyTarget(
    "/circle-api/v1/w3s/wallets?limit=10",
    "/circle-api",
    "https://api.circle.com",
    4173,
  );

  assert.equal(target.toString(), "https://api.circle.com/v1/w3s/wallets?limit=10");
});

test("protocol-relative paths cannot replace the Circle origin", () => {
  const target = buildProxyTarget(
    "/circle-api//evil.example/collect",
    "/circle-api",
    "https://api.circle.com",
    4173,
  );

  assert.equal(target.origin, "https://api.circle.com");
  assert.equal(target.pathname, "//evil.example/collect");
});

test("rejects a proxy base outside the explicit Circle allowlist", () => {
  assert.throws(
    () => buildProxyTarget("/circle-api/v1/test", "/circle-api", "https://evil.example", 4173),
    /Invalid proxy origin/,
  );
});

test("rejects a request that does not match the route prefix", () => {
  assert.throws(
    () => buildProxyTarget("/other/v1/test", "/circle-api", "https://api.circle.com", 4173),
    /Invalid proxy path/,
  );
});
