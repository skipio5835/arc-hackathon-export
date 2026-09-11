# Arc Hackathon Export

Circle Arc Testnet workspace for deploying and exercising experimental payment
and product-flow contracts with MetaMask-signed transactions.

The repository also includes ARCROW (Arc Meme Intelligence), a read-only market intelligence
interface for selected Arc Testnet token pools. It shows indexed trades, calculated
USDC reserve prices, liquidity changes, holder coverage, and evidence-linked
observations without requesting a wallet connection. It is not a whole-chain
scanner, safety rating, or trade recommendation. Mainnet is not enabled.
Light/dark/system themes and English/Korean/Japanese core UI labels are supported;
some detailed descriptions remain English. See [data coverage](circle/arc/ARCROW_DATA.md).

## Scope

- `circle/arc/contracts`: Solidity contracts for invoice, escrow, marketplace,
  subscription, membership, savings, airdrop, bounty, milestone, expense,
  events, preorder, payroll, reward, coupon, referral, cashback, auction,
  rental, warranty, support desk, access, payment links, revenue splitting,
  usage billing, streaming payroll, refundable payments, treasury operations,
  merchant settlement, cross-chain routing, stablecoin FX, and related flows.
- `circle/arc/src`: TypeScript browser clients for Circle App Kit, CCTP, token
  transfers, Arc contract UIs, and ARCROW market analysis.
- `circle/arc/public`: Local HTML tools and prebuilt browser bundles.
- `circle/arc/scripts`: Compile, local server, deployment, verification, and
  demo checklist helper scripts.
- `shared/config.ts`: Minimal shared configuration helper used by Arc scripts.

Base-specific experiments, local `.env` files, logs, caches, and private notes
are intentionally excluded.

## Local Use

```powershell
npm ci --ignore-scripts
npm run hooks:install
npm.cmd run cycle:prepare
npm.cmd run start-deployer
```

Then open the printed local URLs and approve MetaMask prompts manually for the
flows you want to demonstrate.

## Vercel Deployment

The existing [Merchant Console](https://arc-hackathon-export.vercel.app/) remains
the main demo. [ARCROW](https://arc-hackathon-export.vercel.app/circle/arc/public/arc-radar.html)
is an additional market intelligence page. It runs in the browser and reads
public ArcScan API data directly, with optional user-initiated, read-only Arc RPC
state snapshots; no local server, wallet, or API key is required.
Market coverage and freshness depend on the public testnet indexer.

The public deployment includes same-origin Vercel proxy routes for the Circle
endpoints used by App Kit Bridge and Swap. They forward only to fixed Circle API
hosts and do not store or inject Circle credentials. Wallet signatures remain
in MetaMask. A Circle Kit Key is entered locally by the user for App Kit Swap;
never commit keys or private credentials.

## Useful Scripts

```powershell
npm.cmd run compile-custom
npm.cmd run cycle:today
npm.cmd run cycle:combo
npm.cmd run build-arc-invoice
npm.cmd run build-arc-marketplace
npm.cmd run build-arc-pay-link
npm.cmd run build-arc-refundable-payment
npm.cmd run build-arc-treasury-console
npm.cmd run build-arc-merchant-settlement
npm.cmd run build-arc-crosschain-router
npm.cmd run build-arc-stablecoin-fx
npm.cmd run build-arc-radar
npm.cmd run test-arc-radar
npm.cmd run typecheck
```

## Security

Secrets are not included. Keep Circle API keys, entity secrets, private keys,
wallet IDs, and operator-specific deployment addresses in a local `.env` only.
Use `.env.example` as a placeholder template.

Run `npm run check:push` before release. The local pre-push hook and GitHub Security
CI check dependency advisories, SDK compatibility, TypeScript, ARCROW/public-release
tests, and compilation of the existing demo contracts. These checks are not an
independent contract audit. See [Security Policy](SECURITY.md).
