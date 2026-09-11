import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { ARC_RADAR_TESTNET } from "../src/arc-radar-networks.js";

const root = new URL("../../../", import.meta.url);

test("public ARCROW CSP allows only its configured read endpoints", () => {
  const config = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));
  const rule = config.headers.find((entry: any) => entry.source === "/circle/arc/public/arc-radar.html");
  const policy = rule.headers.find((entry: any) => entry.key === "Content-Security-Policy").value as string;
  const directives = new Map(policy.split(";").map(part => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values] as const;
  }));
  assert.deepEqual(directives.get("connect-src"), [
    new URL(ARC_RADAR_TESTNET.apiBase).origin,
    new URL(ARC_RADAR_TESTNET.rpcUrl).origin,
  ]);
  assert.deepEqual(directives.get("script-src"), ["'self'"]);
  assert.deepEqual(directives.get("object-src"), ["'none'"]);
  assert.deepEqual(directives.get("frame-ancestors"), ["'none'"]);
});

test("ARCROW assets and existing submission entry points remain available", () => {
  for (const file of ["index.html", "docs/arc-hackathon-presentation.pptx", "docs/media/arc-hackathon-demo.webm"]) {
    assert.ok(existsSync(new URL(file, root)), file);
  }
  const page = new URL("circle/arc/public/arc-radar.html", root);
  const html = readFileSync(page, "utf8");
  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g)].map(match => match[1]);
  for (const file of ["./arc-radar-theme.js", "./arc-radar-theme.css", "./arc-radar.bundle.js", "./assets/arcrow-mark.png"]) {
    assert.ok(paths.includes(file), file);
  }
  for (const file of paths) assert.ok(existsSync(new URL(file, page)), file);
});
