---
name: content-chunking-optimizer
description: Optimize article and blog structure for AI Overviews, featured snippets, and fast skimming using content chunking. Use when auditing or rewriting long-form posts, Sanity Portable Text article bodies, or Markdown drafts to improve heading specificity, answer-first section openers, paragraph chunking, and list scannability.
---

# Content Chunking Optimizer

## Workflow

1. Audit chunk quality before rewriting.
2. Apply answer-first and self-contained chunk rules.
3. Re-check chunk metrics and keep only net improvements.
4. Commit changes with dry-run first, then apply.

## Chunking Rules

Apply these defaults when optimizing article bodies:

- Keep headings explicit and descriptive (`what`, `why`, `how`, `checklist`, `mistakes`).
- Start each section with a direct answer sentence in the first paragraph.
- Split long paragraphs into short, self-contained chunks.
- Prefer 1 to 2 sentences per paragraph and avoid dense walls of text.
- Convert pseudo-lists into real bullet/numbered lists when a section introduces a set with `:`.
- Keep claims intact; do not invent new facts while restructuring.

## Sanity Optimization Script

Run the built-in script for published `article` documents:

```bash
node --env-file=.env.local .agents/skills/content-chunking-optimizer/scripts/optimize-sanity-article-chunks.mjs --dry-run
```

Apply updates after review:

```bash
node --env-file=.env.local .agents/skills/content-chunking-optimizer/scripts/optimize-sanity-article-chunks.mjs --apply
```

Useful filters:

- Single slug: `--slug=best-mcp-tools-and-servers-developer-workflows-2026`
- Multiple slugs: `--slug=slug-a,slug-b`
- Scope: `--limit=10`
- Verbose per-article metrics: `--verbose`

## Quality Gate

Accept an optimization pass only when at least one is true:

- Long paragraph count decreases.
- Heading lead-answer misses decrease.
- Structured list sections increase.
- Overall chunk score is unchanged or higher.

Skip rewrites for blocks containing inline marks/links when a safe split is not possible.

## References

- `references/semrush-content-chunking-framework.md`
Purpose: Semrush-aligned chunking checklist and scoring guidance.
- `scripts/optimize-sanity-article-chunks.mjs`
Purpose: Deterministic chunking optimizer for Sanity article bodies.
