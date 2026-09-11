# ARCROW Data Sources

ARCROW currently runs on Arc Testnet with one configured USDC v2-style
factory. Its browser fetches public ArcScan data and optional public RPC reads; no background indexer
or mainnet ingestion is running.

- Network configuration: `src/arc-radar-networks.ts` defines the chain ID,
  explorer, API, USDC address and decimals, and DEX sources.
- DEX boundary: `src/arc-radar-dex.ts` parses pool creation, reserves,
  swaps, and liquidity events. The only supported protocol is `uniswap-v2`.
- Discovery: configured sources are merged by chain and pool address,
  ordered newest first, and capped by the shared result limit. A failed
  source fails the refresh rather than silently shrinking coverage.
- Budgets: at most four configured sources, ten discovery pages per source
  per refresh, 150 displayed pools, and three concurrent pool loads.
  These are request bounds, not full-chain coverage.
- Storage: API cache and watchlists include the network and chain ID.
  Pool-specific details and observations also distinguish the pool address.
  Existing testnet watchlists remain readable; old token-scoped observation
  histories are retained in storage but are not reused across pools.

The optional `?network=arc-testnet` URL selects the configured testnet.
`?network=arc-mainnet` or an unknown network shows an unavailable state
and makes no market API calls. Mainnet settings are deliberately absent.

Before enabling mainnet, verify official endpoints, chain ID, the USDC
contract and decimals, and each DEX deployment. Add protocol-specific
fixtures and verify real pool results before setting that network to ready.
Uniswap v4 is explicitly unsupported: it requires its own pool identifiers,
event decoder, concentrated-liquidity valuation, hook handling, and
ownership/exit-risk model. Do not reuse v2 reserve or LP-token assumptions.

Run `npm run test-arc-radar` and `npm run build-arc-radar`.

Color theme is independent of market loading: Light / Dark / System is stored
locally as `arcrow:theme`, defaults to the OS preference, and syncs across tabs.
Blocked storage falls back to the current tab. The small pre-CSS script applies
the initial theme before market code loads. Semantic CSS tokens cover controls,
charts, and state colors. The original full-color ARCROW emblem is preserved on
a fixed light ground; it is not inverted. No theme setting leaves the browser.

Language selection supports English, Korean, and Japanese for core navigation, filters,
market labels, and key warnings. The `arcrow:language` browser preference takes
precedence over the browser language and syncs across tabs. Only explicitly
marked application copy is translated; token identity, addresses, numbers, and
external data remain literal. Some detailed technical descriptions and raw errors
remain English. Switching language preserves the active view and does not refetch
market data or use a translation API. Preferences remain local to the browser.
Pool pricing, transfer interpretation, LP ownership, and holder-coverage notes are
included in both translations. The stacked detail view links back to the market
list in the same page without clearing filters or requesting fresh data.

# Shareable pool detail and watchlist digest

The same static HTML supports `?network=arc-testnet&pool=0x...` for a focused
detail page. Full details / Copy link preserve the deployment path but remove
preview parameters. Pool addresses identify the trading venue; this is not yet
a token-wide aggregate across multiple pools. No server rewrite is required.

Direct links resolve the address's creation transaction and inspect at most four
log pages for a matching PairCreated event emitted by a configured factory.
They do not depend on the most recent 15 discovered pools. Invalid/unverified
links fail explicitly without substituting another token. Missing index data may
prevent a legitimate pool from resolving. This is source verification, not a
security audit. Public SEO metadata/server rendering remain future work.

The homepage digest summarizes up to 12 material observations since the explicit
review marker, or recent saved observations in Recent history, excluding Watch
started records. Reloading does not acknowledge unseen changes. Mark all reviewed
acknowledges existing records through the click time, including records outside
the displayed 12. Legacy last-visit timestamps seed the marker once. Browser
storage is used where available with a current-tab memory fallback.

While visible, the homepage checks at most three loaded watched pools per minute,
oldest check first, with a two-minute detail cooldown. Failures also cool down;
concurrent requests for the same pool/scope share a request. Opening details may
make additional reads. Unloaded watched tokens are explicitly outside coverage.
In-flight reads may finish after the tab becomes hidden, but new background reads
are not started. This is not continuous monitoring while the browser is closed.
No server indexer, wallet connection, or external notification service is added.
A copied localhost link works only on that machine.

## Token grouping and sell observations

The market list groups eligible pools by chain ID and token contract address,
never by symbol/name. Each row shows one representative pool, preferring
non-stale data and then highest liquidity. Filters apply to pools before grouping.
Row metrics and their summary describe representatives, not token-wide totals.
The market pulse still covers all loaded pools. The detail panel's pool selector
compares all currently loaded pools for the token, including pools outside the
active filter. Direct pool links load just their requested pool; they do not
discover every alternative pool. Changing filters may select a new representative.

Sell observations use transaction hash plus log index, scoped to the saved pool.
The first observation, including migration from count-only records, establishes
a baseline without historical notifications. New unseen events trigger an info
alert even if the rolling sell count is unchanged or lower. Delayed indexing may
surface old trades, so the alert does not claim they just happened or that the
token is safe. Missing transaction hashes/log indices are ignored.

Up to 2,000 event identities are retained per tracked pool. When older identities
are evicted, an inclusive timestamp floor prevents them being reported again;
newly indexed events at or before that floor are deliberately ignored. Unseen
events outside fetched history cannot be detected. This is bounded local
observation, not a complete on-chain transaction monitor.

## Detail data quality

Holder, LP, contract, creator, transfer, and transaction-sender reads retain
fresh/cached/unavailable status. Fresh means within the local API cache TTL,
not guaranteed real-time indexing. Failed holder reads never become zero
concentration. Partial holder pages leave absent balances and burn totals
unknown; top-N is shown only if enough non-pool positions were loaded or the
holder page is complete. Rankings exclude burn addresses and all loaded
same-chain, same-token pools. Undiscovered pools may still appear as holders.

Ownership alerts preserve prior valid metrics when a read is stale or missing.
Changes to the known-pool exclusion set establish a new concentration baseline
without claiming ownership moved. Legacy ownership baselines are discarded once;
other saved watch history is retained. Detail cache entries expire after two
minutes and are rebuilt when the known-pool set changes.

Transfers into/out of pools are not automatically called buys, sells, or full
exits. Absence from the first holder page does not prove a zero balance. BUY/SELL
in the trade tape still comes from decoded Swap events. Missing transaction
sender data may display the Swap recipient explicitly as Recipient instead.

Window returns need an indexed price at or before the requested start time;
otherwise they display `--`, including newly created pools. A current balance
fallback is never assigned a fabricated pool-creation timestamp. Counts and
volume remain limited to fetched event pages, as indicated by history coverage.

Liquidity totals and screening use every decoded event in the fetched pages;
only the visible event list is capped at eight rows. The UI reports displayed and
fetched counts and flags truncated history. The 24H sum excludes events outside
the time window, including future timestamps. Missing or invalid total supply,
decimals, or a usable price makes FDV unavailable; a genuine zero supply remains
distinct from missing data.

If discovery finds pools but none can be loaded, the refresh fails explicitly.
Previous rows remain marked cached, while an initial failure shows unknown
activity instead of zero volume. Partial failures identify the omitted pool count
and scope of the totals. A successful empty discovery remains a valid empty result.

## Evidence-first product view

The coverage line identifies the configured factories, loaded pool count,
cached/partial data, and testnet-only scope. These are selected markets, not the
whole Arc ecosystem. Mainnet demand and ad revenue are not validated by testnet
activity. Advertising remains an optional local preview, outside all rankings.

Changes to review uses explicit screening rules: indexed liquidity removal of
at least 10% of prior quote reserve, then calculated 1H reserve-price moves of at
least 30% with complete fetched history and a recent trade, then new pools with
indexed trades. Stale pools are excluded. One result per chain/token, up to six;
within each category the newest record wins. This is not an alpha or safety score.
Event records link to source transactions; price calculations link to pool details.

Capability checks retain matching ABI names and explorer proxy indicators as
unverified evidence. Names alone do not prove ownership renunciation, simulate a
sale, or establish that a control remains executable. Optional getter reads are
displayed separately and do not upgrade ABI-name findings to confirmed capabilities.
No matching function name is not a clean bill of health. The UI no longer sums
flags into a red/green risk grade. It separates indexed, calculated, and unverified
findings and provides source links. PairCreated transaction senders can be relayers
and must not be assumed to identify the token's team.

## Optional contract-state snapshot

Contract state / Read state makes read-only calls to the configured public Arc
Testnet RPC (`https://rpc.testnet.arc.io`), without an injected wallet provider,
account, API key, signature, transaction, or gas spending. The endpoint and chain
ID follow [Arc connection documentation](https://docs.arc.io/arc/references/connect-to-arc).

Each explicit request fetches uncached explorer verification metadata and ABI.
Only exact view/pure signatures for owner, pendingOwner, paused, cap, totalSupply,
DEFAULT_ADMIN_ROLE, MINTER_ROLE, getRoleMemberCount, and getRoleMember are eligible.
Absent or unverified ABI functions remain unexamined, not absent or harmless.
Supply amounts use exact integer base units, not potentially stale token decimals.
Enumerable role members are capped at five per role with coverage/failure counts.
Non-enumerable roles do not imply an empty membership list. Other/custom roles,
role admins, allowlists, and hidden or nonstandard controls are not inventoried.

An explorer-reported single verified implementation may supply an ABI, but calls
always target the token/proxy address. The implementation mapping is not checked
against proxy storage; an upgrade can make this ABI obsolete. Matching getter
values are contract-reported data, not proof that each function enforces them.

RPC chain ID must match. Reads share one block height, whose hash is rechecked
before showing results. A block over five minutes from the local clock, wrong
chain, or changed block rejects the snapshot. Individual failures remain unknown,
never zero/false. Unsupported reads and unavailable metadata are explicit. A zero
owner, false paused flag, empty role, or cap value is not a safety/sellability verdict.

The block link/time and read time stay attached to the result; it is never labeled
live. Snapshots remain only in tab memory, keyed by chain/token, separate from
watchlist baselines. Market auto-refresh does not run or freshen these reads.
Only one snapshot request runs at a time, with a per-token 60-second attempt
cooldown, no retries, at most two concurrent RPC calls, eight-second HTTP timeouts,
and a 30-second overall deadline. A failed retry removes the prior displayed result.

Next release gates: verify deployed mainnet DEX protocols before integration;
design persistent observation with explicit source/block checkpoints and backfill;
validate the watch-and-review workflow with actual traders before adding paid data,
public analytics, or real advertising. These gates have not been completed.
