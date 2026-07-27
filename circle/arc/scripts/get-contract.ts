import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { circleClientConfig, printJson, requiredEnv } from "../../../shared/config.js";

const circleContractSdk = initiateSmartContractPlatformClient(circleClientConfig());

const contractResponse = await circleContractSdk.getContract({
  id: requiredEnv("CONTRACT_ID"),
});

printJson(contractResponse.data);
