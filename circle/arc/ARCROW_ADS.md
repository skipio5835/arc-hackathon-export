# ARCROW advertising preparation

Status: local layout preview only. No ad provider, external analytics, cookies,
billable impression counting, wallet integration, or revenue collection is added.

## Local preview

- Default: `/public/arc-radar.html` has no ad space or preview controls.
- Preview: `http://localhost:4173/public/arc-radar.html?ads=preview`.
- Use the footer's Ad preview checkbox to toggle the single responsive slot.
- Placement compares After summary (default) with Page end. It moves the same
  placeholder only in response to the local user's selection.
- Reloading the preview URL resets the checkbox to on; nothing is persisted.
- Only localhost, 127.0.0.1 and IPv6 loopback support preview. Public deployments
  ignore the parameter. Unavailable networks do not show preview controls.
- Default placement is below the market metrics on every viewport, away from
  trade controls. There are no popups, sticky overlays or ads inside token rows.
- At 768px and above: up to 728 x 90 creative space in a 146px band. Below
  768px: up to 320 x 100 in a 156px band. Narrow screens constrain the width;
  these are mock sizes, not instructions to shrink a real provider's ad.
- Space is reserved while data loads. The creative is hidden when no filtered
  market content is available or a dashboard fetch fails. Reserved space remains
  to prevent layout jumps; disabling preview removes it completely.
- The slot is outside the market row renderer. Refreshing data, selecting tokens
  or changing filters never recreates it or requests another ad.
- Preview labels are not real advertisements and generate no revenue.

## Local placement diagnostic

The footer shows whether at least half of the creative's area was inside the
viewport for one continuous second while the document was visible and market
content was available. Changing placement resets this local check. Scrolling
away or hiding the tab interrupts the qualifying interval; once qualified it
stays Yes, without counting repeated views. Reloading resets everything.

This is a geometry-only preview diagnostic, not Google Active View, a billable
impression, audience analytics, or revenue measurement. It does not detect every
overlay/occlusion or send/store any data. It runs only on the local preview URL.

## Revenue validation after launch

Public launch and provider integration are still separate work. Use provider
reports for actual page RPM, coverage and viewability; compare mobile/desktop
and placements alongside return visits and performance. Estimate revenue as
page views / 1000 * measured page RPM, then subtract hosting and data costs.
Do not infer earnings from this preview's Yes/No result or from API refreshes.
Do not multiply page RPM by the number of slots. More ads are not automatically
more profit. Only expand placements after observing actual user impact.

## Before activating real advertising

Keep production advertising disabled until separately approved by the owner.
Prepare the public ARCROW site, privacy disclosures, contact information,
data methodology and applicable consent management. Obtain provider approval,
then configure verified publisher/slot IDs and provider-supplied ads.txt.
Review third-party scripts and CSP without broadly relaxing security headers.
Do not serve live ads during local testing, auto-refresh ads with market data,
or invent publisher IDs. Test denied consent, blocked scripts, no-fill and
mobile layout. Keep sponsored placement separate from rankings and risk scores.

This preview is not an AdSense integration or a compliance/approval guarantee.

Policy references checked on 2026-09-08:
- https://support.google.com/adsense/answer/1346295?hl=en
- https://support.google.com/adsense/answer/190515?hl=en
