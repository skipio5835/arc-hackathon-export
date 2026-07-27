import { randomUUID } from "node:crypto";
import type { Blockchain, FeeLevel } from "@circle-fin/smart-contract-platform";

export const ARC_TESTNET = "ARC-TESTNET" satisfies Blockchain;

export type ContractTemplate = "erc20" | "erc721" | "erc1155" | "airdrop";

export type TemplateConfig = {
  id: string;
  defaultContractName: string;
  defaultTokenName?: string;
  defaultSymbol?: string;
};

export const TEMPLATE_CONFIGS: Record<ContractTemplate, TemplateConfig> = {
  erc20: {
    id: "a1b74add-23e0-4712-88d1-6b3009e85a86",
    defaultContractName: "MyTokenContract",
    defaultTokenName: "MyToken",
    defaultSymbol: "MTK",
  },
  erc721: {
    id: "76b83278-50e2-4006-8b63-5b1a2a814533",
    defaultContractName: "MyTokenContract",
    defaultTokenName: "MyToken",
    defaultSymbol: "MTK",
  },
  erc1155: {
    id: "aea21da6-0aa2-4971-9a1a-5098842b1248",
    defaultContractName: "MyMultiTokenContract",
    defaultTokenName: "MyMultiToken",
    defaultSymbol: "MMTK",
  },
  airdrop: {
    id: "13e322f2-18dc-4f57-8eed-4bddfc50f85e",
    defaultContractName: "MyAirdropContract",
  },
};

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function circleClientConfig() {
  return {
    apiKey: requiredEnv("CIRCLE_API_KEY"),
    entitySecret: requiredEnv("CIRCLE_ENTITY_SECRET"),
  };
}

export function getFeeLevel(): FeeLevel {
  const feeLevel = (optionalEnv("FEE_LEVEL") ?? "MEDIUM").toUpperCase();
  if (feeLevel !== "LOW" && feeLevel !== "MEDIUM" && feeLevel !== "HIGH") {
    throw new Error("FEE_LEVEL must be LOW, MEDIUM, or HIGH");
  }
  return feeLevel;
}

export function idempotencyKey(prefix: string, envName = "IDEMPOTENCY_KEY"): string {
  void prefix;
  return optionalEnv(envName) ?? randomUUID();
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}
