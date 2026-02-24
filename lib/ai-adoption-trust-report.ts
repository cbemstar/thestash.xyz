import {
  getIndustryMetricSources,
  getIndustryMetricsByIds,
  INDUSTRY_METRICS_VERIFIED_AT,
} from "@/lib/industry-metrics";
import {
  getOfficialBenchmarkReportSources,
  getOfficialBenchmarkReports,
} from "@/lib/official-benchmark-reports";

export const AI_ADOPTION_TRUST_REPORT_SLUG = "ai-adoption-trust-signals";
export const AI_ADOPTION_TRUST_REPORT_UPDATED_AT = INDUSTRY_METRICS_VERIFIED_AT;

const AI_ADOPTION_TRUST_METRIC_IDS = [
  "so-2025-ai-adoption",
  "so-2025-daily-ai-usage",
  "so-2025-ai-trust-gap",
  "so-2025-agent-usage",
  "so-2025-tool-share",
  "so-2025-ide-share",
  "jetbrains-2025-survey-size",
  "jetbrains-2025-ai-regular-use",
  "jetbrains-2025-assistant-reliance",
  "jetbrains-2025-ai-job-signal",
  "github-octoverse-2025-devs",
  "github-octoverse-2025-ai-projects",
];

export function getAiAdoptionTrustMetrics() {
  return getIndustryMetricsByIds(AI_ADOPTION_TRUST_METRIC_IDS);
}

export function getAiAdoptionTrustVisualReports() {
  const include = new Set([
    "stack-overflow-dev-survey-2025-ai",
    "github-octoverse-2025",
    "dora-report-2025",
  ]);
  return getOfficialBenchmarkReports().filter((report) => include.has(report.id));
}

export function getAiAdoptionTrustImplications(): string[] {
  return [
    "Adoption is no longer optional: baseline team workflows should assume AI-assisted coding.",
    "Trust remains the bottleneck: organizations need test gates and review checklists before shipping AI-generated output.",
    "Tool familiarity is concentrated in a small set of products, so migration friction is often lower than expected.",
    "As AI usage becomes a job-level requirement, publish repeatable onboarding docs for your chosen tool stack.",
  ];
}

export function getAiAdoptionTrustReportSources(): Array<{ label: string; url: string }> {
  const sourceMap = new Map<string, { label: string; url: string }>();
  const metricSources = getIndustryMetricSources(getAiAdoptionTrustMetrics());
  const reportSources = getOfficialBenchmarkReportSources();
  for (const source of [...metricSources, ...reportSources]) {
    if (!source.url || sourceMap.has(source.url)) continue;
    sourceMap.set(source.url, source);
  }
  return [...sourceMap.values()];
}

export function getAiAdoptionTrustReportSummary() {
  const metrics = getAiAdoptionTrustMetrics();
  const sources = getAiAdoptionTrustReportSources();
  return {
    slug: AI_ADOPTION_TRUST_REPORT_SLUG,
    title: "AI adoption and trust signals (2026)",
    description:
      "Official-source signals on AI tool adoption, trust gaps, and team readiness for coding workflows.",
    updatedAt: AI_ADOPTION_TRUST_REPORT_UPDATED_AT,
    totalMetrics: metrics.length,
    totalSources: sources.length,
  };
}
