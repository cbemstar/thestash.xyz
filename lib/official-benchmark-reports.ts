export type OfficialBenchmarkReportMetric = {
  value: string;
  detail: string;
};

export type OfficialBenchmarkReport = {
  id: string;
  organization: string;
  title: string;
  reportUrl: string;
  publishedAt?: string;
  publishedLabel: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  metrics: OfficialBenchmarkReportMetric[];
  downloadUrl?: string;
  supportingSources?: Array<{ label: string; url: string }>;
};

const OFFICIAL_BENCHMARK_REPORTS: OfficialBenchmarkReport[] = [
  {
    id: "stack-overflow-dev-survey-2025-ai",
    organization: "Stack Overflow",
    title: "2025 Developer Survey (AI)",
    reportUrl: "https://survey.stackoverflow.co/2025/ai",
    publishedAt: "2025-07-29T00:00:00.000Z",
    publishedLabel: "July 29, 2025",
    summary:
      "Largest annual developer sentiment dataset with detailed AI usage, trust, and workflow impact signals.",
    imageUrl:
      "https://survey.stackoverflow.co/2025/charts/stackoverflow-dev-survey-2025-ai-sentiment-and-usage-ai-select-social.png",
    imageAlt:
      "Stack Overflow 2025 AI sentiment chart showing developer AI usage and sentiment breakdown.",
    metrics: [
      {
        value: "84%",
        detail: "of developers use or plan to use AI tools in their workflow.",
      },
      {
        value: "51%",
        detail: "of professional developers report daily AI tool usage.",
      },
      {
        value: "46%",
        detail: "of professionals say they do not trust AI output accuracy.",
      },
    ],
    supportingSources: [
      {
        label: "Stack Overflow Developer Survey 2025 press release",
        url:
          "https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/",
      },
    ],
  },
  {
    id: "github-octoverse-2025",
    organization: "GitHub",
    title: "Octoverse 2025: AI, Open Source, and Global Developer Growth",
    reportUrl:
      "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
    publishedAt: "2025-11-06T00:00:00.000Z",
    publishedLabel: "November 6, 2025",
    summary:
      "GitHub's annual state-of-development report tracking global contributor growth and AI adoption at project level.",
    imageUrl:
      "https://github.blog/wp-content/uploads/2025/11/Octoverse-2025-top-metrics.png?resize=1024%2C576",
    imageAlt:
      "GitHub Octoverse 2025 top metrics infographic with developer and AI project counts.",
    metrics: [
      {
        value: "180M+",
        detail: "developers are now on GitHub globally.",
      },
      {
        value: "4.3M",
        detail: "projects on GitHub now use AI.",
      },
      {
        value: "1/sec",
        detail: "new developer joined GitHub throughout 2025.",
      },
    ],
  },
  {
    id: "dora-report-2025",
    organization: "Google Cloud / DORA",
    title: "DORA Report 2025",
    reportUrl: "https://dora.dev/research/2025/dora-report/",
    publishedLabel: "2025 report",
    summary:
      "DORA's annual software delivery research covering AI usage, platform engineering maturity, and delivery performance.",
    imageUrl:
      "https://dora.dev/research/shared/dora-report-2025/images/hero-mobile.png",
    imageAlt:
      "DORA Report 2025 hero graphic.",
    metrics: [
      {
        value: "90%",
        detail: "of professionals use AI in day-to-day work (DORA 2025).",
      },
      {
        value: "90%",
        detail: "of organizations report using an internal developer platform.",
      },
      {
        value: "76%",
        detail: "of organizations now have a dedicated platform team.",
      },
    ],
    supportingSources: [
      {
        label: "DORA: AI capability overview",
        url: "https://dora.dev/capabilities/ai/",
      },
      {
        label: "DORA: Platform capability overview",
        url: "https://dora.dev/capabilities/platform/",
      },
    ],
  },
];

export function getOfficialBenchmarkReports(): OfficialBenchmarkReport[] {
  return OFFICIAL_BENCHMARK_REPORTS;
}

export function getOfficialBenchmarkReportSources(): Array<{
  label: string;
  url: string;
}> {
  const seen = new Set<string>();
  const deduped: Array<{ label: string; url: string }> = [];

  for (const report of OFFICIAL_BENCHMARK_REPORTS) {
    if (!seen.has(report.reportUrl)) {
      seen.add(report.reportUrl);
      deduped.push({
        label: `${report.organization}: ${report.title}`,
        url: report.reportUrl,
      });
    }

    for (const source of report.supportingSources ?? []) {
      if (!source.url || seen.has(source.url)) continue;
      seen.add(source.url);
      deduped.push(source);
    }
  }

  return deduped;
}

export function getOfficialBenchmarkReportsFreshnessLabel(): string {
  const datedReports = OFFICIAL_BENCHMARK_REPORTS.filter((report) => report.publishedAt);
  if (!datedReports.length) return "Official reports";

  const latest = datedReports.reduce((max, report) => {
    const ts = Date.parse(report.publishedAt as string);
    return ts > max ? ts : max;
  }, 0);

  return new Date(latest).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
