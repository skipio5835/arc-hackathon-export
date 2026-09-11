# Scoped SDK dependency subsets

These private local packages remove unused vulnerable dependencies, not audit
warnings. They are not official upstream releases or general-purpose replacements.
The root npm workspace configuration, lockfile, and scoped overrides are required
together with this directory. Versions have an explicit `-arcrow.1` suffix.

| Package | Upstream | Local change |
| --- | --- | --- |
| `ethers-hash` | `@ethersproject/hash@5.8.0` | Keep runtime unchanged; inline the two typed-data interfaces instead of depending on the signer/provider/transactions/elliptic chain. Only override the ABI package's dependency. |
| `jayson-browser` | `jayson@4.3.0` | Keep the browser client and request generator unchanged. Omit Node server/transports and their stream-json dependency. Only override Solana web3.js's dependency. |

MIT licenses are retained. `upstream.json` records npm archive integrity and
SHA-256 of every retained original JavaScript file (LF-normalized for Git).
No signature, hash, curve, parser, request, or response algorithm is rewritten.
The retained ethers TypeScript sources are reference material, not application
build inputs. The declaration files are checked separately with strict library
checking; application compiler settings are not weakened.
Jayson's server/main entry is deliberately unavailable; a future consumer of an
unsupported API must fail rather than silently fall back to a vulnerable package.

Maintenance requirements:

- Run `npm ci --ignore-scripts`, `npm run test-dependency-security`, typecheck,
  the application tests, all browser builds, and `npm audit --audit-level=low`.
- Review retained upstream code for new advisories; private forks are not fully
  covered by automated package-name/version advisory matching.
- Compare future SDK imports against the supported entries before upgrading.
- Replace these subsets with official compatible upstream fixes when available.
- Include `circle/arc/vendor` in any export/deployment using the root lockfile.
- Never regenerate the integrity manifest merely to approve runtime changes.
