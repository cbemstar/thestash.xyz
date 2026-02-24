---
name: authority-content-engine
description: Generate high-value authority content for developer-tool discovery and evaluation. Use when the user asks for content briefs, SEO article plans, topic clusters, comparison pages, alternatives pages, use-case pages, collection hubs, or full drafts about AI developer tools, agentic AI frameworks, Webflow/API workflows, LLM observability, MCP tooling, and frontend UI ecosystem shifts.
---

# Authority Content Engine

## Overview

Create content that wins high-intent discovery by being specific, evidence-driven, and decision-useful.
Focus on queries where users are evaluating tools, making architecture choices, or planning implementation.

## Minimal Input

Collect these fields before drafting. If details are missing, assume reasonable defaults and state assumptions.

- Topic
- Primary audience
- Funnel stage (`awareness`, `consideration`, `decision`)
- Format (`comparison`, `alternatives`, `best-for-use-case`, `workflow-guide`, `collection-hub`)
- Primary conversion goal (newsletter, resource click, affiliate click, demo, contact)

## Workflow

1. Classify intent and format.
2. Select the most relevant pillar and subtopic from `references/topic-opportunity-map.md`.
3. Open only the matching format in `references/page-blueprints.md`.
4. Build an authority brief before writing full copy.
5. Draft content with explicit tradeoffs, use-case fit, and implementation constraints.
6. Run the quality gates in `references/quality-gates.md` and revise until passing score.

## Authority Brief (Required)

Create this brief for every request, even when the user asks directly for a draft.

- Search intent summary (what decision the reader is trying to make)
- Safe-harbor keyword set (primary + 3 to 7 variants)
- Reader job-to-be-done and failure risks
- Evaluation framework (5 to 8 criteria tied to the format)
- Evidence plan (what can be verified vs what must be qualified)
- Internal link plan (`/compare/`, `/alternatives/`, `/tools/...-for-...`, related collections)
- Differentiation angle (why this page is hard to replace with a generic AI summary)
- Exact date stamps for time-sensitive claims

## Format Selection

Use this routing logic.

- If query includes `vs`, `compare`, `better`: use `comparison`
- If query includes `alternative`, `replacement`, `similar to`: use `alternatives`
- If query includes `best ... for ...`: use `best-for-use-case`
- If query includes `how to`, `workflow`, `setup`, `playbook`: use `workflow-guide`
- If query asks for category curation: use `collection-hub`

## Content Standards

- Prefer concrete constraints over hype.
- Show where each tool fails, not only where it wins.
- Use absolute dates for freshness statements.
- Separate facts, inferences, and recommendations.
- Avoid fabricated pricing, benchmarks, or adoption metrics.
- Provide migration or implementation guidance when comparison intent is commercial.
- Keep intros short; answer the core question early.

## Output Contract

Return outputs in this order unless the user asks for a different format.

1. Authority brief
2. Proposed title options (3)
3. Recommended slug
4. Meta title and meta description
5. Full draft with clear headings
6. Internal link suggestions (3 to 8 URLs/patterns)
7. Optional schema suggestion (`Article`, `ItemList`, `FAQPage`, or `SoftwareApplication`)

## Script Usage

Use the scaffold script when the user asks for speed, repeatability, or bulk ideation.

```bash
python3 scripts/generate_authority_brief.py \
  --topic "Cursor vs Windsurf for enterprise React teams" \
  --format comparison \
  --pillar ai-developer-tools \
  --stage consideration \
  --audience "Senior frontend engineers"
```

Then fill the generated template with context-specific analysis.

## Resources

- `references/topic-opportunity-map.md`
Purpose: Choose high-intent topic angles and programmatic expansion paths.
- `references/page-blueprints.md`
Purpose: Use the correct structure for each content format.
- `references/quality-gates.md`
Purpose: Score and harden the draft before returning it.
- `scripts/generate_authority_brief.py`
Purpose: Produce a deterministic content brief scaffold.

## Red Flags

Stop and ask for clarification only when critical constraints are missing:

- The audience is unknown and cannot be inferred.
- The requested claim depends on unverifiable or proprietary data.
- The user requests factual certainty for rapidly changing pricing or feature matrices without allowing verification.
