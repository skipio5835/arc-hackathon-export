import { encodeFunctionData, decodeFunctionResult } from "viem/utils";
import type { AbiFunction, Hex } from "viem";
import type { RadarNetwork } from "./arc-radar-networks.js";

export type AuthorityRow = {
  label: string;
  state: "returned" | "unavailable" | "unsupported";
  value: string;
  note: string;
  addresses?: string[];
};
export type AuthoritySnapshot = {
  address: string;
  chainId: number;
  checkedAt: number;
  block: { number: string; hash: string; timestamp: string } | null;
  abiAddresses: string[];
  rows: AuthorityRow[];
  notes: string[];
};

const addressPattern = /^0x[0-9a-f]{40}$/i;
const hashPattern = /^0x[0-9a-f]{64}$/i;
const quantityPattern = /^0x(?:0|[1-9a-f][0-9a-f]*)$/i;
const ZERO = `0x${"0".repeat(40)}`;
const MEMBER_LIMIT = 5;
const READS = [
  ["owner", "address", "Owner"],
  ["pendingOwner", "address", "Pending owner"],
  ["paused", "bool", "Paused flag"],
  ["cap", "uint256", "Supply cap"],
  ["totalSupply", "uint256", "Total supply"],
] as const;
const ROLES = ["DEFAULT_ADMIN_ROLE", "MINTER_ROLE"] as const;

// Only exact, standard read signatures from a verified explorer ABI are eligible.
export function matchingRead(abi: unknown[], name: string, inputs: string[], output: string): AbiFunction | null {
  return abi.find((item): item is AbiFunction => {
    if (!item || typeof item !== "object") return false;
    const entry = item as AbiFunction;
    return entry.type === "function" && entry.name === name && ["view", "pure"].includes(entry.stateMutability)
      && Array.isArray(entry.inputs) && entry.inputs.length === inputs.length
      && entry.inputs.every((parameter, index) => parameter?.type === inputs[index])
      && Array.isArray(entry.outputs) && entry.outputs.length === 1 && entry.outputs[0]?.type === output;
  }) ?? null;
}

function missing(label: string): AuthorityRow {
  return { label, state: "unsupported", value: "Not checked", note: "No matching read function in the available verified ABI. Other controls may exist." };
}

export async function readAuthoritySnapshot(network: RadarNetwork, address: string, fetcher: typeof fetch = fetch): Promise<AuthoritySnapshot> {
  if (!addressPattern.test(address)) throw new Error("Invalid token address.");
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 30_000);
  const snapshot: AuthoritySnapshot = { address, chainId: network.chainId, checkedAt: Date.now(), block: null,
    abiAddresses: [], rows: [], notes: [] };
  let requestId = 0;
  async function json(url: string, init?: RequestInit): Promise<any> {
    const response = await fetcher(url, { ...init, credentials: "omit", cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8_000)]) });
    if (!response.ok) throw new Error(`Read service returned HTTP ${response.status}.`);
    return response.json();
  }
  async function rpc(method: "eth_chainId" | "eth_getBlockByNumber" | "eth_call", params: unknown[]): Promise<any> {
    const id = ++requestId;
    const result = await json(network.rpcUrl, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) });
    if (result?.id !== id || result?.error || result?.result === undefined) throw new Error("RPC read failed or returned an invalid response.");
    return result.result;
  }
  try {
    const metadata = await json(`${network.apiBase}/addresses/${address}`);
    const implementations: string[] = Array.isArray(metadata?.implementations)
      ? [...new Set<string>(metadata.implementations.map((item: { address_hash?: string }) => item?.address_hash?.toLowerCase())
        .filter((value: unknown): value is string => typeof value === "string" && addressPattern.test(value)))] : [];
    const abi: unknown[] = [];
    const candidates = metadata?.is_verified === true ? [address] : [];
    if (implementations.length === 1 && implementations[0] !== address.toLowerCase()) {
      try {
        const implementation = await json(`${network.apiBase}/addresses/${implementations[0]}`);
        if (implementation?.is_verified === true) candidates.push(implementations[0]);
        else snapshot.notes.push("Implementation ABI is not verified in the explorer.");
      } catch { snapshot.notes.push("Implementation verification could not be fetched."); }
    }
    if (implementations.length > 1) snapshot.notes.push("Multiple implementations reported; implementation reads are not inferred.");
    for (const candidate of candidates) {
      try {
        const contract = await json(`${network.apiBase}/smart-contracts/${candidate}`);
        if (Array.isArray(contract?.abi) && contract.abi.length) {
          abi.push(...contract.abi);
          snapshot.abiAddresses.push(candidate);
        } else snapshot.notes.push("A verified ABI was unavailable.");
      } catch { snapshot.notes.push("An ABI request failed; coverage is incomplete."); }
    }
    if (metadata?.proxy_type || implementations.length) snapshot.notes.push("Proxy reads target the token address. The explorer's implementation mapping is not verified against proxy storage.");
    const hasReads = READS.some(([name, output]) => matchingRead(abi, name, [], output))
      || ROLES.some(name => matchingRead(abi, name, [], "bytes32"));
    if (!hasReads) {
      snapshot.rows = [...READS.map(([, , label]) => missing(label)), ...ROLES.map(missing)];
      snapshot.notes.push("No supported verified read signatures were available. No RPC state was inferred.");
      snapshot.checkedAt = Date.now();
      return snapshot;
    }
    const chain = await rpc("eth_chainId", []);
    if (typeof chain !== "string" || !quantityPattern.test(chain) || BigInt(chain) !== BigInt(network.chainId)) throw new Error("RPC chain ID does not match the selected network. No state is shown.");
    const block = await rpc("eth_getBlockByNumber", ["latest", false]);
    if (!block || !quantityPattern.test(block.number) || !quantityPattern.test(block.timestamp) || !hashPattern.test(block.hash)) throw new Error("RPC block metadata is unavailable.");
    const blockTime = Number(BigInt(block.timestamp)) * 1000;
    if (!Number.isFinite(blockTime) || Math.abs(Date.now() - blockTime) > 300_000) throw new Error("RPC block is too old or has an invalid timestamp. No current state is shown.");
    snapshot.block = { number: BigInt(block.number).toString(), hash: block.hash, timestamp: new Date(blockTime).toISOString() };

    async function read(fn: AbiFunction, args: unknown[] = []): Promise<string | bigint | boolean> {
      const data = encodeFunctionData({ abi: [fn], functionName: fn.name, args });
      const result = await rpc("eth_call", [{ to: address, data }, block.number]);
      // All supported outputs occupy one ABI word. Empty/malformed returns stay unknown.
      if (typeof result !== "string" || !hashPattern.test(result)) throw new Error("Invalid return data.");
      const value = decodeFunctionResult({ abi: [fn], functionName: fn.name, data: result as Hex });
      if (fn.outputs[0]?.type === "bool" && ![0n, 1n].includes(BigInt(result))) throw new Error("Invalid boolean.");
      if (typeof value !== "string" && typeof value !== "bigint" && typeof value !== "boolean") throw new Error("Unexpected return type.");
      return value;
    }
    // Sequential groups keep public RPC concurrency at most two, with no automatic retries.
    for (const [name, output, label] of READS) {
      const fn = matchingRead(abi, name, [], output);
      if (!fn) { snapshot.rows.push(missing(label)); continue; }
      try {
        const value = await read(fn);
        let note = `${name}() returned this value at the displayed block.`;
        if (output === "address") note = String(value).toLowerCase() === ZERO
          ? "Zero address returned. This does not prove all permissions were renounced."
          : "Reported by this getter; not a complete inventory of control.";
        if (output === "bool") note = "Reported pause flag only; not proof that transfers or sales will succeed.";
        if (output === "uint256") note = "Exact base units, not decimal-adjusted tokens. Does not prove a limit is enforced on every mint path.";
        snapshot.rows.push({ label, state: "returned", value: String(value), note,
          ...(output === "address" ? { addresses: [String(value)] } : {}) });
      } catch { snapshot.rows.push({ label, state: "unavailable", value: "Unavailable", note: "The read failed or returned invalid data. No zero/false value is assumed." }); }
    }
    const countFn = matchingRead(abi, "getRoleMemberCount", ["bytes32"], "uint256");
    const memberFn = matchingRead(abi, "getRoleMember", ["bytes32", "uint256"], "address");
    for (const name of ROLES) {
      const roleFn = matchingRead(abi, name, [], "bytes32");
      if (!roleFn) { snapshot.rows.push(missing(name)); continue; }
      try {
        const role = await read(roleFn);
        if (!countFn || !memberFn) {
          snapshot.rows.push({ label: name, state: "unsupported", value: "Members not enumerable",
            note: `Role ID ${role}. Member discovery is unavailable; holders are not assumed absent.` });
          continue;
        }
        const count = await read(countFn, [role]) as bigint;
        const limit = Number(count > BigInt(MEMBER_LIMIT) ? BigInt(MEMBER_LIMIT) : count);
        const members: string[] = [];
        let failed = 0;
        for (let index = 0; index < limit; index += 2) {
          await Promise.all(Array.from({ length: Math.min(2, limit - index) }, async (_, offset) => {
            try { members[index + offset] = String(await read(memberFn, [role, BigInt(index + offset)])); }
            catch { failed++; }
          }));
        }
        snapshot.rows.push({ label: name, state: failed ? "unavailable" : "returned",
          value: `${count} reported members`, addresses: members.filter(Boolean),
          note: `${members.filter(Boolean).length} of ${count} members read (limit ${MEMBER_LIMIT}).${failed ? ` ${failed} member reads failed.` : ""} Role membership does not establish which execution paths it controls.` });
      } catch { snapshot.rows.push({ label: name, state: "unavailable", value: "Unavailable", note: "Role or member count read failed. No empty role is assumed." }); }
    }
    const finalBlock = await rpc("eth_getBlockByNumber", [block.number, false]);
    if (finalBlock?.hash?.toLowerCase() !== block.hash.toLowerCase()) throw new Error("RPC block changed during the reads. Snapshot discarded; read again.");
    snapshot.checkedAt = Date.now();
    return snapshot;
  } finally { clearTimeout(deadline); }
}
