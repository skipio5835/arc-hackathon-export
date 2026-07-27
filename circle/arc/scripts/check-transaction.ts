import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { circleClientConfig, optionalEnv, printJson, requiredEnv } from "../../../shared/config.js";

const client = initiateDeveloperControlledWalletsClient(circleClientConfig());
type GetTransactionInput = Parameters<typeof client.getTransaction>[0];

const input: GetTransactionInput = {
  id: requiredEnv("TRANSACTION_ID"),
};

const waitForState = optionalEnv("WAIT_FOR_STATE");
if (waitForState) {
  input.waitForState = waitForState as GetTransactionInput["waitForState"];
  input.pollingInterval = Number(optionalEnv("POLLING_INTERVAL_MS") ?? "2000");
}

const transactionResponse = await client.getTransaction(input);
printJson(transactionResponse.data);
