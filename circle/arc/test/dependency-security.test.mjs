import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const anchorRequire = createRequire(require.resolve("@coral-xyz/anchor"));
const tomlPath = anchorRequire.resolve("toml");
const toml = anchorRequire("toml");

test("patched TOML preserves Anchor configuration parsing, including Buffer input", () => {
  const config = `
[provider]
cluster = "localnet"
wallet = "./test-wallet.json"
[programs.localnet]
example = "11111111111111111111111111111111"
[workspace]
members = ["programs/example"]
[scripts]
test = "node --test"
`;
  for (const input of [config, Buffer.from(config)]) {
    const parsed = toml.parse(input);
    assert.equal(parsed.provider.cluster, "localnet");
    assert.equal(parsed.provider.wallet, "./test-wallet.json");
    assert.equal(parsed.programs.localnet.example, "11111111111111111111111111111111");
    assert.deepEqual(parsed.workspace.members, ["programs/example"]);
    assert.equal(parsed.scripts.test, "node --test");
  }
  assert.throws(() => toml.parse("[unclosed"));
});

// Isolate hostile fixtures so a parser regression cannot pollute or hang the test runner.
function assertIsolated(script) {
  const result = spawnSync(process.execPath, ["--input-type=commonjs", "-e", `
    const assert = require("node:assert/strict");
    const toml = require(${JSON.stringify(tomlPath)});
    ${script}
  `], { encoding: "utf8", timeout: 5000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
}

test("TOML rejects prototype pollution (GHSA-v5mp-jgw5-2x6j)", () => {
  assertIsolated(`
    const input = '[a.b]\\ny = 1\\n[a.b.y.__proto__.__proto__]\\narcrowPolluted = "yes"';
    assert.throws(() => toml.parse(input));
    assert.equal(Object.prototype.arcrowPolluted, undefined);
    assert.equal(({}).arcrowPolluted, undefined);
  `);
});

test("TOML bounds nested arrays before stack exhaustion (GHSA-82x6-q7mm-w9cf)", () => {
  assertIsolated(`
    const input = "value = " + "[".repeat(3000) + "0" + "]".repeat(3000);
    assert.throws(() => toml.parse(input), /Maximum nesting depth/);
    assert.equal(toml.parse("value = 1").value, 1);
  `);
});

test("Circle SDK and Anchor still load after dependency isolation", async () => {
  const { AppKit } = await import("@circle-fin/app-kit");
  const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");
  const anchor = require("@coral-xyz/anchor");
  assert.equal(typeof AppKit, "function");
  assert.equal(typeof createViemAdapterFromProvider, "function");
  assert.ok(anchor.workspace);
});

test("the lockfile removes vulnerable packages and resolves the supported workspace subsets", () => {
  const lock = JSON.parse(readFileSync(new URL("../../../package-lock.json", import.meta.url), "utf8"));
  for (const [name, pkg] of Object.entries(lock.packages)) {
    assert.doesNotMatch(name, /(?:^|\/)node_modules\/(?:elliptic|stream-json|@ethersproject\/(?:signing-key|abstract-signer|abstract-provider|transactions))$/);
    assert.notEqual(pkg.extraneous, true, name);
  }
  const abiRequire = createRequire(require.resolve("@ethersproject/abi"));
  const solanaRequire = createRequire(require.resolve("@solana/web3.js"));
  assert.equal(abiRequire("@ethersproject/hash/package.json").version, "5.8.0-arcrow.1");
  assert.equal(solanaRequire("jayson/package.json").version, "4.3.0-arcrow.1");
  assert.throws(() => solanaRequire("jayson"), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
  assert.throws(() => solanaRequire("jayson/lib/server"), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
});

test("all retained upstream JavaScript matches the reviewed integrity manifests", () => {
  function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(file) : [file];
    });
  }
  for (const folder of ["ethers-hash", "jayson-browser"]) {
    const root = fileURLToPath(new URL(`../vendor/${folder}/`, import.meta.url));
    const manifest = JSON.parse(readFileSync(path.join(root, "upstream.json"), "utf8"));
    const runtime = walk(root).filter((file) => /\.[cm]?js$/.test(file));
    assert.equal(runtime.length, Object.keys(manifest.files).length);
    for (const file of runtime) {
      const relative = path.relative(root, file).split(path.sep).join("/");
      const source = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
      assert.equal(createHash("sha256").update(source).digest("hex"), manifest.files[relative], relative);
    }
  }
});

test("subset declarations typecheck without skipping library checks", () => {
  const declarations = ["ethers-hash/lib/index.d.ts", "jayson-browser/lib/client/browser/index.d.ts"]
    .map((file) => fileURLToPath(new URL(`../vendor/${file}`, import.meta.url)));
  const result = spawnSync(process.execPath, [require.resolve("typescript/bin/tsc"),
    "--ignoreConfig", "--noEmit", "--strict", "--module", "nodenext",
    "--moduleResolution", "nodenext", "--skipLibCheck", "false", ...declarations,
  ], { encoding: "utf8", timeout: 15000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("retained ethers hashing and ABI encoding match ethers v6 test vectors", async () => {
  const legacy = require("@ethersproject/hash");
  const modern = await import("ethers");
  for (const text of ["", "ARCROW", "Arc testnet payment"]) {
    assert.equal(legacy.id(text), modern.id(text));
    assert.equal(legacy.hashMessage(text), modern.hashMessage(text));
  }
  assert.equal(legacy.namehash("arc.eth"), modern.namehash("arc.eth"));
  const domain = { name: "ARCROW", version: "1", chainId: 5042002, verifyingContract: "0x0000000000000000000000000000000000000001" };
  const types = { Payment: [{ name: "amount", type: "uint256" }, { name: "reference", type: "string" }] };
  const value = { amount: "1234567", reference: "test-invoice" };
  assert.equal(legacy._TypedDataEncoder.hash(domain, types, value), modern.TypedDataEncoder.hash(domain, types, value));
  assert.throws(() => legacy._TypedDataEncoder.hash(domain, types, { ...value, amount: "-1" }));
  const abi = ["function transfer(address to, uint256 amount) returns (bool)", "event Transfer(address indexed from, address indexed to, uint256 value)"];
  const oldInterface = new (require("@ethersproject/abi").Interface)(abi);
  const newInterface = new modern.Interface(abi);
  const args = [domain.verifyingContract, value.amount];
  assert.equal(oldInterface.encodeFunctionData("transfer", args), newInterface.encodeFunctionData("transfer", args));
  const log = newInterface.encodeEventLog(newInterface.getEvent("Transfer"), [args[0], args[0], args[1]]);
  assert.equal(oldInterface.parseLog(log).args.value.toString(), args[1]);
});

test("Jayson browser client preserves requests, notifications, batches and error propagation", async () => {
  const Client = require("jayson/lib/client/browser");
  let reply = (requests) => (Array.isArray(requests) ? requests : [requests]).map((request) => ({ jsonrpc: "2.0", id: request.id, result: 42 }));
  const client = new Client((message, callback) => {
    const request = JSON.parse(message);
    const responses = reply(request);
    callback(null, JSON.stringify(Array.isArray(request) ? responses : responses[0]));
  });
  const request = client.request("getSlot", []);
  assert.match(request.id, /^[0-9a-f-]{36}$/i);
  assert.equal(request.jsonrpc, "2.0");
  assert.equal(Object.hasOwn(client.request("notify", [], null), "id"), false);
  assert.throws(() => client.request(123, []), TypeError);
  const result = await new Promise((resolve, reject) => client.request("getSlot", [], (err, response) => err ? reject(err) : resolve(response)));
  assert.equal(result.result, 42);
  const batch = [request, client.request("getSlot", [])];
  const responses = await new Promise((resolve, reject) => client.request(batch, (err, response) => err ? reject(err) : resolve(response)));
  assert.deepEqual(responses.map((response) => response.id), batch.map((item) => item.id));
  reply = () => [{ jsonrpc: "2.0", id: request.id, error: { code: -32601, message: "Unknown method" } }];
  await new Promise((resolve) => client.request("badMethod", [], (err, response) => {
    assert.equal(err, null);
    assert.equal(response.error.code, -32601);
    resolve();
  }));
  for (const mode of ["malformed", "transport"]) {
    const bad = new Client((_message, callback) => mode === "transport" ? callback(new Error("Offline")) : callback(null, "{invalid"));
    await assert.rejects(new Promise((resolve, reject) => bad.request("getSlot", [], (err, response) => err ? reject(err) : resolve(response))));
  }
});

test("Solana's actual RPC client works with the subset without network access", async () => {
  const { Connection, PublicKey } = await import("@solana/web3.js");
  const methods = [];
  const connection = new Connection("http://rpc.invalid", {
    disableRetryOnRateLimit: true,
    fetch: async (_url, options) => {
      const body = JSON.parse(options.body);
      const response = (request) => {
        methods.push(request.method);
        const result = request.method === "getSlot" ? 123 : request.method === "getBalance" ? { context: { slot: 123 }, value: 99 } : null;
        return { jsonrpc: "2.0", id: request.id, result };
      };
      return new Response(JSON.stringify(Array.isArray(body) ? body.map(response) : response(body)), { status: 200 });
    },
  });
  assert.equal(await connection.getSlot(), 123);
  assert.equal(await connection.getBalance(new PublicKey("11111111111111111111111111111111")), 99);
  assert.deepEqual(await connection.getParsedTransactions(["test-signature-1", "test-signature-2"]), [null, null]);
  assert.deepEqual(methods, ["getSlot", "getBalance", "getTransaction", "getTransaction"]);
});

test("ARCROW's browser dependency graph excludes the flagged SDK dependencies", async () => {
  const { build } = await import("esbuild");
  const result = await build({
    entryPoints: [fileURLToPath(new URL("../src/arc-radar.ts", import.meta.url))],
    bundle: true,
    platform: "browser",
    format: "esm",
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  const paths = Object.keys(result.metafile.inputs).map((path) => path.replaceAll("\\", "/"));
  assert.ok(paths.some((path) => path.endsWith("/src/arc-radar.ts")));
  assert.deepEqual(paths.filter((path) => /(?:^|\/)node_modules\/(?:toml|stream-json|elliptic)\//.test(path)), []);
});
