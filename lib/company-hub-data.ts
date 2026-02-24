import { getAiAdoptionTrustReportSummary } from "@/lib/ai-adoption-trust-report";
import { getAllArticles } from "@/lib/sanity.article";
import { getAiCodingBenchmarkSummary } from "@/lib/benchmark-reports";
import { getAiDiscoverabilityReportSummary } from "@/lib/ai-discoverability-report";
import {
  getAllCompanyHubs,
  getCompanyHubBySlug,
  type CompanyHubDefinition,
} from "@/lib/company-hubs";
import {
  getIndustryMetricsForCategories,
  getIndustryMetricsForToolSlugs,
  getIndustryMetricSources,
  type IndustryMetric,
} from "@/lib/industry-metrics";
import {
  getOfficialBenchmarkReports,
  type OfficialBenchmarkReport,
} from "@/lib/official-benchmark-reports";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesLiteQuery } from "@/lib/sanity.queries";
import { getResourceSlug } from "@/lib/slug";
import {
  getAlternativePageData,
  getComparisonPagesForTool,
  getToolProfile,
  type AlternativePageData,
  type ComparisonPageData,
} from "@/lib/seo-pages";
import type { Article } from "@/types/article";
import type { Resource } from "@/types/resource";

type ToolProfile = NonNullable<ReturnType<typeof getToolProfile>>;

export type CompanyHubReportLink = {
  href: string;
  title: string;
  detail: string;
};

export type CompanyHubSourceLink = {
  label: string;
  url: string;
  origin: "official" | "product" | "tool" | "metric" | "report" | "article";
};

export type CompanyHubPageData = {
  hub: CompanyHubDefinition;
  resources: Resource[];
  toolProfiles: ToolProfile[];
  alternativePages: AlternativePageData[];
  comparisonPages: ComparisonPageData[];
  relatedArticles: Article[];
  reportLinks: CompanyHubReportLink[];
  officialReports: OfficialBenchmarkReport[];
  marketMetrics: IndustryMetric[];
  sourceLinks: CompanyHubSourceLink[];
};

export type CompanyHubDirectoryEntry = {
  hub: CompanyHubDefinition;
  resourceCount: number;
  articleCount: number;
  alternativeCount: number;
  comparisonCount: number;
};

function uniqBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function lower(value: string): string {
  return value.trim().toLowerCase();
}

function includesKeyword(text: string, keywords: string[]): boolean {
  const haystack = lower(text);
  return keywords.some((keyword) => haystack.includes(lower(keyword)));
}

async function getAllResourcesLite(): Promise<Resource[]> {
  if (!isSanityConfigured()) return [];
  return (await sanityClient.fetch<Resource[]>(allResourcesLiteQuery)) ?? [];
}

function getHubInternalReportMetadata(): Record<string, { title: string; detail: string }> {
  const benchmark = getAiCodingBenchmarkSummary();
  const adoption = getAiAdoptionTrustReportSummary();
  const discoverability = getAiDiscoverabilityReportSummary();

  return {
    "/reports/ai-coding-tools-benchmark": {
      title: benchmark.title,
      detail: `${benchmark.totalTools} tools, avg score ${benchmark.averageScore}`,
    },
    "/reports/ai-adoption-trust-signals": {
      title: adoption.title,
      detail: `${adoption.totalMetrics} signals, ${adoption.totalSources} sources`,
    },
    "/reports/seo-ai-answer-discoverability": {
      title: discoverability.title,
      detail: `${discoverability.totalSignals} signals, ${discoverability.totalSources} sources`,
    },
  };
}

function getHubSlugSet(hub: CompanyHubDefinition): Set<string> {
  return new Set(
    [...hub.relatedResourceSlugs, ...hub.relatedToolSlugs]
      .map((slug) => lower(slug))
      .filter(Boolean),
  );
}

function getToolProfilesForHub(hub: CompanyHubDefinition): ToolProfile[] {
  const candidateSlugs = uniqBy(
    [...hub.relatedToolSlugs, ...hub.relatedResourceSlugs].map((slug) => lower(slug)),
    (slug) => slug,
  );
  const profiles = candidateSlugs
    .map((slug) => getToolProfile(slug))
    .filter((profile): profile is ToolProfile => Boolean(profile));
  return uniqBy(profiles, (profile) => profile.slug);
}

function getAlternativePagesForHub(toolProfiles: ToolProfile[]): AlternativePageData[] {
  const pages = toolProfiles
    .map((profile) => getAlternativePageData(profile.slug))
    .filter((page): page is AlternativePageData => Boolean(page));
  return uniqBy(pages, (page) => page.slug);
}

function getComparisonPagesForHub(toolProfiles: ToolProfile[]): ComparisonPageData[] {
  const pages = toolProfiles.flatMap((profile) => getComparisonPagesForTool(profile.slug));
  return uniqBy(pages, (page) => page.slug);
}

function getResourcesForHub(allResources: Resource[], hub: CompanyHubDefinition): Resource[] {
  const slugSet = getHubSlugSet(hub);
  const matches = allResources.filter((resource) => slugSet.has(lower(getResourceSlug(resource))));
  return uniqBy(matches, (resource) => resource._id);
}

function getRelatedArticlesForHub(allArticles: Article[], hub: CompanyHubDefinition): Article[] {
  const slugSet = getHubSlugSet(hub);
  const keywordSet = uniqBy(
    [hub.name, hub.shortName, ...hub.aliases].map((keyword) => lower(keyword)),
    (keyword) => keyword,
  );

  const matches = allArticles.filter((article) => {
    const primarySlug = article.primaryResource?.slug ? lower(article.primaryResource.slug) : "";
    if (primarySlug && slugSet.has(primarySlug)) return true;

    const relatedSlugs = (article.relatedResources ?? [])
      .map((resource) => (resource.slug ? lower(resource.slug) : ""))
      .filter(Boolean);
    if (relatedSlugs.some((slug) => slugSet.has(slug))) return true;

    const tags = (article.tags ?? []).map((tag) => lower(tag));
    if (tags.some((tag) => keywordSet.some((keyword) => tag.includes(keyword)))) return true;

    const searchable = `${article.title} ${article.excerpt}`;
    return includesKeyword(searchable, keywordSet);
  });

  return uniqBy(matches, (article) => article._id);
}

function getOfficialReportsForHub(hub: CompanyHubDefinition): OfficialBenchmarkReport[] {
  if (!hub.reportOrganizations.length) return [];
  const orgs = hub.reportOrganizations.map((org) => lower(org));
  return getOfficialBenchmarkReports().filter((report) => {
    const reportOrg = lower(report.organization);
    return orgs.some((org) => reportOrg.includes(org));
  });
}

function getMarketMetricsForHub(hub: CompanyHubDefinition): IndustryMetric[] {
  const byTool = getIndustryMetricsForToolSlugs(
    uniqBy([...hub.relatedToolSlugs, ...hub.relatedResourceSlugs], (slug) => lower(slug)),
    10,
  );
  const byCategory = getIndustryMetricsForCategories(hub.relatedCategories, 10);
  return uniqBy([...byTool, ...byCategory], (metric) => metric.id).slice(0, 10);
}

function getReportLinksForHub(hub: CompanyHubDefinition): CompanyHubReportLink[] {
  const metadata = getHubInternalReportMetadata();
  return hub.reportPaths
    .map((path) => {
      const entry = metadata[path];
      if (!entry) return null;
      return {
        href: path,
        title: entry.title,
        detail: entry.detail,
      } satisfies CompanyHubReportLink;
    })
    .filter((entry): entry is CompanyHubReportLink => Boolean(entry));
}

function getSourceLinksForHub({
  hub,
  toolProfiles,
  marketMetrics,
  officialReports,
  relatedArticles,
}: {
  hub: CompanyHubDefinition;
  toolProfiles: ToolProfile[];
  marketMetrics: IndustryMetric[];
  officialReports: OfficialBenchmarkReport[];
  relatedArticles: Article[];
}): CompanyHubSourceLink[] {
  const collected: CompanyHubSourceLink[] = [];

  for (const link of hub.officialLinks) {
    collected.push({ label: link.label, url: link.url, origin: "official" });
  }
  for (const product of hub.products) {
    collected.push({ label: product.name, url: product.url, origin: "product" });
  }
  for (const profile of toolProfiles) {
    for (const source of profile.sources ?? []) {
      collected.push({ label: source.label, url: source.url, origin: "tool" });
    }
  }
  for (const source of getIndustryMetricSources(marketMetrics)) {
    collected.push({ label: source.label, url: source.url, origin: "metric" });
  }
  for (const report of officialReports) {
    collected.push({ label: `${report.organization}: ${report.title}`, url: report.reportUrl, origin: "report" });
    for (const source of report.supportingSources ?? []) {
      collected.push({ label: source.label, url: source.url, origin: "report" });
    }
  }
  for (const article of relatedArticles) {
    for (const source of article.sources ?? []) {
      collected.push({ label: source.label, url: source.url, origin: "article" });
    }
  }

  return uniqBy(
    collected.filter((source) => source.url && source.label),
    (source) => source.url,
  );
}

export async function getCompanyHubPageData(
  slug: string,
): Promise<CompanyHubPageData | null> {
  const hub = getCompanyHubBySlug(slug);
  if (!hub) return null;

  const [allResources, allArticles] = await Promise.all([getAllResourcesLite(), getAllArticles()]);
  const toolProfiles = getToolProfilesForHub(hub);
  const alternativePages = getAlternativePagesForHub(toolProfiles);
  const comparisonPages = getComparisonPagesForHub(toolProfiles);
  const resources = getResourcesForHub(allResources, hub);
  const relatedArticles = getRelatedArticlesForHub(allArticles, hub).slice(0, 12);
  const reportLinks = getReportLinksForHub(hub);
  const officialReports = getOfficialReportsForHub(hub);
  const marketMetrics = getMarketMetricsForHub(hub);
  const sourceLinks = getSourceLinksForHub({
    hub,
    toolProfiles,
    marketMetrics,
    officialReports,
    relatedArticles,
  });

  return {
    hub,
    resources,
    toolProfiles,
    alternativePages,
    comparisonPages,
    relatedArticles,
    reportLinks,
    officialReports,
    marketMetrics,
    sourceLinks,
  };
}

export async function getCompanyHubDirectoryData(): Promise<CompanyHubDirectoryEntry[]> {
  const hubs = getAllCompanyHubs();
  const [allResources, allArticles] = await Promise.all([getAllResourcesLite(), getAllArticles()]);

  return hubs.map((hub) => {
    const toolProfiles = getToolProfilesForHub(hub);
    const alternatives = getAlternativePagesForHub(toolProfiles);
    const comparisons = getComparisonPagesForHub(toolProfiles);
    const resources = getResourcesForHub(allResources, hub);
    const relatedArticles = getRelatedArticlesForHub(allArticles, hub);

    return {
      hub,
      resourceCount: resources.length,
      articleCount: relatedArticles.length,
      alternativeCount: alternatives.length,
      comparisonCount: comparisons.length,
    };
  });
}
