import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";

type InvoiceStatus = "draft" | "registered" | "paid" | "cancelled";

type Invoice = {
  id: string;
  chainInvoiceId: `0x${string}`;
  merchantName: string;
  merchantWallet: `0x${string}`;
  customerName: string;
  customerEmail: string;
  description: string;
  amount: string;
  platformFee: string;
  totalDue: string;
  dueDate: string;
  status: InvoiceStatus;
  contractAddress?: `0x${string}`;
  registrationTxHash?: `0x${string}`;
  paymentTxHash?: `0x${string}`;
  cancellationTxHash?: `0x${string}`;
  payer?: `0x${string}`;
  createdAt: string;
  updatedAt: string;
};

const root = process.cwd();
const storePath = path.join(root, "artifacts", "arcinvoice-invoices.json");
const demoMerchant = "0x78131700be4a8f2d16eeb0cba3498d2e717f2cd3";

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload, null, 2));
}

function isAddress(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isHash(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

function cleanText(value: unknown, fallback = ""): string {
  return String(value ?? fallback).trim().slice(0, 240);
}

function cleanAmount(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!/^\d+(\.\d{1,6})?$/.test(text)) {
    throw new Error("Amount must be a positive decimal with up to 6 fractional digits.");
  }

  const amount = Number(text);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  return amount.toFixed(2);
}

function invoiceId(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `INV-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function chainInvoiceId(id: string): `0x${string}` {
  return `0x${createHash("sha256").update(id).digest("hex")}`;
}

function seedInvoices(): Invoice[] {
  const now = new Date().toISOString();
  const id = "INV-DEMO-ARC";
  return [
    {
      id,
      chainInvoiceId: chainInvoiceId(id),
      merchantName: "Nexus Studio",
      merchantWallet: demoMerchant,
      customerName: "Atlas Trading LLC",
      customerEmail: "ap@atlas.example",
      description: "Design sprint deposit for July launch assets",
      amount: "0.25",
      platformFee: "0.00",
      totalDue: "0.25",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function readStore(): Invoice[] {
  mkdirSync(path.dirname(storePath), { recursive: true });
  if (!existsSync(storePath)) {
    const seeded = seedInvoices();
    writeStore(seeded);
    return seeded;
  }

  return JSON.parse(readFileSync(storePath, "utf8")) as Invoice[];
}

function writeStore(invoices: Invoice[]): void {
  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(storePath, `${JSON.stringify(invoices, null, 2)}\n`);
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function createInvoice(payload: Record<string, unknown>): Invoice {
  const merchantWallet = payload.merchantWallet;
  if (!isAddress(merchantWallet)) {
    throw new Error("Merchant wallet must be a valid EVM address.");
  }

  const amount = cleanAmount(payload.amount);
  const id = invoiceId();
  const now = new Date().toISOString();
  return {
    id,
    chainInvoiceId: chainInvoiceId(id),
    merchantName: cleanText(payload.merchantName, "Merchant"),
    merchantWallet,
    customerName: cleanText(payload.customerName, "Customer"),
    customerEmail: cleanText(payload.customerEmail),
    description: cleanText(payload.description),
    amount,
    platformFee: "0.00",
    totalDue: amount,
    dueDate: cleanText(payload.dueDate, new Date().toISOString().slice(0, 10)),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

function patchInvoice(invoice: Invoice, payload: Record<string, unknown>): Invoice {
  const next = { ...invoice };

  if (payload.status) {
    const status = String(payload.status) as InvoiceStatus;
    if (!["draft", "registered", "paid", "cancelled"].includes(status)) {
      throw new Error("Unsupported invoice status.");
    }
    const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ["draft", "registered", "cancelled"],
      registered: ["registered", "paid", "cancelled"],
      paid: ["paid"],
      cancelled: ["cancelled"],
    };
    if (!allowedTransitions[invoice.status].includes(status)) {
      throw new Error(`Cannot move invoice from ${invoice.status} to ${status}.`);
    }
    next.status = status;
  }

  if (payload.contractAddress !== undefined) {
    if (!isAddress(payload.contractAddress)) throw new Error("Contract address must be valid.");
    next.contractAddress = payload.contractAddress;
  }

  if (payload.registrationTxHash !== undefined) {
    if (!isHash(payload.registrationTxHash)) throw new Error("Registration tx hash must be valid.");
    next.registrationTxHash = payload.registrationTxHash;
  }

  if (payload.paymentTxHash !== undefined) {
    if (!isHash(payload.paymentTxHash)) throw new Error("Payment tx hash must be valid.");
    next.paymentTxHash = payload.paymentTxHash;
  }

  if (payload.cancellationTxHash !== undefined) {
    if (!isHash(payload.cancellationTxHash)) throw new Error("Cancellation tx hash must be valid.");
    next.cancellationTxHash = payload.cancellationTxHash;
  }

  if (payload.payer !== undefined) {
    if (!isAddress(payload.payer)) throw new Error("Payer must be a valid EVM address.");
    next.payer = payload.payer;
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

export async function handleArcInvoiceApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/arcinvoice")) {
    return false;
  }

  try {
    const parts = url.pathname.split("/").filter(Boolean);
    const method = req.method ?? "GET";

    if (method === "GET" && parts[2] === "health") {
      sendJson(res, 200, { ok: true, store: storePath });
      return true;
    }

    if (parts[2] !== "invoices") {
      sendJson(res, 404, { error: "ArcInvoice endpoint not found." });
      return true;
    }

    const invoices = readStore();
    const invoiceIdParam = parts[3];

    if (method === "GET" && !invoiceIdParam) {
      const sorted = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      sendJson(res, 200, { invoices: sorted });
      return true;
    }

    if (method === "POST" && !invoiceIdParam) {
      const invoice = createInvoice(await readBody(req));
      writeStore([invoice, ...invoices]);
      sendJson(res, 201, invoice);
      return true;
    }

    const index = invoices.findIndex((invoice) => invoice.id === invoiceIdParam);
    if (index === -1) {
      sendJson(res, 404, { error: "Invoice not found." });
      return true;
    }

    if (method === "GET") {
      sendJson(res, 200, invoices[index]);
      return true;
    }

    if (method === "PATCH") {
      const updated = patchInvoice(invoices[index], await readBody(req));
      invoices[index] = updated;
      writeStore(invoices);
      sendJson(res, 200, updated);
      return true;
    }

    sendJson(res, 405, { error: "Method not allowed." });
    return true;
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "ArcInvoice API failed." });
    return true;
  }
}
