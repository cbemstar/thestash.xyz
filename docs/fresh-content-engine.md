# Fresh Content Engine Runbook

Updated: 2026-02-18

## Scope

This runbook implements the tiered content model:

- `tier1`: top 50 tools (deep decision stack)
- `tier2`: next 150 tools (enhanced canonical coverage)
- `tier3`: remaining inventory (baseline canonical coverage)

## Commands

### 1) Build priority queue and top-200 backlog

```bash
npm run content:priority:queue
```

Outputs:

- `/Users/karan/Downloads/thestash.xyz/thestash.xyz/automation/content-priority-queue.json`
- `/Users/karan/Downloads/thestash.xyz/thestash.xyz/automation/content-priority-top200.csv`

### 2) Monitor freshness and missing fields

Endpoint:

- `GET /api/content/freshness`

Response includes:

- `stalePages`
- `missingFieldsByTier`
- `lastReviewDistribution`
- `weeklyCompletionRate`

### 3) Backfill Tier 1/2 metadata before enforcing gates

Dry run:

```bash
npm run content:backfill:tier-fields
```

Apply:

```bash
npm run content:backfill:tier-fields -- --apply
```

Optional controls:

- `--target=resources|articles|both`
- `--limit=50`
- `--fallback-tier` (default) or `--no-fallback-tier`
- `--reviewed-at=2026-02-18T00:00:00.000Z`

### 4) CI freshness gate (tier stale/missing thresholds)

```bash
npm run content:freshness:gate -- --base-url https://thestash.xyz
```

This gate fails when Tier 1/2 stale-page or missing-field thresholds are exceeded.
Thresholds are configurable via CLI flags or env vars (`MAX_TIER1_RESOURCE_STALE`, `MIN_WEEKLY_COMPLETION_RATE`, etc.).

Local/direct mode (no HTTP dependency):

```bash
node --env-file=.env.local scripts/check-content-freshness-gate.mjs --mode=sanity
```

Current baseline lock (as of 2026-02-18 rollout):

- `MAX_TIER1_RESOURCE_MISSING=35`
- `MAX_TIER2_RESOURCE_MISSING=52`
- `MIN_TIERED_RESOURCES=80`

### 5) Keep technical SEO quality healthy

```bash
npm run seo:audit:routes -- --base-url https://thestash.xyz
npm run seo:prune:report -- --base-url https://thestash.xyz
```

## Tiered quality gates

### Resource pages (`tier1`, `tier2`)

- `lastReviewedAt` present
- `sources >= 3`
- answer-first summary present (`description` or `body` or `recommenderBlurb`)
- `refreshCadenceDays` is integer `7..365`
- `factCheckStatus` present

Extra for `tier1`:

- `bestFor >= 1`
- `notFor >= 1`
- `pricingNotes` present
- `alternatives >= 2`

### Article pages (`tier1`, `tier2`)

- `lastReviewedAt` present
- `sources >= 3`
- `excerpt` present
- `primaryKeyword` present
- `intentStage` present
- `relatedResources >= 2`
- Body depth gates (Portable Text)
  - `tier1`: `>=1200` words, `>=6` headings, `>=6` list items, `>=5` inline links, `>=2` internal links, `>=2` external links
  - `tier2`: `>=800` words, `>=4` headings, `>=4` list items, `>=3` inline links, `>=1` internal link, `>=2` external links

## Weekly cadence template

- Monday: prioritize queue, assign 2 decision pages + 2 deep guides + 1 refresh
- Tuesday–Thursday: draft, edit, QA, publish
- Friday: stale cleanup, internal-link pass, llms validation, KPI review
