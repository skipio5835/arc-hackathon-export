import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import {
  circleClientConfig,
  getFeeLevel,
  idempotencyKey,
  printJson,
  requiredEnv,
} from "../../../shared/config.js";

const client = initiateDeveloperControlledWalletsClient(circleClientConfig());

const contractAddress = requiredEnv("CONTRACT_ADDRESS");
const walletId = requiredEnv("WALLET_ID");
const grantee = requiredEnv("METAMASK_ADDRESS");

const roles = [
  {
    name: "DEFAULT_ADMIN_ROLE",
    value: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
  {
    name: "MINTER_ROLE",
    value: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  },
] as const;

const transactions = [];

for (const role of roles) {
  const response = await client.createContractExecutionTransaction({
    walletId,
    contractAddress,
    abiFunctionSignature: "grantRole(bytes32,address)",
    abiParameters: [role.value, grantee],
    fee: {
      type: "level",
      config: {
        feeLevel: getFeeLevel(),
      },
    },
    idempotencyKey: idempotencyKey(`grant-${role.name}`, `${role.name}_IDEMPOTENCY_KEY`),
    refId: `grant-${role.name.toLowerCase()}-to-metamask`,
  });

  const transactionId = response.data?.id;
  if (!transactionId) {
    throw new Error(`Circle did not return a transaction id for ${role.name}.`);
  }

  const transactionResponse = await client.getTransaction({
    id: transactionId,
    waitForState: "COMPLETE",
    pollingInterval: 2000,
  });

  transactions.push({
    role: role.name,
    transactionId,
    txHash: transactionResponse.data?.transaction?.txHash,
    state: transactionResponse.data?.transaction?.state,
  });
}

printJson({
  contractAddress,
  grantee,
  transactions,
});
