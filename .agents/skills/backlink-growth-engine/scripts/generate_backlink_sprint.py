#!/usr/bin/env python3
"""Generate a deterministic backlink-acquisition sprint scaffold."""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

TACTICS = [
    {
        "key": "competitor-replication",
        "name": "Replicate Competitor Backlinks",
        "effort": 3,
        "impact": 5,
        "risk": 1,
        "description": "Mine competitors for link opportunities and prioritize overlap domains.",
    },
    {
        "key": "journalist-pitching",
        "name": "Pitch Journalist Requests",
        "effort": 3,
        "impact": 4,
        "risk": 1,
        "description": "Respond to active media requests with concise expert insight.",
    },
    {
        "key": "digital-pr",
        "name": "Run Digital PR Campaign",
        "effort": 5,
        "impact": 5,
        "risk": 2,
        "description": "Create data-backed stories or tools to earn editorial mentions.",
    },
    {
        "key": "listicle-outreach",
        "name": "Pitch Listicles and Resource Pages",
        "effort": 3,
        "impact": 4,
        "risk": 1,
        "description": "Find curated pages and submit relevant assets for inclusion.",
    },
    {
        "key": "guest-posting",
        "name": "Guest Posting",
        "effort": 5,
        "impact": 4,
        "risk": 2,
        "description": "Pitch and publish original articles on relevant sites.",
    },
    {
        "key": "broken-link-building",
        "name": "Broken Link Building",
        "effort": 3,
        "impact": 3,
        "risk": 1,
        "description": "Locate broken outbound links and offer replacement resources.",
    },
    {
        "key": "unlinked-mentions",
        "name": "Reclaim Unlinked Mentions",
        "effort": 2,
        "impact": 3,
        "risk": 1,
        "description": "Convert existing brand mentions into followed contextual links.",
    },
    {
        "key": "directories-profiles",
        "name": "Directory and Profile Optimization",
        "effort": 2,
        "impact": 2,
        "risk": 2,
        "description": "Update high-quality business directories and profile listings.",
    },
    {
        "key": "endorse-partners",
        "name": "Endorse Tools and Partners",
        "effort": 2,
        "impact": 2,
        "risk": 1,
        "description": "Publish testimonials and partnership endorsements for reciprocal mentions.",
    },
]

PROFILE_BONUS = {
    "conservative": {
        "directories-profiles": -1,
        "guest-posting": -1,
        "digital-pr": 1,
        "unlinked-mentions": 1,
        "journalist-pitching": 1,
    },
    "balanced": {
        "digital-pr": 1,
        "competitor-replication": 1,
    },
    "aggressive": {
        "guest-posting": 1,
        "directories-profiles": 1,
        "broken-link-building": 1,
    },
}

TEMPLATE_SNIPPETS = {
    "journalist-pitching": "Offer a direct quote + one unique data point relevant to the request.",
    "listicle-outreach": "Pitch one clear reader benefit and a concise blurb the editor can paste.",
    "guest-posting": "Propose one headline + three audience outcomes + writing sample.",
    "broken-link-building": "Cite the broken URL and provide a closely matching replacement resource.",
    "unlinked-mentions": "Thank them for the mention and request a direct URL citation.",
}


def tactic_score(tactic: dict[str, object], risk_profile: str) -> float:
    impact = int(tactic["impact"])
    effort = int(tactic["effort"])
    risk = int(tactic["risk"])
    key = str(tactic["key"])
    bonus = PROFILE_BONUS[risk_profile].get(key, 0)
    return round((impact * 1.7) + bonus - (effort * 0.45) - (risk * 0.5), 2)


def prioritize_tactics(risk_profile: str) -> list[tuple[dict[str, object], float]]:
    scored: list[tuple[dict[str, object], float]] = []
    for tactic in TACTICS:
        score = tactic_score(tactic, risk_profile)
        scored.append((tactic, score))
    return sorted(scored, key=lambda item: item[1], reverse=True)


def build_daily_actions(
    prioritized: list[tuple[dict[str, object], float]], sprint_days: int
) -> list[str]:
    tasks: list[str] = []
    top_tactics = prioritized[: min(6, len(prioritized))]

    tasks.append("Set up tracker and baseline: current referring domains, recent new links, toxic-link watchlist.")
    tasks.append("Extract competitor backlink opportunities and classify Tier A/B prospects.")

    for tactic, _ in top_tactics:
        name = str(tactic["name"])
        tasks.append(f"Research prospects for {name}.")
        tasks.append(f"Send first outreach wave for {name}.")
        tasks.append(f"Follow up and log responses for {name}.")

    schedule: list[str] = []
    for day in range(1, sprint_days + 1):
        task = tasks[(day - 1) % len(tasks)]
        schedule.append(f"Day {day}: {task}")
    return schedule


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--domain", required=True, help="Primary domain to grow")
    parser.add_argument("--industry", default="general", help="Primary niche/industry")
    parser.add_argument("--goal-links", type=int, default=8, help="Target new links this sprint")
    parser.add_argument("--sprint-days", type=int, default=14, help="Sprint length in days")
    parser.add_argument(
        "--risk-profile",
        default="balanced",
        choices=("conservative", "balanced", "aggressive"),
        help="Tactic mix and risk appetite",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Optional output file path; omit to print to stdout",
    )
    return parser.parse_args()


def build_plan(args: argparse.Namespace) -> str:
    run_date = dt.date.today().isoformat()
    prioritized = prioritize_tactics(args.risk_profile)
    daily_actions = build_daily_actions(prioritized, args.sprint_days)

    tactic_rows = []
    for index, (tactic, score) in enumerate(prioritized[:8], start=1):
        tactic_rows.append(
            "| {idx} | {name} | {score} | {desc} |".format(
                idx=index,
                name=tactic["name"],
                score=score,
                desc=tactic["description"],
            )
        )
    tactic_table = "\n".join(tactic_rows)

    templates = []
    for key, snippet in TEMPLATE_SNIPPETS.items():
        templates.append(f"- {key}: {snippet}")

    daily_lines = "\n".join(f"- {item}" for item in daily_actions)
    template_lines = "\n".join(templates)

    return f"""# Backlink Sprint Plan: {args.domain}

## Run Metadata
- Generated on: {run_date}
- Domain: {args.domain}
- Industry: {args.industry}
- Sprint length: {args.sprint_days} days
- Risk profile: {args.risk_profile}
- Assumptions: no existing prospect list was provided

## KPI Targets
- Target new backlinks: {args.goal_links}
- Target responses: {max(args.goal_links * 3, 12)}
- Target positive placements: {max(args.goal_links, 6)}
- Suggested follow-up cadence: 2 follow-ups per prospect over 14 days

## Prioritized Tactics
| Priority | Tactic | Score | Why It Matters |
| --- | --- | --- | --- |
{tactic_table}

## Prospect Queue
- Tier A: `[domain] | [contact] | [tactic] | [fit reason] | [status]`
- Tier B: `[domain] | [contact] | [tactic] | [fit reason] | [status]`
- Tier C: `[domain] | [contact] | [tactic] | [fit reason] | [status]`

## Daily Action Plan
{daily_lines}

## Outreach Templates
{template_lines}

## Risk Controls
- Do not buy links or run manipulative exchanges.
- Reject irrelevant or low-quality sites, even if authority metrics look strong.
- Keep anchors natural and varied.
- Flag suspicious inbound links for manual review before disavow.

## Next Run Checklist
- Carry over unresolved Tier A prospects.
- Record new referring domains and placements earned.
- Update best-performing subject lines and outreach angles.
- Prune low-quality prospects from the queue.
"""


def main() -> int:
    args = parse_args()
    plan = build_plan(args)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(plan)
        print(f"Wrote plan to {output_path}")
    else:
        print(plan)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
