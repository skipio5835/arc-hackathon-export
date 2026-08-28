import type { EIP1193Provider } from "viem";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character] ?? character);
}

export function readStoredArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

export function validTokenAmount(value: string, decimals = 6): boolean {
  return new RegExp(`^(?:0|[1-9]\\d*)(?:\\.\\d{1,${decimals}})?$`).test(value) && Number(value) > 0;
}

export function safeExplorerUrl(value: string | undefined, fallback: string, allowedHost: string): string {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.host === allowedHost ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export async function assertWalletContext(
  provider: EIP1193Provider,
  expectedChainId: string,
  expectedAccount: string,
): Promise<void> {
  const [chainId, accounts] = await Promise.all([
    provider.request({ method: "eth_chainId" }) as Promise<string>,
    provider.request({ method: "eth_accounts" }) as Promise<string[]>,
  ]);
  if (chainId.toLowerCase() !== expectedChainId.toLowerCase()) throw new Error("Switch MetaMask to Arc Testnet.");
  if (!accounts[0] || accounts[0].toLowerCase() !== expectedAccount.toLowerCase()) {
    throw new Error("The active MetaMask account changed. Reconnect the wallet.");
  }
}
