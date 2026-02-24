#!/usr/bin/env python3
"""Generate a deterministic authority-content brief scaffold."""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

FORMAT_GUIDANCE = {
    "comparison": {
        "goal": "Help readers choose between competing tools.",
        "outline": [
            "Intro with fast verdict by scenario",
            "Evaluation criteria and weighting",
            "Side-by-side comparison",
            "Tradeoffs and failure modes",
            "Migration or implementation notes",
            "Final recommendation by team profile",
            "FAQ",
        ],
    },
    "alternatives": {
        "goal": "Help readers replace a known tool with better-fit options.",
        "outline": [
            "Why teams seek alternatives",
            "Shortlist table",
            "Deep dive by alternative",
            "Migration checklist",
            "Risk and cost caveats",
            "Recommendation paths",
        ],
    },
    "best-for-use-case": {
        "goal": "Rank tools for a specific use case and audience.",
        "outline": [
            "Scope and selection criteria",
            "Ranked picks",
            "Best overall and best by segment",
            "When not to choose each option",
            "30-day implementation plan",
        ],
    },
    "workflow-guide": {
        "goal": "Provide a step-by-step implementation workflow.",
        "outline": [
            "Prerequisites and assumptions",
            "Workflow architecture",
            "Step-by-step setup",
            "Validation and troubleshooting",
            "Production hardening",
            "Operational checklist",
        ],
    },
    "collection-hub": {
        "goal": "Create a cluster hub for a topic category.",
        "outline": [
            "Category scope",
            "Taxonomy and subcategories",
            "Featured picks by use case",
            "Comparison and alternatives jump links",
            "Guides and learning links",
            "Related cluster pages",
        ],
    },
}

PILLAR_GUIDANCE = {
    "ai-developer-tools": "Daily coding assistants, IDE agents, and prototyping tools.",
    "ai-code-review": "AI-assisted PR review, CI guardrails, and code quality workflows.",
    "self-hosted-ai": "On-prem or VPC-hosted LLM tooling for engineering teams.",
    "llm-observability": "Tracing, evaluation, and monitoring for production LLM apps.",
    "mcp-tooling": "Model Context Protocol servers and workflow integrations.",
    "webflow-apps-apis": "Webflow app development using APIs, OAuth, and deployment pipelines.",
    "ai-ops-automation": "Automation for engineering and DevOps workflows using AI agents.",
    "ui-component-shifts": "Post-Shadcn ecosystem choices and migration decisions.",
}

STAGE_GUIDANCE = {
    "awareness": "Teach and frame the problem space with actionable context.",
    "consideration": "Compare options and tradeoffs for practical decision-making.",
    "decision": "De-risk adoption with implementation and migration guidance.",
}


def build_brief(args: argparse.Namespace) -> str:
    today = dt.date.today().isoformat()
    fmt = FORMAT_GUIDANCE[args.format]
    pillar_line = PILLAR_GUIDANCE[args.pillar]
    stage_line = STAGE_GUIDANCE[args.stage]

    outline_lines = "\n".join(
        f"{idx}. {item}" for idx, item in enumerate(fmt["outline"], start=1)
    )

    primary_keyword = args.primary_keyword or f"[TODO] {args.topic.lower()}"

    return f"""# Authority Brief: {args.topic}

## 1) Snapshot
- Generated: {today}
- Topic: {args.topic}
- Format: {args.format}
- Pillar: {args.pillar}
- Pillar focus: {pillar_line}
- Audience: {args.audience}
- Funnel stage: {args.stage}
- Stage goal: {stage_line}
- Primary keyword: {primary_keyword}
- Conversion goal: [TODO]

## 2) Search Intent and Safe-Harbor Queries
- Core decision question: [TODO]
- Query variants:
  - [TODO]
  - [TODO]
  - [TODO]
  - [TODO]

## 3) Differentiation Angle
- Why this page is hard to replace with a generic summary: [TODO]
- Proprietary or synthesized insight to add: [TODO]

## 4) Evaluation Framework
- Criteria (5-8):
  - [TODO]
  - [TODO]
  - [TODO]
  - [TODO]
  - [TODO]

## 5) Evidence Plan
- Verifiable facts to include: [TODO]
- Claims requiring qualification: [TODO]
- Absolute date for freshness statements: {today}

## 6) Structure Outline
- Blueprint objective: {fmt["goal"]}
{outline_lines}

## 7) Internal Linking Plan
- Sibling comparison page: [TODO]
- Alternatives page: [TODO]
- Use-case or stack page: [TODO]
- Workflow/guide page: [TODO]

## 8) Metadata Draft
- Slug: [TODO]
- Title options (3):
  1. [TODO]
  2. [TODO]
  3. [TODO]
- Meta title (<=60): [TODO]
- Meta description (<=155): [TODO]

## 9) QA Gate
- Target quality score: 12/16 minimum
- Factual integrity risks: [TODO]
- Final verification needs: [TODO]
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--topic", required=True, help="Topic or working title")
    parser.add_argument(
        "--format",
        required=True,
        choices=sorted(FORMAT_GUIDANCE.keys()),
        help="Content format",
    )
    parser.add_argument(
        "--pillar",
        required=True,
        choices=sorted(PILLAR_GUIDANCE.keys()),
        help="Topic pillar",
    )
    parser.add_argument(
        "--stage",
        default="consideration",
        choices=sorted(STAGE_GUIDANCE.keys()),
        help="Funnel stage",
    )
    parser.add_argument(
        "--audience",
        default="Developers evaluating implementation options",
        help="Primary audience",
    )
    parser.add_argument(
        "--primary-keyword",
        default="",
        help="Optional primary keyword override",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Optional output file path (prints to stdout if omitted)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    brief = build_brief(args)

    if args.output:
        output_path = Path(args.output)
        output_path.write_text(brief)
        print(f"Wrote brief to {output_path}")
    else:
        print(brief)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
