# Arc Hackathon Export

Circle Arc Testnet workspace for deploying and exercising audited-style payment
and product-flow contracts with MetaMask-signed transactions.

## Scope

- `circle/arc/contracts`: Solidity contracts for invoice, escrow, marketplace,
  subscription, membership, savings, airdrop, bounty, milestone, expense,
  events, preorder, payroll, reward, coupon, referral, cashback, auction,
  rental, warranty, support desk, access, payment links, revenue splitting,
  usage billing, streaming payroll, refundable payments, and related flows.
- `circle/arc/src`: TypeScript browser clients for Circle App Kit, CCTP, token
  transfers, and Arc contract UIs.
- `circle/arc/public`: Local HTML tools and prebuilt browser bundles.
- `circle/arc/scripts`: Compile, local server, deployment, verification, and
  demo checklist helper scripts.
- `shared/config.ts`: Minimal shared configuration helper used by Arc scripts.

Base-specific experiments, local `.env` files, logs, caches, and private notes
are intentionally excluded.

## Local Use

```powershell
npm install
npm.cmd run cycle:prepare
npm.cmd run start-deployer
```

Then open the printed local URLs and approve MetaMask prompts manually for the
flows you want to demonstrate.

## Useful Scripts

```powershell
npm.cmd run compile-custom
npm.cmd run cycle:today
npm.cmd run cycle:combo
npm.cmd run build-arc-invoice
npm.cmd run build-arc-marketplace
npm.cmd run build-arc-pay-link
npm.cmd run build-arc-refundable-payment
npm.cmd run typecheck
```

## Security

Secrets are not included. Keep Circle API keys, entity secrets, private keys,
wallet IDs, and operator-specific deployment addresses in a local `.env` only.
Use `.env.example` as a placeholder template.
