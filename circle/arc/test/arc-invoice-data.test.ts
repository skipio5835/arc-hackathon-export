import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { parseEther } from "viem";
import {
  INVOICE_STORAGE_KEY, PUBLIC_INVOICE_CONTRACT, createInvoiceDraft, importChainInvoice,
  invoiceAmount, invoiceShareUrl, readBrowserInvoices, reconcileInvoice, saveBrowserInvoice,
  sharedInvoiceReference, validateInvoice,
} from "../src/arc-invoice-data.js";
import type { ChainInvoice } from "../src/arc-invoice-data.js";

const merchant = `0x${"1".repeat(40)}` as const;
const txHash = `0x${"2".repeat(64)}` as const;
const fields = {
  merchantName: "Test merchant", merchantWallet: merchant, customerName: "Test customer",
  customerEmail: "fictional@example.invalid", description: "Browser-only note", amount: "0.000001", dueDate: "2026-09-15",
};
function memory() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
function registered() { return { ...createInvoiceDraft(fields), contractAddress: PUBLIC_INVOICE_CONTRACT }; }
function chain(status = 1): ChainInvoice {
  return { merchant, payer: merchant, amount: parseEther(fields.amount), createdAt: 1n, paidAt: 0n, metadataURI: "https://untrusted.invalid/private", status };
}

test("invoice amounts preserve native USDC precision and reject rounding, overflow and invalid values", () => {
  assert.equal(invoiceAmount("0.000001"), "0.000001");
  assert.equal(invoiceAmount("0.000000000000000001"), "0.000000000000000001");
  assert.equal(invoiceAmount("01.2300"), "1.23");
  for (const value of ["0", "-1", "1e3", "NaN", "Infinity", "0.0000000000000000001", "9".repeat(79), (2n ** 256n).toString()]) {
    assert.throws(() => invoiceAmount(value), Error, value);
  }
});

test("browser drafts are independent, retain precision and whitelist fields", () => {
  const storage = memory();
  const draft = createInvoiceDraft({ ...fields, apiKey: "not-a-real-key" });
  assert.notEqual(draft.chainInvoiceId, createInvoiceDraft(fields).chainInvoiceId);
  assert.equal(draft.status, "draft");
  saveBrowserInvoice(storage, draft);
  assert.deepEqual(readBrowserInvoices(storage), [draft]);
  assert.ok(!storage.getItem(INVOICE_STORAGE_KEY)?.includes("apiKey"));
  assert.deepEqual(readBrowserInvoices(memory()), []);
  saveBrowserInvoice(storage, { ...draft, description: "Updated" });
  assert.equal(readBrowserInvoices(storage).length, 1);
  assert.equal(readBrowserInvoices(storage)[0]?.description, "Updated");
});

test("invalid or damaged history cannot silently replace existing records", () => {
  const storage = memory();
  for (const raw of ["{broken", "{}", JSON.stringify([{}]), "x".repeat(1_000_001)]) {
    storage.setItem(INVOICE_STORAGE_KEY, raw);
    assert.throws(() => readBrowserInvoices(storage));
    assert.throws(() => saveBrowserInvoice(storage, createInvoiceDraft(fields)));
    assert.equal(storage.getItem(INVOICE_STORAGE_KEY), raw);
  }
  assert.throws(() => readBrowserInvoices({ ...storage, getItem() { throw new Error("blocked"); } }), /blocked/);
  assert.throws(() => saveBrowserInvoice({ getItem: () => null, setItem() { throw new Error("quota"); } }, createInvoiceDraft(fields)), /quota/);
});

test("history limit preserves all existing records and permits updating them", () => {
  const storage = memory();
  const drafts = Array.from({ length: 100 }, () => createInvoiceDraft(fields));
  for (const draft of drafts) saveBrowserInvoice(storage, draft);
  assert.throws(() => saveBrowserInvoice(storage, createInvoiceDraft(fields)), /full/);
  saveBrowserInvoice(storage, { ...drafts[0]!, description: "Updated" });
  assert.equal(readBrowserInvoices(storage).length, 100);
});

test("stored addresses, hashes, totals, statuses and oversized text are validated", () => {
  const draft = createInvoiceDraft(fields);
  for (const patch of [
    { merchantWallet: "0x" + "0".repeat(40) }, { merchantWallet: "javascript:alert(1)" },
    { chainInvoiceId: "x" }, { totalDue: "2" }, { status: "paid" }, { status: "forged" },
    { contractAddress: "bad" }, { registrationTxHash: "bad" }, { description: "x".repeat(241) },
    { dueDate: "not-a-date" },
  ]) assert.throws(() => validateInvoice({ ...draft, ...patch }));
});

test("sharing contains only an allowlisted contract and chain ID, never private metadata", () => {
  const draft = registered();
  const url = invoiceShareUrl("https://demo.example/invoice.html?customer=private#secret", draft);
  assert.deepEqual([...url.searchParams.keys()], ["chainInvoice", "contract"]);
  assert.equal(url.hash, "");
  assert.deepEqual(sharedInvoiceReference(url.href), { chainInvoiceId: draft.chainInvoiceId, contractAddress: PUBLIC_INVOICE_CONTRACT });
  assert.throws(() => invoiceShareUrl(url.href, { ...draft, contractAddress: merchant }), /public demo/);
  assert.throws(() => sharedInvoiceReference(url.href + "&contract=" + merchant), /public/);
  assert.throws(() => sharedInvoiceReference("https://demo.example/?chainInvoice=invalid&contract=" + PUBLIC_INVOICE_CONTRACT));
  assert.throws(() => sharedInvoiceReference("https://demo.example/?contract=" + merchant));
  assert.equal(sharedInvoiceReference("https://demo.example/"), null);
});

test("a clean browser reconstructs a shared invoice from chain state without fetching metadata", () => {
  const draft = registered();
  const imported = importChainInvoice({ chainInvoiceId: draft.chainInvoiceId, contractAddress: PUBLIC_INVOICE_CONTRACT }, chain(2));
  assert.equal(imported.status, "paid");
  assert.equal(imported.totalDue, fields.amount);
  assert.equal(imported.merchantWallet, merchant);
  assert.equal(imported.customerEmail, "");
  assert.equal(imported.description, "");
  assert.ok(!JSON.stringify(imported).includes("untrusted.invalid"));
  assert.throws(() => importChainInvoice({ chainInvoiceId: draft.chainInvoiceId, contractAddress: PUBLIC_INVOICE_CONTRACT }, chain(0)), /not found/);
});

test("chain reconciliation overrides cached status and rejects merchant or amount mismatches", () => {
  const draft = registered();
  assert.equal(reconcileInvoice(draft, chain(0)).status, "draft");
  assert.equal(reconcileInvoice(draft, chain(1)).status, "registered");
  const paid = reconcileInvoice(draft, chain(2));
  assert.equal(paid.status, "paid");
  assert.equal(reconcileInvoice(paid, chain(1)).status, "registered");
  assert.equal(reconcileInvoice(draft, chain(3)).status, "cancelled");
  assert.throws(() => reconcileInvoice(paid, chain(0)), /not found/);
  assert.throws(() => reconcileInvoice(draft, { ...chain(), amount: 1n }), /does not match/);
  assert.throws(() => reconcileInvoice(draft, { ...chain(), merchant: PUBLIC_INVOICE_CONTRACT }), /does not match/);
  assert.throws(() => reconcileInvoice(draft, chain(9)), /does not match/);
});

function productionFunction(name: string): string {
  const file = new URL("../src/arc-invoice.ts", import.meta.url);
  const source = ts.createSourceFile(file.pathname, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const node = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(node, name);
  return ts.transpileModule(node.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}

test("actual payment targets the invoice contract, blocks stale state, and never confirms a reverted receipt", async () => {
  for (const outcome of ["success", "reverted", "stale", "wallet-changed", "rpc-down"] as const) {
    const invoice = reconcileInvoice(registered(), chain());
    const statuses: string[] = [];
    const writes: Array<Record<string, unknown>> = [];
    let reads = 0;
    const context = {
      invoiceBusy: false, selectedInvoice: () => invoice, account: merchant, contractAddress: merchant,
      walletClient: { writeContract: async (request: Record<string, unknown>) => { writes.push(request); return txHash; } },
      publicClient: { waitForTransactionReceipt: async () => ({ status: outcome }) },
      assertInvoiceWallet: async () => { if (outcome === "wallet-changed") throw new Error("Wallet changed"); },
      syncInvoice: async () => { reads++; if (outcome === "rpc-down") throw new Error("RPC unavailable"); return { ...invoice, status: outcome === "stale" ? "paid" : "registered" }; },
      rememberInvoice: () => {}, refreshBalance: async () => {}, refreshSelectedInvoice: async () => {},
      updateActions: () => {}, renderInvoiceState: () => {}, setStatus: (message: string) => statuses.push(message),
      errorMessage: (error: Error) => error.message, parseEther, arcInvoiceAbi: [], arcTestnet: { id: 5042002 },
    };
    await runInNewContext(`${productionFunction("payInvoice")}\npayInvoice();`, context);
    assert.equal(context.invoiceBusy, false);
    if (["stale", "wallet-changed", "rpc-down"].includes(outcome)) assert.equal(writes.length, 0);
    else {
      assert.equal(writes[0]?.address, invoice.contractAddress);
      assert.equal(writes[0]?.value, parseEther(invoice.totalDue));
      assert.equal(reads, outcome === "success" ? 2 : 1);
    }
    assert.equal(statuses.some(message => message.startsWith("Payment confirmed:")), outcome === "success");
    if (outcome === "reverted") assert.ok(statuses.some(message => message.includes(txHash) && message.includes("reverted")));
  }
});

test("public invoice source no longer references a nonexistent API or publishes customer metadata", () => {
  const source = readFileSync(new URL("../src/arc-invoice.ts", import.meta.url), "utf8");
  assert.ok(!source.includes("/api/arcinvoice"));
  assert.ok(source.includes("urn:arcinvoice:"));
  assert.ok(!source.includes('localStorage.getItem("arcinvoice.contractAddress")'));
  assert.match(source, /receipt\.status !== "success"/);
});
