# Security Policy

## Scope

The `main` branch contains Arc testnet demos and the read-only ARCROW interface. The
contracts and interfaces are not approved for production custody or mainnet funds.

## Reporting

Report suspected vulnerabilities through this repository's private vulnerability
reporting form in the GitHub Security tab. Do not include private keys, seed phrases,
API credentials, Kit Keys, or live-wallet secrets in an issue or pull request.

## Local Safety

- Keep secrets in an ignored local `.env` file.
- Review the selected network, contract, function, recipient, value, and allowance
  in the wallet before every signature.
- Treat generated browser bundles as build output; review their TypeScript source.
- Run `npm audit --audit-level=low`, `npm run test-dependency-security`,
  `npm run typecheck`, `npm run test-arc-radar`, and `npm run compile-custom`
  before release. See `circle/arc/vendor/README.md` for the scoped dependency subsets
  and their maintenance requirements.
- Compare deployed runtime bytecode with the compiled release artifact before
  recording a deployment as verified.

Public testnet addresses and transaction receipts are not secrets, but they link
repository activity to an on-chain identity. Publish them only for reproducibility.

## Before Pushing

Run `npm run hooks:install` once per clone, including after `npm ci --ignore-scripts`.
This installs only a repository-local launcher for `.githooks/pre-push`. It does not
change global Git settings, remotes, or credentials, and refuses to overwrite a
custom hook or an existing `core.hooksPath` configuration.

Every non-deletion push runs `npm run check:push`: installed dependency validation,
an audit blocking low-or-higher advisories, dependency and hook regression tests,
TypeScript checks, ARCROW/server/public-release tests, and contract compilation.
This export's gate does not include the development repository's Foundry suite;
compilation is not a contract security audit. Existing demo contracts are preserved.
Node.js/npm must be available in the Git client's PATH. Missing tools,
an unreachable audit registry, or a failed check stop the push.

The hook accepts only a clean worktree and updates pointing to the checked-out
commit (including tags of that commit), then rechecks HEAD and files after testing.
Commit pending changes before pushing; for multiple branches, check out and push
each branch separately. Run `npm run check:push` manually during development.
These checks do not sign wallet transactions, deploy contracts, or load `.env`.

Local hooks are a convenience, not an unbypassable security boundary. Git clients
must execute hooks, and another clone needs its own installation. Keep GitHub
Security CI and CodeQL enabled; this gate cannot predict future advisories.
See the [Git pre-push documentation](https://git-scm.com/docs/githooks#_pre_push).

## Payment UI Hardening

Payment status, invoice/escrow/subscription receipts, treasury/merchant histories,
and CCTP receipts render dynamic values with text nodes and DOM elements, not HTML
templates. Explorer links require valid address/transaction formats and fixed
explorer origins. Wallet account/network checks and existing contract sources are
preserved. No transaction or contract redeployment is required for these UI fixes.

Usage billing accepts only validated contract addresses. Manually selected addresses
apply to the current session; deployment receipts can retain their public contract
address. This metadata is public, not a private key. Secrets must never be entered
in contract fields or stored in browser storage.

`npm run test-security-js` includes malicious error messages, stored markup,
untrusted explorer links, row selection, and incremental CCTP receipt tests. These
regressions exercise the production rendering functions without requesting wallet
signatures or sending network transactions. A passing CI job is not proof that
CodeQL has no findings; check open alerts separately after each analysis.
