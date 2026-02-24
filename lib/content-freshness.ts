import { getAllArticles } from "@/lib/sanity.article";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import {
  allResourcesQuery,
  allArticlesQuery,
} from "@/lib/sanity.queries";
import { getResourceSlug } from "@/lib/slug";
import { getAlternativeResourceSummaries } from "@/lib/sanity.resource";
import { getAllComparisonSlugs, getComparisonBySlug } from "@/lib/sanity.comparison";
import {
  evaluateAlternativesQuality,
  evaluateComparisonQuality,
  getAllAlternativePageSlugs,
  getAllAlternativePagesData,
  getAllComparisonPageSlugs,
  getAllComparisonPagesData,
} from "@/lib/seo-pages";
import {
  evaluateUseCaseQuality,
  getAllUseCasePages,
} from "@/lib/use-case-pages";
import type { Article } from "@/types/article";
import type { Resource } from "@/types/resource";
import type { Comparison } from "@/types/comparison";
import {
  evaluateArticleTierQuality,
  evaluateResourceTierQuality,
  getReviewAgeBucket,
  normalizeContentTier,
  reviewedDaysAgo,
  type ContentTier,
} from "@/lib/content-tier";
import { evaluateArticleDepth } from "@/lib/article-depth";

type ReviewDistribution = Record<"missing" | "0-7d" | "8-30d" | "31-90d" | "90d+", number>;

type MissingByTierBucket = {
  resourceDocs: number;
  articleDocs: number;
  resourceDocsWithMissing: number;
  articleDocsWithMissing: number;
  resources: Record<string, number>;
  articles: Record<string, number>;
};

type FreshnessItemType =
  | "resource"
  | "article"
  | "alternative"
  | "comparison"
  | "use-case";

export type FreshnessStaleItem = {
  type: FreshnessItemType;
  source: "seed" | "sanity";
  title: string;
  slug: string;
  url: string;
  tier?: ContentTier;
  lastReviewedAt: string | null;
  daysSinceReview: number | null;
  reasons: string[];
};

export type ContentFreshnessReport = {
  generatedAt: string;
  summary: {
    totalItems: number;
    staleItems: number;
    staleByType: Record<FreshnessItemType, number>;
    tieredResources: number;
    tieredArticles: number;
  };
  stalePages: FreshnessStaleItem[];
  missingFieldsByTier: Record<ContentTier, MissingByTierBucket>;
  lastReviewDistribution: {
    resources: ReviewDistribution;
    articles: ReviewDistribution;
    decisionPages: ReviewDistribution;
  };
  weeklyCompletionRate: {
    target: number;
    reviewedLast7Days: number;
    completionRate: number;
  };
};

function emptyDistribution(): ReviewDistribution {
  return {
    missing: 0,
    "0-7d": 0,
    "8-30d": 0,
    "31-90d": 0,
    "90d+": 0,
  };
}

function emptyMissingBucket(): MissingByTierBucket {
  return {
    resourceDocs: 0,
    articleDocs: 0,
    resourceDocsWithMissing: 0,
    articleDocsWithMissing: 0,
    resources: {},
    articles: {},
  };
}

function incrementField(counter: Record<string, number>, key: string) {
  counter[key] = (counter[key] ?? 0) + 1;
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function resourceMissingFields(resource: Resource): string[] {
  const tier = normalizeContentTier(resource.contentTier);
  if (tier === "tier3") return [];
  const missing: string[] = [];
  if (!resource.lastReviewedAt) missing.push("lastReviewedAt");
  if ((resource.sources?.length ?? 0) < 3) missing.push("sources");
  if (
    !hasText(resource.description) &&
    !hasText(resource.body) &&
    !hasText(resource.recommenderBlurb)
  ) {
    missing.push("answerFirstSummary");
  }
  if (
    typeof resource.refreshCadenceDays !== "number" ||
    !Number.isInteger(resource.refreshCadenceDays) ||
    resource.refreshCadenceDays < 7 ||
    resource.refreshCadenceDays > 365
  ) {
    missing.push("refreshCadenceDays");
  }
  if (!resource.factCheckStatus) missing.push("factCheckStatus");
  if (tier === "tier1") {
    if ((resource.bestFor?.length ?? 0) < 1) missing.push("bestFor");
    if ((resource.notFor?.length ?? 0) < 1) missing.push("notFor");
    if (!hasText(resource.pricingNotes)) missing.push("pricingNotes");
    if ((resource.alternatives?.length ?? 0) < 2) missing.push("alternatives");
  }
  return missing;
}

function articleMissingFields(article: Article): string[] {
  const tier = normalizeContentTier(article.contentTier);
  if (tier === "tier3") return [];
  const missing: string[] = [];
  if (!article.lastReviewedAt) missing.push("lastReviewedAt");
  if ((article.sources?.length ?? 0) < 3) missing.push("sources");
  if (!hasText(article.excerpt)) missing.push("excerpt");
  if (!hasText(article.primaryKeyword)) missing.push("primaryKeyword");
  if (!hasText(article.intentStage)) missing.push("intentStage");
  if ((article.relatedResources?.length ?? 0) < 2) missing.push("relatedResources");
  const depth = evaluateArticleDepth(article.body, tier);
  if (!depth.pass) missing.push("bodyDepth");
  return missing;
}

function addToDistribution(distribution: ReviewDistribution, reviewedAt: string | null | undefined) {
  const bucket = getReviewAgeBucket(reviewedAt);
  distribution[bucket] += 1;
}

export async function getContentFreshnessReport(): Promise<ContentFreshnessReport> {
  const resources: Resource[] = isSanityConfigured()
    ? (await sanityClient.fetch<Resource[]>(allResourcesQuery)) ?? []
    : [];
  const articles: Article[] = isSanityConfigured()
    ? (await sanityClient.fetch<Article[]>(allArticlesQuery)) ?? []
    : await getAllArticles();

  const seedAlternativePages = getAllAlternativePagesData();
  const seedComparisonPages = getAllComparisonPagesData();
  const useCasePages = getAllUseCasePages();

  const seedAlternativeSlugSet = new Set(getAllAlternativePageSlugs());
  const cmsAlternativeSummaries = await getAlternativeResourceSummaries();
  const cmsOnlyAlternatives = cmsAlternativeSummaries.filter(
    (resource) => !seedAlternativeSlugSet.has(resource.slug)
  );

  const seedComparisonSlugSet = new Set(getAllComparisonPageSlugs());
  const cmsComparisonSlugs = await getAllComparisonSlugs();
  const cmsOnlyComparisonSlugs = cmsComparisonSlugs.filter(
    (slug) => !seedComparisonSlugSet.has(slug)
  );
  const cmsComparisons = await Promise.all(
    cmsOnlyComparisonSlugs.map(async (slug) => ({ slug, data: await getComparisonBySlug(slug) }))
  );

  const stalePages: FreshnessStaleItem[] = [];
  const staleByType: Record<FreshnessItemType, number> = {
    resource: 0,
    article: 0,
    alternative: 0,
    comparison: 0,
    "use-case": 0,
  };

  const missingFieldsByTier: Record<ContentTier, MissingByTierBucket> = {
    tier1: emptyMissingBucket(),
    tier2: emptyMissingBucket(),
    tier3: emptyMissingBucket(),
  };

  const resourcesDistribution = emptyDistribution();
  const articlesDistribution = emptyDistribution();
  const decisionDistribution = emptyDistribution();

  let tieredResources = 0;
  let tieredArticles = 0;
  let reviewedTieredResourcesLast7Days = 0;

  for (const resource of resources) {
    const tier = normalizeContentTier(resource.contentTier);
    const tierQuality = evaluateResourceTierQuality(resource);
    const missing = resourceMissingFields(resource);
    const tierBucket = missingFieldsByTier[tier];
    tierBucket.resourceDocs += 1;
    if (missing.length > 0) tierBucket.resourceDocsWithMissing += 1;
    for (const key of missing) incrementField(tierBucket.resources, key);

    addToDistribution(resourcesDistribution, resource.lastReviewedAt ?? null);

    if (tier !== "tier3") {
      tieredResources += 1;
      const age = reviewedDaysAgo(resource.lastReviewedAt);
      if (age !== null && age <= 7) reviewedTieredResourcesLast7Days += 1;
    }

    if (tierQuality.stale) {
      staleByType.resource += 1;
      stalePages.push({
        type: "resource",
        source: "sanity",
        title: resource.title,
        slug: getResourceSlug(resource),
        url: `/${getResourceSlug(resource)}`,
        tier,
        lastReviewedAt: resource.lastReviewedAt ?? null,
        daysSinceReview: reviewedDaysAgo(resource.lastReviewedAt),
        reasons: tierQuality.reasons,
      });
    }
  }

  for (const article of articles) {
    const tier = normalizeContentTier(article.contentTier);
    const tierQuality = evaluateArticleTierQuality(article);
    const missing = articleMissingFields(article);
    const tierBucket = missingFieldsByTier[tier];
    tierBucket.articleDocs += 1;
    if (missing.length > 0) tierBucket.articleDocsWithMissing += 1;
    for (const key of missing) incrementField(tierBucket.articles, key);

    addToDistribution(articlesDistribution, article.lastReviewedAt ?? null);

    if (tier !== "tier3") tieredArticles += 1;

    if (tierQuality.stale) {
      staleByType.article += 1;
      const slug = article.slug ?? "";
      stalePages.push({
        type: "article",
        source: "sanity",
        title: article.title,
        slug,
        url: slug ? `/blog/${slug}` : "/blog",
        tier,
        lastReviewedAt: article.lastReviewedAt ?? null,
        daysSinceReview: reviewedDaysAgo(article.lastReviewedAt),
        reasons: tierQuality.reasons,
      });
    }
  }

  for (const page of seedAlternativePages) {
    const quality = evaluateAlternativesQuality(page);
    addToDistribution(decisionDistribution, page.lastReviewedAt ?? null);
    if (!quality.stale) continue;
    staleByType.alternative += 1;
    stalePages.push({
      type: "alternative",
      source: "seed",
      title: `${page.tool.title} alternatives`,
      slug: page.slug,
      url: `/alternatives/${page.slug}`,
      lastReviewedAt: page.lastReviewedAt ?? null,
      daysSinceReview: reviewedDaysAgo(page.lastReviewedAt),
      reasons: quality.reasons,
    });
  }

  for (const page of cmsOnlyAlternatives) {
    addToDistribution(decisionDistribution, page.lastReviewedAt);
    const age = reviewedDaysAgo(page.lastReviewedAt);
    const stale = age === null || age > 90;
    if (!stale) continue;
    staleByType.alternative += 1;
    stalePages.push({
      type: "alternative",
      source: "sanity",
      title: `${page.title} alternatives`,
      slug: page.slug,
      url: `/alternatives/${page.slug}`,
      lastReviewedAt: page.lastReviewedAt,
      daysSinceReview: reviewedDaysAgo(page.lastReviewedAt),
      reasons: [
        page.lastReviewedAt
          ? "Last reviewed date is older than 90 days."
          : "Missing last reviewed date.",
      ],
    });
  }

  for (const page of seedComparisonPages) {
    const quality = evaluateComparisonQuality(page);
    addToDistribution(decisionDistribution, page.lastReviewedAt ?? null);
    if (!quality.stale) continue;
    staleByType.comparison += 1;
    stalePages.push({
      type: "comparison",
      source: "seed",
      title: page.title,
      slug: page.slug,
      url: `/compare/${page.slug}`,
      lastReviewedAt: page.lastReviewedAt ?? null,
      daysSinceReview: reviewedDaysAgo(page.lastReviewedAt),
      reasons: quality.reasons,
    });
  }

  for (const row of cmsComparisons) {
    if (!row.data) continue;
    const data = row.data as Comparison;
    const quality = evaluateComparisonQuality({
      ...(data as Comparison),
      slug: row.slug,
      leftSlug: data.leftResource?.slug ?? "left",
      rightSlug: data.rightResource?.slug ?? "right",
      compareNext: [],
    });
    addToDistribution(decisionDistribution, data.lastReviewedAt ?? null);
    if (!quality.stale) continue;
    staleByType.comparison += 1;
    stalePages.push({
      type: "comparison",
      source: "sanity",
      title: data.title || row.slug.replace(/-/g, " "),
      slug: row.slug,
      url: `/compare/${row.slug}`,
      lastReviewedAt: data.lastReviewedAt ?? null,
      daysSinceReview: reviewedDaysAgo(data.lastReviewedAt),
      reasons: quality.reasons,
    });
  }

  for (const page of useCasePages) {
    const quality = evaluateUseCaseQuality(page);
    addToDistribution(decisionDistribution, page.lastReviewedAt ?? null);
    if (!quality.stale) continue;
    staleByType["use-case"] += 1;
    stalePages.push({
      type: "use-case",
      source: "seed",
      title: page.title,
      slug: page.slug,
      url: `/use-cases/${page.slug}`,
      lastReviewedAt: page.lastReviewedAt ?? null,
      daysSinceReview: reviewedDaysAgo(page.lastReviewedAt),
      reasons: quality.reasons,
    });
  }

  const weeklyTarget = 30;
  const weeklyCompletionRate = Math.min(
    100,
    Math.round((reviewedTieredResourcesLast7Days / weeklyTarget) * 100)
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalItems:
        resources.length +
        articles.length +
        seedAlternativePages.length +
        seedComparisonPages.length +
        useCasePages.length +
        cmsOnlyAlternatives.length +
        cmsComparisons.length,
      staleItems: stalePages.length,
      staleByType,
      tieredResources,
      tieredArticles,
    },
    stalePages: stalePages.sort((a, b) => {
      const aDays = a.daysSinceReview ?? Number.POSITIVE_INFINITY;
      const bDays = b.daysSinceReview ?? Number.POSITIVE_INFINITY;
      return bDays - aDays;
    }),
    missingFieldsByTier,
    lastReviewDistribution: {
      resources: resourcesDistribution,
      articles: articlesDistribution,
      decisionPages: decisionDistribution,
    },
    weeklyCompletionRate: {
      target: weeklyTarget,
      reviewedLast7Days: reviewedTieredResourcesLast7Days,
      completionRate: weeklyCompletionRate,
    },
  };
}
