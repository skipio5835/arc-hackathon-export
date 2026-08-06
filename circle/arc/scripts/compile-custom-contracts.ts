import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const contractsToCompile = [
  { sourceName: "contracts/ArcInvoice.sol", filePath: "circle/arc/contracts/ArcInvoice.sol", name: "ArcInvoice" },
  { sourceName: "contracts/ArcPayLink.sol", filePath: "circle/arc/contracts/ArcPayLink.sol", name: "ArcPayLink" },
  { sourceName: "contracts/ArcRevenueSplitter.sol", filePath: "circle/arc/contracts/ArcRevenueSplitter.sol", name: "ArcRevenueSplitter" },
  { sourceName: "contracts/ArcUsageBilling.sol", filePath: "circle/arc/contracts/ArcUsageBilling.sol", name: "ArcUsageBilling" },
  { sourceName: "contracts/ArcStreamingPayroll.sol", filePath: "circle/arc/contracts/ArcStreamingPayroll.sol", name: "ArcStreamingPayroll" },
  { sourceName: "contracts/ArcRefundablePayment.sol", filePath: "circle/arc/contracts/ArcRefundablePayment.sol", name: "ArcRefundablePayment" },
  { sourceName: "contracts/ArcEscrow.sol", filePath: "circle/arc/contracts/ArcEscrow.sol", name: "ArcEscrow" },
  {
    sourceName: "contracts/ArcSubscription.sol",
    filePath: "circle/arc/contracts/ArcSubscription.sol",
    name: "ArcSubscription",
  },
  {
    sourceName: "contracts/ArcMembershipPass.sol",
    filePath: "circle/arc/contracts/ArcMembershipPass.sol",
    name: "ArcMembershipPass",
  },
  {
    sourceName: "contracts/ArcSavingsVault.sol",
    filePath: "circle/arc/contracts/ArcSavingsVault.sol",
    name: "ArcSavingsVault",
  },
  { sourceName: "contracts/ArcPoll.sol", filePath: "circle/arc/contracts/ArcPoll.sol", name: "ArcPoll" },
  {
    sourceName: "contracts/ArcAirdropCampaign.sol",
    filePath: "circle/arc/contracts/ArcAirdropCampaign.sol",
    name: "ArcAirdropCampaign",
  },
  {
    sourceName: "contracts/ArcBountyBoard.sol",
    filePath: "circle/arc/contracts/ArcBountyBoard.sol",
    name: "ArcBountyBoard",
  },
  {
    sourceName: "contracts/ArcMilestoneAgreement.sol",
    filePath: "circle/arc/contracts/ArcMilestoneAgreement.sol",
    name: "ArcMilestoneAgreement",
  },
  {
    sourceName: "contracts/ArcExpenseSplitter.sol",
    filePath: "circle/arc/contracts/ArcExpenseSplitter.sol",
    name: "ArcExpenseSplitter",
  },
  {
    sourceName: "contracts/ArcEventTickets.sol",
    filePath: "circle/arc/contracts/ArcEventTickets.sol",
    name: "ArcEventTickets",
  },
  {
    sourceName: "contracts/ArcMarketplaceOrders.sol",
    filePath: "circle/arc/contracts/ArcMarketplaceOrders.sol",
    name: "ArcMarketplaceOrders",
  },
  {
    sourceName: "contracts/ArcServiceBookings.sol",
    filePath: "circle/arc/contracts/ArcServiceBookings.sol",
    name: "ArcServiceBookings",
  },
  {
    sourceName: "contracts/ArcDonationJar.sol",
    filePath: "circle/arc/contracts/ArcDonationJar.sol",
    name: "ArcDonationJar",
  },
  {
    sourceName: "contracts/ArcPreorderStore.sol",
    filePath: "circle/arc/contracts/ArcPreorderStore.sol",
    name: "ArcPreorderStore",
  },
  {
    sourceName: "contracts/ArcPayrollVault.sol",
    filePath: "circle/arc/contracts/ArcPayrollVault.sol",
    name: "ArcPayrollVault",
  },
  {
    sourceName: "contracts/ArcRefundableDeposit.sol",
    filePath: "circle/arc/contracts/ArcRefundableDeposit.sol",
    name: "ArcRefundableDeposit",
  },
  {
    sourceName: "contracts/ArcInstallmentPayments.sol",
    filePath: "circle/arc/contracts/ArcInstallmentPayments.sol",
    name: "ArcInstallmentPayments",
  },
  {
    sourceName: "contracts/ArcVestingVault.sol",
    filePath: "circle/arc/contracts/ArcVestingVault.sol",
    name: "ArcVestingVault",
  },
  {
    sourceName: "contracts/ArcGiftCardVault.sol",
    filePath: "circle/arc/contracts/ArcGiftCardVault.sol",
    name: "ArcGiftCardVault",
  },
  {
    sourceName: "contracts/ArcRewardVault.sol",
    filePath: "circle/arc/contracts/ArcRewardVault.sol",
    name: "ArcRewardVault",
  },
  {
    sourceName: "contracts/ArcCouponVault.sol",
    filePath: "circle/arc/contracts/ArcCouponVault.sol",
    name: "ArcCouponVault",
  },
  {
    sourceName: "contracts/ArcReferralVault.sol",
    filePath: "circle/arc/contracts/ArcReferralVault.sol",
    name: "ArcReferralVault",
  },
  {
    sourceName: "contracts/ArcCashbackVault.sol",
    filePath: "circle/arc/contracts/ArcCashbackVault.sol",
    name: "ArcCashbackVault",
  },
  {
    sourceName: "contracts/ArcAuctionHouse.sol",
    filePath: "circle/arc/contracts/ArcAuctionHouse.sol",
    name: "ArcAuctionHouse",
  },
  {
    sourceName: "contracts/ArcRentalEscrow.sol",
    filePath: "circle/arc/contracts/ArcRentalEscrow.sol",
    name: "ArcRentalEscrow",
  },
  {
    sourceName: "contracts/ArcWarrantyRegistry.sol",
    filePath: "circle/arc/contracts/ArcWarrantyRegistry.sol",
    name: "ArcWarrantyRegistry",
  },
  {
    sourceName: "contracts/ArcSupportDesk.sol",
    filePath: "circle/arc/contracts/ArcSupportDesk.sol",
    name: "ArcSupportDesk",
  },
  {
    sourceName: "contracts/ArcAccessRegistry.sol",
    filePath: "circle/arc/contracts/ArcAccessRegistry.sol",
    name: "ArcAccessRegistry",
  },
  { sourceName: "contracts/Skipio.sol", filePath: "circle/arc/contracts/Skipio.sol", name: "Skipio" },
  { sourceName: "contracts/ProofToken.sol", filePath: "circle/arc/contracts/ProofToken.sol", name: "ProofToken" },
] as const;

function findImports(importPath: string): { contents?: string; error?: string } {
  const candidates = [
    path.join(root, importPath),
    path.join(root, "node_modules", importPath),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return { contents: readFileSync(candidate, "utf8") };
    }
  }

  return { error: `File not found: ${importPath}` };
}

const input = {
  language: "Solidity",
  sources: Object.fromEntries(
    contractsToCompile.map(({ sourceName, filePath }) => [
      sourceName,
      {
        content: readFileSync(path.join(root, filePath), "utf8"),
      },
    ]),
  ),
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = output.errors ?? [];
const fatalErrors = errors.filter((error: { severity: string }) => error.severity === "error");

for (const error of errors) {
  const message = error.formattedMessage ?? error.message;
  if (error.severity === "error") {
    console.error(message);
  } else {
    console.warn(message);
  }
}

if (fatalErrors.length > 0) {
  process.exit(1);
}

const publicArtifactsDir = path.join(root, "circle", "arc", "public", "artifacts");
mkdirSync(publicArtifactsDir, { recursive: true });

for (const { sourceName, name } of contractsToCompile) {
  const artifact = output.contracts?.[sourceName]?.[name];
  if (!artifact?.abi || !artifact?.evm?.bytecode?.object) {
    throw new Error(`Missing compiled ${name} artifact.`);
  }

  const browserArtifact = {
    contractName: name,
    sourceName,
    abi: artifact.abi,
    bytecode: `0x${artifact.evm.bytecode.object}`,
    deployedBytecode: `0x${artifact.evm.deployedBytecode.object}`,
    compiler: solc.version(),
  };

  writeFileSync(path.join(publicArtifactsDir, `${name}.json`), `${JSON.stringify(browserArtifact, null, 2)}\n`);

  console.log(`Compiled ${name} with ${solc.version()}`);
  console.log(`Wrote circle/arc/public/artifacts/${name}.json`);
}
