# Arc Demo Workflow

Run this before a local demo or validation pass:

```powershell
cd C:\Users\Nexus\Documents\Circle
npm.cmd run cycle:prepare
npm.cmd run start-deployer
```

Keep the server window open, then follow the printed checklist.

For flows that can safely run as one page sequence, print combo links:

```powershell
npm.cmd run cycle:combo
```

Open one combo at a time:

```powershell
npm.cmd run cycle:combo -- --open reward
npm.cmd run cycle:combo -- --open coupon
npm.cmd run cycle:combo -- --open referral
npm.cmd run cycle:combo -- --open cashback
npm.cmd run cycle:combo -- --open auction
npm.cmd run cycle:combo -- --open auction-cancel
npm.cmd run cycle:combo -- --open rental
npm.cmd run cycle:combo -- --open warranty
npm.cmd run cycle:combo -- --open support
npm.cmd run cycle:combo -- --open access
```

Each combo opens the page with `autorun=1` and combines same-page actions.
Approve wallet requests only after reviewing them. Do not open multiple combo tabs
at once, because overlapping prompts can create duplicate transactions.

If port `4173` is already serving a page without `/api/arcinvoice`, run the app on
another port and print the checklist with the same port:

```powershell
$env:PORT="4174"; npm.cmd run cycle:today
$env:PORT="4174"; npm.cmd run start-deployer
```

The checklist prepares review-friendly testnet parameters for Circle App Kit,
CCTP, issued tokens, and the Arc product-flow contracts. It varies token pairs,
destinations, labels, metadata, permissions, lifecycle states, and settlement
outcomes so reviewers can inspect a broader set of contract behavior.

Fast order:

1. App Kit Send: send the printed USDC amount to the Circle Dev Wallet.
2. App Kit Swap: use the printed token pair and amount with the `KIT_KEY` pasted in the page.
3. App Kit Bridge: bridge the printed USDC amount to the printed testnet destination.
4. Unified Balance: deposit and spend the printed amounts.
   For Arc Testnet to Arc Testnet spend, leave `useForwarder` unchecked.
5. Issued Token Transfer: use the printed ARCP or SKIPIO preset and amount.
6. Dev Wallet Transfer: run the printed command, which sets the amount for that one demo run.
7. Memo Receipt: open Arc Payment Ops and send the printed receipt through `Memo.memo`.
8. Batch Payout: use Arc Payment Ops to submit the printed rows through `Multicall3From.aggregate3`.
9. ArcInvoice Register: create a new invoice, use the printed contract, then register it on Arc.
10. ArcInvoice Payment: pay the registered invoice with the printed native USDC amount.
11. ArcInvoice Cancel: create a separate unpaid invoice, register it, then cancel it.
11A. ArcQuote Create: create a quote candidate on the ArcInvoice contract.
11B. ArcQuote Accept: accept the quote and escrow the printed native USDC amount.
11C. ArcQuote Settle: settle the accepted quote to the seller wallet.
12. Issued Token Approve: approve the printed spender for the printed ARCP or SKIPIO amount.
13. Dev Wallet transferFrom: run the printed command so the Circle Dev Wallet spends part of the allowance.
14. Issued Token Revoke: revoke the same spender by approving `0`.
15. ArcEscrow Fund: create a draft, fund it with native USDC, and save the funding tx.
16. ArcEscrow Settle: release or refund the funded escrow according to the printed outcome.
16A. ArcEscrow Dispute Fund: create a separate escrow for the dispute path.
16B. ArcEscrow Open Dispute + Evidence: open the dispute, then submit evidence.
16C. ArcEscrow Resolve Dispute: resolve the disputed escrow to seller release or buyer refund.
17. ArcSubscription Plan: create a native-USDC subscription plan.
18. ArcSubscription Subscribe: pay for the printed number of cycles.
19. ArcSubscription Cancel: cancel the active subscription.
20. Raw CCTP Approve: approve the Circle Bridge contract to burn the printed Arc ERC-20 USDC amount.
21. Raw CCTP Burn + Attestation: call `bridgeWithPreapproval`, then poll Iris for the attestation.
22. Raw CCTP Mint: switch to the printed destination and call `receiveMessage`.
23. ArcMembership Mint or Renew: deploy once if needed, then mint a pass or renew the existing pass.
24. ArcMembership NFT Approve: approve the printed spender for the pass token ID.
25. ArcMembership NFT Revoke: revoke the same NFT approval.
26. ArcSavingsVault Create: deploy once if needed, then create a native-USDC vault.
27. ArcSavingsVault Set Goal: update the same vault goal metadata.
28. ArcSavingsVault Deposit: add a second native-USDC deposit to the vault.
29. ArcSavingsVault Withdraw: withdraw part of the balance back to the MetaMask wallet.
30. ArcPoll Create: deploy once if needed, then create a dated governance poll.
31. ArcPoll Cast Vote: cast the printed vote choice with a reason.
32. ArcPoll Close: close the poll and save the final tally.
33. ArcAirdrop Create Campaign: deploy once if needed, then fund a native-USDC claim campaign.
34. ArcAirdrop Claim: claim the printed allocation from the MetaMask wallet.
35. ArcAirdrop Close Campaign: close the campaign and refund any remainder.
36. ArcBounty Create: deploy once if needed, then create a native-USDC work bounty.
37. ArcBounty Accept: accept the printed bounty from the MetaMask wallet.
38. ArcBounty Submit Work: submit the printed completion URI.
39. ArcBounty Release Reward: release the bounty reward after submission.
40. ArcMilestone Create Agreement: deploy once if needed, then fund two native-USDC milestones.
41. ArcMilestone Submit: submit milestone 0 with the printed URI.
42. ArcMilestone Release: release milestone 0 to the worker wallet.
43. ArcMilestone Close: close the agreement and refund the remaining milestone balance.
44. ArcExpense Create: deploy once if needed, then create a shared native-USDC expense.
45. ArcExpense Contribute: contribute the printed amount to the expense.
46. ArcExpense Withdraw: withdraw part of the funded expense to the payee wallet.
47. ArcExpense Close: close the expense and refund the remaining balance.
48. ArcEvent Create: deploy once if needed, then create a native-USDC ticketed event.
49. ArcEvent Buy Ticket: buy one ticket from the MetaMask wallet.
50. ArcEvent Check In: check in the purchased ticket.
51. ArcEvent Settle: settle ticket revenue to the MetaMask wallet.
52. ArcMarketplace Create Listing: deploy once if needed, then create a native-USDC listing.
53. ArcMarketplace Buy Order: buy one order from the MetaMask wallet.
54. ArcMarketplace Fulfill Order: record the fulfillment URI for the purchased order.
54A. ArcMarketplace Request Return: request a return/RMA for the fulfilled order.
54B. ArcMarketplace Review Return: approve or reject the requested return with a review URI.
54C. ArcMarketplace Close Return: close the reviewed return with a final URI.
55. ArcMarketplace Settle Listing: settle order revenue to the MetaMask wallet.
56. ArcService Create Service: deploy once if needed, then create a native-USDC service.
57. ArcService Book Service: book one service slot from the MetaMask wallet.
58. ArcService Complete Booking: record the completion URI for the booked service.
59. ArcService Settle Service: settle service revenue to the MetaMask wallet.
59A. ArcWorkOrder Create: create a funded work order on `ArcServiceBookings`.
59B. ArcWorkOrder Accept: accept the funded work order as the worker.
59C. ArcWorkOrder Submit: submit completion evidence for the order.
59D. ArcWorkOrder Approve Payout: approve the submitted work and pay the worker.
60. ArcDonation Create Campaign: deploy once if needed, then create a native-USDC donation campaign.
61. ArcDonation Donate: donate the printed native-USDC amount with the printed message.
62. ArcDonation Withdraw: withdraw the donation amount back to the MetaMask wallet.
63. ArcPreorder Create Product: deploy once if needed, then create a native-USDC preorder product.
64. ArcPreorder Place Preorder: place one preorder from the MetaMask wallet.
65. ArcPreorder Fulfill Preorder: record the fulfillment URI for the preorder.
66. ArcPreorder Settle Product: settle preorder revenue to the MetaMask wallet.
67. ArcPayroll Create Payroll: deploy once if needed, then fund a native-USDC worker payout.
68. ArcPayroll Claim Payroll: claim the funded payout to the MetaMask wallet.
69. ArcPayroll Close Payroll: close the payroll after claim and record the zero-refund close.
70. ArcDeposit Create Refundable Deposit: deploy once if needed, then create a native-USDC refundable deposit.
71. ArcDeposit Resolve Refundable Deposit: refund or forfeit the deposit according to the printed outcome.
72. ArcInstallment Create Agreement: deploy once if needed, then create a two-payment native-USDC agreement.
73. ArcInstallment Pay 1: pay the first installment.
74. ArcInstallment Pay 2: pay the second installment.
75. ArcInstallment Complete Agreement: close the paid agreement with a completion URI.
76. ArcVesting Create Grant: deploy once if needed, then fund a native-USDC vesting grant.
77. ArcVesting Claim Grant: claim the unlocked grant to the MetaMask wallet.
78. ArcVesting Close Grant: close the vesting grant after claim and record the zero-refund close.
79. ArcGiftCard Create Card: deploy once if needed, then fund a native-USDC gift card.
80. ArcGiftCard Redeem Card: redeem the funded card to the MetaMask wallet.
81. ArcGiftCard Close Card: close the gift card after redeem and record the zero-refund close.
82. ArcReward Create Reward: deploy once if needed, then fund a native-USDC reward.
83. ArcReward Claim Reward: claim the funded reward to the MetaMask wallet.
84. ArcReward Close Reward: close the reward after claim and record the zero-refund close.
85. ArcCoupon Create Coupon: deploy once if needed, then fund a native-USDC coupon.
86. ArcCoupon Claim Coupon: claim the funded coupon to the MetaMask wallet.
87. ArcCoupon Close Coupon: close the coupon after claim and record the zero-refund close.
88. ArcReferral Create Campaign: deploy once if needed, then fund a native-USDC referral campaign.
89. ArcReferral Claim Referral: claim the funded referral payout to the MetaMask wallet.
90. ArcReferral Close Referral: close the referral campaign after claim and record the zero-refund close.
91. ArcCashback Create Cashback: deploy once if needed, then fund a native-USDC cashback campaign.
92. ArcCashback Claim Cashback: claim the funded cashback to the MetaMask wallet.
93. ArcCashback Close Cashback: close the cashback campaign after claim and record the zero-refund close.
94. ArcAuction Create Auction: deploy once if needed, then create a native-USDC auction.
95. ArcAuction First Bid: place the printed minimum bid.
96. ArcAuction Raise Bid: place a higher bid and record the previous-bid refund behavior.
97. ArcAuction Settle Auction: settle the winning bid to the MetaMask wallet.
97A. ArcAuction Create Cancel Test: create a separate native-USDC auction for the cancel path.
97B. ArcAuction Bid Cancel Test: place the printed minimum bid on the cancel-test auction.
97C. ArcAuction Cancel Auction: cancel the cancel-test auction and record the bid refund behavior.
98. ArcRental Create Rental: deploy once if needed, then create a native-USDC rental with a fee and deposit.
99. ArcRental Book Rental: book the rental by paying fee plus deposit.
100. ArcRental Return Rental: record the return, pay the fee plus damage fee, and refund the remaining deposit.
101. ArcWarranty Register: deploy once if needed, then register a zero-value product warranty.
102. ArcWarranty Open Claim: open a zero-value claim with a dated claim URI.
103. ArcWarranty Resolve Claim: resolve the claim with a dated resolution URI.
104. ArcSupport Create Ticket: deploy once if needed, then create a zero-value support ticket.
105. ArcSupport Respond: add a zero-value response URI to the ticket.
106. ArcSupport Close Ticket: close the support ticket with a dated close URI.
107. ArcAccess Request: deploy once if needed, then request a zero-value access role.
108. ArcAccess Approve: approve the access request with a dated approval URI.
109. ArcAccess Revoke: revoke the access role with a dated revoke URI.

Current deployment addresses and operator defaults belong in local `.env` files
or private notes, not in this public workflow document.

After each step, save the `txHash` or ArcScan explorer link.

To preview a different date:

```powershell
$env:CYCLE_DATE="2026-07-03"; npm.cmd run cycle:today; Remove-Item Env:\CYCLE_DATE
```
