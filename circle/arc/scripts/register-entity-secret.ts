import { registerEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";
import { mkdirSync } from "node:fs";
import { requiredEnv } from "../../../shared/config.js";

mkdirSync("recovery", { recursive: true });

await registerEntitySecretCiphertext({
  apiKey: requiredEnv("CIRCLE_API_KEY"),
  entitySecret: requiredEnv("CIRCLE_ENTITY_SECRET"),
  recoveryFileDownloadPath: "./recovery",
});

console.log("Entity secret registered.");
console.log("Recovery file saved in ./recovery. Store it somewhere secure.");
