import { Contract, JsonRpcProvider, formatUnits, parseUnits } from "ethers";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import {
  circleClientConfig,
  getFeeLevel,
  idempotencyKey,
  optionalEnv,
  printJson,
  requiredEnv,
} from "../../../shared/config.js";

const ARC_RPC_URL = "https://rpc.testnet.arc.network";
const DEFAULT_ARCP_CONTRACT = "0x7A30aad0AA76bF8D2C14B9Eef035C07EEFDcdA8f";
const DEFAULT_DECIMALS = 18;

const ERC20_ABI = [
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

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
  const provider = new JsonRpcProvider(optionalEnv("ARC_RPC_URL") ?? ARC_RPC_URL);

  const walletId = requiredEnv("WALLET_ID");
  const spenderAddress = requiredEnv("WALLET_ADDRESS");
  const tokenAddress = optionalEnv("DELEGATED_TOKEN_CONTRACT") ?? DEFAULT_ARCP_CONTRACT;
  const fromAddress = optionalEnv("DELEGATED_TRANSFER_FROM") ?? requiredEnv("METAMASK_ADDRESS");
  const toAddress = optionalEnv("DELEGATED_TRANSFER_TO") ?? fromAddress;
  const amount = optionalEnv("DELEGATED_TRANSFER_AMOUNT") ?? "0.25";

  const token = new Contract(tokenAddress, ERC20_ABI, provider);
  const [decimalsResult, symbol] = await Promise.all([
    token.decimals().catch(() => DEFAULT_DECIMALS),
    token.symbol().catch(() => "TOKEN"),
  ]);

  const decimals = Number(decimalsResult);
  const rawAmount = parseUnits(amount, decimals);

  const [allowanceBefore, fromBalanceBefore, toBalanceBefore] = await Promise.all([
    token.allowance(fromAddress, spenderAddress),
    token.balanceOf(fromAddress),
    token.balanceOf(toAddress),
  ]);

  if (allowanceBefore < rawAmount) {
    throw new Error(
      `Insufficient allowance. Approve at least ${amount} ${symbol} from ${fromAddress} to spender ${spenderAddress} first.`,
    );
  }

  const response = await client.createContractExecutionTransaction({
    walletId,
    contractAddress: tokenAddress,
    abiFunctionSignature: "transferFrom(address,address,uint256)",
    abiParameters: [fromAddress, toAddress, rawAmount.toString()],
    fee: {
      type: "level",
      config: {
        feeLevel: getFeeLevel(),
      },
    },
    idempotencyKey: idempotencyKey("dev-wallet-transfer-from", "DELEGATED_TRANSFER_IDEMPOTENCY_KEY"),
    refId: "dev-wallet-transfer-from",
  });

  const transactionId = response.data?.id;
  if (!transactionId) {
    throw new Error("Circle did not return a transaction id for transferFrom.");
  }

  const transactionResponse = await client.getTransaction({
    id: transactionId,
    waitForState: "COMPLETE",
    pollingInterval: 2000,
  });

  const tx = transactionResponse.data?.transaction;
  const txHash = tx?.txHash;

  const [allowanceAfter, fromBalanceAfter, toBalanceAfter] = await Promise.all([
    token.allowance(fromAddress, spenderAddress),
    token.balanceOf(fromAddress),
    token.balanceOf(toAddress),
  ]);

  printJson({
    action: "dev-wallet-transfer-from",
    walletId,
    spenderAddress,
    tokenAddress,
    symbol,
    fromAddress,
    toAddress,
    amount,
    rawAmount: rawAmount.toString(),
    transactionId,
    state: tx?.state,
    txHash,
    explorer: txHash ? `https://testnet.arcscan.app/tx/${txHash}` : undefined,
    allowanceBefore: `${formatUnits(allowanceBefore, decimals)} ${symbol}`,
    allowanceAfter: `${formatUnits(allowanceAfter, decimals)} ${symbol}`,
    fromBalanceBefore: `${formatUnits(fromBalanceBefore, decimals)} ${symbol}`,
    fromBalanceAfter: `${formatUnits(fromBalanceAfter, decimals)} ${symbol}`,
    toBalanceBefore: `${formatUnits(toBalanceBefore, decimals)} ${symbol}`,
    toBalanceAfter: `${formatUnits(toBalanceAfter, decimals)} ${symbol}`,
  });
}

main().catch((error) => {
  printJson({
    action: "dev-wallet-transfer-from",
    ok: false,
    error: errorSummary(error),
  });
  process.exitCode = 1;
});
