const ARC_SCAN_ORIGIN = "https://testnet.arcscan.app";
const ARC_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const ARC_TRANSACTION_PATTERN = /^0x[a-fA-F0-9]{64}$/;

type SafeContent = Node | string;

function appendContent(parent: Element, content: SafeContent): void {
  parent.append(typeof content === "string" ? document.createTextNode(content) : content);
}

export function arcScanLink(path: "address" | "tx", value: string, label = value): HTMLAnchorElement | Text {
  const isValid = path === "address" ? ARC_ADDRESS_PATTERN.test(value) : ARC_TRANSACTION_PATTERN.test(value);
  if (!isValid) {
    return document.createTextNode(label);
  }

  const anchor = document.createElement("a");
  const encodedValue = encodeURIComponent(value);
  anchor.href = path === "address"
    ? `${ARC_SCAN_ORIGIN}/address/${encodedValue}`
    : `${ARC_SCAN_ORIGIN}/tx/${encodedValue}`;
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  anchor.textContent = label;
  return anchor;
}

export function renderStatus(container: HTMLElement, message: string, hash?: string, linkLabel = "ArcScan"): void {
  container.replaceChildren(document.createTextNode(message));
  if (!hash) return;

  container.append(document.createTextNode(" "), arcScanLink("tx", hash, linkLabel));
}

export function codeValue(value: string): HTMLElement {
  const code = document.createElement("code");
  code.textContent = value;
  return code;
}

export function receiptField(label: string, value: SafeContent): HTMLDivElement {
  const row = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  appendContent(description, value);
  row.append(term, description);
  return row;
}

export function tableCell(value: SafeContent): HTMLTableCellElement {
  const cell = document.createElement("td");
  appendContent(cell, value);
  return cell;
}
