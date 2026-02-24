---
name: backlink-growth-engine
description: Build repeatable backlink acquisition workflows using proven tactics such as competitor backlink replication, journalist request pitching, digital PR, listicle outreach, guest posting, broken link building, unlinked mention reclamation, and directory/profile optimization. Use when users ask how to get backlinks, improve off-page SEO authority, create outreach campaigns, prioritize link-building opportunities, or run weekly/monthly backlink growth automations.
---

# Backlink Growth Engine

## Overview

Plan and execute backlink growth campaigns with high-quality, low-risk tactics.
Generate automation-ready sprint outputs with fixed sections, templates, and QA checks.

## Minimal Inputs

Collect these fields before execution:

- Domain
- Industry or niche
- Link target for this sprint (count)
- Sprint length (days)
- Risk profile (`conservative`, `balanced`, `aggressive`)

If details are missing, assume:

- Industry: `general`
- Link target: `8`
- Sprint length: `14`
- Risk profile: `balanced`

## Workflow

1. Load `references/semrush-backlink-playbook.md` and select tactics by risk profile.
2. Generate a deterministic sprint scaffold with:

- Competitor backlink replication
- Journalist request pitching
- Digital PR campaigns
- Listicle/resource-page outreach
- Guest post pitching
- Broken link building
- Unlinked mention reclamation
- Directory/profile optimization

3. Apply prioritization:

- Prefer high relevance and editorial links over raw volume.
- Use risk controls to avoid paid/spammy links.
- Keep one cleanup block for toxic-link monitoring/disavow decisions.

4. Produce output in the fixed contract below.
5. For repeatable runs, use `scripts/generate_backlink_sprint.py`.

## Output Contract (Automation-Ready)

Return sections in this exact order:

1. `Run Metadata`
2. `KPI Targets`
3. `Prioritized Tactics`
4. `Prospect Queue`
5. `Daily Action Plan`
6. `Outreach Templates`
7. `Risk Controls`
8. `Next Run Checklist`

Use explicit dates, counts, and assumptions so a scheduler can diff runs reliably.

## Script Usage

Use the helper script for recurring execution:

```bash
python3 scripts/generate_backlink_sprint.py \
  --domain example.com \
  --industry "developer tools" \
  --goal-links 10 \
  --sprint-days 14 \
  --risk-profile balanced \
  --output reports/backlink-sprint.md
```

If `--output` is omitted, print to stdout for direct automation ingestion.

## Resources

- `references/semrush-backlink-playbook.md`
Purpose: Tactic definitions, qualification rubric, and outreach templates.
- `scripts/generate_backlink_sprint.py`
Purpose: Deterministic sprint-plan generation for recurring automations.

## Guardrails

- Do not recommend buying links or link exchanges intended to manipulate rankings.
- Flag suspicious domains and route them to manual review before disavow.
- Prefer editorial relevance and traffic potential over vanity authority metrics.
- If critical context is unavailable, proceed with assumptions and list them in `Run Metadata`.
