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
    .filter((seg) => seg.text.length > 0)
    .map((seg) => {
      if (!seg.href) {
        return { _type: "span", _key: key(), text: seg.text };
      }
      const markKey = key();
      markDefs.push({
        _key: markKey,
        _type: "link",
        href: seg.href,
      });
      return {
        _type: "span",
        _key: key(),
        text: seg.text,
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

function blocksFromMarkdown(markdown) {
  const lines = String(markdown || "").split("\n");
  const blocks = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
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
    blocks.push(blockFromLine(line));
  }
  return blocks;
}

const slug = "claude-vs-chatgpt-vs-gemini-for-developers-2026";
const nowIso = new Date().toISOString();

const article = {
  title: "Claude vs ChatGPT vs Gemini for Developers (2026 Decision Guide)",
  slug,
  excerpt:
    "A decision-first comparison of Claude, ChatGPT, and Gemini for developer workflows, including coding depth, integrations, governance, and rollout strategy.",
  primaryKeyword: "claude vs chatgpt vs gemini for developers",
  intentStage: "consideration",
  contentTier: "tier2",
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
    "workflow automation",
  ],
  relatedResourceSlugs: ["claude", "gemini", "cursor", "github-copilot"],
  sources: [
    { label: "OpenAI: Introducing Codex", url: "https://openai.com/index/introducing-codex/" },
    { label: "OpenAI API docs", url: "https://platform.openai.com/docs/overview" },
    { label: "OpenAI pricing", url: "https://openai.com/pricing" },
    { label: "Anthropic Claude overview", url: "https://www.anthropic.com/claude" },
    { label: "Anthropic: Claude Code docs", url: "https://docs.anthropic.com/en/docs/claude-code/overview" },
    { label: "Anthropic pricing", url: "https://www.anthropic.com/pricing" },
    { label: "Google AI: Gemini API docs", url: "https://ai.google.dev/gemini-api/docs" },
    { label: "Google AI: Gemini API pricing", url: "https://ai.google.dev/pricing" },
    { label: "Google: Gemini Code Assist docs", url: "https://developers.google.com/gemini-code-assist/docs/overview" },
  ],
  body: `Choosing an AI assistant for software teams in 2026 is not about finding one universal winner. It is about selecting the assistant that fits your development system: repository size, stack complexity, compliance requirements, and the way your team actually ships code.

As of February 19, 2026, the right framing is this: Claude, ChatGPT, and Gemini are all capable, but each one is optimized for a different operating model. If you evaluate them with a generic "which is smartest" question, you will likely pick the wrong tool for your workflow.

This guide gives a decision-first comparison for developers and engineering leads, with explicit tradeoffs and rollout guidance.

## Quick verdict by scenario

If you need a fast starting point, use this shortlist:

- Choose Claude first if your team is terminal-first, works in larger repos, and wants an agentic coding workflow anchored around [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview).
- Choose ChatGPT first if your team needs broad coverage across coding, research, and product work, and you plan to combine app usage with API-based workflows via [OpenAI's platform docs](https://platform.openai.com/docs/overview).
- Choose Gemini first if your engineering environment is already centered on Google Cloud, Workspace, and IDE tooling through [Gemini API](https://ai.google.dev/gemini-api/docs) and [Gemini Code Assist](https://developers.google.com/gemini-code-assist/docs/overview).
- For most teams, run a two-model strategy: one primary assistant plus one fallback model for reliability, cost, or policy reasons.

## Evaluation framework used in this comparison

To keep this practical, the comparison uses seven criteria that map to real engineering outcomes:

- Code generation quality on multi-file tasks.
- Context handling across large repositories and long prompts.
- IDE and terminal integration depth.
- API and automation friendliness.
- Security and governance controls for teams.
- Cost predictability under daily usage.
- Migration friction from your current workflow.

If you already run AI-assisted review in pull requests, align this evaluation with your existing process in [AI code review workflow with GitHub, Cursor, and Claude](/blog/ai-code-review-workflow-github-cursor-claude-2026).

## Side-by-side summary: where each assistant tends to win

No single assistant dominates every criterion. In practice, teams typically see this pattern:

- Claude tends to be strong when the task requires sustained reasoning through larger code contexts and when the team prefers terminal-native interactions.
- ChatGPT tends to be strong when teams need one assistant for mixed tasks: coding, debugging, synthesis, and product-facing writing or analysis.
- Gemini tends to be strong for Google-native teams, especially where code assistance and platform integration need to stay within a consolidated Google environment.

The key is to score these strengths against your constraints, not against social media benchmarks.

## Coding depth and repository-scale behavior

For developer teams, the core question is not raw response quality in isolation. The core question is whether the assistant helps complete real work without increasing review overhead.

Claude's developer positioning is tightly connected to [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview), where terminal-centric workflows and iterative refactoring are central. This is often a fit for teams that treat AI as an in-repo collaborator.

ChatGPT's developer value has expanded through OpenAI's coding and API surface, including [Codex announcements](https://openai.com/index/introducing-codex/) and platform tooling through the [OpenAI docs](https://platform.openai.com/docs/overview). This tends to suit teams that want one assistant spanning implementation and analysis tasks.

Gemini's coding workflow has improved through [Gemini API docs](https://ai.google.dev/gemini-api/docs) and [Gemini Code Assist](https://developers.google.com/gemini-code-assist/docs/overview), making it particularly relevant when your stack and governance already sit inside Google's ecosystem.

If your developers frequently jump from prompt to implementation, combine this article with [How to integrate AI APIs into your web projects](/blog/how-integrate-ai-apis-web-projects-2026) for architecture decisions.

## Integrations, automation, and workflow fit

Model quality matters, but integration quality determines long-term adoption.

Teams that fail with AI assistants usually fail at orchestration: weak handoffs, missing context, brittle tool connectors, or no fallback logic during outages.

Use this lens:

- API-first teams should prioritize assistant platforms with stable docs, predictable request patterns, and strong observability hooks.
- IDE-heavy teams should test editor/terminal ergonomics, not only model outputs.
- Platform teams should verify how easily the assistant connects to repositories, issue trackers, and deployment metadata.

For integration-heavy teams, the operational model in [Best MCP tools and servers for developer workflows](/blog/best-mcp-tools-and-servers-developer-workflows-2026) is a useful extension of this comparison.

## Security, governance, and enterprise readiness

If you are evaluating for team usage, never base the decision on consumer app UX alone. Separate your evaluation into two lanes:

- End-user assistant experience (chat, coding flow, day-to-day utility).
- Enterprise policy fit (access control, data handling, audit expectations, deployment boundaries).

At minimum, review each vendor's official docs and pricing/policy pages before standardizing:

- [OpenAI pricing](https://openai.com/pricing)
- [Anthropic pricing](https://www.anthropic.com/pricing)
- [Google Gemini pricing](https://ai.google.dev/pricing)

Because policy and limits can change, treat documentation checks as a recurring governance task, not a one-time setup step.

## Cost model: measure cost per accepted outcome, not cost per prompt

Teams often compare assistants by plan price or token price, then make a poor choice. A better metric is cost per accepted engineering outcome.

Track these during pilot:

- Cost per accepted pull-request suggestion.
- Cost per resolved debugging session.
- Cost per generated test that survives review.
- Prompt-to-merge cycle time.
- Human rework minutes per accepted change.

This avoids false savings where one model is cheaper per call but produces lower acceptance rates and higher rework.

For teams building operational telemetry around these metrics, pair this with [LLM observability stack planning](/blog/llm-observability-stack-langfuse-literalai-helicone-2026).

## 30-day rollout plan for engineering teams

Use a structured pilot instead of ad hoc experimentation:

- Week 1: Choose 2-3 workflows (feature implementation, bug triage, PR review) and define clear success metrics.
- Week 2: Run Claude, ChatGPT, and Gemini on the same task sets with standardized prompts and reviewers.
- Week 3: Record acceptance rate, rework time, and policy/compliance issues by team.
- Week 4: Decide primary assistant by workflow, not by aggregate score alone.

Include explicit no-go criteria:

- Any assistant that increases critical review risk.
- Any assistant that cannot meet your policy baseline.
- Any assistant that looks fast in demos but weak in repeatable team workflows.

## Recommended deployment patterns by team type

These patterns are usually more reliable than single-vendor absolutism:

- Startup teams shipping quickly: pick one primary assistant for speed, keep one fallback for continuity.
- Mid-size SaaS teams: choose primary by workflow domain (for example, one for coding depth, one for general product/analysis tasks).
- GCP-native organizations: start with Gemini in core workflows, then add a secondary assistant where performance or ergonomics requires it.
- Platform and DevOps-heavy teams: prioritize integration and governance first, then tune model choice inside that operating envelope.

This aligns with the broader direction outlined in [The future of AI in developers' workflow](/blog/future-ai-developers-workflow-2026).

## Common mistakes to avoid

These errors repeatedly create poor outcomes in assistant rollouts:

- Picking one model globally without workflow-level testing.
- Letting teams adopt tools without a shared review policy.
- Measuring "speed" but not acceptance quality.
- Treating pricing snapshots as stable over long planning cycles.
- Ignoring fallback strategy when provider behavior changes.

Avoiding these mistakes matters more than marginal differences in model quality.

## Final recommendation

For developers in 2026, the best question is not "Claude vs ChatGPT vs Gemini, which is best overall?" It is: "Which assistant is best for this workflow, under our constraints, with our governance model?"

If your team executes a disciplined pilot, you will likely end with a hybrid result:

- one primary assistant for daily coding,
- one secondary assistant for resilience or specialized tasks,
- and clear policy around when to use each.

That operating model produces better engineering outcomes than committing early to a single-vendor ideology.

## FAQ

### Should we standardize on one assistant company-wide?

Only if your workflows are unusually uniform. Most teams get better results by assigning a primary assistant per workflow type and keeping one fallback.

### Which tool is best for code review workflows specifically?

Run a dedicated pilot on pull requests and measure acceptance, rework, and cycle time. Then apply the controls in [AI code review workflow with GitHub, Cursor, and Claude](/blog/ai-code-review-workflow-github-cursor-claude-2026).

### Is this comparison still valid later in 2026?

Use this as a decision framework, not a frozen scoreboard. Re-check vendor docs and pricing pages quarterly because capabilities, limits, and packaging change quickly.
`,
};

async function main() {
  const resourceRows = await client.fetch(
    `*[_type == "resource" && coalesce(slug.current, slug) in ["claude","gemini","cursor","github-copilot"]]{ _id, "slug": coalesce(slug.current, slug) }`
  );

  const resourceIdBySlug = new Map(
    resourceRows.map((row) => [String(row.slug), String(row._id)])
  );

  const relatedResources = article.relatedResourceSlugs
    .map((s) => resourceIdBySlug.get(s))
    .filter(Boolean)
    .map((id) => ({ _type: "reference", _ref: id }));

  const existing = await client.fetch(
    `*[_type == "article" && coalesce(slug.current, slug) == "${slug}"][0]{ _id }`
  );

  const payload = {
    _type: "article",
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    primaryKeyword: article.primaryKeyword,
    intentStage: article.intentStage,
    contentTier: article.contentTier,
    lastReviewedAt: article.lastReviewedAt,
    body: blocksFromMarkdown(article.body),
    tags: article.tags,
    relatedResources,
    primaryResource: resourceIdBySlug.get("claude")
      ? { _type: "reference", _ref: resourceIdBySlug.get("claude") }
      : undefined,
    sources: article.sources,
    author: article.author,
    publishedAt: article.publishedAt,
  };

  // Remove undefined fields before write.
  for (const k of Object.keys(payload)) {
    if (payload[k] === undefined) delete payload[k];
  }

  if (existing?._id) {
    await client.patch(existing._id).set(payload).commit();
    console.log(`Updated existing article: ${slug} (${existing._id})`);
    return;
  }

  const newId = `article-${slug}`;
  await client.create({ _id: newId, ...payload });
  console.log(`Created new article: ${slug} (${newId})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
