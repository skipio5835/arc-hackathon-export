import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import {
  circleClientConfig,
  getFeeLevel,
  idempotencyKey,
  optionalEnv,
  printJson,
  requiredEnv,
} from "../../../shared/config.js";

function parseUnits(value: string, decimals: number): string {
  const normalized = value.replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("MINT_AMOUNT must be a positive decimal number.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) {
    throw new Error(`MINT_AMOUNT has more than ${decimals} decimal places.`);
  }

  const raw = `${whole}${fraction.padEnd(decimals, "0")}`.replace(/^0+(?=\d)/, "");
  return raw || "0";
}

const client = initiateDeveloperControlledWalletsClient(circleClientConfig());

const decimals = Number(optionalEnv("TOKEN_DECIMALS") ?? "18");
const amount = requiredEnv("MINT_AMOUNT");
const rawAmount = parseUnits(amount, decimals);

const response = await client.createContractExecutionTransaction({
  walletId: requiredEnv("WALLET_ID"),
  contractAddress: requiredEnv("CONTRACT_ADDRESS"),
  abiFunctionSignature: "mintTo(address,uint256)",
  abiParameters: [requiredEnv("MINT_TO"), rawAmount],
  fee: {
    type: "level",
    config: {
      feeLevel: getFeeLevel(),
    },
  },
  idempotencyKey: idempotencyKey("mint-token", "MINT_IDEMPOTENCY_KEY"),
  refId: "mint-token",
});

const transactionId = response.data?.id;
if (!transactionId) {
  throw new Error("Circle did not return a transaction id for mint.");
}

const transactionResponse = await client.getTransaction({
  id: transactionId,
  waitForState: "COMPLETE",
  pollingInterval: 2000,
});

printJson({
  contractAddress: requiredEnv("CONTRACT_ADDRESS"),
  to: requiredEnv("MINT_TO"),
  amount,
  decimals,
  rawAmount,
  transactionId,
  txHash: transactionResponse.data?.transaction?.txHash,
  state: transactionResponse.data?.transaction?.state,
});
