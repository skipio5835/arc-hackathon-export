import {
  Blockchain,
  initiateDeveloperControlledWalletsClient,
  type Balance,
  type CreateTransferTransactionInput,
  type EstimateTransferFeeInput,
} from "@circle-fin/developer-controlled-wallets";
import {
  circleClientConfig,
  getFeeLevel,
  idempotencyKey,
  optionalEnv,
  printJson,
  requiredEnv,
} from "../../../shared/config.js";

const DEV_WALLET_CHAIN = Blockchain.ArcTestnet;
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const USDC_SYMBOL = "USDC";

type TokenBalance = Balance;
type TransferTokenInput = { kind: "id"; tokenId: string } | { kind: "address"; tokenAddress: string };

function errorSummary(error: unknown) {
  const err = error as {
    code?: unknown;
    message?: unknown;
    method?: unknown;
    response?: {
      status?: unknown;
      data?: unknown;
    };
    status?: unknown;
    url?: unknown;
  };

  return {
    message: err.message,
    code: err.code,
    status: err.status ?? err.response?.status,
    method: err.method,
    url: err.url,
    response: err.response?.data,
  };
}

async function main() {
  const client = initiateDeveloperControlledWalletsClient(circleClientConfig());

  const walletId = requiredEnv("WALLET_ID");
  const destinationAddress = optionalEnv("DEV_WALLET_TRANSFER_TO") ?? requiredEnv("METAMASK_ADDRESS");
  const amount = optionalEnv("DEV_WALLET_TRANSFER_AMOUNT") ?? "0.01";
  const tokenAddress = optionalEnv("DEV_WALLET_TRANSFER_TOKEN") ?? USDC_ADDRESS;
  const envTokenId = optionalEnv("DEV_WALLET_TRANSFER_TOKEN_ID");

  const balanceBefore = await client.getWalletTokenBalance({
    id: walletId,
    includeAll: true,
  });
  const selectedBalance = selectTokenBalance(balanceBefore.data?.tokenBalances ?? [], tokenAddress);
  const tokenInput = transferTokenInput(envTokenId ?? selectedBalance?.token.id, tokenAddress);

  const transferBase = {
    walletId,
    amount: [amount],
    destinationAddress,
  };
  const estimateInput: EstimateTransferFeeInput = tokenInput.kind === "id"
    ? { ...transferBase, tokenId: tokenInput.tokenId }
    : { ...transferBase, tokenAddress: tokenInput.tokenAddress };
  const estimate = await client.estimateTransferFee(estimateInput);

  const createBase = {
    ...transferBase,
    fee: {
      type: "level",
      config: {
        feeLevel: getFeeLevel(),
      },
    },
    idempotencyKey: idempotencyKey("dev-wallet-usdc-transfer", "DEV_WALLET_TRANSFER_IDEMPOTENCY_KEY"),
    refId: "dev-wallet-usdc-transfer",
  } satisfies Omit<CreateTransferTransactionInput, "tokenAddress" | "tokenId">;
  const createInput: CreateTransferTransactionInput = tokenInput.kind === "id"
    ? { ...createBase, tokenId: tokenInput.tokenId }
    : { ...createBase, tokenAddress: tokenInput.tokenAddress };

  const response = await client.createTransaction(createInput);

  const transactionId = response.data?.id;
  if (!transactionId) {
    throw new Error("Circle did not return a transaction id for the transfer.");
  }

  const transactionResponse = await client.getTransaction({
    id: transactionId,
    waitForState: "COMPLETE",
    pollingInterval: 2000,
  });

  const tx = transactionResponse.data?.transaction;
  const txHash = tx?.txHash;

  const balanceAfter = await client.getWalletTokenBalance({
    id: walletId,
    includeAll: true,
  });

  printJson({
    action: "dev-wallet-usdc-transfer",
    walletId,
    blockchain: DEV_WALLET_CHAIN,
    tokenAddress,
    selectedToken: tokenSummary(selectedBalance),
    tokenInput,
    destinationAddress,
    amount,
    estimate: estimate.data,
    transactionId,
    state: tx?.state,
    txHash,
    explorer: txHash ? `https://testnet.arcscan.app/tx/${txHash}` : undefined,
    balanceBefore: balanceBefore.data?.tokenBalances,
    balanceAfter: balanceAfter.data?.tokenBalances,
  });
}

function selectTokenBalance(tokenBalances: TokenBalance[], tokenAddress: string): TokenBalance | undefined {
  const normalizedAddress = tokenAddress.toLowerCase();
  return tokenBalances.find((balance) => balance.token.tokenAddress?.toLowerCase() === normalizedAddress)
    ?? tokenBalances.find(
      (balance) => balance.token.blockchain === DEV_WALLET_CHAIN && balance.token.symbol?.toUpperCase() === USDC_SYMBOL,
    );
}

function transferTokenInput(tokenId: string | undefined, tokenAddress: string): TransferTokenInput {
  return tokenId ? { kind: "id", tokenId } : { kind: "address", tokenAddress };
}

function tokenSummary(balance: TokenBalance | undefined) {
  if (!balance) {
    return undefined;
  }

  return {
    amount: balance.amount,
    id: balance.token.id,
    blockchain: balance.token.blockchain,
    symbol: balance.token.symbol,
    isNative: balance.token.isNative,
    tokenAddress: balance.token.tokenAddress,
  };
}

main().catch((error) => {
  printJson({
    action: "dev-wallet-usdc-transfer",
    ok: false,
    error: errorSummary(error),
  });
  process.exitCode = 1;
});
