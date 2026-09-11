import assert from "node:assert/strict";
import test from "node:test";
import { decodeFunctionData, encodeFunctionResult, parseAbi, type Hex } from "viem";
import { matchingRead, readAuthoritySnapshot } from "../src/arc-radar-authority.js";
import { ARC_RADAR_TESTNET as network } from "../src/arc-radar-networks.js";

const token = `0x${"1".repeat(40)}`;
const implementation = `0x${"2".repeat(40)}`;
const member = `0x${"3".repeat(40)}`;
const zero = `0x${"0".repeat(40)}`;
const hash = `0x${"4".repeat(64)}`;
const abi = parseAbi([
  "function owner() view returns (address)", "function pendingOwner() view returns (address)",
  "function paused() view returns (bool)", "function cap() view returns (uint256)",
  "function totalSupply() view returns (uint256)", "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function MINTER_ROLE() view returns (bytes32)", "function getRoleMemberCount(bytes32) view returns (uint256)",
  "function getRoleMember(bytes32,uint256) view returns (address)",
]);
function fixture(options: {
  verified?: boolean; impl?: boolean; implVerified?: boolean; abi?: unknown[]; chain?: string;
  oldBlock?: boolean; reorg?: boolean; failure?: string; malformed?: string; count?: bigint;
  abiFailure?: boolean; failedMember?: boolean;
} = {}) {
  const requests: Array<{ url: string; method?: string; params?: any[] }> = [];
  const values: Record<string, unknown> = { owner: zero, pendingOwner: member, paused: false,
    cap: (2n ** 255n) + 1n, totalSupply: 0n, DEFAULT_ADMIN_ROLE: `0x${"0".repeat(64)}`,
    MINTER_ROLE: hash, getRoleMemberCount: options.count ?? 0n, getRoleMember: member };
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(init?.credentials, "omit");
    assert.equal(init?.cache, "no-store");
    assert.ok(init?.signal);
    const request = init?.body ? JSON.parse(String(init.body)) : null;
    requests.push({ url: String(url), method: request?.method, params: request?.params });
    const response = (result: unknown) => new Response(JSON.stringify(request ? { id: request.id, jsonrpc: "2.0", result } : result));
    if (!request) {
      if (String(url).includes("smart-contracts")) return options.abiFailure ? new Response("", { status: 503 }) : response({ abi: options.abi ?? abi });
      return response({ is_verified: String(url).endsWith(implementation) ? options.implVerified !== false : options.verified !== false,
        implementations: options.impl && String(url).endsWith(token) ? [{ address_hash: implementation }] : [] });
    }
    if (request.method === "eth_chainId") return response(options.chain ?? `0x${network.chainId.toString(16)}`);
    if (request.method === "eth_getBlockByNumber") return response({ number: "0x123", hash: options.reorg && request.params[0] !== "latest" ? `0x${"5".repeat(64)}` : hash,
      timestamp: `0x${Math.floor(Date.now() / 1000 - (options.oldBlock ? 600 : 0)).toString(16)}` });
    assert.equal(request.method, "eth_call", "No transaction or signing methods allowed");
    assert.equal(request.params[0].to, token, "Read proxy/token storage, never implementation storage");
    assert.equal(request.params[1], "0x123", "Every read uses the same block");
    assert.equal(request.params[0].from, undefined, "No account needed");
    const decoded = decodeFunctionData({ abi, data: request.params[0].data as Hex });
    if (options.failure === decoded.functionName || (options.failedMember && decoded.functionName === "getRoleMember" && decoded.args?.[1] === 1n)) {
      return new Response(JSON.stringify({ id: request.id, error: { code: -32000, message: "Execution reverted" } }));
    }
    if (options.malformed === decoded.functionName) return response("0x");
    return response(encodeFunctionResult({ abi, functionName: decoded.functionName, result: values[decoded.functionName] as never }));
  };
  return { fetcher, requests };
}

test("reads exact values at one block without treating zero owner/false pause as safety", async () => {
  const mock = fixture();
  const result = await readAuthoritySnapshot(network, token, mock.fetcher);
  assert.equal(result.block?.number, "291");
  assert.equal(result.block?.hash, hash);
  assert.equal(result.rows.find(row => row.label === "Owner")?.value, zero);
  assert.match(result.rows.find(row => row.label === "Owner")!.note, /does not prove/);
  assert.equal(result.rows.find(row => row.label === "Paused flag")?.value, "false");
  assert.equal(result.rows.find(row => row.label === "Supply cap")?.value, ((2n ** 255n) + 1n).toString());
  assert.match(result.rows.find(row => row.label === "Supply cap")!.note, /base units/);
  assert.equal(result.rows.find(row => row.label === "MINTER_ROLE")?.value, "0 reported members");
  assert.ok(mock.requests.length <= 26);
});

test("no verified ABI means no guessed selectors or RPC calls", async () => {
  const mock = fixture({ verified: false });
  const result = await readAuthoritySnapshot(network, token, mock.fetcher);
  assert.equal(result.block, null);
  assert.ok(result.rows.every(row => row.state === "unsupported"));
  assert.equal(mock.requests.length, 1);
});

test("ABI fetch failure remains explicit and never becomes a clean result", async () => {
  const mock = fixture({ abiFailure: true });
  const result = await readAuthoritySnapshot(network, token, mock.fetcher);
  assert.equal(result.block, null);
  assert.match(result.notes.join(" "), /request failed/);
  assert.ok(result.rows.every(row => row.state === "unsupported"));
});

test("exact getter signatures required, not name-only or mutating overloads", () => {
  const owner = abi[0];
  assert.ok(matchingRead([...abi], "owner", [], "address"));
  for (const invalid of [{ ...owner, stateMutability: "nonpayable" }, { ...owner, inputs: [{ type: "address" }] },
    { ...owner, outputs: [{ type: "bytes32" }] }, { type: "function", name: "owner" }, null]) {
    assert.equal(matchingRead([invalid], "owner", [], "address"), null);
  }
  assert.ok(matchingRead([{ ...owner, inputs: [{ type: "address" }] }, owner], "owner", [], "address"));
});

test("verified implementation ABI is read at the proxy address; unverified implementation is skipped", async () => {
  const mock = fixture({ impl: true, verified: false });
  const result = await readAuthoritySnapshot(network, token, mock.fetcher);
  assert.deepEqual(result.abiAddresses, [implementation]);
  assert.match(result.notes.join(" "), /not verified against proxy storage/);
  const skipped = fixture({ impl: true, verified: false, implVerified: false });
  assert.equal((await readAuthoritySnapshot(network, token, skipped.fetcher)).block, null);
  assert.equal(skipped.requests.filter(request => request.method).length, 0);
});

test("wrong network, stale block and changed block discard snapshot", async () => {
  for (const [options, pattern] of [[{ chain: "0x1" }, /chain ID/], [{ oldBlock: true }, /too old/], [{ reorg: true }, /Snapshot discarded/]] as const) {
    const mock = fixture(options);
    await assert.rejects(readAuthoritySnapshot(network, token, mock.fetcher), pattern);
    if (!options.reorg) assert.equal(mock.requests.filter(request => request.method === "eth_call").length, 0);
  }
});

test("failed and empty getter returns are unknown, distinct from genuine false/zero", async () => {
  const mock = fixture({ failure: "owner", malformed: "paused" });
  const result = await readAuthoritySnapshot(network, token, mock.fetcher);
  for (const label of ["Owner", "Paused flag"]) {
    assert.equal(result.rows.find(row => row.label === label)?.state, "unavailable");
    assert.equal(result.rows.find(row => row.label === label)?.value, "Unavailable");
  }
  assert.equal(result.rows.find(row => row.label === "Total supply")?.value, "0");
});

test("roles without enumeration never imply no members", async () => {
  const mock = fixture({ abi: abi.filter(fn => !fn.name.startsWith("getRole")) });
  const result = await readAuthoritySnapshot(network, token, mock.fetcher);
  assert.equal(result.rows.find(row => row.label === "MINTER_ROLE")?.value, "Members not enumerable");
  assert.match(result.rows.find(row => row.label === "MINTER_ROLE")!.note, /not assumed absent/);
});

test("enumeration has a five-member cap per role and reports partial failures", async () => {
  const mock = fixture({ count: 100n, failedMember: true });
  const result = await readAuthoritySnapshot(network, token, mock.fetcher);
  const role = result.rows.find(row => row.label === "MINTER_ROLE")!;
  assert.equal(role.value, "100 reported members");
  assert.equal(role.state, "unavailable");
  assert.equal(role.addresses?.length, 4);
  assert.match(role.note, /4 of 100 members read/);
  assert.match(role.note, /1 member reads failed/);
  assert.ok(mock.requests.length <= 26);
});

test("invalid target fails before any network request", async () => {
  const mock = fixture();
  await assert.rejects(readAuthoritySnapshot(network, "https://example.com", mock.fetcher), /Invalid token/);
  assert.equal(mock.requests.length, 0);
});
