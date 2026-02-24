# Agent Research + Writing Playbooks

This document explains how automation agents now mirror the same workflows used for manual deep resource research and blog drafting.

## 1) Resource research workflow (automated)

The research flow now uses:

- `automation/agents/resource-research-playbook.json`
- `automation/agents/research-agent.mjs`
- `automation/agents/research-report.json`

### How it works

1. Scout discovers leads into `lead-queue.json`.
2. Research agent dedupes by URL and slug against Sanity.
3. Research agent validates URLs (HEAD, fallback GET).
4. Research agent enriches metadata (title, description, category, tags).
5. Research agent applies category rebalance weighting using live Sanity category counts.
6. Research agent tags marketing leads with `industries: ["marketing"]` when signal keywords match.
7. Research agent writes run diagnostics to `research-report.json`.
8. Editor + Publisher handle approval and publish.

### Why this matches manual deep research

- Prioritizes underrepresented categories.
- Enforces duplicate prevention before publish.
- Uses first-party sources and validation-first checks.
- Keeps a machine-readable run trace for auditing and tuning.

## 2) Blog writing workflow (automated)

The writer flow now uses:

- `automation/agents/blog-style-playbook.json`
- `automation/agents/writer-agent.mjs`
- `automation/agents/writer-learning-log.json`

### How it works

1. Writer loads style constraints (minimum candidate depth, minimum source depth, required internal links).
2. Writer generates article drafts with the Fact / Inference / Recommendation structure.
3. Writer enforces source depth guardrails before queueing.
4. Writer records output metrics (word count, headings, list count, links, sources, tier) into `writer-learning-log.json`.
5. Editor quality gates and publisher complete release flow.

### Learning loop

Update playbooks based on outcomes:

- Tighten `minSources` or `minCandidates` in `blog-style-playbook.json` when quality needs to increase.
- Reorder `categoryPriority` in `resource-research-playbook.json` to rebalance catalog coverage.
- Inspect `writer-learning-log.json` and `research-report.json` after each run to spot drift.

## 3) Commands

```bash
npm run agent:scout
npm run agent:research
npm run agent:writer
npm run agent:editor
npm run agent:publish
```

Orchestrator runs:

```bash
npm run agent:orchestrator -- daily
npm run agent:orchestrator -- full --approve-reviewed
```
