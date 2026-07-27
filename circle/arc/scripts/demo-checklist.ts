const DEFAULT_METAMASK = "0x0000000000000000000000000000000000000000";
const DEFAULT_CIRCLE_WALLET = "0x78131700be4a8f2d16eeb0cba3498d2e717f2cd3";
const SKIPIO_CONTRACT = "0x724038D2B4c1EbE69DC8B29cc5d591C4caA21918";
const ARCP_CONTRACT = "0x7A30aad0AA76bF8D2C14B9Eef035C07EEFDcdA8f";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const MEMO_CONTRACT = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";
const MULTICALL3FROM_CONTRACT = "0x522fAf9A91c41c443c66765030741e4AaCe147D0";
const DEFAULT_ARCINVOICE_CONTRACT = "0xda11c8b98f17164180eed93c4b62bc60407692d1";
const DEFAULT_ARCESCROW_CONTRACT = "0x679b3456100a3102e81ba60b54a400443fe20558";
const DEFAULT_ARCSUBSCRIPTION_CONTRACT = "0x89b7bde935505992bf33f838359613ed9cdfaed0";
const DEFAULT_ARCMEMBERSHIP_CONTRACT = "0x6bd54d5524ffe9e40d64bf64057c59ecceedc889";
const DEFAULT_ARCSAVINGSVAULT_CONTRACT = "0x6236cf93ba71d3a89400818478b7c9a395d2d474";
const DEFAULT_ARCPOLL_CONTRACT = "0xdd6fe001dac9d93053c92fe966c0b4573340dba4";
const DEFAULT_ARCAIRDROP_CONTRACT = "0xd4eed3efcd2f5f0a5005ee90e5b7de77786b718f";
const DEFAULT_ARCBOUNTY_CONTRACT = "0x46d942923e3d1ffd4edbab4a66c2e819e5382635";
const DEFAULT_ARCMILESTONE_CONTRACT = "0xb922ea1d992078226365e793f5ace4c08858e4d0";
const DEFAULT_ARCEXPENSE_CONTRACT = "0xccd4bad1f974fda2167a7060942916bf3c148d93";
const DEFAULT_ARCEVENTTICKETS_CONTRACT = "0xca0ef47f4ab7be8d0a290186666f8b37af9856d7";
const DEFAULT_ARCMARKETPLACE_CONTRACT = "";
const DEFAULT_ARCSERVICEBOOKINGS_CONTRACT = "0x1f99c4b86918d1b3ae6635392800dd1ecadf6352";
const DEFAULT_ARCDONATION_CONTRACT = "0x9a677c873ca846c55175aad7c0be8a299e325870";
const DEFAULT_ARCPREORDER_CONTRACT = "0x7c97d3eff8681ea4c7bb3354d1b4d827141934e9";
const DEFAULT_ARCPAYROLL_CONTRACT = "0xbb04cc4983802f9a7e4aea048a5e675c89f8c9ea";
const DEFAULT_ARCREFUNDABLEDEPOSIT_CONTRACT = "0xcad7f2503eb90e38063aa2385fc4616db0e9f147";
const DEFAULT_ARCINSTALLMENTS_CONTRACT = "0xb5b5d1ffa19b5357a03b84f6230f155b9d452cea";
const DEFAULT_ARCVESTING_CONTRACT = "0xc61917d88af3abf6f2c7dbeb473755de83f41332";
const DEFAULT_ARCGIFTCARD_CONTRACT = "0x2113dd2e00b0fca54d3199b5b5cf8da83066efb3";
const DEFAULT_ARCREWARD_CONTRACT = "0x6da434b13e24ae1507687179ac57980776f11d2c";
const DEFAULT_ARCCOUPON_CONTRACT = "0x689f5c5447b1f0505d49af73bc85475970e690e2";
const DEFAULT_ARCREFERRAL_CONTRACT = "0xa2eaf480143d01ae4d9e9d9d880aff1c60d80396";
const DEFAULT_ARCCASHBACK_CONTRACT = "0xe30af52b7da6a23e8ced04473290f57b8964fef8";
const DEFAULT_ARCAUCTION_CONTRACT = "";
const DEFAULT_ARCRENTAL_CONTRACT = "0x69177a3ce61b80e28709a1a9f873ec1a23d77076";
const DEFAULT_ARCWARRANTY_CONTRACT = "0xAd668A996e80607B963Ed0FB2593EB9B11E00313";
const DEFAULT_ARCSUPPORTDESK_CONTRACT = "0x9a2B3a86959E2d944fde2660B616c2c7Ce17D6fc";
const DEFAULT_ARCACCESS_CONTRACT = "0xc561Df062A6D74c951db2b18Ba106eB3771ED2a5";
const CCTP_BRIDGE_CONTRACT = "0xC5567a5E3370d4DBfB0540025078e283e36A363d";
const CCTP_MESSAGE_TRANSMITTER_V2 = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";
const BASE_URL = `http://localhost:${process.env.PORT ?? "4173"}`;

const metamaskAddress = process.env.METAMASK_ADDRESS?.trim() || DEFAULT_METAMASK;
const circleWalletAddress = process.env.WALLET_ADDRESS?.trim() || DEFAULT_CIRCLE_WALLET;
const arcInvoiceContract = process.env.ARCINVOICE_CONTRACT?.trim() || DEFAULT_ARCINVOICE_CONTRACT;
const arcEscrowContract = process.env.ARCESCROW_CONTRACT?.trim() || DEFAULT_ARCESCROW_CONTRACT;
const arcSubscriptionContract = process.env.ARCSUBSCRIPTION_CONTRACT?.trim() || DEFAULT_ARCSUBSCRIPTION_CONTRACT;
const arcMembershipContract = process.env.ARCMEMBERSHIP_CONTRACT?.trim() || DEFAULT_ARCMEMBERSHIP_CONTRACT;
const arcSavingsVaultContract = process.env.ARCSAVINGSVAULT_CONTRACT?.trim() || DEFAULT_ARCSAVINGSVAULT_CONTRACT;
const arcPollContract = process.env.ARCPOLL_CONTRACT?.trim() || DEFAULT_ARCPOLL_CONTRACT;
const arcAirdropContract = process.env.ARCAIRDROP_CONTRACT?.trim() || DEFAULT_ARCAIRDROP_CONTRACT;
const arcBountyContract = process.env.ARCBOUNTY_CONTRACT?.trim() || DEFAULT_ARCBOUNTY_CONTRACT;
const arcMilestoneContract = process.env.ARCMILESTONE_CONTRACT?.trim() || DEFAULT_ARCMILESTONE_CONTRACT;
const arcExpenseContract = process.env.ARCEXPENSE_CONTRACT?.trim() || DEFAULT_ARCEXPENSE_CONTRACT;
const arcEventTicketsContract = process.env.ARCEVENTTICKETS_CONTRACT?.trim() || DEFAULT_ARCEVENTTICKETS_CONTRACT;
const arcMarketplaceContract = process.env.ARCMARKETPLACE_V2_CONTRACT?.trim() || DEFAULT_ARCMARKETPLACE_CONTRACT;
const arcServiceBookingsContract =
  process.env.ARCSERVICEBOOKINGS_CONTRACT?.trim() || DEFAULT_ARCSERVICEBOOKINGS_CONTRACT;
const arcDonationContract = process.env.ARCDONATION_CONTRACT?.trim() || DEFAULT_ARCDONATION_CONTRACT;
const arcPreorderContract = process.env.ARCPREORDER_CONTRACT?.trim() || DEFAULT_ARCPREORDER_CONTRACT;
const arcPayrollContract = process.env.ARCPAYROLL_CONTRACT?.trim() || DEFAULT_ARCPAYROLL_CONTRACT;
const arcRefundableDepositContract =
  process.env.ARCREFUNDABLEDEPOSIT_CONTRACT?.trim() || DEFAULT_ARCREFUNDABLEDEPOSIT_CONTRACT;
const arcInstallmentsContract = process.env.ARCINSTALLMENTS_CONTRACT?.trim() || DEFAULT_ARCINSTALLMENTS_CONTRACT;
const arcVestingContract = process.env.ARCVESTING_CONTRACT?.trim() || DEFAULT_ARCVESTING_CONTRACT;
const arcGiftCardContract = process.env.ARCGIFTCARD_CONTRACT?.trim() || DEFAULT_ARCGIFTCARD_CONTRACT;
const arcRewardContract = process.env.ARCREWARD_CONTRACT?.trim() || DEFAULT_ARCREWARD_CONTRACT;
const arcCouponContract = process.env.ARCCOUPON_CONTRACT?.trim() || DEFAULT_ARCCOUPON_CONTRACT;
const arcReferralContract = process.env.ARCREFERRAL_CONTRACT?.trim() || DEFAULT_ARCREFERRAL_CONTRACT;
const arcCashbackContract = process.env.ARCCASHBACK_CONTRACT?.trim() || DEFAULT_ARCCASHBACK_CONTRACT;
const arcAuctionContract = process.env.ARCAUCTION_CONTRACT?.trim() || DEFAULT_ARCAUCTION_CONTRACT;
const arcRentalContract = process.env.ARCRENTAL_CONTRACT?.trim() || DEFAULT_ARCRENTAL_CONTRACT;
const arcWarrantyContract = process.env.ARCWARRANTY_CONTRACT?.trim() || DEFAULT_ARCWARRANTY_CONTRACT;
const arcSupportDeskContract = process.env.ARCSUPPORTDESK_CONTRACT?.trim() || DEFAULT_ARCSUPPORTDESK_CONTRACT;
const arcAccessContract = process.env.ARCACCESS_CONTRACT?.trim() || DEFAULT_ARCACCESS_CONTRACT;

type DemoPlan = {
  sendAmount: string;
  swapAmount: string;
  swapTokenIn: "USDC" | "EURC";
  swapTokenOut: "USDC" | "EURC";
  bridgeAmount: string;
  bridgeTo: "Ethereum_Sepolia" | "Base_Sepolia";
  rawCctpAmount: string;
  rawCctpTo: "Ethereum_Sepolia" | "Base_Sepolia";
  unifiedDeposit: string;
  unifiedSpend: string;
  tokenPreset: "ARCP / ProofToken" | "SKIPIO";
  tokenAmount: string;
  allowanceAmount: string;
  delegatedTransferAmount: string;
  devWalletAmount: string;
};

type Step = {
  title: string;
  url?: string;
  command?: string;
  fields: string[];
  proof: string;
};

type ProductPlan = {
  memoAmount: string;
  batchCircleAmount: string;
  batchSelfAmount: string;
  invoiceAmount: string;
  quoteAmount: string;
  quoteAcceptance: string;
  quoteSettlement: string;
  escrowAmount: string;
  escrowOutcome: "release" | "refund";
  escrowDisputeAmount: string;
  escrowDisputeOutcome: "release" | "refund";
  escrowDisputeEvidence: string;
  escrowDisputeResolution: string;
  subscriptionPrice: string;
  subscriptionPeriodDays: string;
  subscriptionCycles: string;
  membershipMintPrice: string;
  membershipRenewalPrice: string;
  membershipRenewalDays: string;
  vaultGoal: string;
  vaultDeposit: string;
  vaultTopUp: string;
  vaultWithdraw: string;
  pollChoice: "Yes" | "No" | "Abstain";
  pollReason: string;
  pollDurationMinutes: string;
  airdropAmount: string;
  airdropDurationMinutes: string;
  bountyReward: string;
  bountySubmission: string;
  milestoneFirstAmount: string;
  milestoneSecondAmount: string;
  milestoneSubmission: string;
  expenseTarget: string;
  expenseContribution: string;
  expenseWithdraw: string;
  eventTicketPrice: string;
  eventMaxSupply: string;
  marketplacePrice: string;
  marketplaceMaxOrders: string;
  marketplaceFulfillment: string;
  servicePrice: string;
  serviceMaxBookings: string;
  serviceCompletion: string;
  workOrderAmount: string;
  workOrderSubmission: string;
  workOrderApproval: string;
  donationGoal: string;
  donationAmount: string;
  donationMessage: string;
  preorderPrice: string;
  preorderMaxSupply: string;
  preorderFulfillment: string;
  payrollAmount: string;
  payrollClaim: string;
  refundableDepositAmount: string;
  refundableDepositOutcome: "refund" | "forfeit";
  refundableDepositReason: string;
  installmentAmount: string;
  installmentCompletion: string;
  vestingAmount: string;
  vestingClaim: string;
  giftCardAmount: string;
  giftCardRedeem: string;
  rewardAmount: string;
  rewardClaim: string;
  couponAmount: string;
  couponClaim: string;
  referralAmount: string;
  referralClaim: string;
  cashbackAmount: string;
  cashbackClaim: string;
  auctionMinBid: string;
  auctionRaiseBid: string;
  auctionSettlement: string;
  rentalFee: string;
  rentalDeposit: string;
  rentalDamageFee: string;
  rentalReturn: string;
  warrantyClaim: string;
  warrantyResolution: string;
  warrantyExpiresDays: string;
  supportCategory: string;
  supportResponse: string;
  supportClose: string;
  accessRole: string;
  accessApproval: string;
  accessRevoke: string;
};

const demoPlans: DemoPlan[] = [
  {
    sendAmount: "0.007",
    swapAmount: "0.01",
    swapTokenIn: "USDC",
    swapTokenOut: "EURC",
    bridgeAmount: "0.05",
    bridgeTo: "Ethereum_Sepolia",
    rawCctpAmount: "0.02",
    rawCctpTo: "Base_Sepolia",
    unifiedDeposit: "0.05",
    unifiedSpend: "0.005",
    tokenPreset: "ARCP / ProofToken",
    tokenAmount: "1",
    allowanceAmount: "1",
    delegatedTransferAmount: "0.25",
    devWalletAmount: "0.005",
  },
  {
    sendAmount: "0.009",
    swapAmount: "0.01",
    swapTokenIn: "EURC",
    swapTokenOut: "USDC",
    bridgeAmount: "0.06",
    bridgeTo: "Base_Sepolia",
    rawCctpAmount: "0.025",
    rawCctpTo: "Ethereum_Sepolia",
    unifiedDeposit: "0.06",
    unifiedSpend: "0.006",
    tokenPreset: "SKIPIO",
    tokenAmount: "2",
    allowanceAmount: "2",
    delegatedTransferAmount: "0.4",
    devWalletAmount: "0.006",
  },
  {
    sendAmount: "0.011",
    swapAmount: "0.015",
    swapTokenIn: "USDC",
    swapTokenOut: "EURC",
    bridgeAmount: "0.07",
    bridgeTo: "Ethereum_Sepolia",
    rawCctpAmount: "0.03",
    rawCctpTo: "Base_Sepolia",
    unifiedDeposit: "0.07",
    unifiedSpend: "0.007",
    tokenPreset: "ARCP / ProofToken",
    tokenAmount: "3",
    allowanceAmount: "3",
    delegatedTransferAmount: "0.75",
    devWalletAmount: "0.007",
  },
  {
    sendAmount: "0.013",
    swapAmount: "0.015",
    swapTokenIn: "EURC",
    swapTokenOut: "USDC",
    bridgeAmount: "0.08",
    bridgeTo: "Base_Sepolia",
    rawCctpAmount: "0.035",
    rawCctpTo: "Ethereum_Sepolia",
    unifiedDeposit: "0.08",
    unifiedSpend: "0.008",
    tokenPreset: "SKIPIO",
    tokenAmount: "1",
    allowanceAmount: "1",
    delegatedTransferAmount: "0.3",
    devWalletAmount: "0.008",
  },
  {
    sendAmount: "0.015",
    swapAmount: "0.02",
    swapTokenIn: "USDC",
    swapTokenOut: "EURC",
    bridgeAmount: "0.09",
    bridgeTo: "Ethereum_Sepolia",
    rawCctpAmount: "0.04",
    rawCctpTo: "Base_Sepolia",
    unifiedDeposit: "0.09",
    unifiedSpend: "0.009",
    tokenPreset: "ARCP / ProofToken",
    tokenAmount: "2",
    allowanceAmount: "2",
    delegatedTransferAmount: "0.5",
    devWalletAmount: "0.009",
  },
  {
    sendAmount: "0.017",
    swapAmount: "0.02",
    swapTokenIn: "EURC",
    swapTokenOut: "USDC",
    bridgeAmount: "0.10",
    bridgeTo: "Base_Sepolia",
    rawCctpAmount: "0.045",
    rawCctpTo: "Ethereum_Sepolia",
    unifiedDeposit: "0.10",
    unifiedSpend: "0.01",
    tokenPreset: "SKIPIO",
    tokenAmount: "3",
    allowanceAmount: "3",
    delegatedTransferAmount: "0.9",
    devWalletAmount: "0.01",
  },
  {
    sendAmount: "0.019",
    swapAmount: "0.012",
    swapTokenIn: "USDC",
    swapTokenOut: "EURC",
    bridgeAmount: "0.055",
    bridgeTo: "Ethereum_Sepolia",
    rawCctpAmount: "0.05",
    rawCctpTo: "Base_Sepolia",
    unifiedDeposit: "0.055",
    unifiedSpend: "0.0055",
    tokenPreset: "ARCP / ProofToken",
    tokenAmount: "5",
    allowanceAmount: "5",
    delegatedTransferAmount: "1.25",
    devWalletAmount: "0.0055",
  },
];

const productPlans: ProductPlan[] = [
  {
    memoAmount: "0.003",
    batchCircleAmount: "0.002",
    batchSelfAmount: "0.001",
    invoiceAmount: "0.01",
    quoteAmount: "0.002",
    quoteAcceptance: "accepted-review-quote",
    quoteSettlement: "settled-review-quote",
    escrowAmount: "0.004",
    escrowOutcome: "release",
    escrowDisputeAmount: "0.0015",
    escrowDisputeOutcome: "refund",
    escrowDisputeEvidence: "evidence-review-delivery-mismatch",
    escrowDisputeResolution: "resolved-review-refund",
    subscriptionPrice: "0.003",
    subscriptionPeriodDays: "7",
    subscriptionCycles: "1",
    membershipMintPrice: "0.003",
    membershipRenewalPrice: "0.001",
    membershipRenewalDays: "14",
    vaultGoal: "0.05",
    vaultDeposit: "0.006",
    vaultTopUp: "0.002",
    vaultWithdraw: "0.001",
    pollChoice: "Yes",
    pollReason: "records review support",
    pollDurationMinutes: "60",
    airdropAmount: "0.004",
    airdropDurationMinutes: "60",
    bountyReward: "0.004",
    bountySubmission: "accepted-review-work",
    milestoneFirstAmount: "0.003",
    milestoneSecondAmount: "0.002",
    milestoneSubmission: "submitted-design-check",
    expenseTarget: "0.006",
    expenseContribution: "0.004",
    expenseWithdraw: "0.0025",
    eventTicketPrice: "0.003",
    eventMaxSupply: "5",
    marketplacePrice: "0.004",
    marketplaceMaxOrders: "5",
    marketplaceFulfillment: "fulfilled-review-market-order",
    servicePrice: "0.0035",
    serviceMaxBookings: "5",
    serviceCompletion: "completed-review-service-booking",
    workOrderAmount: "0.002",
    workOrderSubmission: "submitted-review-work-order",
    workOrderApproval: "approved-review-work-order",
    donationGoal: "0.02",
    donationAmount: "0.003",
    donationMessage: "supports-review-build",
    preorderPrice: "0.005",
    preorderMaxSupply: "5",
    preorderFulfillment: "fulfilled-review-preorder",
    payrollAmount: "0.004",
    payrollClaim: "claimed-review-payroll",
    refundableDepositAmount: "0.004",
    refundableDepositOutcome: "refund",
    refundableDepositReason: "returned-review-deposit",
    installmentAmount: "0.003",
    installmentCompletion: "completed-review-installments",
    vestingAmount: "0.003",
    vestingClaim: "claimed-review-vesting",
    giftCardAmount: "0.003",
    giftCardRedeem: "redeemed-review-gift",
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
    memoAmount: "0.004",
    batchCircleAmount: "0.002",
    batchSelfAmount: "0.002",
    invoiceAmount: "0.02",
    quoteAmount: "0.0025",
    quoteAcceptance: "accepted-product-quote",
    quoteSettlement: "settled-product-quote",
    escrowAmount: "0.005",
    escrowOutcome: "refund",
    escrowDisputeAmount: "0.0016",
    escrowDisputeOutcome: "release",
    escrowDisputeEvidence: "evidence-product-completion",
    escrowDisputeResolution: "resolved-product-release",
    subscriptionPrice: "0.004",
    subscriptionPeriodDays: "14",
    subscriptionCycles: "1",
    membershipMintPrice: "0.004",
    membershipRenewalPrice: "0.0015",
    membershipRenewalDays: "21",
    vaultGoal: "0.06",
    vaultDeposit: "0.007",
    vaultTopUp: "0.0025",
    vaultWithdraw: "0.0015",
    pollChoice: "Yes",
    pollReason: "confirms product loop",
    pollDurationMinutes: "75",
    airdropAmount: "0.005",
    airdropDurationMinutes: "75",
    bountyReward: "0.006",
    bountySubmission: "submitted-product-loop",
    milestoneFirstAmount: "0.004",
    milestoneSecondAmount: "0.003",
    milestoneSubmission: "submitted-first-deliverable",
    expenseTarget: "0.007",
    expenseContribution: "0.005",
    expenseWithdraw: "0.003",
    eventTicketPrice: "0.004",
    eventMaxSupply: "6",
    marketplacePrice: "0.005",
    marketplaceMaxOrders: "6",
    marketplaceFulfillment: "fulfilled-product-market-order",
    servicePrice: "0.0045",
    serviceMaxBookings: "6",
    serviceCompletion: "completed-product-service-booking",
    workOrderAmount: "0.0022",
    workOrderSubmission: "submitted-product-work-order",
    workOrderApproval: "approved-product-work-order",
    donationGoal: "0.025",
    donationAmount: "0.004",
    donationMessage: "supports-product-loop",
    preorderPrice: "0.006",
    preorderMaxSupply: "6",
    preorderFulfillment: "fulfilled-product-preorder",
    payrollAmount: "0.005",
    payrollClaim: "claimed-product-payroll",
    refundableDepositAmount: "0.005",
    refundableDepositOutcome: "refund",
    refundableDepositReason: "returned-product-deposit",
    installmentAmount: "0.0035",
    installmentCompletion: "completed-product-installments",
    vestingAmount: "0.0035",
    vestingClaim: "claimed-product-vesting",
    giftCardAmount: "0.0035",
    giftCardRedeem: "redeemed-product-gift",
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
    memoAmount: "0.005",
    batchCircleAmount: "0.003",
    batchSelfAmount: "0.002",
    invoiceAmount: "0.01",
    quoteAmount: "0.003",
    quoteAcceptance: "accepted-ops-quote",
    quoteSettlement: "settled-ops-quote",
    escrowAmount: "0.006",
    escrowOutcome: "release",
    escrowDisputeAmount: "0.0017",
    escrowDisputeOutcome: "refund",
    escrowDisputeEvidence: "evidence-ops-refund-check",
    escrowDisputeResolution: "resolved-ops-refund",
    subscriptionPrice: "0.005",
    subscriptionPeriodDays: "7",
    subscriptionCycles: "2",
    membershipMintPrice: "0.005",
    membershipRenewalPrice: "0.002",
    membershipRenewalDays: "10",
    vaultGoal: "0.07",
    vaultDeposit: "0.008",
    vaultTopUp: "0.003",
    vaultWithdraw: "0.002",
    pollChoice: "Abstain",
    pollReason: "records neutral governance action",
    pollDurationMinutes: "90",
    airdropAmount: "0.006",
    airdropDurationMinutes: "90",
    bountyReward: "0.005",
    bountySubmission: "submitted-arc-ops-proof",
    milestoneFirstAmount: "0.005",
    milestoneSecondAmount: "0.0025",
    milestoneSubmission: "submitted-ops-review",
    expenseTarget: "0.008",
    expenseContribution: "0.006",
    expenseWithdraw: "0.0035",
    eventTicketPrice: "0.005",
    eventMaxSupply: "7",
    marketplacePrice: "0.006",
    marketplaceMaxOrders: "7",
    marketplaceFulfillment: "fulfilled-ops-market-order",
    servicePrice: "0.0055",
    serviceMaxBookings: "7",
    serviceCompletion: "completed-ops-service-booking",
    workOrderAmount: "0.0024",
    workOrderSubmission: "submitted-ops-work-order",
    workOrderApproval: "approved-ops-work-order",
    donationGoal: "0.03",
    donationAmount: "0.005",
    donationMessage: "supports-ops-proof",
    preorderPrice: "0.007",
    preorderMaxSupply: "7",
    preorderFulfillment: "fulfilled-ops-preorder",
    payrollAmount: "0.006",
    payrollClaim: "claimed-ops-payroll",
    refundableDepositAmount: "0.006",
    refundableDepositOutcome: "forfeit",
    refundableDepositReason: "forfeited-ops-deposit",
    installmentAmount: "0.004",
    installmentCompletion: "completed-ops-installments",
    vestingAmount: "0.004",
    vestingClaim: "claimed-ops-vesting",
    giftCardAmount: "0.004",
    giftCardRedeem: "redeemed-ops-gift",
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
    memoAmount: "0.006",
    batchCircleAmount: "0.004",
    batchSelfAmount: "0.002",
    invoiceAmount: "0.03",
    quoteAmount: "0.0035",
    quoteAcceptance: "accepted-alt-quote",
    quoteSettlement: "settled-alt-quote",
    escrowAmount: "0.007",
    escrowOutcome: "refund",
    escrowDisputeAmount: "0.0018",
    escrowDisputeOutcome: "release",
    escrowDisputeEvidence: "evidence-alt-service-accepted",
    escrowDisputeResolution: "resolved-alt-release",
    subscriptionPrice: "0.006",
    subscriptionPeriodDays: "30",
    subscriptionCycles: "1",
    membershipMintPrice: "0.006",
    membershipRenewalPrice: "0.002",
    membershipRenewalDays: "30",
    vaultGoal: "0.08",
    vaultDeposit: "0.009",
    vaultTopUp: "0.0035",
    vaultWithdraw: "0.0025",
    pollChoice: "No",
    pollReason: "tests alternate vote path",
    pollDurationMinutes: "45",
    airdropAmount: "0.007",
    airdropDurationMinutes: "45",
    bountyReward: "0.007",
    bountySubmission: "submitted-alternate-path",
    milestoneFirstAmount: "0.006",
    milestoneSecondAmount: "0.003",
    milestoneSubmission: "submitted-alt-scope",
    expenseTarget: "0.009",
    expenseContribution: "0.007",
    expenseWithdraw: "0.004",
    eventTicketPrice: "0.006",
    eventMaxSupply: "8",
    marketplacePrice: "0.007",
    marketplaceMaxOrders: "8",
    marketplaceFulfillment: "fulfilled-alt-market-order",
    servicePrice: "0.0065",
    serviceMaxBookings: "8",
    serviceCompletion: "completed-alt-service-booking",
    workOrderAmount: "0.0026",
    workOrderSubmission: "submitted-alt-work-order",
    workOrderApproval: "approved-alt-work-order",
    donationGoal: "0.035",
    donationAmount: "0.006",
    donationMessage: "supports-alt-route",
    preorderPrice: "0.008",
    preorderMaxSupply: "8",
    preorderFulfillment: "fulfilled-alt-preorder",
    payrollAmount: "0.007",
    payrollClaim: "claimed-alt-payroll",
    refundableDepositAmount: "0.007",
    refundableDepositOutcome: "refund",
    refundableDepositReason: "returned-alt-deposit",
    installmentAmount: "0.0045",
    installmentCompletion: "completed-alt-installments",
    vestingAmount: "0.0045",
    vestingClaim: "claimed-alt-vesting",
    giftCardAmount: "0.0045",
    giftCardRedeem: "redeemed-alt-gift",
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
    memoAmount: "0.007",
    batchCircleAmount: "0.004",
    batchSelfAmount: "0.003",
    invoiceAmount: "0.02",
    quoteAmount: "0.004",
    quoteAcceptance: "accepted-release-quote",
    quoteSettlement: "settled-release-quote",
    escrowAmount: "0.008",
    escrowOutcome: "release",
    escrowDisputeAmount: "0.0019",
    escrowDisputeOutcome: "refund",
    escrowDisputeEvidence: "evidence-release-refund-review",
    escrowDisputeResolution: "resolved-release-refund",
    subscriptionPrice: "0.007",
    subscriptionPeriodDays: "14",
    subscriptionCycles: "2",
    membershipMintPrice: "0.007",
    membershipRenewalPrice: "0.003",
    membershipRenewalDays: "14",
    vaultGoal: "0.09",
    vaultDeposit: "0.01",
    vaultTopUp: "0.004",
    vaultWithdraw: "0.003",
    pollChoice: "Yes",
    pollReason: "keeps governance cadence",
    pollDurationMinutes: "120",
    airdropAmount: "0.008",
    airdropDurationMinutes: "120",
    bountyReward: "0.008",
    bountySubmission: "submitted-release-check",
    milestoneFirstAmount: "0.007",
    milestoneSecondAmount: "0.0035",
    milestoneSubmission: "submitted-release-slice",
    expenseTarget: "0.010",
    expenseContribution: "0.008",
    expenseWithdraw: "0.0045",
    eventTicketPrice: "0.007",
    eventMaxSupply: "9",
    marketplacePrice: "0.008",
    marketplaceMaxOrders: "9",
    marketplaceFulfillment: "fulfilled-release-market-order",
    servicePrice: "0.0075",
    serviceMaxBookings: "9",
    serviceCompletion: "completed-release-service-booking",
    workOrderAmount: "0.0028",
    workOrderSubmission: "submitted-release-work-order",
    workOrderApproval: "approved-release-work-order",
    donationGoal: "0.04",
    donationAmount: "0.007",
    donationMessage: "supports-release-check",
    preorderPrice: "0.009",
    preorderMaxSupply: "9",
    preorderFulfillment: "fulfilled-release-preorder",
    payrollAmount: "0.008",
    payrollClaim: "claimed-release-payroll",
    refundableDepositAmount: "0.008",
    refundableDepositOutcome: "forfeit",
    refundableDepositReason: "forfeited-release-deposit",
    installmentAmount: "0.005",
    installmentCompletion: "completed-release-installments",
    vestingAmount: "0.005",
    vestingClaim: "claimed-release-vesting",
    giftCardAmount: "0.005",
    giftCardRedeem: "redeemed-release-gift",
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
    memoAmount: "0.008",
    batchCircleAmount: "0.005",
    batchSelfAmount: "0.003",
    invoiceAmount: "0.01",
    quoteAmount: "0.0045",
    quoteAcceptance: "accepted-abstain-quote",
    quoteSettlement: "settled-abstain-quote",
    escrowAmount: "0.009",
    escrowOutcome: "refund",
    escrowDisputeAmount: "0.002",
    escrowDisputeOutcome: "release",
    escrowDisputeEvidence: "evidence-abstain-work-accepted",
    escrowDisputeResolution: "resolved-abstain-release",
    subscriptionPrice: "0.008",
    subscriptionPeriodDays: "7",
    subscriptionCycles: "1",
    membershipMintPrice: "0.008",
    membershipRenewalPrice: "0.003",
    membershipRenewalDays: "7",
    vaultGoal: "0.10",
    vaultDeposit: "0.011",
    vaultTopUp: "0.0045",
    vaultWithdraw: "0.0035",
    pollChoice: "Abstain",
    pollReason: "checks abstain tally",
    pollDurationMinutes: "60",
    airdropAmount: "0.009",
    airdropDurationMinutes: "60",
    bountyReward: "0.009",
    bountySubmission: "submitted-abstain-review",
    milestoneFirstAmount: "0.008",
    milestoneSecondAmount: "0.004",
    milestoneSubmission: "submitted-review-slice",
    expenseTarget: "0.011",
    expenseContribution: "0.009",
    expenseWithdraw: "0.005",
    eventTicketPrice: "0.008",
    eventMaxSupply: "10",
    marketplacePrice: "0.009",
    marketplaceMaxOrders: "10",
    marketplaceFulfillment: "fulfilled-abstain-market-order",
    servicePrice: "0.0085",
    serviceMaxBookings: "10",
    serviceCompletion: "completed-abstain-service-booking",
    workOrderAmount: "0.003",
    workOrderSubmission: "submitted-abstain-work-order",
    workOrderApproval: "approved-abstain-work-order",
    donationGoal: "0.045",
    donationAmount: "0.008",
    donationMessage: "supports-abstain-review",
    preorderPrice: "0.010",
    preorderMaxSupply: "10",
    preorderFulfillment: "fulfilled-abstain-preorder",
    payrollAmount: "0.009",
    payrollClaim: "claimed-abstain-payroll",
    refundableDepositAmount: "0.009",
    refundableDepositOutcome: "refund",
    refundableDepositReason: "returned-abstain-deposit",
    installmentAmount: "0.0055",
    installmentCompletion: "completed-abstain-installments",
    vestingAmount: "0.0055",
    vestingClaim: "claimed-abstain-vesting",
    giftCardAmount: "0.0055",
    giftCardRedeem: "redeemed-abstain-gift",
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
    memoAmount: "0.009",
    batchCircleAmount: "0.006",
    batchSelfAmount: "0.003",
    invoiceAmount: "0.02",
    quoteAmount: "0.0022",
    quoteAcceptance: "accepted-final-quote",
    quoteSettlement: "settled-final-quote",
    escrowAmount: "0.01",
    escrowOutcome: "release",
    escrowDisputeAmount: "0.0014",
    escrowDisputeOutcome: "refund",
    escrowDisputeEvidence: "evidence-final-refund-check",
    escrowDisputeResolution: "resolved-final-refund",
    subscriptionPrice: "0.009",
    subscriptionPeriodDays: "30",
    subscriptionCycles: "1",
    membershipMintPrice: "0.009",
    membershipRenewalPrice: "0.004",
    membershipRenewalDays: "21",
    vaultGoal: "0.055",
    vaultDeposit: "0.0065",
    vaultTopUp: "0.002",
    vaultWithdraw: "0.001",
    pollChoice: "Yes",
    pollReason: "final review variant",
    pollDurationMinutes: "30",
    airdropAmount: "0.0045",
    airdropDurationMinutes: "30",
    bountyReward: "0.0045",
    bountySubmission: "submitted-final-variant",
    milestoneFirstAmount: "0.0035",
    milestoneSecondAmount: "0.002",
    milestoneSubmission: "submitted-final-slice",
    expenseTarget: "0.0065",
    expenseContribution: "0.0045",
    expenseWithdraw: "0.0025",
    eventTicketPrice: "0.0035",
    eventMaxSupply: "4",
    marketplacePrice: "0.0045",
    marketplaceMaxOrders: "4",
    marketplaceFulfillment: "fulfilled-final-market-order",
    servicePrice: "0.004",
    serviceMaxBookings: "4",
    serviceCompletion: "completed-final-service-booking",
    workOrderAmount: "0.0018",
    workOrderSubmission: "submitted-final-work-order",
    workOrderApproval: "approved-final-work-order",
    donationGoal: "0.022",
    donationAmount: "0.0035",
    donationMessage: "supports-final-variant",
    preorderPrice: "0.0055",
    preorderMaxSupply: "4",
    preorderFulfillment: "fulfilled-final-preorder",
    payrollAmount: "0.0045",
    payrollClaim: "claimed-final-payroll",
    refundableDepositAmount: "0.0045",
    refundableDepositOutcome: "forfeit",
    refundableDepositReason: "forfeited-final-deposit",
    installmentAmount: "0.0032",
    installmentCompletion: "completed-final-installments",
    vestingAmount: "0.0032",
    vestingClaim: "claimed-final-vesting",
    giftCardAmount: "0.0032",
    giftCardRedeem: "redeemed-final-gift",
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
  if (override) {
    return override;
  }

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

function devWalletCommand(amount: string): string {
  return `$env:DEV_WALLET_TRANSFER_AMOUNT="${amount}"; npm.cmd run dev-wallet-usdc-transfer; Remove-Item Env:\\DEV_WALLET_TRANSFER_AMOUNT`;
}

function issuedTokenContract(tokenPreset: DemoPlan["tokenPreset"]): string {
  return tokenPreset === "SKIPIO" ? SKIPIO_CONTRACT : ARCP_CONTRACT;
}

function devWalletTransferFromCommand(tokenPreset: DemoPlan["tokenPreset"], amount: string): string {
  return [
    `$env:DELEGATED_TOKEN_CONTRACT="${issuedTokenContract(tokenPreset)}"`,
    `$env:DELEGATED_TRANSFER_AMOUNT="${amount}"`,
    "npm.cmd run dev-wallet-transfer-from",
    "Remove-Item Env:\\DELEGATED_TOKEN_CONTRACT",
    "Remove-Item Env:\\DELEGATED_TRANSFER_AMOUNT",
  ].join("; ");
}

const cycleDate = todayKey();
const planIndex = (dayOfYear(cycleDate) - 1) % demoPlans.length;
const plan = demoPlans[planIndex];
const productPlan = productPlans[planIndex];
const memoReference = `arc-receipt-${cycleDate}-v${planIndex + 1}`;
const invoiceLabel = `Arc Demo Invoice ${cycleDate} v${planIndex + 1}`;
const cancelInvoiceLabel = `Arc Cancel Invoice ${cycleDate} v${planIndex + 1}`;
const quoteTitle = `arc-quote-${cycleDate}-v${planIndex + 1}`;
const quoteMetadataURI = `local:${quoteTitle}:metadata`;
const quoteAcceptanceURI = `local:${quoteTitle}:${productPlan.quoteAcceptance}`;
const quoteSettlementURI = `local:${quoteTitle}:${productPlan.quoteSettlement}`;
const escrowReference = `arc-escrow-${cycleDate}-v${planIndex + 1}`;
const escrowDisputeReference = `arc-escrow-dispute-${cycleDate}-v${planIndex + 1}`;
const escrowDisputeURI = `local:${escrowDisputeReference}:opened`;
const escrowEvidenceURI = `local:${escrowDisputeReference}:${productPlan.escrowDisputeEvidence}`;
const escrowResolutionURI = `local:${escrowDisputeReference}:${productPlan.escrowDisputeResolution}`;
const subscriptionReference = `arc-subscription-${cycleDate}-v${planIndex + 1}`;
const membershipHandle = `arc-member-${cycleDate}-v${planIndex + 1}`;
const vaultLabel = `arc-vault-${cycleDate}-v${planIndex + 1}`;
const pollTitle = `arc-poll-${cycleDate}-v${planIndex + 1}`;
const airdropLabel = `arc-airdrop-${cycleDate}-v${planIndex + 1}`;
const bountyTitle = `arc-bounty-${cycleDate}-v${planIndex + 1}`;
const bountySubmissionURI = `local:${bountyTitle}:${productPlan.bountySubmission}`;
const milestoneTitle = `arc-milestone-${cycleDate}-v${planIndex + 1}`;
const milestoneSubmissionURI = `local:${milestoneTitle}:${productPlan.milestoneSubmission}`;
const expenseTitle = `arc-expense-${cycleDate}-v${planIndex + 1}`;
const eventTitle = `arc-event-${cycleDate}-v${planIndex + 1}`;
const marketplaceTitle = `arc-market-${cycleDate}-v${planIndex + 1}`;
const marketplaceFulfillmentURI = `local:${marketplaceTitle}:${productPlan.marketplaceFulfillment}`;
const marketplaceReturnAccepted = planIndex % 4 !== 2;
const marketplaceReturnReasonURI = `local:${marketplaceTitle}:return-request-v${planIndex + 1}`;
const marketplaceReturnReviewURI = `local:${marketplaceTitle}:return-${
  marketplaceReturnAccepted ? "approved" : "rejected"
}-v${planIndex + 1}`;
const marketplaceReturnCloseURI = `local:${marketplaceTitle}:return-closed-v${planIndex + 1}`;
const serviceTitle = `arc-service-${cycleDate}-v${planIndex + 1}`;
const serviceCompletionURI = `local:${serviceTitle}:${productPlan.serviceCompletion}`;
const workOrderTitle = `arc-work-order-${cycleDate}-v${planIndex + 1}`;
const workOrderBriefURI = `local:${workOrderTitle}:brief`;
const workOrderSubmissionURI = `local:${workOrderTitle}:${productPlan.workOrderSubmission}`;
const workOrderApprovalURI = `local:${workOrderTitle}:${productPlan.workOrderApproval}`;
const donationTitle = `arc-donation-${cycleDate}-v${planIndex + 1}`;
const donationMessage = `local:${donationTitle}:${productPlan.donationMessage}`;
const preorderTitle = `arc-preorder-${cycleDate}-v${planIndex + 1}`;
const preorderFulfillmentURI = `local:${preorderTitle}:${productPlan.preorderFulfillment}`;
const payrollReference = `arc-payroll-${cycleDate}-v${planIndex + 1}`;
const payrollClaimURI = `local:${payrollReference}:${productPlan.payrollClaim}`;
const refundableDepositLabel = `arc-deposit-${cycleDate}-v${planIndex + 1}`;
const refundableDepositResolutionURI = `local:${refundableDepositLabel}:${productPlan.refundableDepositReason}`;
const refundableDepositAction =
  productPlan.refundableDepositOutcome === "refund"
    ? `Refund to: ${metamaskAddress}`
    : `Forfeit to: ${circleWalletAddress}`;
const refundableDepositResult =
  productPlan.refundableDepositOutcome === "refund"
    ? `Expected refund: ${productPlan.refundableDepositAmount} native USDC back to ${metamaskAddress}`
    : `Expected payout: ${productPlan.refundableDepositAmount} native USDC to ${circleWalletAddress}`;
const installmentLabel = `arc-installment-${cycleDate}-v${planIndex + 1}`;
const installmentPaymentOneURI = `local:${installmentLabel}:payment-1`;
const installmentPaymentTwoURI = `local:${installmentLabel}:payment-2`;
const installmentCompletionURI = `local:${installmentLabel}:${productPlan.installmentCompletion}`;
const vestingLabel = `arc-vesting-${cycleDate}-v${planIndex + 1}`;
const vestingClaimURI = `local:${vestingLabel}:${productPlan.vestingClaim}`;
const giftCardLabel = `arc-gift-${cycleDate}-v${planIndex + 1}`;
const giftCardRedeemURI = `local:${giftCardLabel}:${productPlan.giftCardRedeem}`;
const rewardLabel = `arc-reward-${cycleDate}-v${planIndex + 1}`;
const rewardClaimURI = `local:${rewardLabel}:${productPlan.rewardClaim}`;
const couponLabel = `arc-coupon-${cycleDate}-v${planIndex + 1}`;
const couponClaimURI = `local:${couponLabel}:${productPlan.couponClaim}`;
const referralLabel = `arc-referral-${cycleDate}-v${planIndex + 1}`;
const referralClaimURI = `local:${referralLabel}:${productPlan.referralClaim}`;
const cashbackLabel = `arc-cashback-${cycleDate}-v${planIndex + 1}`;
const cashbackClaimURI = `local:${cashbackLabel}:${productPlan.cashbackClaim}`;
const auctionTitle = `arc-auction-${cycleDate}-v${planIndex + 1}`;
const auctionSettlementURI = `local:${auctionTitle}:${productPlan.auctionSettlement}`;
const auctionCancelTitle = `arc-auction-cancel-${cycleDate}-v${planIndex + 1}`;
const auctionCancelURI = `local:${auctionCancelTitle}:${productPlan.auctionSettlement.replace("settled", "canceled")}`;
const rentalTitle = `arc-rental-${cycleDate}-v${planIndex + 1}`;
const rentalReturnURI = `local:${rentalTitle}:${productPlan.rentalReturn}`;
const warrantyTitle = `arc-warranty-${cycleDate}-v${planIndex + 1}`;
const warrantyClaimURI = `local:${warrantyTitle}:${productPlan.warrantyClaim}`;
const warrantyResolutionURI = `local:${warrantyTitle}:${productPlan.warrantyResolution}`;
const supportTitle = `arc-support-${cycleDate}-v${planIndex + 1}`;
const supportResponseURI = `local:${supportTitle}:${productPlan.supportResponse}`;
const supportCloseURI = `local:${supportTitle}:${productPlan.supportClose}`;
const accessTitle = `arc-access-${cycleDate}-v${planIndex + 1}`;
const accessApprovalURI = `local:${accessTitle}:${productPlan.accessApproval}`;
const accessRevokeURI = `local:${accessTitle}:${productPlan.accessRevoke}`;

const steps: Step[] = [
  {
    title: "1. App Kit Send",
    url: `${BASE_URL}/public/appkit-send.html`,
    fields: [
      `Recipient: ${circleWalletAddress}`,
      `Token: ${USDC_ADDRESS}`,
      `Amount: ${plan.sendAmount}`,
    ],
    proof: "Save txHash/explorer after MetaMask signs.",
  },
  {
    title: "2. App Kit Swap",
    url: `${BASE_URL}/public/appkit-swap.html?proxy=1`,
    fields: [
      "KIT_KEY: paste manually in the page. Do not save it in chat.",
      `Token in: ${plan.swapTokenIn}`,
      `Token out: ${plan.swapTokenOut}`,
      `Amount in: ${plan.swapAmount}`,
      "Fallback if balance/liquidity is short: USDC -> EURC, Amount in: 0.01",
    ],
    proof: "Save txHash/explorer after swap confirms.",
  },
  {
    title: "3. App Kit Bridge",
    url: `${BASE_URL}/public/appkit-bridge.html?proxy=1`,
    fields: [
      `Expected account: ${metamaskAddress}`,
      "From: Arc_Testnet",
      `To: ${plan.bridgeTo}`,
      `Recipient: ${metamaskAddress}`,
      `Amount: ${plan.bridgeAmount}`,
      "Forwarder: checked",
    ],
    proof: "Save burn/bridge txHash and explorer link.",
  },
  {
    title: "4. Unified Balance",
    url: `${BASE_URL}/public/appkit-unified-balance.html?proxy=1`,
    fields: [
      `Expected account: ${metamaskAddress}`,
      "Source chain: Arc_Testnet",
      "Destination chain: Arc_Testnet",
      `Deposit amount: ${plan.unifiedDeposit}`,
      `Spend amount: ${plan.unifiedSpend}`,
      `Recipient: ${metamaskAddress}`,
      "Allowance: approve",
      "Forwarder: unchecked for Arc_Testnet -> Arc_Testnet spend",
    ],
    proof: "Save deposit tx and spend tx.",
  },
  {
    title: "5. Issued Token Transfer",
    url: `${BASE_URL}/public/skipio-transfer.html`,
    fields: [
      `Token preset: ${plan.tokenPreset}`,
      `ARCP contract: ${ARCP_CONTRACT}`,
      `SKIPIO contract: ${SKIPIO_CONTRACT}`,
      `Recipient: ${circleWalletAddress}`,
      `Amount: ${plan.tokenAmount}`,
    ],
    proof: "Save txHash/explorer after MetaMask signs.",
  },
  {
    title: "6. Circle Dev Wallet Transfer",
    command: devWalletCommand(plan.devWalletAmount),
    fields: [
      `From: Circle Dev Wallet (${circleWalletAddress})`,
      `To: MetaMask (${metamaskAddress})`,
      "Token: Arc Testnet USDC",
      `Amount: ${plan.devWalletAmount}`,
    ],
    proof: "Save txHash/explorer from terminal output.",
  },
  {
    title: "7. Memo Receipt",
    url: `${BASE_URL}/public/arc-usdc-tools.html`,
    fields: [
      `Memo contract: ${MEMO_CONTRACT}`,
      `Recipient: ${circleWalletAddress}`,
      `ERC-20 USDC amount: ${productPlan.memoAmount}`,
      `Memo reference: ${memoReference}`,
      `Memo data: circle-arc-payment ${memoReference}`,
    ],
    proof: "Save Memo.memo txHash/explorer and memoId.",
  },
  {
    title: "8. Batch Payout",
    url: `${BASE_URL}/public/arc-usdc-tools.html`,
    fields: [
      `Multicall3From contract: ${MULTICALL3FROM_CONTRACT}`,
      "Payout rows:",
      `  ${circleWalletAddress},${productPlan.batchCircleAmount}`,
      `  ${metamaskAddress},${productPlan.batchSelfAmount}`,
    ],
    proof: "Save Multicall3From.aggregate3 txHash/explorer.",
  },
  {
    title: "9. ArcInvoice Register",
    url: `${BASE_URL}/public/arc-invoice.html`,
    fields: [
      `Contract: ${arcInvoiceContract}`,
      "Create a new invoice first.",
      `Merchant wallet: ${metamaskAddress}`,
      `Customer: ${invoiceLabel}`,
      `Amount: ${productPlan.invoiceAmount}`,
      "Then select that invoice and click Register on Arc.",
    ],
    proof: "Save createInvoice/register txHash and explorer link.",
  },
  {
    title: "10. ArcInvoice Payment",
    url: `${BASE_URL}/public/arc-invoice.html`,
    fields: [
      `Select the registered invoice for: ${invoiceLabel}`,
      `Payment amount: ${productPlan.invoiceAmount} native USDC`,
      "Click Pay USDC and sign in MetaMask.",
    ],
    proof: "Save payInvoice txHash and explorer link.",
  },
  {
    title: "11. ArcInvoice Cancel",
    url: `${BASE_URL}/public/arc-invoice.html`,
    fields: [
      `Contract: ${arcInvoiceContract}`,
      "Create a separate new invoice first; do not use the paid invoice.",
      `Merchant wallet: ${metamaskAddress}`,
      `Customer: ${cancelInvoiceLabel}`,
      `Amount: ${productPlan.invoiceAmount}`,
      "Click Register on Arc, then click Cancel Invoice before paying it.",
    ],
    proof: "Save register txHash and cancelInvoice txHash/explorer link.",
  },
  {
    title: "11A. ArcQuote Create",
    url: `${BASE_URL}/public/arc-invoice.html`,
    fields: [
      `Contract: ${arcInvoiceContract || "deploy a newer ArcInvoice contract with Quote support"}`,
      "Requires the newer ArcInvoice deployment with quote functions.",
      `Quote title: ${quoteTitle}`,
      `Buyer: ${metamaskAddress}`,
      `Amount: ${productPlan.quoteAmount} native USDC`,
      `Metadata URI: ${quoteMetadataURI}`,
      "Click Create Quote and save the quoteId.",
    ],
    proof: "Save createQuote txHash/explorer link and quoteId.",
  },
  {
    title: "11B. ArcQuote Accept",
    url: `${BASE_URL}/public/arc-invoice.html`,
    fields: [
      `Contract: ${arcInvoiceContract || "use the saved ArcInvoice contract from step 11A"}`,
      `Quote title: ${quoteTitle}`,
      `Acceptance URI: ${quoteAcceptanceURI}`,
      `Payment amount: ${productPlan.quoteAmount} native USDC`,
      "Click Refresh Quote, then Accept Quote.",
    ],
    proof: "Save acceptQuote txHash/explorer link and status = accepted.",
  },
  {
    title: "11C. ArcQuote Settle",
    url: `${BASE_URL}/public/arc-invoice.html`,
    fields: [
      `Contract: ${arcInvoiceContract || "use the saved ArcInvoice contract from step 11A"}`,
      `Quote title: ${quoteTitle}`,
      `Settlement to: ${metamaskAddress}`,
      `Settlement note: ${quoteSettlementURI}`,
      `Expected settlement: ${productPlan.quoteAmount} native USDC`,
      "Click Settle Quote after acceptance confirms.",
    ],
    proof: "Save settleQuote txHash/explorer link and final status = settled.",
  },
  {
    title: "12. Issued Token Approve",
    url: `${BASE_URL}/public/skipio-transfer.html`,
    fields: [
      `Token preset: ${plan.tokenPreset}`,
      `Spender: ${circleWalletAddress}`,
      `Approve amount: ${plan.allowanceAmount}`,
      "Click Check Allowance first if you want a baseline, then Approve Allowance.",
    ],
    proof: "Save approve txHash/explorer link.",
  },
  {
    title: "13. Dev Wallet transferFrom",
    command: devWalletTransferFromCommand(plan.tokenPreset, plan.delegatedTransferAmount),
    fields: [
      `Token preset: ${plan.tokenPreset}`,
      `Token contract: ${issuedTokenContract(plan.tokenPreset)}`,
      `Spender/Circle Dev Wallet: ${circleWalletAddress}`,
      `From: ${metamaskAddress}`,
      `To: ${metamaskAddress}`,
      `Amount: ${plan.delegatedTransferAmount}`,
      "This consumes part of the allowance without draining the issued-token balance.",
    ],
    proof: "Save transferFrom txHash/explorer link from terminal output.",
  },
  {
    title: "14. Issued Token Revoke",
    url: `${BASE_URL}/public/skipio-transfer.html`,
    fields: [
      `Token preset: ${plan.tokenPreset}`,
      `Spender: ${circleWalletAddress}`,
      "Revoke amount: approve spender for 0",
      "Click Revoke Allowance after the transferFrom command completes.",
    ],
    proof: "Save revoke txHash/explorer link and final allowance = 0.",
  },
  {
    title: "15. ArcEscrow Fund",
    url: `${BASE_URL}/public/arc-escrow.html`,
    fields: [
      `Contract: ${arcEscrowContract}`,
      `Seller: ${circleWalletAddress}`,
      `Amount: ${productPlan.escrowAmount} native USDC`,
      `Reference: ${escrowReference}`,
      `Outcome: ${productPlan.escrowOutcome}`,
      "Create Draft, select it, then click Fund Escrow.",
    ],
    proof: "Save createEscrow/fund txHash.",
  },
  {
    title: "16. ArcEscrow Settle",
    url: `${BASE_URL}/public/arc-escrow.html`,
    fields: [
      `Select funded escrow: ${escrowReference}`,
      `Settlement action: ${productPlan.escrowOutcome}`,
      productPlan.escrowOutcome === "release"
        ? `Release sends ${productPlan.escrowAmount} native USDC to seller ${circleWalletAddress}.`
        : `Refund returns ${productPlan.escrowAmount} native USDC to buyer ${metamaskAddress}.`,
      "Click Release or Refund and sign in MetaMask.",
    ],
    proof: "Save releaseEscrow/refundEscrow txHash and final status.",
  },
  {
    title: "16A. ArcEscrow Dispute Fund",
    url: `${BASE_URL}/public/arc-escrow.html`,
    fields: [
      `Contract: ${arcEscrowContract}`,
      "Requires the newer ArcEscrow deployment with dispute functions.",
      `Seller: ${circleWalletAddress}`,
      `Amount: ${productPlan.escrowDisputeAmount} native USDC`,
      `Reference: ${escrowDisputeReference}`,
      "Outcome can stay release/refund; dispute resolution uses the field below.",
      "Create Draft, select it, then click Fund Escrow.",
    ],
    proof: "Save createEscrow/fund txHash for the dispute escrow.",
  },
  {
    title: "16B. ArcEscrow Open Dispute + Evidence",
    url: `${BASE_URL}/public/arc-escrow.html`,
    fields: [
      `Select funded escrow: ${escrowDisputeReference}`,
      `Dispute URI: ${escrowDisputeURI}`,
      `Evidence URI: ${escrowEvidenceURI}`,
      "Click Open Dispute, then Submit Evidence after the first tx confirms.",
    ],
    proof: "Save openDispute and submitEvidence txHash/explorer links.",
  },
  {
    title: "16C. ArcEscrow Resolve Dispute",
    url: `${BASE_URL}/public/arc-escrow.html`,
    fields: [
      `Select disputed escrow: ${escrowDisputeReference}`,
      `Resolution action: ${productPlan.escrowDisputeOutcome}`,
      `Resolution URI: ${escrowResolutionURI}`,
      productPlan.escrowDisputeOutcome === "release"
        ? `Resolve Release sends ${productPlan.escrowDisputeAmount} native USDC to seller ${circleWalletAddress}.`
        : `Resolve Refund returns ${productPlan.escrowDisputeAmount} native USDC to buyer ${metamaskAddress}.`,
    ],
    proof: "Save resolveDispute txHash/explorer link and final disputed escrow status.",
  },
  {
    title: "17. ArcSubscription Plan",
    url: `${BASE_URL}/public/arc-subscription.html`,
    fields: [
      `Contract: ${arcSubscriptionContract}`,
      `Merchant: ${circleWalletAddress}`,
      `Price: ${productPlan.subscriptionPrice} native USDC`,
      `Period days: ${productPlan.subscriptionPeriodDays}`,
      `Cycles: ${productPlan.subscriptionCycles}`,
      `Reference: ${subscriptionReference}`,
      "If no ArcSubscription contract is saved yet, deploy it once and save the address before creating the plan.",
      "Create Draft, select it, then click Create Plan.",
    ],
    proof: "Save deploy tx if new, then save createPlan txHash.",
  },
  {
    title: "18. ArcSubscription Subscribe",
    url: `${BASE_URL}/public/arc-subscription.html`,
    fields: [
      `Select plan: ${subscriptionReference}`,
      `Subscription payment: ${productPlan.subscriptionPrice} native USDC x ${productPlan.subscriptionCycles} cycle(s)`,
      "Click Subscribe and sign in MetaMask.",
    ],
    proof: "Save subscribe txHash and paidThrough value.",
  },
  {
    title: "19. ArcSubscription Cancel",
    url: `${BASE_URL}/public/arc-subscription.html`,
    fields: [
      `Select subscribed plan: ${subscriptionReference}`,
      "Click Cancel and sign in MetaMask.",
    ],
    proof: "Save cancelSubscription txHash and final status.",
  },
  {
    title: "20. Raw CCTP Approve",
    url: `${BASE_URL}/public/raw-cctp.html`,
    fields: [
      "Source: Arc_Testnet / CCTP domain 26",
      `Destination: ${plan.rawCctpTo}`,
      `Recipient: ${metamaskAddress}`,
      `Amount: ${plan.rawCctpAmount}`,
      "Speed: STANDARD",
      `Approve spender / Bridge contract: ${CCTP_BRIDGE_CONTRACT}`,
      "Click Fetch Fee, then Approve.",
    ],
    proof: "Save approve txHash and allowance value.",
  },
  {
    title: "21. Raw CCTP Burn + Attestation",
    url: `${BASE_URL}/public/raw-cctp.html`,
    fields: [
      `Destination: ${plan.rawCctpTo}`,
      `Burn amount: ${plan.rawCctpAmount} Arc ERC-20 USDC`,
      "Click Bridge Burn, sign in MetaMask, then click Poll Iris.",
      "Iris: /v2/messages/26?transactionHash={burnTxHash}",
    ],
    proof: "Save burn txHash, event nonce, message, and attestation status.",
  },
  {
    title: "22. Raw CCTP Mint",
    url: `${BASE_URL}/public/raw-cctp.html`,
    fields: [
      `Switch MetaMask to: ${plan.rawCctpTo}`,
      `MessageTransmitterV2: ${CCTP_MESSAGE_TRANSMITTER_V2}`,
      "Click Mint after Iris status is complete.",
    ],
    proof: "Save destination receiveMessage txHash and final destination USDC balance.",
  },
  {
    title: "23. ArcMembership Mint or Renew",
    url: `${BASE_URL}/public/arc-membership.html`,
    fields: [
      `Contract: ${arcMembershipContract || "deploy once, then save address and set ARCMEMBERSHIP_CONTRACT in .env"}`,
      `Handle: ${membershipHandle}`,
      `Mint price: ${productPlan.membershipMintPrice} native USDC`,
      `Renew price: ${productPlan.membershipRenewalPrice} native USDC`,
      `Renewal days: ${productPlan.membershipRenewalDays}`,
      "Initial days: 30 when deploying a new contract",
      "If no pass exists, deploy once, save the contract, then Mint Pass.",
      "If a pass already exists, Refresh and click Renew Pass.",
    ],
    proof: "Save deploy tx if new, then save mintPass or renewPass txHash/explorer link.",
  },
  {
    title: "24. ArcMembership NFT Approve",
    url: `${BASE_URL}/public/arc-membership.html`,
    fields: [
      `Contract: ${arcMembershipContract || "use the saved ArcMembershipPass contract from step 23"}`,
      `Spender: ${circleWalletAddress}`,
      "Token ID: use the minted/refreshed pass tokenId",
      "Click Approve and sign in MetaMask.",
    ],
    proof: "Save ERC721 approve txHash/explorer link and approved address.",
  },
  {
    title: "25. ArcMembership NFT Revoke",
    url: `${BASE_URL}/public/arc-membership.html`,
    fields: [
      `Contract: ${arcMembershipContract || "use the saved ArcMembershipPass contract from step 23"}`,
      "Token ID: same pass tokenId",
      "Click Revoke to approve the zero address.",
    ],
    proof: "Save ERC721 revoke txHash/explorer link and final approved address = 0x0.",
  },
  {
    title: "26. ArcSavingsVault Create",
    url: `${BASE_URL}/public/arc-savings-vault.html`,
    fields: [
      `Contract: ${arcSavingsVaultContract || "deploy once, then save address and set ARCSAVINGSVAULT_CONTRACT in .env"}`,
      `Label: ${vaultLabel}`,
      `Goal amount: ${productPlan.vaultGoal} native USDC`,
      `Initial deposit: ${productPlan.vaultDeposit} native USDC`,
      "If no vault contract exists, deploy once, save the contract, then Create Vault.",
    ],
    proof: "Save deploy tx if new, then save createVault txHash/explorer link and vaultId.",
  },
  {
    title: "27. ArcSavingsVault Set Goal",
    url: `${BASE_URL}/public/arc-savings-vault.html`,
    fields: [
      `Contract: ${arcSavingsVaultContract || "use the saved ArcSavingsVault contract from step 26"}`,
      `Label: ${vaultLabel}`,
      `Goal amount: ${productPlan.vaultGoal} native USDC`,
      "Click Refresh, then Set Goal.",
    ],
    proof: "Save setGoal txHash/explorer link.",
  },
  {
    title: "28. ArcSavingsVault Deposit",
    url: `${BASE_URL}/public/arc-savings-vault.html`,
    fields: [
      `Contract: ${arcSavingsVaultContract || "use the saved ArcSavingsVault contract from step 26"}`,
      `Label: ${vaultLabel}`,
      `Deposit amount: ${productPlan.vaultTopUp} native USDC`,
      "Use the Deposit amount field, then click Deposit.",
    ],
    proof: "Save deposit txHash/explorer link and updated vault balance.",
  },
  {
    title: "29. ArcSavingsVault Withdraw",
    url: `${BASE_URL}/public/arc-savings-vault.html`,
    fields: [
      `Contract: ${arcSavingsVaultContract || "use the saved ArcSavingsVault contract from step 26"}`,
      `Label: ${vaultLabel}`,
      `Withdraw amount: ${productPlan.vaultWithdraw} native USDC`,
      `Recipient: ${metamaskAddress}`,
      "Click Withdraw and sign in MetaMask.",
    ],
    proof: "Save withdraw txHash/explorer link and final vault balance.",
  },
  {
    title: "30. ArcPoll Create",
    url: `${BASE_URL}/public/arc-poll.html`,
    fields: [
      `Contract: ${arcPollContract || "deploy once, then save address and set ARCPOLL_CONTRACT in .env"}`,
      `Title: ${pollTitle}`,
      `Metadata URI: local:${pollTitle}`,
      `Duration minutes: ${productPlan.pollDurationMinutes}`,
      "If no poll contract exists, deploy once, save the contract, then Create Poll.",
    ],
    proof: "Save deploy tx if new, then save createPoll txHash/explorer link and pollId.",
  },
  {
    title: "31. ArcPoll Cast Vote",
    url: `${BASE_URL}/public/arc-poll.html`,
    fields: [
      `Contract: ${arcPollContract || "use the saved ArcPoll contract from step 30"}`,
      `Title: ${pollTitle}`,
      `Choice: ${productPlan.pollChoice}`,
      `Reason: ${productPlan.pollReason}`,
      "Click Refresh, then Cast Vote.",
    ],
    proof: "Save castVote txHash/explorer link and updated tally.",
  },
  {
    title: "32. ArcPoll Close",
    url: `${BASE_URL}/public/arc-poll.html`,
    fields: [
      `Contract: ${arcPollContract || "use the saved ArcPoll contract from step 30"}`,
      `Title: ${pollTitle}`,
      "Click Close Poll after the vote confirms.",
    ],
    proof: "Save closePoll txHash/explorer link and final tally.",
  },
  {
    title: "33. ArcAirdrop Create Campaign",
    url: `${BASE_URL}/public/arc-airdrop.html`,
    fields: [
      `Contract: ${arcAirdropContract || "deploy once, then save address and set ARCAIRDROP_CONTRACT in .env"}`,
      `Label: ${airdropLabel}`,
      `Recipient: ${metamaskAddress}`,
      `Allocation amount: ${productPlan.airdropAmount} native USDC`,
      `Duration minutes: ${productPlan.airdropDurationMinutes}`,
      "If no airdrop contract exists, deploy once, save the contract, then Create Campaign.",
    ],
    proof: "Save deploy tx if new, then save createCampaign txHash/explorer link and campaignId.",
  },
  {
    title: "34. ArcAirdrop Claim",
    url: `${BASE_URL}/public/arc-airdrop.html`,
    fields: [
      `Contract: ${arcAirdropContract || "use the saved ArcAirdropCampaign contract from step 33"}`,
      `Label: ${airdropLabel}`,
      `Recipient / claimer: ${metamaskAddress}`,
      "Click Refresh, then Claim.",
    ],
    proof: "Save claim txHash/explorer link and claimed amount.",
  },
  {
    title: "35. ArcAirdrop Close Campaign",
    url: `${BASE_URL}/public/arc-airdrop.html`,
    fields: [
      `Contract: ${arcAirdropContract || "use the saved ArcAirdropCampaign contract from step 33"}`,
      `Label: ${airdropLabel}`,
      `Refund to: ${metamaskAddress}`,
      "Click Close Campaign after the claim confirms.",
    ],
    proof: "Save closeCampaign txHash/explorer link and final remaining balance.",
  },
  {
    title: "36. ArcBounty Create",
    url: `${BASE_URL}/public/arc-bounty.html`,
    fields: [
      `Contract: ${arcBountyContract || "deploy once, then save address and set ARCBOUNTY_CONTRACT in .env"}`,
      `Title: ${bountyTitle}`,
      `Metadata URI: local:${bountyTitle}`,
      `Reward amount: ${productPlan.bountyReward} native USDC`,
      "If no bounty contract exists, deploy once, save the contract, then Create Bounty.",
    ],
    proof: "Save deploy tx if new, then save createBounty txHash/explorer link and bountyId.",
  },
  {
    title: "37. ArcBounty Accept",
    url: `${BASE_URL}/public/arc-bounty.html`,
    fields: [
      `Contract: ${arcBountyContract || "use the saved ArcBountyBoard contract from step 36"}`,
      `Title: ${bountyTitle}`,
      "Click Refresh, then Accept Bounty.",
    ],
    proof: "Save acceptBounty txHash/explorer link and worker address.",
  },
  {
    title: "38. ArcBounty Submit Work",
    url: `${BASE_URL}/public/arc-bounty.html`,
    fields: [
      `Contract: ${arcBountyContract || "use the saved ArcBountyBoard contract from step 36"}`,
      `Title: ${bountyTitle}`,
      `Submission URI: ${bountySubmissionURI}`,
      "Click Submit Work.",
    ],
    proof: "Save submitWork txHash/explorer link and submission URI.",
  },
  {
    title: "39. ArcBounty Release Reward",
    url: `${BASE_URL}/public/arc-bounty.html`,
    fields: [
      `Contract: ${arcBountyContract || "use the saved ArcBountyBoard contract from step 36"}`,
      `Title: ${bountyTitle}`,
      `Reward amount: ${productPlan.bountyReward} native USDC`,
      "Click Release Reward after the submission confirms.",
    ],
    proof: "Save releaseBounty txHash/explorer link and final bounty status = released.",
  },
  {
    title: "40. ArcMilestone Create Agreement",
    url: `${BASE_URL}/public/arc-milestone.html`,
    fields: [
      `Contract: ${arcMilestoneContract || "deploy once, then save address and set ARCMILESTONE_CONTRACT in .env"}`,
      `Title: ${milestoneTitle}`,
      `Worker: ${metamaskAddress}`,
      `Metadata URI: local:${milestoneTitle}`,
      `Milestone 0 amount: ${productPlan.milestoneFirstAmount} native USDC`,
      `Milestone 1 amount: ${productPlan.milestoneSecondAmount} native USDC`,
      "If no milestone contract exists, deploy once, save the contract, then Create Agreement.",
    ],
    proof: "Save deploy tx if new, then save createAgreement txHash/explorer link and agreementId.",
  },
  {
    title: "41. ArcMilestone Submit",
    url: `${BASE_URL}/public/arc-milestone.html`,
    fields: [
      `Contract: ${arcMilestoneContract || "use the saved ArcMilestoneAgreement contract from step 40"}`,
      `Title: ${milestoneTitle}`,
      "Milestone index: 0",
      `Submission URI: ${milestoneSubmissionURI}`,
      "Click Refresh, then Submit Milestone.",
    ],
    proof: "Save submitMilestone txHash/explorer link and milestone submission URI.",
  },
  {
    title: "42. ArcMilestone Release",
    url: `${BASE_URL}/public/arc-milestone.html`,
    fields: [
      `Contract: ${arcMilestoneContract || "use the saved ArcMilestoneAgreement contract from step 40"}`,
      `Title: ${milestoneTitle}`,
      "Milestone index: 0",
      `Release amount: ${productPlan.milestoneFirstAmount} native USDC`,
      "Click Release Milestone after the submission confirms.",
    ],
    proof: "Save releaseMilestone txHash/explorer link and released/remaining totals.",
  },
  {
    title: "43. ArcMilestone Close",
    url: `${BASE_URL}/public/arc-milestone.html`,
    fields: [
      `Contract: ${arcMilestoneContract || "use the saved ArcMilestoneAgreement contract from step 40"}`,
      `Title: ${milestoneTitle}`,
      `Refund to: ${metamaskAddress}`,
      `Expected refund: ${productPlan.milestoneSecondAmount} native USDC`,
      "Click Close Agreement after milestone 0 is released.",
    ],
    proof: "Save closeAgreement txHash/explorer link and final agreement status = closed.",
  },
  {
    title: "44. ArcExpense Create",
    url: `${BASE_URL}/public/arc-expense.html`,
    fields: [
      `Contract: ${arcExpenseContract || "deploy once, then save address and set ARCEXPENSE_CONTRACT in .env"}`,
      `Title: ${expenseTitle}`,
      `Payee: ${metamaskAddress}`,
      `Metadata URI: local:${expenseTitle}`,
      `Target amount: ${productPlan.expenseTarget} native USDC`,
      "If no expense contract exists, deploy once, save the contract, then Create Expense.",
    ],
    proof: "Save deploy tx if new, then save createExpense txHash/explorer link and expenseId.",
  },
  {
    title: "45. ArcExpense Contribute",
    url: `${BASE_URL}/public/arc-expense.html`,
    fields: [
      `Contract: ${arcExpenseContract || "use the saved ArcExpenseSplitter contract from step 44"}`,
      `Title: ${expenseTitle}`,
      `Contribution amount: ${productPlan.expenseContribution} native USDC`,
      "Click Refresh, then Contribute.",
    ],
    proof: "Save contribute txHash/explorer link and contributor amount.",
  },
  {
    title: "46. ArcExpense Withdraw",
    url: `${BASE_URL}/public/arc-expense.html`,
    fields: [
      `Contract: ${arcExpenseContract || "use the saved ArcExpenseSplitter contract from step 44"}`,
      `Title: ${expenseTitle}`,
      `Withdraw amount: ${productPlan.expenseWithdraw} native USDC`,
      `Withdraw to: ${metamaskAddress}`,
      "Click Withdraw after the contribution confirms.",
    ],
    proof: "Save withdraw txHash/explorer link and remaining available amount.",
  },
  {
    title: "47. ArcExpense Close",
    url: `${BASE_URL}/public/arc-expense.html`,
    fields: [
      `Contract: ${arcExpenseContract || "use the saved ArcExpenseSplitter contract from step 44"}`,
      `Title: ${expenseTitle}`,
      `Refund to: ${metamaskAddress}`,
      `Expected refund: contribution minus withdraw = ${productPlan.expenseContribution} - ${productPlan.expenseWithdraw} native USDC`,
      "Click Close Expense after withdrawal confirms.",
    ],
    proof: "Save closeExpense txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "48. ArcEvent Create",
    url: `${BASE_URL}/public/arc-event-tickets.html`,
    fields: [
      `Contract: ${arcEventTicketsContract || "deploy once, then save address and set ARCEVENTTICKETS_CONTRACT in .env"}`,
      `Title: ${eventTitle}`,
      `Treasury: ${metamaskAddress}`,
      `Metadata URI: local:${eventTitle}`,
      `Ticket price: ${productPlan.eventTicketPrice} native USDC`,
      `Max supply: ${productPlan.eventMaxSupply}`,
      "If no event ticket contract exists, deploy once, save the contract, then Create Event.",
    ],
    proof: "Save deploy tx if new, then save createEvent txHash/explorer link and eventId.",
  },
  {
    title: "49. ArcEvent Buy Ticket",
    url: `${BASE_URL}/public/arc-event-tickets.html`,
    fields: [
      `Contract: ${arcEventTicketsContract || "use the saved ArcEventTickets contract from step 48"}`,
      `Title: ${eventTitle}`,
      `Ticket price: ${productPlan.eventTicketPrice} native USDC`,
      "Click Refresh, then Buy Ticket.",
    ],
    proof: "Save buyTicket txHash/explorer link and ticketId.",
  },
  {
    title: "50. ArcEvent Check In",
    url: `${BASE_URL}/public/arc-event-tickets.html`,
    fields: [
      `Contract: ${arcEventTicketsContract || "use the saved ArcEventTickets contract from step 48"}`,
      `Title: ${eventTitle}`,
      "Ticket ID: use the purchased ticket shown on the page.",
      "Click Check In after the purchase confirms.",
    ],
    proof: "Save checkIn txHash/explorer link and checkedIn count.",
  },
  {
    title: "51. ArcEvent Settle",
    url: `${BASE_URL}/public/arc-event-tickets.html`,
    fields: [
      `Contract: ${arcEventTicketsContract || "use the saved ArcEventTickets contract from step 48"}`,
      `Title: ${eventTitle}`,
      `Settlement to: ${metamaskAddress}`,
      `Expected settlement: ${productPlan.eventTicketPrice} native USDC`,
      "Click Settle Event after check-in.",
    ],
    proof: "Save settleEvent txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "52. ArcMarketplace Create Listing",
    url: `${BASE_URL}/public/arc-marketplace.html`,
    fields: [
      `Contract: ${arcMarketplaceContract || "deploy once, then save address and set ARCMARKETPLACE_V2_CONTRACT in .env"}`,
      `Title: ${marketplaceTitle}`,
      `Treasury: ${metamaskAddress}`,
      `Metadata URI: local:${marketplaceTitle}`,
      `Price: ${productPlan.marketplacePrice} native USDC`,
      `Max orders: ${productPlan.marketplaceMaxOrders}`,
      "If no marketplace contract exists, deploy once, save the contract, then Create Listing.",
    ],
    proof: "Save deploy tx if new, then save createListing txHash/explorer link and listingId.",
  },
  {
    title: "53. ArcMarketplace Buy Order",
    url: `${BASE_URL}/public/arc-marketplace.html`,
    fields: [
      `Contract: ${arcMarketplaceContract || "use the saved ArcMarketplaceOrders contract from step 52"}`,
      `Title: ${marketplaceTitle}`,
      `Price: ${productPlan.marketplacePrice} native USDC`,
      "Click Refresh, then Buy Order.",
    ],
    proof: "Save purchase txHash/explorer link and orderId.",
  },
  {
    title: "54. ArcMarketplace Fulfill Order",
    url: `${BASE_URL}/public/arc-marketplace.html`,
    fields: [
      `Contract: ${arcMarketplaceContract || "use the saved ArcMarketplaceOrders contract from step 52"}`,
      `Title: ${marketplaceTitle}`,
      `Fulfillment URI: ${marketplaceFulfillmentURI}`,
      "Click Fulfill Order after the purchase confirms.",
    ],
    proof: "Save fulfillOrder txHash/explorer link and fulfillment URI.",
  },
  {
    title: "54A. ArcMarketplace Request Return",
    url: `${BASE_URL}/public/arc-marketplace.html`,
    fields: [
      `Contract: ${arcMarketplaceContract || "use the saved ArcMarketplaceOrders contract from step 52"}`,
      "Requires the newer ArcMarketplaceOrders deployment with return functions.",
      `Title: ${marketplaceTitle}`,
      "Order ID: use the purchased order shown on the page.",
      `Return reason URI: ${marketplaceReturnReasonURI}`,
      "Click Request Return after fulfillment confirms.",
    ],
    proof: "Save requestReturn txHash/explorer link and return status = requested.",
  },
  {
    title: "54B. ArcMarketplace Review Return",
    url: `${BASE_URL}/public/arc-marketplace.html`,
    fields: [
      `Contract: ${arcMarketplaceContract || "use the saved ArcMarketplaceOrders contract from step 52"}`,
      `Title: ${marketplaceTitle}`,
      `Review result: ${marketplaceReturnAccepted ? "approve" : "reject"}`,
      `Review URI: ${marketplaceReturnReviewURI}`,
      "Click Review Return after the request confirms.",
    ],
    proof: "Save reviewReturn txHash/explorer link and return status = approved/rejected.",
  },
  {
    title: "54C. ArcMarketplace Close Return",
    url: `${BASE_URL}/public/arc-marketplace.html`,
    fields: [
      `Contract: ${arcMarketplaceContract || "use the saved ArcMarketplaceOrders contract from step 52"}`,
      `Title: ${marketplaceTitle}`,
      `Close URI: ${marketplaceReturnCloseURI}`,
      "Click Close Return after review confirms.",
    ],
    proof: "Save closeReturn txHash/explorer link and final return status = closed.",
  },
  {
    title: "55. ArcMarketplace Settle Listing",
    url: `${BASE_URL}/public/arc-marketplace.html`,
    fields: [
      `Contract: ${arcMarketplaceContract || "use the saved ArcMarketplaceOrders contract from step 52"}`,
      `Title: ${marketplaceTitle}`,
      `Settlement to: ${metamaskAddress}`,
      `Expected settlement: ${productPlan.marketplacePrice} native USDC`,
      "Click Settle Listing after fulfillment.",
    ],
    proof: "Save settleListing txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "56. ArcService Create Service",
    url: `${BASE_URL}/public/arc-service-bookings.html`,
    fields: [
      `Contract: ${arcServiceBookingsContract || "deploy once, then save address and set ARCSERVICEBOOKINGS_CONTRACT in .env"}`,
      `Title: ${serviceTitle}`,
      `Treasury: ${metamaskAddress}`,
      `Metadata URI: local:${serviceTitle}`,
      `Price: ${productPlan.servicePrice} native USDC`,
      `Max bookings: ${productPlan.serviceMaxBookings}`,
      "If no service bookings contract exists, deploy once, save the contract, then Create Service.",
    ],
    proof: "Save deploy tx if new, then save createService txHash/explorer link and serviceId.",
  },
  {
    title: "57. ArcService Book Service",
    url: `${BASE_URL}/public/arc-service-bookings.html`,
    fields: [
      `Contract: ${arcServiceBookingsContract || "use the saved ArcServiceBookings contract from step 56"}`,
      `Title: ${serviceTitle}`,
      `Price: ${productPlan.servicePrice} native USDC`,
      "Click Refresh, then Book Service.",
    ],
    proof: "Save bookService txHash/explorer link and bookingId.",
  },
  {
    title: "58. ArcService Complete Booking",
    url: `${BASE_URL}/public/arc-service-bookings.html`,
    fields: [
      `Contract: ${arcServiceBookingsContract || "use the saved ArcServiceBookings contract from step 56"}`,
      `Title: ${serviceTitle}`,
      `Completion URI: ${serviceCompletionURI}`,
      "Click Complete Booking after the booking confirms.",
    ],
    proof: "Save completeBooking txHash/explorer link and completion URI.",
  },
  {
    title: "59. ArcService Settle Service",
    url: `${BASE_URL}/public/arc-service-bookings.html`,
    fields: [
      `Contract: ${arcServiceBookingsContract || "use the saved ArcServiceBookings contract from step 56"}`,
      `Title: ${serviceTitle}`,
      `Settlement to: ${metamaskAddress}`,
      `Expected settlement: ${productPlan.servicePrice} native USDC`,
      "Click Settle Service after completion.",
    ],
    proof: "Save settleService txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "59A. ArcWorkOrder Create",
    url: `${BASE_URL}/public/arc-service-bookings.html`,
    fields: [
      `Contract: ${arcServiceBookingsContract || "deploy a newer ArcServiceBookings contract with WorkOrder support"}`,
      "Requires the newer ArcServiceBookings deployment with work order functions.",
      `Work title: ${workOrderTitle}`,
      `Worker: ${metamaskAddress}`,
      `Amount: ${productPlan.workOrderAmount} native USDC`,
      `Brief URI: ${workOrderBriefURI}`,
      "Create Work Order and save the workOrderId.",
    ],
    proof: "Save createWorkOrder txHash/explorer link and workOrderId.",
  },
  {
    title: "59B. ArcWorkOrder Accept",
    url: `${BASE_URL}/public/arc-service-bookings.html`,
    fields: [
      `Contract: ${arcServiceBookingsContract || "use the saved ArcServiceBookings contract from step 59A"}`,
      `Work title: ${workOrderTitle}`,
      "Click Refresh Work Order, then Accept.",
    ],
    proof: "Save acceptWorkOrder txHash/explorer link and status = accepted.",
  },
  {
    title: "59C. ArcWorkOrder Submit",
    url: `${BASE_URL}/public/arc-service-bookings.html`,
    fields: [
      `Contract: ${arcServiceBookingsContract || "use the saved ArcServiceBookings contract from step 59A"}`,
      `Work title: ${workOrderTitle}`,
      `Submission URI: ${workOrderSubmissionURI}`,
      "Click Submit after acceptance confirms.",
    ],
    proof: "Save submitWorkOrder txHash/explorer link and submission URI.",
  },
  {
    title: "59D. ArcWorkOrder Approve Payout",
    url: `${BASE_URL}/public/arc-service-bookings.html`,
    fields: [
      `Contract: ${arcServiceBookingsContract || "use the saved ArcServiceBookings contract from step 59A"}`,
      `Work title: ${workOrderTitle}`,
      `Payout to worker: ${metamaskAddress}`,
      `Approval URI: ${workOrderApprovalURI}`,
      `Expected payout: ${productPlan.workOrderAmount} native USDC`,
      "Click Approve Payout after submission confirms.",
    ],
    proof: "Save approveWorkOrder txHash/explorer link and final status = approved.",
  },
  {
    title: "60. ArcDonation Create Campaign",
    url: `${BASE_URL}/public/arc-donation.html`,
    fields: [
      `Contract: ${arcDonationContract || "deploy once, then save address and set ARCDONATION_CONTRACT in .env"}`,
      `Title: ${donationTitle}`,
      `Treasury: ${metamaskAddress}`,
      `Metadata URI: local:${donationTitle}`,
      `Goal amount: ${productPlan.donationGoal} native USDC`,
      "If no donation contract exists, deploy once, save the contract, then Create Campaign.",
    ],
    proof: "Save deploy tx if new, then save createCampaign txHash/explorer link and campaignId.",
  },
  {
    title: "61. ArcDonation Donate",
    url: `${BASE_URL}/public/arc-donation.html`,
    fields: [
      `Contract: ${arcDonationContract || "use the saved ArcDonationJar contract from step 60"}`,
      `Title: ${donationTitle}`,
      `Donation amount: ${productPlan.donationAmount} native USDC`,
      `Message: ${donationMessage}`,
      "Click Refresh, then Donate.",
    ],
    proof: "Save donate txHash/explorer link and donationId.",
  },
  {
    title: "62. ArcDonation Withdraw",
    url: `${BASE_URL}/public/arc-donation.html`,
    fields: [
      `Contract: ${arcDonationContract || "use the saved ArcDonationJar contract from step 60"}`,
      `Title: ${donationTitle}`,
      `Withdraw amount: ${productPlan.donationAmount} native USDC`,
      `Withdraw to: ${metamaskAddress}`,
      "Click Withdraw after the donation confirms.",
    ],
    proof: "Save withdrawCampaign txHash/explorer link and final campaign available amount = 0.",
  },
  {
    title: "63. ArcPreorder Create Product",
    url: `${BASE_URL}/public/arc-preorder.html`,
    fields: [
      `Contract: ${arcPreorderContract || "deploy once, then save address and set ARCPREORDER_CONTRACT in .env"}`,
      `Title: ${preorderTitle}`,
      `Treasury: ${metamaskAddress}`,
      `Metadata URI: local:${preorderTitle}`,
      `Price: ${productPlan.preorderPrice} native USDC`,
      `Max supply: ${productPlan.preorderMaxSupply}`,
      "If no preorder contract exists, deploy once, save the contract, then Create Product.",
    ],
    proof: "Save deploy tx if new, then save createProduct txHash/explorer link and productId.",
  },
  {
    title: "64. ArcPreorder Place Preorder",
    url: `${BASE_URL}/public/arc-preorder.html`,
    fields: [
      `Contract: ${arcPreorderContract || "use the saved ArcPreorderStore contract from step 63"}`,
      `Title: ${preorderTitle}`,
      `Price: ${productPlan.preorderPrice} native USDC`,
      "Click Refresh, then Place Preorder.",
    ],
    proof: "Save preorder txHash/explorer link and preorderId.",
  },
  {
    title: "65. ArcPreorder Fulfill Preorder",
    url: `${BASE_URL}/public/arc-preorder.html`,
    fields: [
      `Contract: ${arcPreorderContract || "use the saved ArcPreorderStore contract from step 63"}`,
      `Title: ${preorderTitle}`,
      `Fulfillment URI: ${preorderFulfillmentURI}`,
      "Click Fulfill Preorder after the preorder confirms.",
    ],
    proof: "Save fulfillPreorder txHash/explorer link and fulfillment URI.",
  },
  {
    title: "66. ArcPreorder Settle Product",
    url: `${BASE_URL}/public/arc-preorder.html`,
    fields: [
      `Contract: ${arcPreorderContract || "use the saved ArcPreorderStore contract from step 63"}`,
      `Title: ${preorderTitle}`,
      `Settlement to: ${metamaskAddress}`,
      `Expected settlement: ${productPlan.preorderPrice} native USDC`,
      "Click Settle Product after fulfillment.",
    ],
    proof: "Save settleProduct txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "67. ArcPayroll Create Payroll",
    url: `${BASE_URL}/public/arc-payroll.html`,
    fields: [
      `Contract: ${arcPayrollContract || "deploy once, then save address and set ARCPAYROLL_CONTRACT in .env"}`,
      `Reference: ${payrollReference}`,
      `Worker: ${metamaskAddress}`,
      `Metadata URI: local:${payrollReference}`,
      `Amount: ${productPlan.payrollAmount} native USDC`,
      "Claim after: 0 / immediate",
      "If no payroll contract exists, deploy once, save the contract, then Create Payroll.",
    ],
    proof: "Save deploy tx if new, then save createPayroll txHash/explorer link and payrollId.",
  },
  {
    title: "68. ArcPayroll Claim Payroll",
    url: `${BASE_URL}/public/arc-payroll.html`,
    fields: [
      `Contract: ${arcPayrollContract || "use the saved ArcPayrollVault contract from step 67"}`,
      `Reference: ${payrollReference}`,
      `Claim to: ${metamaskAddress}`,
      `Claim URI: ${payrollClaimURI}`,
      `Expected claim: ${productPlan.payrollAmount} native USDC`,
      "Click Refresh, then Claim Payroll.",
    ],
    proof: "Save claimPayroll txHash/explorer link and claimed amount.",
  },
  {
    title: "69. ArcPayroll Close Payroll",
    url: `${BASE_URL}/public/arc-payroll.html`,
    fields: [
      `Contract: ${arcPayrollContract || "use the saved ArcPayrollVault contract from step 67"}`,
      `Reference: ${payrollReference}`,
      `Refund to: ${metamaskAddress}`,
      "Expected refund: 0 native USDC after claim",
      "Click Close Payroll after the claim confirms.",
    ],
    proof: "Save closePayroll txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "70. ArcDeposit Create Refundable Deposit",
    url: `${BASE_URL}/public/arc-refundable-deposit.html`,
    fields: [
      `Contract: ${
        arcRefundableDepositContract || "deploy once, then save address and set ARCREFUNDABLEDEPOSIT_CONTRACT in .env"
      }`,
      `Label: ${refundableDepositLabel}`,
      `Beneficiary: ${circleWalletAddress}`,
      `Metadata URI: local:${refundableDepositLabel}`,
      `Amount: ${productPlan.refundableDepositAmount} native USDC`,
      "Deadline: 0 / immediate resolution",
      "If no refundable deposit contract exists, deploy once, save the contract, then Create Deposit.",
    ],
    proof: "Save deploy tx if new, then save createDeposit txHash/explorer link and depositId.",
  },
  {
    title: "71. ArcDeposit Resolve Refundable Deposit",
    url: `${BASE_URL}/public/arc-refundable-deposit.html`,
    fields: [
      `Contract: ${arcRefundableDepositContract || "use the saved ArcRefundableDeposit contract from step 70"}`,
      `Label: ${refundableDepositLabel}`,
      `Action: ${productPlan.refundableDepositOutcome}`,
      refundableDepositAction,
      `Resolution URI: ${refundableDepositResolutionURI}`,
      refundableDepositResult,
      productPlan.refundableDepositOutcome === "refund" ? "Click Refund Deposit." : "Click Forfeit Deposit.",
    ],
    proof: "Save refundDeposit or forfeitDeposit txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "72. ArcInstallment Create Agreement",
    url: `${BASE_URL}/public/arc-installments.html`,
    fields: [
      `Contract: ${arcInstallmentsContract || "deploy once, then save address and set ARCINSTALLMENTS_CONTRACT in .env"}`,
      `Label: ${installmentLabel}`,
      `Merchant: ${circleWalletAddress}`,
      "Installments: 2",
      `Installment amount: ${productPlan.installmentAmount} native USDC`,
      `Metadata URI: local:${installmentLabel}`,
      "If no installment contract exists, deploy once, save the contract, then Create Agreement.",
    ],
    proof: "Save deploy tx if new, then save createAgreement txHash/explorer link and agreementId.",
  },
  {
    title: "73. ArcInstallment Pay 1",
    url: `${BASE_URL}/public/arc-installments.html`,
    fields: [
      `Contract: ${arcInstallmentsContract || "use the saved ArcInstallmentPayments contract from step 72"}`,
      `Label: ${installmentLabel}`,
      `Payment URI: ${installmentPaymentOneURI}`,
      `Payment amount: ${productPlan.installmentAmount} native USDC`,
      "Click Refresh, then Pay Installment.",
    ],
    proof: "Save first payInstallment txHash/explorer link and progress 1 / 2.",
  },
  {
    title: "74. ArcInstallment Pay 2",
    url: `${BASE_URL}/public/arc-installments.html`,
    fields: [
      `Contract: ${arcInstallmentsContract || "use the saved ArcInstallmentPayments contract from step 72"}`,
      `Label: ${installmentLabel}`,
      `Payment URI: ${installmentPaymentTwoURI}`,
      `Payment amount: ${productPlan.installmentAmount} native USDC`,
      "Click Pay Installment again after the first payment confirms.",
    ],
    proof: "Save second payInstallment txHash/explorer link and progress 2 / 2.",
  },
  {
    title: "75. ArcInstallment Complete Agreement",
    url: `${BASE_URL}/public/arc-installments.html`,
    fields: [
      `Contract: ${arcInstallmentsContract || "use the saved ArcInstallmentPayments contract from step 72"}`,
      `Label: ${installmentLabel}`,
      `Completion URI: ${installmentCompletionURI}`,
      `Expected paid total: ${productPlan.installmentAmount} x 2 native USDC`,
      "Click Complete Agreement after both installments confirm.",
    ],
    proof: "Save completeAgreement txHash/explorer link and final agreement status = completed.",
  },
  {
    title: "76. ArcVesting Create Grant",
    url: `${BASE_URL}/public/arc-vesting.html`,
    fields: [
      `Contract: ${arcVestingContract || "deploy once, then save address and set ARCVESTING_CONTRACT in .env"}`,
      `Label: ${vestingLabel}`,
      `Beneficiary: ${metamaskAddress}`,
      `Metadata URI: local:${vestingLabel}`,
      `Amount: ${productPlan.vestingAmount} native USDC`,
      "Unlock time: 0 / immediate",
      "If no vesting contract exists, deploy once, save the contract, then Create Vesting.",
    ],
    proof: "Save deploy tx if new, then save createVesting txHash/explorer link and grantId.",
  },
  {
    title: "77. ArcVesting Claim Grant",
    url: `${BASE_URL}/public/arc-vesting.html`,
    fields: [
      `Contract: ${arcVestingContract || "use the saved ArcVestingVault contract from step 76"}`,
      `Label: ${vestingLabel}`,
      `Claim to: ${metamaskAddress}`,
      `Claim URI: ${vestingClaimURI}`,
      `Expected claim: ${productPlan.vestingAmount} native USDC`,
      "Click Refresh, then Claim Vesting.",
    ],
    proof: "Save claimVesting txHash/explorer link and claimed amount.",
  },
  {
    title: "78. ArcVesting Close Grant",
    url: `${BASE_URL}/public/arc-vesting.html`,
    fields: [
      `Contract: ${arcVestingContract || "use the saved ArcVestingVault contract from step 76"}`,
      `Label: ${vestingLabel}`,
      `Refund to: ${metamaskAddress}`,
      "Expected refund: 0 native USDC after claim",
      "Click Close Vesting after the claim confirms.",
    ],
    proof: "Save closeVesting txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "79. ArcGiftCard Create Card",
    url: `${BASE_URL}/public/arc-gift-card.html`,
    fields: [
      `Contract: ${arcGiftCardContract || "deploy once, then save address and set ARCGIFTCARD_CONTRACT in .env"}`,
      `Label: ${giftCardLabel}`,
      `Recipient: ${metamaskAddress}`,
      `Metadata URI: local:${giftCardLabel}`,
      `Amount: ${productPlan.giftCardAmount} native USDC`,
      "Expires at: 0 / no expiry",
      "If no gift card contract exists, deploy once, save the contract, then Create Gift Card.",
    ],
    proof: "Save deploy tx if new, then save createGiftCard txHash/explorer link and cardId.",
  },
  {
    title: "80. ArcGiftCard Redeem Card",
    url: `${BASE_URL}/public/arc-gift-card.html`,
    fields: [
      `Contract: ${arcGiftCardContract || "use the saved ArcGiftCardVault contract from step 79"}`,
      `Label: ${giftCardLabel}`,
      `Redeem to: ${metamaskAddress}`,
      `Redeem URI: ${giftCardRedeemURI}`,
      `Expected redeem: ${productPlan.giftCardAmount} native USDC`,
      "Click Refresh, then Redeem Gift Card.",
    ],
    proof: "Save redeemGiftCard txHash/explorer link and redeemed amount.",
  },
  {
    title: "81. ArcGiftCard Close Card",
    url: `${BASE_URL}/public/arc-gift-card.html`,
    fields: [
      `Contract: ${arcGiftCardContract || "use the saved ArcGiftCardVault contract from step 79"}`,
      `Label: ${giftCardLabel}`,
      `Refund to: ${metamaskAddress}`,
      "Expected refund: 0 native USDC after redeem",
      "Click Close Gift Card after the redeem confirms.",
    ],
    proof: "Save closeGiftCard txHash/explorer link and final card redeemed/remaining amount.",
  },
  {
    title: "82. ArcReward Create Reward",
    url: `${BASE_URL}/public/arc-reward.html`,
    fields: [
      `Contract: ${arcRewardContract || "deploy once, then save address and set ARCREWARD_CONTRACT in .env"}`,
      `Label: ${rewardLabel}`,
      `Recipient: ${metamaskAddress}`,
      `Metadata URI: local:${rewardLabel}`,
      `Amount: ${productPlan.rewardAmount} native USDC`,
      "Expires at: 0 / no expiry",
      "If no reward contract exists, deploy once, save the contract, then Create Reward.",
    ],
    proof: "Save deploy tx if new, then save createReward txHash/explorer link and rewardId.",
  },
  {
    title: "83. ArcReward Claim Reward",
    url: `${BASE_URL}/public/arc-reward.html`,
    fields: [
      `Contract: ${arcRewardContract || "use the saved ArcRewardVault contract from step 82"}`,
      `Label: ${rewardLabel}`,
      `Claim to: ${metamaskAddress}`,
      `Claim URI: ${rewardClaimURI}`,
      `Expected claim: ${productPlan.rewardAmount} native USDC`,
      "Click Refresh, then Claim Reward.",
    ],
    proof: "Save claimReward txHash/explorer link and claimed amount.",
  },
  {
    title: "84. ArcReward Close Reward",
    url: `${BASE_URL}/public/arc-reward.html`,
    fields: [
      `Contract: ${arcRewardContract || "use the saved ArcRewardVault contract from step 82"}`,
      `Label: ${rewardLabel}`,
      `Refund to: ${metamaskAddress}`,
      "Expected refund: 0 native USDC after claim",
      "Click Close Reward after the claim confirms.",
    ],
    proof: "Save closeReward txHash/explorer link and final reward claimed/remaining amount.",
  },
  {
    title: "85. ArcCoupon Create Coupon",
    url: `${BASE_URL}/public/arc-coupon.html`,
    fields: [
      `Contract: ${arcCouponContract || "deploy once, then save address and set ARCCOUPON_CONTRACT in .env"}`,
      `Label: ${couponLabel}`,
      `Recipient: ${metamaskAddress}`,
      `Metadata URI: local:${couponLabel}`,
      `Amount: ${productPlan.couponAmount} native USDC`,
      "Expires at: 0 / no expiry",
      "If no coupon contract exists, deploy once, save the contract, then Create Coupon.",
    ],
    proof: "Save deploy tx if new, then save createCoupon txHash/explorer link and couponId.",
  },
  {
    title: "86. ArcCoupon Claim Coupon",
    url: `${BASE_URL}/public/arc-coupon.html`,
    fields: [
      `Contract: ${arcCouponContract || "use the saved ArcCouponVault contract from step 85"}`,
      `Label: ${couponLabel}`,
      `Claim to: ${metamaskAddress}`,
      `Claim URI: ${couponClaimURI}`,
      `Expected claim: ${productPlan.couponAmount} native USDC`,
      "Click Refresh, then Claim Coupon.",
    ],
    proof: "Save claimCoupon txHash/explorer link and claimed amount.",
  },
  {
    title: "87. ArcCoupon Close Coupon",
    url: `${BASE_URL}/public/arc-coupon.html`,
    fields: [
      `Contract: ${arcCouponContract || "use the saved ArcCouponVault contract from step 85"}`,
      `Label: ${couponLabel}`,
      `Refund to: ${metamaskAddress}`,
      "Expected refund: 0 native USDC after claim",
      "Click Close Coupon after the claim confirms.",
    ],
    proof: "Save closeCoupon txHash/explorer link and final coupon claimed/remaining amount.",
  },
  {
    title: "88. ArcReferral Create Campaign",
    url: `${BASE_URL}/public/arc-referral.html`,
    fields: [
      `Contract: ${arcReferralContract || "deploy once, then save address and set ARCREFERRAL_CONTRACT in .env"}`,
      `Label: ${referralLabel}`,
      `Recipient: ${metamaskAddress}`,
      `Metadata URI: local:${referralLabel}`,
      `Amount: ${productPlan.referralAmount} native USDC`,
      "Expires at: 0 / no expiry",
      "If no referral contract exists, deploy once, save the contract, then Create Referral.",
    ],
    proof: "Save deploy tx if new, then save createReferral txHash/explorer link and referralId.",
  },
  {
    title: "89. ArcReferral Claim Referral",
    url: `${BASE_URL}/public/arc-referral.html`,
    fields: [
      `Contract: ${arcReferralContract || "use the saved ArcReferralVault contract from step 88"}`,
      `Label: ${referralLabel}`,
      `Claim to: ${metamaskAddress}`,
      `Claim URI: ${referralClaimURI}`,
      `Expected claim: ${productPlan.referralAmount} native USDC`,
      "Click Refresh, then Claim Referral.",
    ],
    proof: "Save claimReferral txHash/explorer link and claimed amount.",
  },
  {
    title: "90. ArcReferral Close Referral",
    url: `${BASE_URL}/public/arc-referral.html`,
    fields: [
      `Contract: ${arcReferralContract || "use the saved ArcReferralVault contract from step 88"}`,
      `Label: ${referralLabel}`,
      `Refund to: ${metamaskAddress}`,
      "Expected refund: 0 native USDC after claim",
      "Click Close Referral after the claim confirms.",
    ],
    proof: "Save closeReferral txHash/explorer link and final referral claimed/remaining amount.",
  },
  {
    title: "91. ArcCashback Create Cashback",
    url: `${BASE_URL}/public/arc-cashback.html`,
    fields: [
      `Contract: ${arcCashbackContract || "deploy once, then save address and set ARCCASHBACK_CONTRACT in .env"}`,
      `Label: ${cashbackLabel}`,
      `Recipient: ${metamaskAddress}`,
      `Metadata URI: local:${cashbackLabel}`,
      `Amount: ${productPlan.cashbackAmount} native USDC`,
      "Expires at: 0 / no expiry",
      "If no cashback contract exists, deploy once, save the contract, then Create Cashback.",
    ],
    proof: "Save deploy tx if new, then save createCashback txHash/explorer link and cashbackId.",
  },
  {
    title: "92. ArcCashback Claim Cashback",
    url: `${BASE_URL}/public/arc-cashback.html`,
    fields: [
      `Contract: ${arcCashbackContract || "use the saved ArcCashbackVault contract from step 91"}`,
      `Label: ${cashbackLabel}`,
      `Claim to: ${metamaskAddress}`,
      `Claim URI: ${cashbackClaimURI}`,
      `Expected claim: ${productPlan.cashbackAmount} native USDC`,
      "Click Refresh, then Claim Cashback.",
    ],
    proof: "Save claimCashback txHash/explorer link and claimed amount.",
  },
  {
    title: "93. ArcCashback Close Cashback",
    url: `${BASE_URL}/public/arc-cashback.html`,
    fields: [
      `Contract: ${arcCashbackContract || "use the saved ArcCashbackVault contract from step 91"}`,
      `Label: ${cashbackLabel}`,
      `Refund to: ${metamaskAddress}`,
      "Expected refund: 0 native USDC after claim",
      "Click Close Cashback after the claim confirms.",
    ],
    proof: "Save closeCashback txHash/explorer link and final cashback claimed/remaining amount.",
  },
  {
    title: "94. ArcAuction Create Auction",
    url: `${BASE_URL}/public/arc-auction.html`,
    fields: [
      `Contract: ${arcAuctionContract || "deploy once, then save address and set ARCAUCTION_CONTRACT in .env"}`,
      `Title: ${auctionTitle}`,
      `Settlement to: ${metamaskAddress}`,
      `Metadata URI: local:${auctionTitle}`,
      `Minimum bid: ${productPlan.auctionMinBid} native USDC`,
      "Duration minutes: 0 / immediate settlement",
      "If no auction contract exists, deploy once, save the contract, then Create Auction.",
    ],
    proof: "Save deploy tx if new, then save createAuction txHash/explorer link and auctionId.",
  },
  {
    title: "95. ArcAuction First Bid",
    url: `${BASE_URL}/public/arc-auction.html`,
    fields: [
      `Contract: ${arcAuctionContract || "use the saved ArcAuctionHouse contract from step 94"}`,
      `Title: ${auctionTitle}`,
      `Bid amount: ${productPlan.auctionMinBid} native USDC`,
      "Click Refresh, then Place Bid.",
    ],
    proof: "Save bid txHash/explorer link and highestBid.",
  },
  {
    title: "96. ArcAuction Raise Bid",
    url: `${BASE_URL}/public/arc-auction.html`,
    fields: [
      `Contract: ${arcAuctionContract || "use the saved ArcAuctionHouse contract from step 94"}`,
      `Title: ${auctionTitle}`,
      `Raise bid amount: ${productPlan.auctionRaiseBid} native USDC`,
      "This replaces the previous highest bid and refunds the prior bid.",
    ],
    proof: "Save raise bid txHash/explorer link, bidCount, highestBid, and refund behavior.",
  },
  {
    title: "97. ArcAuction Settle Auction",
    url: `${BASE_URL}/public/arc-auction.html`,
    fields: [
      `Contract: ${arcAuctionContract || "use the saved ArcAuctionHouse contract from step 94"}`,
      `Title: ${auctionTitle}`,
      `Settlement URI: ${auctionSettlementURI}`,
      `Expected settlement: ${productPlan.auctionRaiseBid} native USDC`,
      "Click Settle Auction after the raised bid confirms.",
    ],
    proof: "Save settleAuction txHash/explorer link and final status = settled.",
  },
  {
    title: "97A. ArcAuction Create Cancel Test",
    url: `${BASE_URL}/public/arc-auction.html`,
    fields: [
      `Contract: ${arcAuctionContract || "use the saved ArcAuctionHouse contract from step 94"}`,
      `Title: ${auctionCancelTitle}`,
      `Settlement to: ${metamaskAddress}`,
      `Metadata URI: local:${auctionCancelTitle}`,
      `Minimum bid: ${productPlan.auctionMinBid} native USDC`,
      "Duration minutes: 0 / immediate cancellation allowed",
      "Create a separate auction for the cancel/refund path.",
    ],
    proof: "Save createAuction txHash/explorer link and cancel-test auctionId.",
  },
  {
    title: "97B. ArcAuction Bid Cancel Test",
    url: `${BASE_URL}/public/arc-auction.html`,
    fields: [
      `Contract: ${arcAuctionContract || "use the saved ArcAuctionHouse contract from step 94"}`,
      `Title: ${auctionCancelTitle}`,
      `Bid amount: ${productPlan.auctionMinBid} native USDC`,
      "Click Refresh, then Place Bid.",
    ],
    proof: "Save bid txHash/explorer link and highestBid before cancellation.",
  },
  {
    title: "97C. ArcAuction Cancel Auction",
    url: `${BASE_URL}/public/arc-auction.html`,
    fields: [
      `Contract: ${arcAuctionContract || "use the saved ArcAuctionHouse contract from step 94"}`,
      `Title: ${auctionCancelTitle}`,
      `Cancel URI: ${auctionCancelURI}`,
      `Expected refund: ${productPlan.auctionMinBid} native USDC back to the highest bidder.`,
      "Click Cancel Auction after the bid confirms.",
    ],
    proof: "Save cancelAuction txHash/explorer link and final status = canceled.",
  },
  {
    title: "98. ArcRental Create Rental",
    url: `${BASE_URL}/public/arc-rental.html`,
    fields: [
      `Contract: ${arcRentalContract || "deploy once, then save address and set ARCRENTAL_CONTRACT in .env"}`,
      `Title: ${rentalTitle}`,
      `Payout to: ${metamaskAddress}`,
      `Metadata URI: local:${rentalTitle}`,
      `Rental fee: ${productPlan.rentalFee} native USDC`,
      `Deposit: ${productPlan.rentalDeposit} native USDC`,
      "If no rental contract exists, deploy once, save the contract, then Create Rental.",
    ],
    proof: "Save deploy tx if new, then save createRental txHash/explorer link and rentalId.",
  },
  {
    title: "99. ArcRental Book Rental",
    url: `${BASE_URL}/public/arc-rental.html`,
    fields: [
      `Contract: ${arcRentalContract || "use the saved ArcRentalEscrow contract from step 98"}`,
      `Title: ${rentalTitle}`,
      `Payment total: ${productPlan.rentalFee} fee + ${productPlan.rentalDeposit} deposit native USDC`,
      "Click Refresh, then Book Rental.",
    ],
    proof: "Save bookRental txHash/explorer link and paidTotal.",
  },
  {
    title: "100. ArcRental Return Rental",
    url: `${BASE_URL}/public/arc-rental.html`,
    fields: [
      `Contract: ${arcRentalContract || "use the saved ArcRentalEscrow contract from step 98"}`,
      `Title: ${rentalTitle}`,
      `Damage fee: ${productPlan.rentalDamageFee} native USDC`,
      `Refund to: ${metamaskAddress}`,
      `Return URI: ${rentalReturnURI}`,
      "Click Return Rental after the booking confirms.",
    ],
    proof: "Save returnRental txHash/explorer link and final contract balance = 0.",
  },
  {
    title: "101. ArcWarranty Register",
    url: `${BASE_URL}/public/arc-warranty.html`,
    fields: [
      `Contract: ${arcWarrantyContract || "deploy once, then save address and set ARCWARRANTY_CONTRACT in .env"}`,
      `Title: ${warrantyTitle}`,
      `Product ref: ${warrantyTitle}`,
      `Service provider: ${metamaskAddress}`,
      `Metadata URI: local:${warrantyTitle}`,
      `Expires days: ${productPlan.warrantyExpiresDays}`,
      "Value transfer: 0 native USDC",
      "If no warranty contract exists, deploy once, save the contract, then Register Warranty.",
    ],
    proof: "Save deploy tx if new, then save registerWarranty txHash/explorer link and warrantyId.",
  },
  {
    title: "102. ArcWarranty Open Claim",
    url: `${BASE_URL}/public/arc-warranty.html`,
    fields: [
      `Contract: ${arcWarrantyContract || "use the saved ArcWarrantyRegistry contract from step 101"}`,
      `Title: ${warrantyTitle}`,
      `Claim URI: ${warrantyClaimURI}`,
      "Value transfer: 0 native USDC",
      "Click Refresh, then Open Claim.",
    ],
    proof: "Save openClaim txHash/explorer link and claim URI.",
  },
  {
    title: "103. ArcWarranty Resolve Claim",
    url: `${BASE_URL}/public/arc-warranty.html`,
    fields: [
      `Contract: ${arcWarrantyContract || "use the saved ArcWarrantyRegistry contract from step 101"}`,
      `Title: ${warrantyTitle}`,
      `Resolution URI: ${warrantyResolutionURI}`,
      "Value transfer: 0 native USDC",
      "Click Resolve Claim after the claim opens.",
    ],
    proof: "Save resolveClaim txHash/explorer link and final status = resolved.",
  },
  {
    title: "104. ArcSupport Create Ticket",
    url: `${BASE_URL}/public/arc-support-desk.html`,
    fields: [
      `Contract: ${arcSupportDeskContract || "deploy once, then save address and set ARCSUPPORTDESK_CONTRACT in .env"}`,
      `Title: ${supportTitle}`,
      `Ticket ref: ${supportTitle}`,
      `Category: ${productPlan.supportCategory}`,
      `Agent: ${metamaskAddress}`,
      `Metadata URI: local:${supportTitle}`,
      "Value transfer: 0 native USDC",
      "If no support desk contract exists, deploy once, save the contract, then Create Ticket.",
    ],
    proof: "Save deploy tx if new, then save createTicket txHash/explorer link and ticketId.",
  },
  {
    title: "105. ArcSupport Respond",
    url: `${BASE_URL}/public/arc-support-desk.html`,
    fields: [
      `Contract: ${arcSupportDeskContract || "use the saved ArcSupportDesk contract from step 104"}`,
      `Title: ${supportTitle}`,
      `Response URI: ${supportResponseURI}`,
      "Value transfer: 0 native USDC",
      "Click Refresh, then Respond.",
    ],
    proof: "Save respondTicket txHash/explorer link and response URI.",
  },
  {
    title: "106. ArcSupport Close Ticket",
    url: `${BASE_URL}/public/arc-support-desk.html`,
    fields: [
      `Contract: ${arcSupportDeskContract || "use the saved ArcSupportDesk contract from step 104"}`,
      `Title: ${supportTitle}`,
      `Close URI: ${supportCloseURI}`,
      "Value transfer: 0 native USDC",
      "Click Close Ticket after the response confirms.",
    ],
    proof: "Save closeTicket txHash/explorer link and final status = closed.",
  },
  {
    title: "107. ArcAccess Request",
    url: `${BASE_URL}/public/arc-access.html`,
    fields: [
      `Contract: ${arcAccessContract || "deploy once, then save address and set ARCACCESS_CONTRACT in .env"}`,
      `Title: ${accessTitle}`,
      `Access ref: ${accessTitle}`,
      `Role: ${productPlan.accessRole}`,
      `Approver: ${metamaskAddress}`,
      `Metadata URI: local:${accessTitle}`,
      "Value transfer: 0 native USDC",
      "If no access registry contract exists, deploy once, save the contract, then Request Access.",
    ],
    proof: "Save deploy tx if new, then save requestAccess txHash/explorer link and accessId.",
  },
  {
    title: "108. ArcAccess Approve",
    url: `${BASE_URL}/public/arc-access.html`,
    fields: [
      `Contract: ${arcAccessContract || "use the saved ArcAccessRegistry contract from step 107"}`,
      `Title: ${accessTitle}`,
      `Approval URI: ${accessApprovalURI}`,
      "Value transfer: 0 native USDC",
      "Click Refresh, then Approve Access.",
    ],
    proof: "Save approveAccess txHash/explorer link and approval URI.",
  },
  {
    title: "109. ArcAccess Revoke",
    url: `${BASE_URL}/public/arc-access.html`,
    fields: [
      `Contract: ${arcAccessContract || "use the saved ArcAccessRegistry contract from step 107"}`,
      `Title: ${accessTitle}`,
      `Revoke URI: ${accessRevokeURI}`,
      "Value transfer: 0 native USDC",
      "Click Revoke Access after approval confirms.",
    ],
    proof: "Save revokeAccess txHash/explorer link and final status = revoked.",
  },
];

function printStep(step: Step): void {
  console.log(step.title);
  if (step.url) {
    console.log(`  URL: ${step.url}`);
  }
  if (step.command) {
    console.log(`  Command: ${step.command}`);
  }
  for (const field of step.fields) {
    console.log(`  - ${field}`);
  }
  console.log(`  Proof: ${step.proof}`);
  console.log("");
}

console.log("Arc demo checklist");
console.log(`Date: ${cycleDate}`);
console.log(`Variant: ${planIndex + 1}/${demoPlans.length}`);
console.log("Purpose: guide a reviewer through Circle/Arc feature usage and product-style state changes.");
console.log("Server: npm.cmd run start-deployer");
console.log(`ArcScan: https://testnet.arcscan.app/address/${metamaskAddress}`);
console.log("");

for (const step of steps) {
  printStep(step);
}

console.log("For demos, keep selected txHash/explorer links together in one note.");

