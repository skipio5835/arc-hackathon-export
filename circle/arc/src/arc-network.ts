import type { Address } from "viem";

export const ARC_TESTNET = {
  id: 5042002,
  chainIdHex: "0x4cef52",
  name: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  tokens: {
    USDC: { address: "0x3600000000000000000000000000000000000000" as Address, decimals: 6 },
    EURC: { address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as Address, decimals: 6 },
    USYC: { address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C" as Address, decimals: 6 },
  },
} as const;

export const ARC_TESTNET_CHAIN = {
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: ARC_TESTNET.nativeCurrency,
  rpcUrls: { default: { http: [ARC_TESTNET.rpcUrl] } },
  blockExplorers: { default: { name: "ArcScan", url: ARC_TESTNET.explorerUrl } },
} as const;
