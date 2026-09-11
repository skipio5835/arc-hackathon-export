const ALLOWED_PROXY_ORIGINS = new Set([
  "https://api.circle.com",
  "https://gateway-api.circle.com",
  "https://gateway-api-testnet.circle.com",
  "https://iris-api.circle.com",
  "https://iris-api-sandbox.circle.com",
]);

export function buildProxyTarget(requestUrl: string, prefix: string, baseUrl: string, localPort: number): URL {
  const incomingUrl = new URL(requestUrl, `http://localhost:${localPort}`);
  if (incomingUrl.pathname !== prefix && !incomingUrl.pathname.startsWith(`${prefix}/`)) {
    throw new Error("Invalid proxy path");
  }

  const base = new URL(baseUrl);
  if (base.protocol !== "https:" || !ALLOWED_PROXY_ORIGINS.has(base.origin)) {
    throw new Error("Invalid proxy origin");
  }

  const targetPath = incomingUrl.pathname.slice(prefix.length) || "/";
  const targetUrl = new URL(base);
  targetUrl.pathname = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  targetUrl.search = incomingUrl.search;
  return targetUrl;
}
