# Blog 2026 Refresh Audit

- Refreshed at: `2026-02-15`
- Scope: all published `article` documents in Sanity
- Result: `20/20` articles updated with a `2026 update: latest verified benchmarks` section
- Result: `20/20` articles now include refreshed infographic benchmark blocks and deduped source lists
- Result: second-pass legacy cleanup complete (`0` remaining `2024` mentions across text, links, and source metadata)
- Result: third-pass conversion layer shipped on all blog article pages (newsletter form + internal-link CTA block)

## Verification Snapshot

- `workflow-automation-tools-designers-devs-2026` (7 sources)
- `best-practices-accessible-web-interfaces-2026` (7 sources)
- `top-web-development-services-pick-right-one-2026` (5 sources)
- `choosing-between-webflow-traditional-web-builders-2026` (5 sources)
- `most-popular-programming-languages-their-uses-2026` (4 sources)
- `essential-resources-learning-frontend-development-2026` (9 sources)
- `top-web-design-inspiration-sources-2026` (8 sources)
- `compare-top-10-nocode-platforms-beginners-2026` (6 sources)
- `best-ai-tools-developers-accelerate-coding-2026` (7 sources)
- `ultimate-list-coding-resources-2026` (9 sources)
- `best-platforms-launch-saas-product-2026` (6 sources)
- `most-recommended-developer-frameworks-2026` (7 sources)
- `best-subscription-services-continuous-learning-tech-2026` (7 sources)
- `beginners-guide-modern-web-development-technologies-2026` (7 sources)
- `mastering-css-animations-tips-best-practices-2026` (9 sources)
- `future-ai-developers-workflow-2026` (7 sources)
- `how-github-enhances-collaboration-modern-dev-teams` (7 sources)
- `how-integrate-ai-apis-web-projects-2026` (6 sources)
- `top-15-developer-tools-boost-workflow-2026` (7 sources)
- `how-choose-right-ui-design-tools-projects-2026` (6 sources)

## 2026 Source Set Used

- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025)
- [Stack Overflow Developer Survey 2025 (AI)](https://survey.stackoverflow.co/2025/ai)
- [Stack Overflow Developer Survey 2025 (Developers)](https://survey.stackoverflow.co/2025/developers)
- [Stack Overflow Developer Survey 2025 (Methodology)](https://survey.stackoverflow.co/2025/methodology/)
- [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)
- [JetBrains Developer Ecosystem 2025](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)
- [WebAIM Million 2025](https://webaim.org/projects/million/)
- [HTTP Archive Web Almanac 2025](https://almanac.httparchive.org/en/2025/)
- [HTTP Archive Web Almanac 2025 (Page Weight)](https://almanac.httparchive.org/en/2025/page-weight)
- [W3Techs WordPress Usage Stats (February 2026)](https://w3techs.com/technologies/comparison/cm-wordpress)
- [Postman State of the API 2025](https://www.postman.com/state-of-api/2025/)
- [Coursera Global Skills Report 2025](https://www.coursera.org/skills-reports/global)
- [Coursera 2025 GSR Announcement](https://blog.coursera.org/presenting-courseras-2025-global-skills-report-the-skills-trends-shaping-the-future-of-education-and-employment/)
- [UX Tools 2025 Survey (Design Standard)](https://www.uxtools.co/survey/design-tools-awards/design-standard)
- [UX Tools 2025 Survey (The Big Picture)](https://www.uxtools.co/survey/conclusion/the-big-picture)

## Runbook

1. Run refresh: `npm run content:refresh:blogs:2026`
2. Run legacy rewrite cleanup: `npm run content:rewrite:legacy-references:2026`
3. Verify coverage with a Sanity query for all article slugs and section presence.
4. Verify stale-year cleanup with a query counting `2024` mentions in article body + source labels/urls.
5. Confirm article template conversion module renders:
   - newsletter form posting to `/api/subscribe`
   - internal CTA links to `/compare`, `/alternatives`, `/use-cases`, `/reports/ai-coding-tools-benchmark`
6. Re-run quarterly with updated source set and review date.
