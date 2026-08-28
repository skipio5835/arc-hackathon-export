import { createCircleProxy, type ProxyRule } from "../_circle-proxy.js";

const rules = [
  { method: "GET", path: /^v1\/stablecoinKits\/quote$/, query: ["tokenInAddress", "tokenInChain", "tokenOutAddress", "tokenOutChain", "fromAddress", "toAddress", "amount", "slippageBps", "fees.platformBps", "fees.beneficiary"], authorization: "required" },
  { method: "GET", path: /^v1\/stablecoinKits\/swap\/status$/, query: ["txHash", "chain"], authorization: "required" },
  { method: "POST", path: /^v1\/stablecoinKits\/swap$/, query: [], authorization: "required" },
  { method: "POST", path: /^v1\/stablecoinKits\/logs$/, query: [], authorization: "forbidden" },
] as const satisfies readonly ProxyRule[];

export default createCircleProxy("https://api.circle.com", "/circle-api", "/api/circle-api", rules);
export { config } from "../_circle-proxy.js";
