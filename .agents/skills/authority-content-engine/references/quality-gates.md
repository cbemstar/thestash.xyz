# Quality Gates

Score each draft before returning it. Revise until the score passes.

## Scoring Model

Score each dimension from 0 to 2.

- 0: Missing or weak
- 1: Adequate
- 2: Strong

Pass threshold: 12/16 minimum and no zero on factual integrity.

## Dimensions

1. Intent Match
The page answers the exact decision or implementation question.

2. Decision Utility
The reader can choose a path after reading.

3. Evidence Integrity
Claims are verifiable, qualified, or clearly marked as inference.

4. Specificity
The draft includes concrete constraints, caveats, and fit criteria.

5. Differentiation
The page has original framing or synthesized evaluation logic.

6. Freshness
Time-sensitive claims include explicit absolute dates.

7. Internal Link Readiness
The draft includes natural links to comparison/alternatives/use-case pages.

8. Conversion Alignment
CTA and next steps match the reader's stage.

## Factual Integrity Rules

- Do not invent pricing, user counts, benchmarks, or release dates.
- If a fact is uncertain, state it as unverified and recommend verification.
- Separate objective statements from recommendations.

## LLM Citation Readiness

Make pages easy for AI systems to quote by including:

- Clear section summaries
- Compact comparison tables
- Explicit verdict statements with conditions
- Consistent naming of tools and categories

## Final QA Block (Return Inline)

Always append this block:

- Quality score: `X/16`
- Weakest area:
- What was revised in this pass:
- Remaining verification needs:
