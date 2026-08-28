import { createCircleProxy, type ProxyRule } from "./_circle-proxy.js";

const stablecoinRules = [
  { method: "GET", path: /^v1\/stablecoinKits\/quote$/, query: ["tokenInAddress", "tokenInChain", "tokenOutAddress", "tokenOutChain", "fromAddress", "toAddress", "amount", "slippageBps", "fees.platformBps", "fees.beneficiary"], authorization: "required" },
  { method: "GET", path: /^v1\/stablecoinKits\/swap\/status$/, query: ["txHash", "chain"], authorization: "required" },
  { method: "POST", path: /^v1\/stablecoinKits\/swap$/, query: [], authorization: "required" },
  { method: "POST", path: /^v1\/stablecoinKits\/logs$/, query: [], authorization: "forbidden" },
] as const satisfies readonly ProxyRule[];

const irisRules = [
  { method: "GET", path: /^v2\/messages\/\d+$/, query: ["transactionHash"], authorization: "forbidden" },
  { method: "POST", path: /^v2\/reattest\/0x[A-Fa-f0-9]+$/, query: [], authorization: "forbidden" },
] as const satisfies readonly ProxyRule[];

export default createCircleProxy({
  stablecoin: { baseUrl: "https://api.circle.com", rules: stablecoinRules },
  iris: { baseUrl: "https://iris-api.circle.com", rules: irisRules },
  "iris-sandbox": { baseUrl: "https://iris-api-sandbox.circle.com", rules: irisRules },
});

export { config } from "./_circle-proxy.js";
