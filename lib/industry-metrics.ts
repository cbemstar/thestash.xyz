import type { ResourceCategory } from "@/types/resource";

export type IndustryMetricTopic =
  | "general"
  | "ai-coding"
  | "developer-productivity"
  | "project-management"
  | "deployment"
  | "design"
  | "open-source";

export type IndustryMetric = {
  id: string;
  metric: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  verifiedAt: string;
  topics: IndustryMetricTopic[];
};

export const INDUSTRY_METRICS_VERIFIED_AT = "2026-02-18T00:00:00.000Z";

const INDUSTRY_METRICS: IndustryMetric[] = [
  {
    id: "so-2025-ai-adoption",
    metric: "84% of developers use or plan to use AI tools",
    detail:
      "Latest Stack Overflow Developer Survey 2025 signals AI has shifted from experimental to mainstream in dev workflows.",
    sourceLabel: "Stack Overflow Developer Survey 2025 (AI section)",
    sourceUrl: "https://survey.stackoverflow.co/2025/ai",
    sourcePublishedAt: "2025-07-29T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "ai-coding", "developer-productivity"],
  },
  {
    id: "so-2025-daily-ai-usage",
    metric: "51% of professional developers use AI tools daily",
    detail:
      "Daily AI usage shows sustained workflow integration rather than occasional experimentation.",
    sourceLabel: "Stack Overflow 2025 survey press release",
    sourceUrl:
      "https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/",
    sourcePublishedAt: "2025-08-13T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "ai-coding", "developer-productivity"],
  },
  {
    id: "so-2025-ai-trust-gap",
    metric: "46% of professional developers do not trust AI output accuracy",
    detail:
      "Trust and verification remain critical, so teams still need strong review and quality guardrails.",
    sourceLabel: "Stack Overflow 2025 survey press release",
    sourceUrl:
      "https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/",
    sourcePublishedAt: "2025-08-13T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "ai-coding", "open-source"],
  },
  {
    id: "so-2025-agent-usage",
    metric: "AI agents: 31% using now, 17% planning, 38% no plans",
    detail:
      "Agent adoption is growing but not universal, indicating mixed readiness across teams.",
    sourceLabel: "Stack Overflow 2025 survey press release",
    sourceUrl:
      "https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/",
    sourcePublishedAt: "2025-08-13T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "ai-coding", "developer-productivity"],
  },
  {
    id: "so-2025-tool-share",
    metric: "Among AI users: ChatGPT 82%, GitHub Copilot 68%",
    detail:
      "Tool share data shows where user familiarity is currently concentrated.",
    sourceLabel: "Stack Overflow 2025 survey press release",
    sourceUrl:
      "https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/",
    sourcePublishedAt: "2025-08-13T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["ai-coding", "developer-productivity", "open-source"],
  },
  {
    id: "so-2025-ide-share",
    metric: "AI IDE usage: Cursor 18%, Claude Code 10%, Windsurf 5%",
    detail:
      "Specialized AI coding environments are gaining share relative to traditional IDE-only workflows.",
    sourceLabel: "Stack Overflow 2025 survey press release",
    sourceUrl:
      "https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/",
    sourcePublishedAt: "2025-08-13T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["ai-coding", "developer-productivity"],
  },
  {
    id: "github-octoverse-2025-devs",
    metric: "GitHub surpassed 180 million developers (+50M in one year)",
    detail:
      "Developer growth signals expanding global software participation and opportunity.",
    sourceLabel: "GitHub Octoverse 2025",
    sourceUrl:
      "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
    sourcePublishedAt: "2025-11-06T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "open-source"],
  },
  {
    id: "github-octoverse-2025-ai-projects",
    metric: "4.3 million projects on GitHub now use AI",
    detail:
      "AI-native and AI-assisted development is becoming standard at project level.",
    sourceLabel: "GitHub Octoverse 2025",
    sourceUrl:
      "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
    sourcePublishedAt: "2025-11-06T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "ai-coding", "open-source"],
  },
  {
    id: "github-octoverse-2025-new-developer",
    metric: "One new developer joined GitHub every second in 2025",
    detail:
      "The global contributor base continues to scale rapidly, increasing competition and collaboration potential.",
    sourceLabel: "GitHub Octoverse 2025",
    sourceUrl:
      "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
    sourcePublishedAt: "2025-11-06T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "open-source"],
  },
  {
    id: "jetbrains-2025-survey-size",
    metric: "JetBrains surveyed 24,534 developers across 194 countries",
    detail:
      "Large global sample size provides a broad signal on tooling and workflow behavior.",
    sourceLabel: "JetBrains Developer Ecosystem 2025",
    sourceUrl: "https://blog.jetbrains.com/blog/2025/10/14/the-state-of-developer-ecosystem-in-2025/",
    sourcePublishedAt: "2025-10-14T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "developer-productivity"],
  },
  {
    id: "jetbrains-2025-ai-regular-use",
    metric: "85% of developers regularly use AI tools",
    detail:
      "Regular AI usage confirms broad integration into mainstream engineering tasks.",
    sourceLabel: "JetBrains Developer Ecosystem 2025",
    sourceUrl: "https://blog.jetbrains.com/blog/2025/10/14/the-state-of-developer-ecosystem-in-2025/",
    sourcePublishedAt: "2025-10-14T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "ai-coding", "developer-productivity"],
  },
  {
    id: "jetbrains-2025-assistant-reliance",
    metric: "62% rely on at least one AI coding assistant, editor, or agent",
    detail:
      "Assistant reliance is now common enough to influence baseline team tooling decisions.",
    sourceLabel: "JetBrains Developer Ecosystem 2025",
    sourceUrl: "https://blog.jetbrains.com/blog/2025/10/14/the-state-of-developer-ecosystem-in-2025/",
    sourcePublishedAt: "2025-10-14T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["ai-coding", "developer-productivity"],
  },
  {
    id: "jetbrains-2025-ai-job-signal",
    metric: "68% expect AI proficiency to become a job requirement",
    detail:
      "AI capability is increasingly treated as a core professional skill in software roles.",
    sourceLabel: "JetBrains Developer Ecosystem 2025",
    sourceUrl: "https://blog.jetbrains.com/blog/2025/10/14/the-state-of-developer-ecosystem-in-2025/",
    sourcePublishedAt: "2025-10-14T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["general", "ai-coding", "developer-productivity"],
  },
  {
    id: "jetbrains-2025-cloud-share",
    metric: "Cloud preference in JetBrains survey: AWS 43%, GCP 22%, Azure 22%",
    detail:
      "Deployment and infra decisions still center around a few dominant cloud ecosystems.",
    sourceLabel: "JetBrains Developer Ecosystem 2025",
    sourceUrl: "https://blog.jetbrains.com/blog/2025/10/14/the-state-of-developer-ecosystem-in-2025/",
    sourcePublishedAt: "2025-10-14T00:00:00.000Z",
    verifiedAt: INDUSTRY_METRICS_VERIFIED_AT,
    topics: ["deployment", "general"],
  },
];

const AI_TOOL_SLUGS = new Set([
  "cursor",
  "github-copilot",
  "windsurf",
  "claude-code",
  "codeium",
  "tabnine",
  "sourcegraph-cody",
  "amazon-q-developer",
  "jetbrains-ai-assistant",
  "bolt",
  "lovable",
  "v0",
]);

const DEVELOPER_PRODUCTIVITY_SLUGS = new Set(["raycast", "alfred"]);

const PROJECT_MANAGEMENT_SLUGS = new Set([
  "linear",
  "notion",
  "clickup",
  "asana",
  "monday",
  "jira",
]);

const DEPLOYMENT_SLUGS = new Set([
  "vercel",
  "netlify",
  "cloudflare-pages",
  "replit",
]);

const DESIGN_SLUGS = new Set(["figma", "webflow", "framer", "v0", "bolt", "lovable"]);

const OPEN_SOURCE_SLUGS = new Set([
  "wordpress",
  "vscode",
  "zed",
  "sourcegraph-cody",
  "github-copilot",
]);

function uniqueMetrics(metrics: IndustryMetric[]): IndustryMetric[] {
  const seen = new Set<string>();
  const out: IndustryMetric[] = [];
  for (const metric of metrics) {
    if (seen.has(metric.id)) continue;
    seen.add(metric.id);
    out.push(metric);
  }
  return out;
}

function resolveTopicsFromToolSlugs(slugs: string[]): IndustryMetricTopic[] {
  const topics = new Set<IndustryMetricTopic>();

  for (const rawSlug of slugs) {
    const slug = rawSlug.trim().toLowerCase();
    if (AI_TOOL_SLUGS.has(slug)) topics.add("ai-coding");
    if (DEVELOPER_PRODUCTIVITY_SLUGS.has(slug))
      topics.add("developer-productivity");
    if (PROJECT_MANAGEMENT_SLUGS.has(slug)) topics.add("project-management");
    if (DEPLOYMENT_SLUGS.has(slug)) topics.add("deployment");
    if (DESIGN_SLUGS.has(slug)) topics.add("design");
    if (OPEN_SOURCE_SLUGS.has(slug)) topics.add("open-source");
  }

  return [...topics];
}

function resolveTopicsFromCategories(
  categories: ResourceCategory[]
): IndustryMetricTopic[] {
  const topics = new Set<IndustryMetricTopic>();

  for (const category of categories) {
    if (category === "ai-tools") topics.add("ai-coding");
    if (category === "productivity") topics.add("project-management");
    if (category === "development-tools" || category === "coding") {
      topics.add("developer-productivity");
      topics.add("deployment");
      topics.add("open-source");
    }
    if (category === "design-tools" || category === "ui-ux-resources" || category === "webflow") {
      topics.add("design");
    }
    if (category === "github") topics.add("open-source");
  }

  return [...topics];
}

function sortMetricsByFreshness(metrics: IndustryMetric[]): IndustryMetric[] {
  return [...metrics].sort((a, b) => {
    const aTs = Date.parse(a.sourcePublishedAt);
    const bTs = Date.parse(b.sourcePublishedAt);
    return bTs - aTs;
  });
}

export function getIndustryMetricsForToolSlugs(
  slugs: string[],
  limit = 5
): IndustryMetric[] {
  const topics = resolveTopicsFromToolSlugs(slugs);
  if (topics.length === 0) return [];
  const selected = INDUSTRY_METRICS.filter((metric) =>
    metric.topics.some((topic) => topics.includes(topic))
  );
  return sortMetricsByFreshness(uniqueMetrics(selected)).slice(0, limit);
}

export function getIndustryMetricsForCategories(
  categories: ResourceCategory[],
  limit = 5
): IndustryMetric[] {
  const topics = resolveTopicsFromCategories(categories);
  if (topics.length === 0) return [];
  const selected = INDUSTRY_METRICS.filter((metric) =>
    metric.topics.some((topic) => topics.includes(topic))
  );
  return sortMetricsByFreshness(uniqueMetrics(selected)).slice(0, limit);
}

export function getIndustryMetricSources(
  metrics: IndustryMetric[]
): Array<{ label: string; url: string }> {
  const seen = new Set<string>();
  const deduped: Array<{ label: string; url: string }> = [];
  for (const metric of metrics) {
    if (!metric.sourceUrl || seen.has(metric.sourceUrl)) continue;
    seen.add(metric.sourceUrl);
    deduped.push({ label: metric.sourceLabel, url: metric.sourceUrl });
  }
  return deduped;
}

export function getIndustryMetricsUpdatedDateLabel(): string {
  return new Date(INDUSTRY_METRICS_VERIFIED_AT).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getIndustryMetricsByIds(ids: string[]): IndustryMetric[] {
  if (!ids.length) return [];
  const idSet = new Set(ids);
  const selected = INDUSTRY_METRICS.filter((metric) => idSet.has(metric.id));
  return sortMetricsByFreshness(uniqueMetrics(selected));
}
