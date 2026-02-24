# Reports Refresh Workflow (SEO + AI Discoverability)

This workflow keeps `/reports` updated with official-source metrics and discoverability-focused analysis.

## Scope

Current report routes:

- `/reports/ai-coding-tools-benchmark`
- `/reports/ai-adoption-trust-signals`
- `/reports/seo-ai-answer-discoverability`

Core data files:

- `lib/benchmark-reports.ts`
- `lib/industry-metrics.ts`
- `lib/official-benchmark-reports.ts`
- `lib/ai-discoverability-report.ts`

## Official source policy

Only update reports from primary publisher sources (official docs, official annual reports, official company research posts).

Primary sources currently used:

- Stack Overflow Developer Survey
- GitHub Octoverse
- Google Search / Google Blog updates
- DORA (Google Cloud)
- JetBrains Developer Ecosystem report

## Invocation

Use this exact request when you want the agent to run the workflow:

`Run the reports refresh workflow in docs/reports-refresh-workflow.md and update report pages, sources, and freshness timestamps.`

## Repeatable workflow

1. Freshness gate
   Run:
   ```bash
   npm run reports:freshness:gate
   ```
   If stale, continue with source refresh.

2. Source refresh
   - Verify latest publication date from each official source.
   - Update metric values only when directly stated in source text.
   - Update verification timestamps in report data files.

3. Report page updates
   - Ensure each report has:
     - updated date
     - source links
     - at least one official visual/infographic image
     - practical implications for end users
     - SEO + AI discoverability recommendations where relevant

4. Index and crawl updates
   - Ensure `src/app/reports/page.tsx` reflects active report list.
   - Ensure `src/app/sitemap.ts` includes all report routes.

5. Quality checks
   Run:
   ```bash
   npm run seo:audit:routes
   npm run content:freshness:gate
   npx tsc --noEmit
   ```

6. Publish notes
   - Add summary of changes and source dates in PR/commit description.
   - Mention any source link that changed or was replaced.

## Automation blueprint

### Weekly (Monday)

- Run:
  - `npm run reports:freshness:gate`
  - `npm run seo:audit:routes`
- If failure: create an issue titled `Reports refresh required`.

### Monthly (1st day)

- Run:
  - `npm run reports:freshness:gate`
  - `npm run content:freshness:gate`
- If stale metrics are found, trigger manual source refresh step.

### Quarterly

- Add or retire report routes based on:
  - new official annual datasets
  - discoverability relevance
  - source reliability

## Definition of done

- All report timestamps are within freshness threshold.
- All key metrics link to official sources.
- `/reports` index, sitemap, and page-level source lists are aligned.
- Typecheck passes.
