import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { ARC_TESTNET, circleClientConfig, idempotencyKey, optionalEnv, printJson } from "../../../shared/config.js";

const client = initiateDeveloperControlledWalletsClient(circleClientConfig());

const walletSetResponse = await client.createWalletSet({
  name: optionalEnv("WALLET_SET_NAME") ?? "Arc Testnet Wallet Set",
  idempotencyKey: idempotencyKey("wallet-set", "WALLET_SET_IDEMPOTENCY_KEY"),
});

const walletSetId = walletSetResponse.data?.walletSet?.id;
if (!walletSetId) {
  throw new Error("Circle did not return a wallet set id.");
}

const walletsResponse = await client.createWallets({
  blockchains: [ARC_TESTNET],
  count: 1,
  walletSetId,
  accountType: "SCA",
  idempotencyKey: idempotencyKey("wallet", "WALLET_IDEMPOTENCY_KEY"),
});

const wallet = walletsResponse.data?.wallets?.[0];

printJson({
  walletSet: walletSetResponse.data?.walletSet,
  wallets: walletsResponse.data?.wallets,
  env: wallet
    ? {
        WALLET_ID: wallet.id,
        WALLET_ADDRESS: wallet.address,
      }
    : undefined,
});
