import { formatEther, isAddress, keccak256, parseAbi, parseEther, toBytes } from "viem";
import type { Address, Hash } from "viem";

export const PUBLIC_INVOICE_CONTRACT = "0xda11c8b98f17164180eed93c4b62bc60407692d1" as Address;
export const INVOICE_STORAGE_KEY = "arcinvoice.browser.invoices.v1";
export const invoiceReadAbi = parseAbi([
  "function getInvoice(bytes32 invoiceId) view returns ((address merchant, address payer, uint256 amount, uint64 createdAt, uint64 paidAt, string metadataURI, uint8 status))",
]);

export type InvoiceStatus = "draft" | "registered" | "paid" | "cancelled";
export type Invoice = {
  id: string;
  chainInvoiceId: Hash;
  merchantName: string;
  merchantWallet: Address;
  customerName: string;
  customerEmail: string;
  description: string;
  amount: string;
  totalDue: string;
  dueDate: string;
  status: InvoiceStatus;
  contractAddress?: Address;
  registrationTxHash?: Hash;
  paymentTxHash?: Hash;
  cancellationTxHash?: Hash;
  payer?: Address;
  createdAt: string;
  updatedAt: string;
};

export type ChainInvoice = {
  merchant: Address;
  payer: Address;
  amount: bigint;
  createdAt: bigint;
  paidAt: bigint;
  metadataURI: string;
  status: number;
};

type StorageAccess = Pick<Storage, "getItem" | "setItem">;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const hashPattern = /^0x[0-9a-fA-F]{64}$/;
const statuses: InvoiceStatus[] = ["draft", "registered", "paid", "cancelled"];

function text(value: unknown): string {
  if (typeof value !== "string" || value.length > 240) throw new Error("Invoice text must be at most 240 characters.");
  return value.trim();
}

export function invoiceAmount(value: unknown): string {
  const amount = text(value);
  if (!/^\d{1,78}(\.\d{1,18})?$/.test(amount)) throw new Error("Enter a positive USDC amount with at most 18 decimals.");
  const units = parseEther(amount);
  if (units <= 0n || units >= 2n ** 256n) throw new Error("USDC amount is outside the supported range.");
  return formatEther(units);
}

function wallet(value: unknown): Address {
  if (typeof value !== "string" || !isAddress(value) || value.toLowerCase() === ZERO_ADDRESS) {
    throw new Error("Invoice requires a valid nonzero wallet or contract address.");
  }
  return value;
}

function hash(value: unknown): Hash {
  if (typeof value !== "string" || !hashPattern.test(value)) throw new Error("Invalid invoice or transaction hash.");
  return value as Hash;
}

export function validateInvoice(value: unknown): Invoice {
  if (!value || typeof value !== "object") throw new Error("Invalid invoice record.");
  const record = value as Record<string, unknown>;
  const id = text(record.id);
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) throw new Error("Invalid invoice ID.");
  const amount = invoiceAmount(record.amount);
  if (invoiceAmount(record.totalDue) !== amount) throw new Error("Invoice totals do not match.");
  if (!statuses.includes(record.status as InvoiceStatus)) throw new Error("Invalid invoice status.");
  const dueDate = text(record.dueDate);
  if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !Number.isFinite(Date.parse(dueDate)))) {
    throw new Error("Invalid invoice due date.");
  }
  const result: Invoice = {
    id, chainInvoiceId: hash(record.chainInvoiceId), merchantWallet: wallet(record.merchantWallet),
    merchantName: text(record.merchantName), customerName: text(record.customerName),
    customerEmail: text(record.customerEmail), description: text(record.description),
    amount, totalDue: amount, dueDate, status: record.status as InvoiceStatus,
    createdAt: text(record.createdAt), updatedAt: text(record.updatedAt),
  };
  for (const key of ["contractAddress", "payer"] as const) {
    if (record[key] !== undefined) result[key] = wallet(record[key]);
  }
  for (const key of ["registrationTxHash", "paymentTxHash", "cancellationTxHash"] as const) {
    if (record[key] !== undefined) result[key] = hash(record[key]);
  }
  if (result.status !== "draft" && !result.contractAddress) throw new Error("Registered invoice has no contract.");
  return result;
}

export function createInvoiceDraft(fields: Record<string, unknown>): Invoice {
  const id = `INV-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  return validateInvoice({
    ...fields, id, chainInvoiceId: keccak256(toBytes(id)), status: "draft",
    amount: fields.amount, totalDue: fields.amount, createdAt: now, updatedAt: now,
  });
}

export function readBrowserInvoices(storage: StorageAccess): Invoice[] {
  const raw = storage.getItem(INVOICE_STORAGE_KEY);
  if (raw === null) return [];
  if (raw.length > 1_000_000) throw new Error("Browser invoice history is too large.");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Browser invoice history is damaged; it has not been overwritten."); }
  if (!Array.isArray(parsed) || parsed.length > 100) throw new Error("Invalid browser invoice history.");
  const records = parsed.map(validateInvoice);
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error("Duplicate invoice IDs in browser history.");
  return records;
}

export function saveBrowserInvoice(storage: StorageAccess, invoice: Invoice): void {
  const valid = validateInvoice(invoice);
  const records = readBrowserInvoices(storage);
  const index = records.findIndex(record => record.id === valid.id);
  if (index < 0) {
    if (records.length >= 100) throw new Error("Browser history is full (100 invoices). Existing records were preserved.");
    records.unshift(valid);
  } else records[index] = valid;
  storage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(records));
}

// Share only the reviewed public demo deployment, never a contract supplied by a link.
export function invoiceShareUrl(page: string, invoice: Pick<Invoice, "chainInvoiceId" | "contractAddress">): URL {
  if (invoice.contractAddress?.toLowerCase() !== PUBLIC_INVOICE_CONTRACT) {
    throw new Error("Sharing is available only for the public demo contract.");
  }
  const url = new URL(page);
  url.search = "";
  url.hash = "";
  url.searchParams.set("chainInvoice", hash(invoice.chainInvoiceId));
  url.searchParams.set("contract", PUBLIC_INVOICE_CONTRACT);
  return url;
}

export function sharedInvoiceReference(page: string): { chainInvoiceId: Hash; contractAddress: Address } | null {
  const params = new URL(page).searchParams;
  if (!params.has("chainInvoice") && !params.has("contract")) return null;
  if (params.getAll("chainInvoice").length !== 1 || params.getAll("contract").length !== 1 ||
      params.get("contract")?.toLowerCase() !== PUBLIC_INVOICE_CONTRACT) {
    throw new Error("This link does not refer to the public ArcInvoice demo contract.");
  }
  return { chainInvoiceId: hash(params.get("chainInvoice")), contractAddress: PUBLIC_INVOICE_CONTRACT };
}

export function reconcileInvoice(invoice: Invoice, chain: ChainInvoice): Invoice {
  if (chain.status === 0) {
    if (invoice.status !== "draft") throw new Error("Invoice was not found on Arc Testnet. Cached status is not verified.");
    return invoice;
  }
  if (![1, 2, 3].includes(chain.status) || chain.merchant.toLowerCase() !== invoice.merchantWallet.toLowerCase() ||
      chain.amount !== parseEther(invoice.totalDue)) {
    throw new Error("On-chain merchant or amount does not match this invoice. No payment submitted.");
  }
  return validateInvoice({
    ...invoice, status: statuses[chain.status],
    payer: chain.status === 2 ? chain.payer : undefined, updatedAt: new Date().toISOString(),
  });
}

export function importChainInvoice(reference: { chainInvoiceId: Hash; contractAddress: Address }, chain: ChainInvoice): Invoice {
  if (![1, 2, 3].includes(chain.status)) throw new Error("Invoice was not found on Arc Testnet.");
  const amount = formatEther(chain.amount);
  const now = new Date().toISOString();
  return reconcileInvoice(validateInvoice({
    ...reference, id: `ARC-${reference.chainInvoiceId.slice(2)}`, merchantWallet: chain.merchant,
    merchantName: "On-chain merchant", customerName: "Not shared", customerEmail: "", description: "",
    amount, totalDue: amount, dueDate: "", status: "draft", createdAt: now, updatedAt: now,
  }), chain);
}
