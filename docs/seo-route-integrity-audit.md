# SEO route integrity audit

Purpose: continuously enforce route health for high-intent SEO pages.

Checks implemented:
- each keyword-mapped URL resolves to HTTP `200`
- canonical tag exists and matches the mapped URL
- no mapped URL is `noindex`
- no duplicate canonical targets across different mapped URLs
- reversed comparison slugs (`b-vs-a`) redirect to canonical (`a-vs-b`)
- every mapped URL is present in `/sitemap.xml`

Source of truth for URLs:
- `/Users/karan/Downloads/thestash.xyz/thestash.xyz/docs/seo-keyword-to-url-map.md`

## Run locally

```bash
npm run seo:audit:routes -- --base-url http://localhost:3000
```

List discovered URLs without making network requests:

```bash
npm run seo:audit:routes -- --list
```

Current Phase 3 baseline (February 13, 2026): `96` discovered SEO target URLs.

Write JSON report:

```bash
npm run seo:audit:routes -- --base-url https://thestash.xyz --output docs/audits/seo-route-audit-latest.json
```

## CI recommendation

GitHub Actions workflow is committed at:
- `/Users/karan/Downloads/thestash.xyz/thestash.xyz/.github/workflows/seo-route-integrity.yml`

What it does:
- on `pull_request` + `push main`: build app and run local audit against `http://127.0.0.1:3000`
- on weekly schedule (Monday 09:00 UTC) + manual dispatch: run live-site audit (default `https://thestash.xyz`)

Manual dispatch supports a custom live URL via `base_url` input.

Equivalent command:

```bash
npm run seo:audit:routes -- --base-url "$DEPLOYMENT_URL"
```

If the command exits non-zero, block release until fixed.

## Monthly prune flow

Generate a freshness + noindex queue from the SEO quality endpoint:

```bash
npm run seo:prune:report -- --base-url https://thestash.xyz --output docs/audits/seo-prune-report-latest.md
```

This report identifies pages that should be fixed or kept `noindex` based on quality-gate failures.

## Why this matters

This is a long-term protection loop for programmatic SEO:
- prevents silent canonical drift and cannibalization
- catches broken URLs before indexing loss compounds
- enforces sitemap completeness as keyword footprint scales
