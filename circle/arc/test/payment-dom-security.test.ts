import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { formatUnits, isAddress } from "viem";

const payload = '<img src=x onerror="alert(1)"><a href="javascript:alert(1)">unsafe</a>';
const hash = `0x${"1".repeat(64)}`;
const address = `0x${"2".repeat(40)}`;

class DomNode {
  children: DomNode[] = [];
  dataset: Record<string, string> = {};
  listeners: Record<string, () => void> = {};
  className = "";
  href = "";
  rel = "";
  target = "";
  value = "";
  private text = "";
  classList = { add() {}, toggle() {} };
  constructor(readonly tag: string) {}
  get textContent(): string { return this.text + this.children.map(child => child.textContent).join(""); }
  set textContent(value: string) { this.text = String(value ?? ""); this.children = []; }
  set innerHTML(_value: string) { throw new Error("HTML parsing is forbidden in receipt/status rendering"); }
  append(...nodes: Array<DomNode | string>): void {
    for (const node of nodes) {
      if (typeof node === "string") { const text = new DomNode("#text"); text.textContent = node; this.children.push(text); }
      else if (node.tag === "#fragment") this.children.push(...node.children);
      else this.children.push(node);
    }
  }
  replaceChildren(...nodes: Array<DomNode | string>): void { this.text = ""; this.children = []; this.append(...nodes); }
  addEventListener(name: string, listener: () => void): void { this.listeners[name] = listener; }
  querySelectorAll(selector: string): DomNode[] {
    return this.children.flatMap(child => [
      ...(selector === "[data-key]" ? Object.hasOwn(child.dataset, "key") : child.tag === selector) ? [child] : [],
      ...child.querySelectorAll(selector),
    ]);
  }
}

function functions(file: string, names: string[]): string {
  const source = ts.createSourceFile(file, readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
  const found = source.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text ?? ""));
  assert.equal(found.length, names.length, file);
  return ts.transpileModule(found.map(node => node.getText(source)).join("\n"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function fixture(extra: Record<string, any> = {}): Record<string, any> {
  const document = {
    createElement: (tag: string) => new DomNode(tag),
    createTextNode: (value: string) => { const node = new DomNode("#text"); node.textContent = value; return node; },
    createDocumentFragment: () => new DomNode("#fragment"),
  };
  const exports: Record<string, any> = {};
  const helper = readFileSync(new URL("../src/dom-safety.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(helper, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { document, exports });
  return { document, URL, ...exports, ...extra };
}

test("all affected status renderers keep exception text literal and validate transaction links", () => {
  const files = ["arc-usage-billing", "arc-treasury-console", "arc-streaming-payroll", "arc-revenue-splitter", "arc-refundable-payment", "arc-pay-link", "arc-merchant-settlement"];
  for (const file of files) {
    const status = new DomNode("p");
    const context = fixture({ el: { status }, payload, hash });
    const script = functions(`${file}.ts`, ["setStatus"]);
    runInNewContext(`${script}\nsetStatus(payload, hash);`, context);
    assert.ok(status.textContent.startsWith(payload), file);
    assert.equal(status.querySelectorAll("img").length, 0);
    assert.equal(status.querySelectorAll("a")[0]?.href, `https://testnet.arcscan.app/tx/${hash}`);
    runInNewContext(`${script}\nsetStatus(payload, payload);`, context);
    assert.equal(status.querySelectorAll("a").length, 0, file);
    runInNewContext(`${script}\nsetStatus(payload);`, context);
    assert.equal(status.textContent, payload, file);
  }
});

test("invoice, escrow and subscription render stored strings as text and retain row selection", () => {
  for (const kind of ["invoice", "escrow", "subscription"]) {
    const rows = new DomNode("tbody"), receipt = new DomNode("dl");
    const record = {
      id: payload, status: payload, amount: "1", totalDue: "1", price: "1", periodDays: "7", cycles: 2,
      outcome: payload, customerName: payload, merchantName: payload, chainInvoiceId: payload,
      escrowId: payload, planId: payload, seller: payload, merchant: payload, paidThrough: payload,
      contractAddress: payload, fundingTxHash: payload, paymentTxHash: payload, subscribeTxHash: payload,
      metadataURI: payload, disputeURI: payload, evidenceURI: payload, resolutionURI: payload,
    };
    let selected = "", renders = 0;
    const el: Record<string, DomNode> = { receipt, selectedStatus: new DomNode("span"), invoiceCount: new DomNode("span"), paidVolume: new DomNode("span") };
    for (const name of ["invoiceRows", "escrowRows", "subscriptionRows"]) el[name] = rows;
    for (const name of ["stepDraft", "stepRegistered", "stepPaid"]) el[name] = new DomNode("span");
    const context = fixture({ el, invoices: [record], records: [record], selectedId: "", contractAddress: "",
      selectedInvoice: () => record, selectedRecord: () => record, statusClass: (s: string) => `status ${s}`,
      statusLabel: (s: string) => s, shortHash: (s: string) => s, selectInvoice: (id: string) => { selected = id; }, render: () => { renders++; },
    });
    runInNewContext(`${functions(`arc-${kind}.ts`, ["renderRows", "renderReceipt"])}\nrenderRows(); renderReceipt();`, context);
    assert.ok(rows.textContent.includes(payload));
    assert.ok(receipt.textContent.includes(payload));
    assert.equal(receipt.querySelectorAll("a").length, 0);
    assert.equal(rows.querySelectorAll("img").length, 0);
    const button = rows.querySelectorAll("button")[0]!;
    assert.equal(button.dataset.id, payload);
    button.listeners.click!();
    if (kind === "invoice") assert.equal(selected, payload);
    else { assert.equal(context.selectedId, payload); assert.equal(renders, 1); }
  }
});

test("empty receipts, contract summaries and valid explorer links still render", () => {
  for (const kind of ["invoice", "escrow", "subscription"]) {
    const el = { receipt: new DomNode("dl"), selectedStatus: new DomNode("span") };
    runInNewContext(`${functions(`arc-${kind}.ts`, ["renderReceipt"])}\nrenderReceipt();`, fixture({ el, selectedRecord: () => null, selectedInvoice: () => null }));
    assert.ok(el.receipt.textContent.includes("-"));
  }
  const el = { contractAddress: new DomNode("input"), contractSummary: new DomNode("div") };
  const context = fixture({ el, contractAddress: "", isAddress, shortHash: (s: string) => s });
  const script = functions("arc-invoice.ts", ["updateContractSummary"]);
  el.contractAddress.value = payload;
  runInNewContext(`${script}\nupdateContractSummary();`, context);
  assert.equal(el.contractSummary.textContent, "Not loaded");
  el.contractAddress.value = address;
  runInNewContext(`${script}\nupdateContractSummary();`, context);
  assert.equal(el.contractSummary.querySelectorAll("a")[0]?.href, `https://testnet.arcscan.app/address/${address}`);
});

test("treasury and merchant ledgers cannot interpret stored hashes or references as markup", () => {
  const record = { token: payload, amount: payload, recipient: payload, hash: payload, createdAt: "2026-09-11", at: "2026-09-11", kind: payload, reference: payload, counterparty: payload };
  for (const [file, name, target] of [["arc-treasury-console.ts", "renderActivity", "activity"], ["arc-merchant-settlement.ts", "renderLedger", "ledger"]]) {
    const list = new DomNode("ul");
    const context = fixture({ el: { [target!]: list }, readStoredArray: () => [record], ledger: () => [record], activityKey: "fixture" });
    runInNewContext(`${functions(file!, [name!])}\n${name}();`, context);
    assert.ok(list.textContent.includes(payload));
    assert.equal(list.querySelectorAll("a").length, 0);
    assert.equal(list.querySelectorAll("img").length, 0);
  }
});

test("CCTP receipts preserve incremental state and destination-specific transaction links", () => {
  const el = { receipt: new DomNode("div"), amount: new DomNode("input") };
  el.amount.value = payload;
  const context = fixture({ el, payload, hash, USDC_DECIMALS: 6, formatUnits,
    selectedDestination: () => "Ethereum_Sepolia",
    chains: { Arc_Testnet: { explorerUrl: "https://testnet.arcscan.app" }, Ethereum_Sepolia: { explorerUrl: "https://sepolia.etherscan.io" } },
  });
  const script = functions("raw-cctp.ts", ["chainExplorerTx", "txLink", "renderReceipt"]);
  runInNewContext(`${script}\nrenderReceipt({burnTx:hash,eventNonce:payload,message:payload,attestationStatus:payload}); renderReceipt({mintTx:hash});`, context);
  assert.ok(el.receipt.textContent.includes(payload));
  assert.equal(el.receipt.querySelectorAll("img").length, 0);
  assert.deepEqual(el.receipt.querySelectorAll("a").map(node => node.href), [`https://testnet.arcscan.app/tx/${hash}`, `https://sepolia.etherscan.io/tx/${hash}`]);
  assert.equal(el.receipt.querySelectorAll("[data-key]").find(node => node.dataset.key === "message")?.dataset.value, payload);
});

test("standalone token transfer errors reject off-site and executable explorer links", () => {
  const html = readFileSync(new URL("../public/skipio-transfer.html", import.meta.url), "utf8");
  const source = ts.createSourceFile("inline.js", [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n"), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const fn = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === "setStatus")!;
  const status = new DomNode("p");
  for (const link of ["javascript:alert(1)", `https://evil.example/tx/${hash}`, `https://testnet.arcscan.app.evil.example/tx/${hash}`, `https://testnet.arcscan.app/tx/${payload}`, `https://testnet.arcscan.app/tx/${hash}?evil=1`]) {
    runInNewContext(`${fn.getText(source)}\nsetStatus(payload, link);`, fixture({ el: { status }, payload, link }));
    assert.equal(status.textContent, payload);
    assert.equal(status.querySelectorAll("a").length, 0);
  }
  runInNewContext(`${fn.getText(source)}\nsetStatus(payload, link);`, fixture({ el: { status }, payload, link: `https://testnet.arcscan.app/tx/${hash}` }));
  assert.equal(status.querySelectorAll("a").length, 1);
});

test("CCTP fee responses render untrusted fields without parsing HTML", () => {
  const el = { feesBox: new DomNode("div") };
  runInNewContext(`${functions("raw-cctp.ts", ["renderFees"])}\nrenderFees([{minimumFee:payload,finalityThreshold:1000}], {finalityThreshold:payload}, 100n);`,
    fixture({ el, payload, formatUnits, USDC_DECIMALS: 6 }));
  assert.ok(el.feesBox.textContent.includes(payload));
  assert.equal(el.feesBox.querySelectorAll("img").length, 0);
  assert.ok(el.feesBox.textContent.includes("0.0001 USDC"));
});

test("usage billing accepts only a valid public address without persisting typed input", () => {
  const el = { contract: new DomNode("input") };
  const messages: string[] = [];
  const context = fixture({ el, contract: "", isAddress, setStatus: (s: string) => messages.push(s), localStorage: { setItem() { throw new Error("Must not persist user input"); } } });
  const script = functions("arc-usage-billing.ts", ["useContract"]);
  el.contract.value = payload;
  assert.throws(() => runInNewContext(`${script}\nuseContract();`, context), /valid contract address/);
  assert.equal(context.contract, "");
  el.contract.value = address;
  runInNewContext(`${script}\nuseContract();`, context);
  assert.equal(context.contract, address);
  assert.match(messages[0]!, /this session/);
});
