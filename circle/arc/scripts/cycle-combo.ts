import { spawn } from "node:child_process";

type ComboKey =
  | "reward"
  | "coupon"
  | "referral"
  | "cashback"
  | "auction"
  | "auction-cancel"
  | "rental"
  | "warranty"
  | "support"
  | "access";

type ComboPlan = {
  cashbackAmount: string;
  cashbackClaim: string;
  auctionMinBid: string;
  auctionRaiseBid: string;
  auctionSettlement: string;
  couponAmount: string;
  couponClaim: string;
  referralAmount: string;
  referralClaim: string;
  rentalDamageFee: string;
  rentalDeposit: string;
  rentalFee: string;
  rentalReturn: string;
  rewardAmount: string;
  rewardClaim: string;
  warrantyClaim: string;
  warrantyExpiresDays: string;
  warrantyResolution: string;
  supportCategory: string;
  supportResponse: string;
  supportClose: string;
  accessRole: string;
  accessApproval: string;
  accessRevoke: string;
};

type ComboSpec = {
  amount: string;
  claim: string;
  contract: string;
  label: string;
  mode?: "settle" | "cancel";
  page: string;
  title: string;
};

const DEFAULT_METAMASK = "0x0000000000000000000000000000000000000000";
const DEFAULT_ARCREWARD_CONTRACT = "0x6da434b13e24ae1507687179ac57980776f11d2c";
const DEFAULT_ARCCOUPON_CONTRACT = "0x689f5c5447b1f0505d49af73bc85475970e690e2";
const DEFAULT_ARCREFERRAL_CONTRACT = "0xa2eaf480143d01ae4d9e9d9d880aff1c60d80396";
const DEFAULT_ARCCASHBACK_CONTRACT = "0xe30af52b7da6a23e8ced04473290f57b8964fef8";
const DEFAULT_ARCAUCTION_CONTRACT = "";
const DEFAULT_ARCRENTAL_CONTRACT = "0x69177a3ce61b80e28709a1a9f873ec1a23d77076";
const DEFAULT_ARCWARRANTY_CONTRACT = "0xAd668A996e80607B963Ed0FB2593EB9B11E00313";
const DEFAULT_ARCSUPPORTDESK_CONTRACT = "0x9a2B3a86959E2d944fde2660B616c2c7Ce17D6fc";
const DEFAULT_ARCACCESS_CONTRACT = "0xc561Df062A6D74c951db2b18Ba106eB3771ED2a5";
const BASE_URL = `http://localhost:${process.env.PORT ?? "4173"}`;

const productPlans: ComboPlan[] = [
  {
    rewardAmount: "0.003",
    rewardClaim: "claimed-review-reward",
    couponAmount: "0.003",
    couponClaim: "claimed-review-coupon",
    referralAmount: "0.003",
    referralClaim: "claimed-review-referral",
    cashbackAmount: "0.003",
    cashbackClaim: "claimed-review-cashback",
    auctionMinBid: "0.003",
    auctionRaiseBid: "0.004",
    auctionSettlement: "settled-review-auction",
    rentalFee: "0.0015",
    rentalDeposit: "0.003",
    rentalDamageFee: "0.0005",
    rentalReturn: "returned-review-rental",
    warrantyClaim: "claimed-review-warranty",
    warrantyResolution: "resolved-review-warranty",
    warrantyExpiresDays: "0",
    supportCategory: "billing",
    supportResponse: "responded-review-support",
    supportClose: "closed-review-support",
    accessRole: "billing-operator",
    accessApproval: "approved-review-access",
    accessRevoke: "revoked-review-access",
  },
  {
    rewardAmount: "0.0035",
    rewardClaim: "claimed-product-reward",
    couponAmount: "0.0035",
    couponClaim: "claimed-product-coupon",
    referralAmount: "0.0035",
    referralClaim: "claimed-product-referral",
    cashbackAmount: "0.0035",
    cashbackClaim: "claimed-product-cashback",
    auctionMinBid: "0.0035",
    auctionRaiseBid: "0.0045",
    auctionSettlement: "settled-product-auction",
    rentalFee: "0.002",
    rentalDeposit: "0.0035",
    rentalDamageFee: "0.0006",
    rentalReturn: "returned-product-rental",
    warrantyClaim: "claimed-product-warranty",
    warrantyResolution: "resolved-product-warranty",
    warrantyExpiresDays: "14",
    supportCategory: "product",
    supportResponse: "responded-product-support",
    supportClose: "closed-product-support",
    accessRole: "product-operator",
    accessApproval: "approved-product-access",
    accessRevoke: "revoked-product-access",
  },
  {
    rewardAmount: "0.004",
    rewardClaim: "claimed-ops-reward",
    couponAmount: "0.004",
    couponClaim: "claimed-ops-coupon",
    referralAmount: "0.004",
    referralClaim: "claimed-ops-referral",
    cashbackAmount: "0.004",
    cashbackClaim: "claimed-ops-cashback",
    auctionMinBid: "0.004",
    auctionRaiseBid: "0.005",
    auctionSettlement: "settled-ops-auction",
    rentalFee: "0.0025",
    rentalDeposit: "0.004",
    rentalDamageFee: "0.0007",
    rentalReturn: "returned-ops-rental",
    warrantyClaim: "claimed-ops-warranty",
    warrantyResolution: "resolved-ops-warranty",
    warrantyExpiresDays: "30",
    supportCategory: "ops",
    supportResponse: "responded-ops-support",
    supportClose: "closed-ops-support",
    accessRole: "ops-operator",
    accessApproval: "approved-ops-access",
    accessRevoke: "revoked-ops-access",
  },
  {
    rewardAmount: "0.0045",
    rewardClaim: "claimed-alt-reward",
    couponAmount: "0.0045",
    couponClaim: "claimed-alt-coupon",
    referralAmount: "0.0045",
    referralClaim: "claimed-alt-referral",
    cashbackAmount: "0.0045",
    cashbackClaim: "claimed-alt-cashback",
    auctionMinBid: "0.0045",
    auctionRaiseBid: "0.0055",
    auctionSettlement: "settled-alt-auction",
    rentalFee: "0.003",
    rentalDeposit: "0.0045",
    rentalDamageFee: "0.0008",
    rentalReturn: "returned-alt-rental",
    warrantyClaim: "claimed-alt-warranty",
    warrantyResolution: "resolved-alt-warranty",
    warrantyExpiresDays: "7",
    supportCategory: "account",
    supportResponse: "responded-alt-support",
    supportClose: "closed-alt-support",
    accessRole: "account-operator",
    accessApproval: "approved-alt-access",
    accessRevoke: "revoked-alt-access",
  },
  {
    rewardAmount: "0.005",
    rewardClaim: "claimed-release-reward",
    couponAmount: "0.005",
    couponClaim: "claimed-release-coupon",
    referralAmount: "0.005",
    referralClaim: "claimed-release-referral",
    cashbackAmount: "0.005",
    cashbackClaim: "claimed-release-cashback",
    auctionMinBid: "0.005",
    auctionRaiseBid: "0.006",
    auctionSettlement: "settled-release-auction",
    rentalFee: "0.0035",
    rentalDeposit: "0.005",
    rentalDamageFee: "0.0009",
    rentalReturn: "returned-release-rental",
    warrantyClaim: "claimed-release-warranty",
    warrantyResolution: "resolved-release-warranty",
    warrantyExpiresDays: "21",
    supportCategory: "release",
    supportResponse: "responded-release-support",
    supportClose: "closed-release-support",
    accessRole: "release-operator",
    accessApproval: "approved-release-access",
    accessRevoke: "revoked-release-access",
  },
  {
    rewardAmount: "0.0055",
    rewardClaim: "claimed-abstain-reward",
    couponAmount: "0.0055",
    couponClaim: "claimed-abstain-coupon",
    referralAmount: "0.0055",
    referralClaim: "claimed-abstain-referral",
    cashbackAmount: "0.0055",
    cashbackClaim: "claimed-abstain-cashback",
    auctionMinBid: "0.0055",
    auctionRaiseBid: "0.0065",
    auctionSettlement: "settled-abstain-auction",
    rentalFee: "0.004",
    rentalDeposit: "0.0055",
    rentalDamageFee: "0.001",
    rentalReturn: "returned-abstain-rental",
    warrantyClaim: "claimed-abstain-warranty",
    warrantyResolution: "resolved-abstain-warranty",
    warrantyExpiresDays: "45",
    supportCategory: "review",
    supportResponse: "responded-abstain-support",
    supportClose: "closed-abstain-support",
    accessRole: "review-operator",
    accessApproval: "approved-abstain-access",
    accessRevoke: "revoked-abstain-access",
  },
  {
    rewardAmount: "0.0032",
    rewardClaim: "claimed-final-reward",
    couponAmount: "0.0032",
    couponClaim: "claimed-final-coupon",
    referralAmount: "0.0032",
    referralClaim: "claimed-final-referral",
    cashbackAmount: "0.0032",
    cashbackClaim: "claimed-final-cashback",
    auctionMinBid: "0.0032",
    auctionRaiseBid: "0.0042",
    auctionSettlement: "settled-final-auction",
    rentalFee: "0.0018",
    rentalDeposit: "0.0032",
    rentalDamageFee: "0.0004",
    rentalReturn: "returned-final-rental",
    warrantyClaim: "claimed-final-warranty",
    warrantyResolution: "resolved-final-warranty",
    warrantyExpiresDays: "0",
    supportCategory: "final",
    supportResponse: "responded-final-support",
    supportClose: "closed-final-support",
    accessRole: "final-operator",
    accessApproval: "approved-final-access",
    accessRevoke: "revoked-final-access",
  },
];

function todayKey(): string {
  const override = process.env.CYCLE_DATE?.trim();
  if (override) return override;

  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function dayOfYear(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("CYCLE_DATE must use YYYY-MM-DD format.");
  }

  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86_400_000) + 1;
}

function argValue(name: string): string | undefined {
  const exactIndex = process.argv.indexOf(name);
  if (exactIndex >= 0) return process.argv[exactIndex + 1];

  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function buildSpecs(cycleDate: string, variant: number, plan: ComboPlan): Record<ComboKey, ComboSpec> {
  return {
    reward: {
      amount: plan.rewardAmount,
      claim: plan.rewardClaim,
      contract: process.env.ARCREWARD_CONTRACT?.trim() || DEFAULT_ARCREWARD_CONTRACT,
      label: `arc-reward-${cycleDate}-v${variant}`,
      page: "arc-reward.html",
      title: "ArcReward Create + Claim + Close",
    },
    coupon: {
      amount: plan.couponAmount,
      claim: plan.couponClaim,
      contract: process.env.ARCCOUPON_CONTRACT?.trim() || DEFAULT_ARCCOUPON_CONTRACT,
      label: `arc-coupon-${cycleDate}-v${variant}`,
      page: "arc-coupon.html",
      title: "ArcCoupon Create + Claim + Close",
    },
    referral: {
      amount: plan.referralAmount,
      claim: plan.referralClaim,
      contract: process.env.ARCREFERRAL_CONTRACT?.trim() || DEFAULT_ARCREFERRAL_CONTRACT,
      label: `arc-referral-${cycleDate}-v${variant}`,
      page: "arc-referral.html",
      title: "ArcReferral Create + Claim + Close",
    },
    cashback: {
      amount: plan.cashbackAmount,
      claim: plan.cashbackClaim,
      contract: process.env.ARCCASHBACK_CONTRACT?.trim() || DEFAULT_ARCCASHBACK_CONTRACT,
      label: `arc-cashback-${cycleDate}-v${variant}`,
      page: "arc-cashback.html",
      title: "ArcCashback Create + Claim + Close",
    },
    auction: {
      amount: plan.auctionMinBid,
      claim: plan.auctionSettlement,
      contract: process.env.ARCAUCTION_CONTRACT?.trim() || DEFAULT_ARCAUCTION_CONTRACT,
      label: `arc-auction-${cycleDate}-v${variant}`,
      mode: "settle",
      page: "arc-auction.html",
      title: "ArcAuction Create + Bid + Raise + Settle",
    },
    "auction-cancel": {
      amount: plan.auctionMinBid,
      claim: plan.auctionSettlement.replace("settled", "canceled"),
      contract: process.env.ARCAUCTION_CONTRACT?.trim() || DEFAULT_ARCAUCTION_CONTRACT,
      label: `arc-auction-cancel-${cycleDate}-v${variant}`,
      mode: "cancel",
      page: "arc-auction.html",
      title: "ArcAuction Create + Bid + Cancel",
    },
    rental: {
      amount: plan.rentalFee,
      claim: plan.rentalReturn,
      contract: process.env.ARCRENTAL_CONTRACT?.trim() || DEFAULT_ARCRENTAL_CONTRACT,
      label: `arc-rental-${cycleDate}-v${variant}`,
      page: "arc-rental.html",
      title: "ArcRental Create + Book + Return",
    },
    warranty: {
      amount: "0",
      claim: plan.warrantyResolution,
      contract: process.env.ARCWARRANTY_CONTRACT?.trim() || DEFAULT_ARCWARRANTY_CONTRACT,
      label: `arc-warranty-${cycleDate}-v${variant}`,
      page: "arc-warranty.html",
      title: "ArcWarranty Register + Claim + Resolve",
    },
    support: {
      amount: "0",
      claim: plan.supportClose,
      contract: process.env.ARCSUPPORTDESK_CONTRACT?.trim() || DEFAULT_ARCSUPPORTDESK_CONTRACT,
      label: `arc-support-${cycleDate}-v${variant}`,
      page: "arc-support-desk.html",
      title: "ArcSupport Create + Respond + Close",
    },
    access: {
      amount: "0",
      claim: plan.accessRevoke,
      contract: process.env.ARCACCESS_CONTRACT?.trim() || DEFAULT_ARCACCESS_CONTRACT,
      label: `arc-access-${cycleDate}-v${variant}`,
      page: "arc-access.html",
      title: "ArcAccess Request + Approve + Revoke",
    },
  };
}

function buildUrl(spec: ComboSpec): string {
  const owner = process.env.METAMASK_ADDRESS?.trim() || DEFAULT_METAMASK;
  if (spec.page === "arc-auction.html") {
    const plan = productPlans[variantIndex];
    const params = new URLSearchParams({
      autorun: "1",
      mode: spec.mode ?? "settle",
      cancelURI: `local:${spec.label}:${plan.auctionSettlement.replace("settled", "canceled")}`,
      contract: spec.contract,
      durationMinutes: "0",
      metadataURI: `local:${spec.label}`,
      minBid: plan.auctionMinBid,
      raiseBid: plan.auctionRaiseBid,
      settlementTo: owner,
      settlementURI: `local:${spec.label}:${plan.auctionSettlement}`,
      title: spec.label,
    });

    return `${BASE_URL}/public/${spec.page}?${params}`;
  }
  if (spec.page === "arc-rental.html") {
    const plan = productPlans[variantIndex];
    const params = new URLSearchParams({
      autorun: "1",
      cancelURI: `local:${spec.label}:canceled`,
      contract: spec.contract,
      damageFee: plan.rentalDamageFee,
      deposit: plan.rentalDeposit,
      metadataURI: `local:${spec.label}`,
      payoutTo: owner,
      refundTo: owner,
      rentalFee: plan.rentalFee,
      returnURI: `local:${spec.label}:${plan.rentalReturn}`,
      title: spec.label,
    });

    return `${BASE_URL}/public/${spec.page}?${params}`;
  }
  if (spec.page === "arc-warranty.html") {
    const plan = productPlans[variantIndex];
    const params = new URLSearchParams({
      autorun: "1",
      claimURI: `local:${spec.label}:${plan.warrantyClaim}`,
      contract: spec.contract,
      expiresDays: plan.warrantyExpiresDays,
      metadataURI: `local:${spec.label}`,
      productRef: spec.label,
      resolutionURI: `local:${spec.label}:${plan.warrantyResolution}`,
      serviceProvider: owner,
      title: spec.label,
    });

    return `${BASE_URL}/public/${spec.page}?${params}`;
  }
  if (spec.page === "arc-support-desk.html") {
    const plan = productPlans[variantIndex];
    const params = new URLSearchParams({
      agent: owner,
      autorun: "1",
      category: plan.supportCategory,
      closeURI: `local:${spec.label}:${plan.supportClose}`,
      contract: spec.contract,
      metadataURI: `local:${spec.label}`,
      responseURI: `local:${spec.label}:${plan.supportResponse}`,
      ticketRef: spec.label,
      title: spec.label,
    });

    return `${BASE_URL}/public/${spec.page}?${params}`;
  }
  if (spec.page === "arc-access.html") {
    const plan = productPlans[variantIndex];
    const params = new URLSearchParams({
      accessRef: spec.label,
      approvalURI: `local:${spec.label}:${plan.accessApproval}`,
      approver: owner,
      autorun: "1",
      contract: spec.contract,
      metadataURI: `local:${spec.label}`,
      revokeURI: `local:${spec.label}:${plan.accessRevoke}`,
      role: plan.accessRole,
      title: spec.label,
    });

    return `${BASE_URL}/public/${spec.page}?${params}`;
  }

  const params = new URLSearchParams({
    amount: spec.amount,
    autorun: "1",
    claimTo: owner,
    claimURI: `local:${spec.label}:${spec.claim}`,
    contract: spec.contract,
    label: spec.label,
    metadataURI: `local:${spec.label}`,
    recipient: owner,
    refundTo: owner,
  });

  return `${BASE_URL}/public/${spec.page}?${params}`;
}

function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function openChrome(url: string): void {
  const profile = argValue("--profile") ?? "Default";
  const command = [
    'Start-Process "chrome.exe" -ArgumentList @(',
    [psQuote(`--profile-directory=${profile}`), psQuote("--new-window"), psQuote(url)].join(", "),
    ")",
  ].join("");
  const child = spawn("powershell.exe", ["-NoProfile", "-Command", command], {
    detached: true,
    stdio: "ignore",
  });
  child.on("error", () => {
    console.log("Could not open Chrome automatically. Open the URL manually instead.");
  });
  child.unref();
}

const cycleDate = todayKey();
const variantIndex = (dayOfYear(cycleDate) - 1) % productPlans.length;
const variant = variantIndex + 1;
const specs = buildSpecs(cycleDate, variant, productPlans[variantIndex]);
const open = argValue("--open") as ComboKey | undefined;

console.log(`Date: ${cycleDate}`);
console.log(`Variant: ${variant}/${productPlans.length}`);
console.log("");

if (open) {
  const spec = specs[open];
  if (!spec) {
    throw new Error(`Unknown combo "${open}". Use one of: ${Object.keys(specs).join(", ")}`);
  }

  const url = buildUrl(spec);
  openChrome(url);
  console.log(`Opened ${open}: ${spec.title}`);
  console.log(url);
  console.log("");
  console.log("Approve each MetaMask request. This combines the safe same-page actions for that one flow.");
} else {
  console.log("Combo flows available:");
  for (const [key, spec] of Object.entries(specs) as Array<[ComboKey, ComboSpec]>) {
    console.log("");
    console.log(`${key}: ${spec.title}`);
    console.log(`  Amount: ${spec.amount} native USDC`);
    console.log(`  Contract: ${spec.contract}`);
    console.log(`  Label: ${spec.label}`);
    console.log(`  Open: npm.cmd run cycle:combo -- --open ${key}`);
    console.log(`  URL: ${buildUrl(spec)}`);
  }

  console.log("");
  console.log("Open one combo at a time so MetaMask requests do not overlap.");
}
