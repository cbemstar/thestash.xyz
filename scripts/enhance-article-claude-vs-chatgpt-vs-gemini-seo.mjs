#!/usr/bin/env node

import { createClient } from "@sanity/client";
import { randomUUID } from "node:crypto";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: false,
  token,
});

const slug = "claude-vs-chatgpt-vs-gemini-for-developers-2026";

function key() {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

function parseInlineLinks(text) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > cursor) {
      out.push({ text: text.slice(cursor, match.index), href: null });
    }
    out.push({ text: match[1], href: match[2] });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    out.push({ text: text.slice(cursor), href: null });
  }
  return out.length ? out : [{ text, href: null }];
}

function blockFromLine(text, style = "normal", listItem = null) {
  const segments = parseInlineLinks(text);
  const markDefs = [];
  const children = segments
    .filter((segment) => segment.text.length > 0)
    .map((segment) => {
      if (!segment.href) {
        return { _type: "span", _key: key(), text: segment.text };
      }
      const markKey = key();
      markDefs.push({
        _key: markKey,
        _type: "link",
        href: segment.href,
      });
      return {
        _type: "span",
        _key: key(),
        text: segment.text,
        marks: [markKey],
      };
    });

  const out = {
    _type: "block",
    _key: key(),
    style,
    children,
  };

  if (markDefs.length > 0) out.markDefs = markDefs;
  if (listItem) out.listItem = listItem;
  return out;
}

function infographicUsageSnapshot() {
  return {
    _type: "infographic",
    _key: key(),
    variant: "grid",
    title: "2025 developer AI usage snapshot",
    stats: [
      { _key: key(), label: "All respondents using AI daily", value: "47.1%" },
      { _key: key(), label: "Professional developers using AI daily", value: "50.6%" },
      { _key: key(), label: "Respondents using or planning AI tools", value: "84%" },
      { _key: key(), label: "Respondents who do not plan to use AI", value: "16.2%" },
      { _key: key(), label: "Survey responses for this question", value: "33,662" },
      { _key: key(), label: "AI-threat sentiment: \"No\"", value: "63.6%" },
    ],
    sourceLabel: "Stack Overflow Developer Survey 2025 (AI)",
    sourceUrl: "https://survey.stackoverflow.co/2025/ai",
  };
}

function infographicGithubSignals() {
  return {
    _type: "infographic",
    _key: key(),
    variant: "grid",
    title: "GitHub Octoverse 2025 signals",
    stats: [
      { _key: key(), label: "Public/open source contributions", value: "1.128B" },
      { _key: key(), label: "Merged pull requests", value: "518.7M" },
      { _key: key(), label: "New open source contributors in March 2025", value: "255k" },
      { _key: key(), label: "Public repositories", value: "395M" },
      { _key: key(), label: "Notebooks growth YoY", value: "+75%" },
      { _key: key(), label: "Dockerfiles growth YoY", value: "+120%" },
    ],
    sourceLabel: "GitHub Octoverse 2025",
    sourceUrl:
      "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
  };
}

function sourcedImageUsageChart() {
  return {
    _type: "sourcedImage",
    _key: key(),
    imageUrl:
      "https://survey.stackoverflow.co/2025/charts/stackoverflow-dev-survey-2025-ai-sentiment-and-usage-ai-select-social.png",
    alt: "Stack Overflow 2025 AI survey chart showing AI tool usage cadence among respondents.",
    caption:
      "Stack Overflow Developer Survey 2025 chart for AI-tool usage cadence (all respondents).",
    sourceLabel: "Stack Overflow Developer Survey 2025 (AI chart)",
    sourceUrl: "https://survey.stackoverflow.co/2025/ai",
    width: 2400,
    height: 1110,
  };
}

function sourcedImageGithubTopMetrics() {
  return {
    _type: "sourcedImage",
    _key: key(),
    imageUrl:
      "https://github.blog/wp-content/uploads/2025/10/octoverse-2025-open-source-top-metrics.png?resize=1728%2C432",
    alt: "GitHub Octoverse 2025 top open-source metrics infographic with contributions and contributor growth.",
    caption:
      "GitHub Octoverse 2025 open-source top metrics graphic.",
    sourceLabel: "GitHub Octoverse 2025",
    sourceUrl:
      "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
    width: 1728,
    height: 432,
  };
}

function sourcedImageGithubProductivity() {
  return {
    _type: "sourcedImage",
    _key: key(),
    imageUrl:
      "https://github.blog/wp-content/uploads/2025/10/octoverse-2025-developer-productivity-top-line-metrics.png?resize=1728%2C432",
    alt: "GitHub Octoverse 2025 developer productivity metrics graphic with closed issues and merged pull requests.",
    caption:
      "GitHub Octoverse 2025 developer productivity top-line metrics graphic.",
    sourceLabel: "GitHub Octoverse 2025",
    sourceUrl:
      "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
    width: 1728,
    height: 432,
  };
}

function sourcedImageGeminiCreative() {
  return {
    _type: "sourcedImage",
    _key: key(),
    imageUrl: "https://ai.google.dev/static/site-assets/images/share-gemini-api-2.png",
    alt: "Official Google AI for Developers Gemini API share image.",
    caption: "Official Gemini API share creative from Google AI for Developers.",
    sourceLabel: "Google AI for Developers (Gemini API docs)",
    sourceUrl: "https://ai.google.dev/gemini-api/docs",
    width: 1200,
    height: 675,
  };
}

function bodyBlocks() {
  const markdown = `Choosing an assistant for developer workflows in 2026 is not a single-model popularity contest. It is an architecture decision across productivity, integration depth, governance, and reliability.

As of February 19, 2026, a practical conclusion remains: Claude, ChatGPT, and Gemini are all useful for engineering teams, but each is strongest in different operating contexts. The winning choice depends on workflow fit, not benchmark theater.

## Authority brief snapshot (for engineering decision-makers)

- Decision question: Which assistant should we standardize for coding, review, and implementation tasks?
- Audience: Developers, tech leads, and platform teams.
- Intent stage: Consideration with immediate implementation impact.
- Primary recommendation: Run a structured pilot and assign a primary assistant by workflow domain, not globally.
- Freshness boundary: Facts and source checks in this article are reviewed against official pages and reports dated through February 19, 2026.

## Official data signals before tool selection

Before comparing features, validate market behavior with reputable datasets. In the [Stack Overflow Developer Survey 2025 AI section](https://survey.stackoverflow.co/2025/ai), 84% of respondents report using or planning to use AI tools in their development process. The same source reports 50.6% daily AI usage among professional developers, with 47.1% daily usage across all respondents.

The same dataset also shows a useful risk signal: 63.64% of respondents answered that AI is not a threat to their current job, while 15.01% answered yes. That split is important for rollout strategy. It means adoption is mainstream, but governance and change management still matter.

[[INFOGRAPHIC:usage-snapshot]]
[[IMAGE:so-ai-usage]]

## Productivity and ecosystem momentum from first-party platform data

The [GitHub Octoverse 2025 report](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) provides first-party ecosystem signals: a new developer joined GitHub every second in 2025, public/open source contributions reached 1.128 billion (+13% YoY), and merged pull requests reached 518.7 million.

For teams evaluating assistants, these signals matter because they indicate where tooling pressure is highest: faster implementation loops, more AI-assisted experimentation, and more review burden on platform teams.

[[INFOGRAPHIC:github-signals]]
[[IMAGE:github-open-source]]
[[IMAGE:github-productivity]]

## Scenario verdict: where each assistant is usually the better fit

Use this scenario mapping as a first-pass selection framework:

- Choose Claude first when your team is terminal-heavy, works in large repositories, and values agentic workflows through [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code/overview).
- Choose ChatGPT first when your team wants broad coverage across coding, synthesis, and API-driven automation from one platform, starting from [OpenAI Codex announcement context](https://openai.com/index/introducing-codex/).
- Choose Gemini first when your environment already depends on Google developer tooling and cloud ecosystem alignment, using [Gemini API docs](https://ai.google.dev/gemini-api/docs) and [Gemini Code Assist docs](https://developers.google.com/gemini-code-assist/docs/overview).

Most organizations should deploy a primary + fallback model strategy to reduce policy and continuity risk.

## Comparison framework (use this in procurement and pilot scoring)

Use seven criteria, each scored by workflow rather than aggregate preference:

- Multi-file coding quality and edit reliability.
- Context handling for larger codebases.
- IDE and terminal integration depth.
- API integration quality and automation ergonomics.
- Security and governance controls.
- Cost predictability under daily team usage.
- Migration friction from your current stack.

If your immediate priority is code quality workflow, align this with [AI code review workflow with GitHub, Cursor, and Claude](/blog/ai-code-review-workflow-github-cursor-claude-2026).

If your priority is platform-level observability, link evaluation to [LLM observability stack planning](/blog/llm-observability-stack-langfuse-literalai-helicone-2026) so adoption and telemetry stay synchronized.

## Integration and deployment reality checks

Teams usually fail assistant rollouts at the integration layer, not at prompt quality. Common failure patterns:

- No shared prompt contracts across teams.
- Weak fallback behavior when providers fail or rate-limit.
- Missing review gates for high-impact code changes.
- No traceability between prompts, outputs, and merged code.

To avoid this, define a hard rollout contract:

- Require structured prompts for high-risk tasks.
- Require human approval for production-impacting changes.
- Log model/provider metadata for every accepted suggestion.
- Keep one fallback assistant ready for resilience.

For orchestration-heavy teams, connect this to [MCP implementation strategy](/blog/best-mcp-tools-and-servers-developer-workflows-2026) and [AI API integration patterns](/blog/how-integrate-ai-apis-web-projects-2026).

## Cost model: track accepted outcome efficiency, not prompt cost

Raw token prices are easy to compare but frequently misleading. Better operational metrics:

- Cost per accepted pull-request change.
- Cost per resolved debugging incident.
- Prompt-to-merge cycle time.
- Human rework time per accepted output.
- Acceptance ratio by workflow type.

This cost model prevents false optimization where a cheaper call creates more review burden and lower net throughput.

## Accessibility, attribution, and source-quality policy used in this draft

This draft follows these rules:

- Use primary or high-authority first-party sources only (official docs, official reports, standards organizations).
- Attribute every visual with source label and source URL.
- Use descriptive alt text for every image to preserve meaning for assistive technologies.
- Include absolute dates for time-sensitive claims.
- Avoid low-authority aggregators and unattributed statistics.

[[IMAGE:gemini-share]]

## Recommendation for teams deciding now

Do not standardize globally after one ad hoc demo. Instead:

1. Pick 2-3 critical workflows (for example: implementation, bug triage, PR review).
2. Run Claude, ChatGPT, and Gemini on the same task sets for 2-4 weeks.
3. Score by acceptance quality, rework time, and governance fit.
4. Select primary assistant per workflow domain.
5. Keep one fallback model/provider for continuity.

This gives a defensible operating model and better long-term outcomes than committing to one vendor ideology.

## Assistant-specific tradeoffs engineering leads should pressure-test

Even with a pilot scorecard, leadership teams should pressure-test each option against failure modes seen in production organizations.

Claude tradeoffs to evaluate:

- Strength can drop if your team depends on ecosystem-specific integrations that are not standardized in your internal tooling.
- Terminal-first workflows can improve power-user productivity but may increase onboarding burden for less experienced contributors.
- Governance needs to include explicit command-execution boundaries when teams use agentic coding flows.

ChatGPT tradeoffs to evaluate:

- Broad capability can encourage overuse across tasks that should still be handled with deterministic tooling.
- Teams often underestimate operational complexity when they mix app workflows and API workflows without unified logging.
- Procurement teams should review model/package changes on a recurring schedule so architecture does not drift from budget assumptions.

Gemini tradeoffs to evaluate:

- The strongest value generally appears when your stack is already Google-aligned; mixed-cloud teams should test integration friction directly.
- If your workflow depends on external non-Google systems, verify operational quality at the connector layer, not only model output quality.
- Governance should validate how policy and access controls map to your existing cloud and IAM strategy.

The practical lesson is consistent across all three: model quality alone does not guarantee workflow reliability. Team operating discipline determines realized value.

## 60-day implementation checklist for standards-compliant rollout

Use this implementation plan when hardening from pilot to team standard:

1. Week 1-2: Define task categories, accepted-output criteria, and escalation paths for unsafe or low-confidence outputs.
2. Week 2-3: Enforce prompt templates and require source links for high-impact technical claims in assistant-generated artifacts.
3. Week 3-4: Add traceability for prompt, model, output, reviewer, and final merge decision in your engineering workflow logs.
4. Week 4-6: Run cost-per-accepted-outcome analysis and remove low-value assistant usage patterns.
5. Week 6-8: Finalize policy guardrails and codify a fallback assistant path for continuity during outages or provider regressions.

For organizations with compliance obligations, pair this checklist with periodic source quality audits. Every cited source in this article is from high-authority domains with first-party ownership or platform-level survey authority, and every embedded visual is attributed with alt text, source label, and source URL for accessibility and provenance.

## FAQ

### Is there one universal winner for all developer teams?

No. Most teams benefit from a workflow-specific decision: one assistant may perform better for in-repo coding, while another performs better for mixed synthesis and implementation support.

### Should we use one model everywhere for simplicity?

Only if your workflows are unusually uniform and compliance constraints are simple. In most environments, primary + fallback provides better continuity and lower platform risk.

### How often should we refresh this comparison?

Review quarterly, and also whenever major model updates, pricing changes, or integration capabilities shift. Re-check official documentation before renewing standards.
`;

  const lines = markdown.split("\n");
  const blocks = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line === "[[INFOGRAPHIC:usage-snapshot]]") {
      blocks.push(infographicUsageSnapshot());
      continue;
    }
    if (line === "[[INFOGRAPHIC:github-signals]]") {
      blocks.push(infographicGithubSignals());
      continue;
    }
    if (line === "[[IMAGE:so-ai-usage]]") {
      blocks.push(sourcedImageUsageChart());
      continue;
    }
    if (line === "[[IMAGE:github-open-source]]") {
      blocks.push(sourcedImageGithubTopMetrics());
      continue;
    }
    if (line === "[[IMAGE:github-productivity]]") {
      blocks.push(sourcedImageGithubProductivity());
      continue;
    }
    if (line === "[[IMAGE:gemini-share]]") {
      blocks.push(sourcedImageGeminiCreative());
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(blockFromLine(line.slice(3), "h2"));
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(blockFromLine(line.slice(4), "h3"));
      continue;
    }
    if (line.startsWith("- ")) {
      blocks.push(blockFromLine(line.slice(2), "normal", "bullet"));
      continue;
    }
    if (/^[0-9]+\.\s+/.test(line)) {
      blocks.push(blockFromLine(line.replace(/^[0-9]+\.\s+/, ""), "normal", "number"));
      continue;
    }
    blocks.push(blockFromLine(line, "normal"));
  }

  return blocks;
}

async function main() {
  const [existing, resources] = await Promise.all([
    client.fetch(
      `*[_type == "article" && coalesce(slug.current, slug) == "${slug}"][0]{ _id }`
    ),
    client.fetch(
      `*[_type == "resource" && coalesce(slug.current, slug) in ["claude","gemini","cursor","github-copilot"]]{ _id, "slug": coalesce(slug.current, slug) }`
    ),
  ]);

  if (!existing?._id) {
    console.error(`Article not found for slug: ${slug}`);
    process.exit(1);
  }

  const resourceIdBySlug = new Map(
    resources.map((resource) => [String(resource.slug), String(resource._id)])
  );
  const relatedResources = ["claude", "gemini", "cursor", "github-copilot"]
    .map((resourceSlug) => resourceIdBySlug.get(resourceSlug))
    .filter(Boolean)
    .map((id) => ({ _type: "reference", _ref: id }));

  const nowIso = new Date().toISOString();
  const payload = {
    title: "Claude vs ChatGPT vs Gemini for Developers (2026 Decision Guide)",
    excerpt:
      "A source-verified 2026 comparison of Claude, ChatGPT, and Gemini for developer teams, with first-party data visuals, implementation criteria, and schema-optimized structure.",
    primaryKeyword: "claude vs chatgpt vs gemini for developers",
    intentStage: "consideration",
    contentTier: "tier1",
    lastReviewedAt: nowIso,
    author: "The Stash Editorial Team",
    publishedAt: nowIso,
    tags: [
      "AI assistants",
      "developer tools",
      "Claude",
      "ChatGPT",
      "Gemini",
      "AI code review",
      "technical SEO",
      "workflow automation",
    ],
    body: bodyBlocks(),
    relatedResources,
    primaryResource: resourceIdBySlug.get("claude")
      ? { _type: "reference", _ref: resourceIdBySlug.get("claude") }
      : undefined,
    sources: [
      {
        label: "Stack Overflow Developer Survey 2025 – AI",
        url: "https://survey.stackoverflow.co/2025/ai",
      },
      {
        label: "Stack Overflow 2025 AI usage chart",
        url: "https://survey.stackoverflow.co/2025/charts/stackoverflow-dev-survey-2025-ai-sentiment-and-usage-ai-select-social.png",
      },
      {
        label: "GitHub Octoverse 2025 report",
        url: "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
      },
      {
        label: "GitHub Octoverse 2025 open-source top metrics visual",
        url: "https://github.blog/wp-content/uploads/2025/10/octoverse-2025-open-source-top-metrics.png?resize=1728%2C432",
      },
      {
        label: "GitHub Octoverse 2025 developer productivity visual",
        url: "https://github.blog/wp-content/uploads/2025/10/octoverse-2025-developer-productivity-top-line-metrics.png?resize=1728%2C432",
      },
      {
        label: "Anthropic Claude Code overview",
        url: "https://docs.anthropic.com/en/docs/claude-code/overview",
      },
      {
        label: "Google AI for Developers – Gemini API docs",
        url: "https://ai.google.dev/gemini-api/docs",
      },
      {
        label: "Google for Developers – Gemini Code Assist overview",
        url: "https://developers.google.com/gemini-code-assist/docs/overview",
      },
      {
        label: "OpenAI – Introducing Codex",
        url: "https://openai.com/index/introducing-codex/",
      },
      {
        label: "OpenAI pricing",
        url: "https://openai.com/pricing",
      },
    ],
  };

  for (const keyName of Object.keys(payload)) {
    if (payload[keyName] === undefined) delete payload[keyName];
  }

  await client.patch(existing._id).set(payload).commit();
  console.log(`Enhanced and republished article: ${slug} (${existing._id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
