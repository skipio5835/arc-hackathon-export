import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import type { DeployContractTemplateInput } from "@circle-fin/smart-contract-platform";
import {
  ARC_TESTNET,
  TEMPLATE_CONFIGS,
  circleClientConfig,
  getFeeLevel,
  idempotencyKey,
  optionalEnv,
  printJson,
  requiredEnv,
  type ContractTemplate,
} from "../../../shared/config.js";

const templateName = process.argv[2] as ContractTemplate | undefined;
if (!templateName || !(templateName in TEMPLATE_CONFIGS)) {
  throw new Error("Usage: npm run deploy-erc20 | deploy-erc721 | deploy-erc1155 | deploy-airdrop");
}

const template = TEMPLATE_CONFIGS[templateName];
const walletAddress = requiredEnv("WALLET_ADDRESS");

const templateParameters: Record<string, string | number> = {
  defaultAdmin: walletAddress,
};

if (templateName !== "airdrop") {
  templateParameters.name = optionalEnv("TOKEN_NAME") ?? template.defaultTokenName ?? "MyToken";
  templateParameters.symbol = optionalEnv("TOKEN_SYMBOL") ?? template.defaultSymbol ?? "MTK";
  templateParameters.primarySaleRecipient = walletAddress;
}

if (templateName === "erc721" || templateName === "erc1155") {
  templateParameters.royaltyRecipient = walletAddress;
  templateParameters.royaltyPercent = Number(optionalEnv("ROYALTY_PERCENT") ?? "0.01");
}

const contractUri = optionalEnv("CONTRACT_URI");
if (contractUri) {
  templateParameters[templateName === "airdrop" ? "contractURI" : "contractUri"] = contractUri;
}

const platformFeeRecipient = optionalEnv("PLATFORM_FEE_RECIPIENT");
const platformFeePercent = optionalEnv("PLATFORM_FEE_PERCENT");
if (platformFeeRecipient && platformFeePercent && templateName !== "airdrop") {
  templateParameters.platformFeeRecipient = platformFeeRecipient;
  templateParameters.platformFeePercent = Number(platformFeePercent);
}

const input: DeployContractTemplateInput = {
  id: template.id,
  blockchain: ARC_TESTNET,
  name: optionalEnv("CONTRACT_NAME") ?? template.defaultContractName,
  walletId: requiredEnv("WALLET_ID"),
  templateParameters,
  fee: {
    type: "level",
    config: {
      feeLevel: getFeeLevel(),
    },
  },
  idempotencyKey: idempotencyKey(`deploy-${templateName}`, "DEPLOY_IDEMPOTENCY_KEY"),
};

const circleContractSdk = initiateSmartContractPlatformClient(circleClientConfig());
const response = await circleContractSdk.deployContractTemplate(input);

printJson({
  template: templateName,
  request: {
    blockchain: input.blockchain,
    contractName: input.name,
    templateId: input.id,
    templateParameters: input.templateParameters,
  },
  response: response.data,
  env: {
    TRANSACTION_ID: response.data?.transactionId,
    CONTRACT_ID: response.data?.contractIds?.[0],
  },
});
