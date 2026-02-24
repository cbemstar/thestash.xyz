import { getAllComparisonSlugs, getComparisonBySlug } from "@/lib/sanity.comparison";
import { getAlternativeResourceSummaries } from "@/lib/sanity.resource";
import {
  evaluateAlternativesQuality,
  evaluateComparisonQuality,
  getAllAlternativePagesData,
  getAllAlternativePageSlugs,
  getAllComparisonPageSlugs,
  getAllComparisonPagesData,
} from "@/lib/seo-pages";
import {
  evaluateUseCaseQuality,
  getAllUseCasePages,
} from "@/lib/use-case-pages";
import type { Comparison } from "@/types/comparison";

export type SeoQualityItem = {
  type: "alternative" | "comparison" | "use-case";
  source: "seed" | "sanity";
  slug: string;
  title: string;
  url: string;
  pass: boolean;
  stale: boolean;
  reasons: string[];
  lastReviewedAt: string | null;
};

export type SeoQualityReport = {
  generatedAt: string;
  summary: {
    total: number;
    passing: number;
    failing: number;
    stale: number;
  };
  items: SeoQualityItem[];
};

function normalizeComparisonTitle(comparison: Comparison, slug: string): string {
  if (comparison.title && comparison.title.trim()) return comparison.title;
  return slug.replace(/-/g, " ");
}

function isOlderThan90Days(dateLike?: string | null): boolean {
  if (!dateLike) return true;
  const timestamp = Date.parse(dateLike);
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > 90 * 24 * 60 * 60 * 1000;
}

export async function getSeoQualityReport(): Promise<SeoQualityReport> {
  const seedAlternativeItems: SeoQualityItem[] = getAllAlternativePagesData().map((page) => {
    const quality = evaluateAlternativesQuality(page);
    return {
      type: "alternative" as const,
      source: "seed" as const,
      slug: page.slug,
      title: `${page.tool.title} alternatives`,
      url: `/alternatives/${page.slug}`,
      pass: quality.pass,
      stale: quality.stale,
      reasons: quality.reasons,
      lastReviewedAt: page.lastReviewedAt ?? null,
    };
  });
  const seedAlternativeSlugSet = new Set(getAllAlternativePageSlugs());
  const cmsAlternativeSummaries = await getAlternativeResourceSummaries();
  const cmsAlternativeItems: SeoQualityItem[] = cmsAlternativeSummaries
    .filter((resource) => !seedAlternativeSlugSet.has(resource.slug))
    .map((resource) => {
      const reasons: string[] = [];
      if (resource.sourcesCount < 3) reasons.push("Needs at least 3 sources.");
      if (resource.bestForCount < 1) reasons.push("Missing best-for bullets.");
      if (resource.notForCount < 1) reasons.push("Missing not-for bullets.");
      if (resource.alternativesCount < 2) {
        reasons.push("Needs at least 2 alternatives for a 3-row decision matrix.");
      }
      const stale = isOlderThan90Days(resource.lastReviewedAt);
      if (stale) reasons.push("Last reviewed date is older than 90 days.");
      return {
        type: "alternative" as const,
        source: "sanity" as const,
        slug: resource.slug,
        title: `${resource.title} alternatives`,
        url: `/alternatives/${resource.slug}`,
        pass: reasons.length === 0,
        stale,
        reasons,
        lastReviewedAt: resource.lastReviewedAt,
      };
    });

  const seedComparisonItems: SeoQualityItem[] = getAllComparisonPagesData().map((page) => {
    const quality = evaluateComparisonQuality(page);
    return {
      type: "comparison" as const,
      source: "seed" as const,
      slug: page.slug,
      title: page.title,
      url: `/compare/${page.slug}`,
      pass: quality.pass,
      stale: quality.stale,
      reasons: quality.reasons,
      lastReviewedAt: page.lastReviewedAt ?? null,
    };
  });

  const seedUseCaseItems: SeoQualityItem[] = getAllUseCasePages().map((page) => {
    const quality = evaluateUseCaseQuality(page);
    return {
      type: "use-case" as const,
      source: "seed" as const,
      slug: page.slug,
      title: page.title,
      url: `/use-cases/${page.slug}`,
      pass: quality.pass,
      stale: quality.stale,
      reasons: quality.reasons,
      lastReviewedAt: page.lastReviewedAt ?? null,
    };
  });

  const seedComparisonSlugSet = new Set(getAllComparisonPageSlugs());
  const cmsComparisonSlugs = await getAllComparisonSlugs();
  const cmsOnlySlugs = cmsComparisonSlugs.filter((slug) => !seedComparisonSlugSet.has(slug));
  const cmsComparisons = await Promise.all(
    cmsOnlySlugs.map(async (slug) => ({ slug, data: await getComparisonBySlug(slug) }))
  );
  const cmsComparisonItems: SeoQualityItem[] = cmsComparisons
    .filter((row): row is { slug: string; data: Comparison } => Boolean(row.data))
    .map(({ slug, data }) => {
      const quality = evaluateComparisonQuality({
        ...(data as Comparison),
        slug,
        leftSlug: data.leftResource?.slug ?? "left",
        rightSlug: data.rightResource?.slug ?? "right",
        compareNext: [],
      });
      return {
        type: "comparison" as const,
        source: "sanity" as const,
        slug,
        title: normalizeComparisonTitle(data, slug),
        url: `/compare/${slug}`,
        pass: quality.pass,
        stale: quality.stale,
        reasons: quality.reasons,
        lastReviewedAt: data.lastReviewedAt ?? null,
      };
    });

  const items = [
    ...seedAlternativeItems,
    ...cmsAlternativeItems,
    ...seedComparisonItems,
    ...cmsComparisonItems,
    ...seedUseCaseItems,
  ];
  const passing = items.filter((item) => item.pass).length;
  const stale = items.filter((item) => item.stale).length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: items.length,
      passing,
      failing: items.length - passing,
      stale,
    },
    items,
  };
}
