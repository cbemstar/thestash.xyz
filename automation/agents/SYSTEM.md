# Multi-Agent Site Management System

## Overview

This pipeline discovers new resources, enriches and reviews them, drafts blogs, and publishes only approved items.

## Security Baseline

- No API keys or tokens are stored in agent source files.
- Required secrets are loaded from environment variables (`.env.local` for local runs).
- If env vars are missing, agents fail fast with explicit errors.

## Agent Architecture

```text
ORCHESTRATOR
  -> SCOUT      (discover high-signal leads)
  -> RESEARCH   (validate + enrich + queue resources)
  -> WRITER     (generate evidence-led blog draft)
  -> EDITOR     (tier-aware quality gates)
  -> PUBLISHER  (publish approved queue items)
  -> UX         (weekly quality diagnostics)
  -> LOOPS      (weekly digest trigger via /api/cron/weekly-digest)
```

## Data Flow Files

- `automation/agents/lead-queue.json` - discovered leads
- `automation/agents/validated-leads.json` - enriched leads
- `automation/agents/blog-draft.json` - latest blog draft
- `automation/agents/approval-queue.json` - review queue (`pending`, `reviewed`, `needs_revision`, `approved`)
- `automation/agents/published-log.json` - publish history
- `automation/agents/ux-report.json` - latest UX report
- `automation/agents/resource-research-playbook.json` - research/discovery weighting + category rebalance rules
- `automation/agents/research-report.json` - latest research run diagnostics (skips, validation statuses, per-category output)
- `automation/agents/blog-style-playbook.json` - blog generation style/quality defaults
- `automation/agents/writer-learning-log.json` - rolling writer output metrics for feedback loops

## Agent Learning Loop

- **Research learning loop**: tune `resource-research-playbook.json` (category priority + marketing signals) to push net-new resources into underrepresented categories.
- **Writer learning loop**: tune `blog-style-playbook.json` and inspect `writer-learning-log.json` after each run to enforce source depth, structure, and style outcomes.
- **Operational traceability**: `research-agent` and `writer-agent` now emit structured run events into `event-log.json` for per-run debugging.

## Quality Gates

### Resource

- Required: `title`, `slug`, `url`, `description`, `category`
- Tiered checks: `sources >= 3` for tier1/tier2, valid cadence and fact-check fields

### Article

- Required: `title`, `slug`, `excerpt`, `primaryKeyword`, `intentStage`, `body`
- Tier1/Tier2 strict depth gates per `docs/fresh-content-engine.md`
- Failing items are marked `needs_revision` and are not approval-ready

## Commands

- Scout: `npm run agent:scout`
- Research: `npm run agent:research`
- Writer: `npm run agent:writer`
- Editor: `npm run agent:editor`
- Publisher: `npm run agent:publish`
- Curator (resource pipeline): `npm run agent:curator`
- Curator with auto-approve + publish:
  `npm run agent:curator -- --auto-approve-reviewed --publish-approved --max-publish=25`
- Daemon (24/7 loop): `npm run agent:daemon -- --interval-min=180 --weekly-hours=168 --auto-approve-reviewed --publish-approved`
- Daemon service start (background, managed): `npm run agent:daemon:start`
- Daemon service start with unlimited publish: `npm run agent:daemon:start -- --max-publish=0`
- Daemon service stop: `npm run agent:daemon:stop`
- Daemon service status: `npm run agent:daemon:status`
- Daemon service logs: `npm run agent:daemon:logs -- --lines=200 --follow`
- Live watch (CLI): `npm run agent:watch -- --agent=research`
- Request graceful stop: `npm run agent:stop -- "manual review"`
- Clear stop request: `npm run agent:resume`
- UX: `npm run agent:ux`
- Loops: `npm run agent:loops`
- Orchestrator daily: `npm run agent:orchestrator -- daily`
- Orchestrator weekly: `npm run agent:orchestrator -- weekly`
- Orchestrator publish approved: `npm run agent:orchestrator -- approve`
- Orchestrator full + auto-approve reviewed (testing only):
  `npm run agent:orchestrator -- full --approve-reviewed`

## Required Environment Variables

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET` (optional, defaults to `production`)
- `SANITY_API_TOKEN`
- `CRON_SECRET` or `VERCEL_CRON_SECRET` (for digest trigger)
- `NEXT_PUBLIC_SITE_URL` (recommended for cron endpoint target)
- `LOOPS_DIGEST_EMAILS` (optional, comma-separated)
