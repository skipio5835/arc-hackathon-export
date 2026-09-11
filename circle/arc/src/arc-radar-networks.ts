import { ARC_TESTNET_USDC_ADDRESS, type RadarQuoteAsset } from "./arc-radar-core.js";

export type RadarDexSource = {
  id: string;
  label: string;
  protocol: "uniswap-v2" | "uniswap-v4";
  factoryAddress: string;
};

export type RadarNetwork = {
  id: string;
  label: string;
  chainId: number;
  testnet: boolean;
  apiBase: string;
  rpcUrl: string;
  explorerBase: string;
  quoteAsset: RadarQuoteAsset;
  sources: readonly RadarDexSource[];
};

export const ARC_RADAR_TESTNET: RadarNetwork = {
  id: "arc-testnet",
  label: "Arc Testnet",
  chainId: 5042002,
  testnet: true,
  apiBase: "https://testnet.arcscan.app/api/v2",
  rpcUrl: "https://rpc.testnet.arc.io",
  explorerBase: "https://testnet.arcscan.app",
  quoteAsset: { address: ARC_TESTNET_USDC_ADDRESS, decimals: 6, symbol: "USDC" },
  sources: [{
    id: "arc-usdc-v2",
    label: "Arc USDC pools",
    protocol: "uniswap-v2",
    factoryAddress: "0x7483847D46Db2920DD64eFa676CF72dcF765814f",
  }],
};

// Mainnet stays unconfigured until endpoints, quote assets and DEX deployments are verified.
export const RADAR_NETWORKS = {
  "arc-testnet": { status: "ready", network: ARC_RADAR_TESTNET },
  "arc-mainnet": { status: "unconfigured", label: "Arc Mainnet" },
} as const;

export function resolveRadarNetwork(id = "arc-testnet"): RadarNetwork {
  if (!Object.hasOwn(RADAR_NETWORKS, id)) throw new Error("This network is not supported by ARCROW.");
  const entry = RADAR_NETWORKS[id as keyof typeof RADAR_NETWORKS];
  if (entry.status !== "ready") throw new Error(`${entry.label} is not available in ARCROW yet.`);
  return entry.network;
}

export function radarStoragePrefix(network: RadarNetwork): string {
  return `arcrow:v2:${network.id}:${network.chainId}:`;
}

export function radarPoolKey(network: RadarNetwork, pairAddress: string): string {
  return `${radarStoragePrefix(network)}pool:${pairAddress.toLowerCase()}`;
}
