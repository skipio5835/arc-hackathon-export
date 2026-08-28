import { createCircleProxy, type ProxyRule } from "../_circle-proxy.js";

const rules = [
  { method: "GET", path: /^v2\/messages\/\d+$/, query: ["transactionHash"], authorization: "forbidden" },
  { method: "POST", path: /^v2\/reattest\/0x[A-Fa-f0-9]+$/, query: [], authorization: "forbidden" },
] as const satisfies readonly ProxyRule[];

export default createCircleProxy("https://iris-api.circle.com", "/circle-iris", "/api/circle-iris", rules);
export { config } from "../_circle-proxy.js";
