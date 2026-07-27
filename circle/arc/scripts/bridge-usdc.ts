import { AppKit } from "@circle-fin/app-kit";
import type { BridgeParams } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { inspect } from "node:util";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Add it to local .env before running this script.`);
  }

  return value;
}

const privateKey = requireEnv("BRIDGE_PRIVATE_KEY");
const fromChain = (process.env.BRIDGE_FROM_CHAIN?.trim() || "Ethereum_Sepolia") as BridgeParams["from"]["chain"];
const toChain = (process.env.BRIDGE_TO_CHAIN?.trim() || "Arc_Testnet") as BridgeParams["from"]["chain"];
const amount = process.env.BRIDGE_AMOUNT?.trim() || "1.00";
const recipientAddress = process.env.BRIDGE_RECIPIENT_ADDRESS?.trim();
const useForwarder = process.env.BRIDGE_USE_FORWARDER?.trim().toLowerCase() === "true";

if (Number(amount) <= 0) {
  throw new Error("BRIDGE_AMOUNT must be greater than 0.");
}

const kit = new AppKit();
const adapter = createViemAdapterFromPrivateKey({ privateKey });

const to = (
  recipientAddress
    ? { adapter, chain: toChain, recipientAddress, useForwarder }
    : { adapter, chain: toChain, useForwarder }
) as BridgeParams["to"];

console.log(
  JSON.stringify(
    {
      action: "bridge-usdc",
      token: "USDC",
      fromChain,
      toChain,
      amount,
      recipientAddress: recipientAddress || "derived from BRIDGE_PRIVATE_KEY",
      useForwarder,
      note: "Private key is loaded from .env and is never printed.",
    },
    null,
    2,
  ),
);

const result = await kit.bridge({
  from: { adapter, chain: fromChain },
  to,
  amount,
  token: "USDC",
});

console.log("BRIDGE_RESULT");
console.log(inspect(result, false, null, true));
