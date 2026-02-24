import type { Article } from "@/types/article";
import type { Resource } from "@/types/resource";
import {
  evaluateArticleDepth,
  type ArticleContentTier,
} from "@/lib/article-depth";

export type ContentTier = "tier1" | "tier2" | "tier3";

export type TierQualityResult = {
  tier: ContentTier;
  requiresGate: boolean;
  pass: boolean;
  stale: boolean;
  minSources: number;
  reasons: string[];
};

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeContentTier(value: unknown): ContentTier {
  if (value === "tier1" || value === "tier2" || value === "tier3") return value;
  return "tier3";
}

export function isOlderThanDays(
  dateLike: string | null | undefined,
  days: number
): boolean {
  if (!dateLike) return true;
  const ts = Date.parse(dateLike);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > days * 24 * 60 * 60 * 1000;
}

export function reviewedDaysAgo(
  dateLike: string | null | undefined
): number | null {
  if (!dateLike) return null;
  const ts = Date.parse(dateLike);
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000)));
}

export function evaluateResourceTierQuality(resource: Resource): TierQualityResult {
  const tier = normalizeContentTier(resource.contentTier);
  const requiresGate = tier !== "tier3";
  const minSources = 3;
  const reasons: string[] = [];

  if (!requiresGate) {
    return {
      tier,
      requiresGate,
      pass: true,
      stale: false,
      minSources,
      reasons,
    };
  }

  const sourceCount = resource.sources?.length ?? 0;
  if (sourceCount < minSources) {
    reasons.push(`Add at least ${minSources} sources.`);
  }
  if (!hasText(resource.description) && !hasText(resource.body) && !hasText(resource.recommenderBlurb)) {
    reasons.push("Missing answer-first summary (description/body/recommender blurb).");
  }
  if (!resource.lastReviewedAt) {
    reasons.push("Missing last reviewed date.");
  }
  if (
    typeof resource.refreshCadenceDays !== "number" ||
    !Number.isInteger(resource.refreshCadenceDays) ||
    resource.refreshCadenceDays < 7 ||
    resource.refreshCadenceDays > 365
  ) {
    reasons.push("Refresh cadence must be an integer between 7 and 365 days.");
  }
  if (!resource.factCheckStatus) {
    reasons.push("Missing fact-check status.");
  }

  if (tier === "tier1") {
    if ((resource.bestFor?.length ?? 0) < 1) reasons.push("Missing best-for bullets.");
    if ((resource.notFor?.length ?? 0) < 1) reasons.push("Missing not-for bullets.");
    if (!hasText(resource.pricingNotes)) reasons.push("Missing pricing notes.");
    if ((resource.alternatives?.length ?? 0) < 2) reasons.push("Needs at least 2 alternatives.");
  }

  const stale = isOlderThanDays(resource.lastReviewedAt, 90);
  if (stale) reasons.push("Last reviewed date is older than 90 days.");

  return {
    tier,
    requiresGate,
    pass: reasons.length === 0,
    stale,
    minSources,
    reasons,
  };
}

export function evaluateArticleTierQuality(article: Article): TierQualityResult {
  const tier = normalizeContentTier(article.contentTier);
  const requiresGate = tier !== "tier3";
  const minSources = 3;
  const reasons: string[] = [];

  if (!requiresGate) {
    return {
      tier,
      requiresGate,
      pass: true,
      stale: false,
      minSources,
      reasons,
    };
  }

  if (!hasText(article.excerpt)) reasons.push("Missing answer-first excerpt.");
  if (!hasText(article.primaryKeyword)) reasons.push("Missing primary keyword.");
  if (!hasText(article.intentStage)) reasons.push("Missing intent stage.");
  if ((article.sources?.length ?? 0) < minSources) {
    reasons.push(`Add at least ${minSources} sources.`);
  }
  if (!article.lastReviewedAt) reasons.push("Missing last reviewed date.");
  if ((article.relatedResources?.length ?? 0) < 2) {
    reasons.push("Add at least 2 related resources for internal linking.");
  }

  const depth = evaluateArticleDepth(article.body, tier as ArticleContentTier);
  if (!depth.pass) {
    reasons.push(...depth.reasons);
  }

  const stale = isOlderThanDays(article.lastReviewedAt, 90);
  if (stale) reasons.push("Last reviewed date is older than 90 days.");

  return {
    tier,
    requiresGate,
    pass: reasons.length === 0,
    stale,
    minSources,
    reasons,
  };
}

export function shouldNoindexFromTierQuality(result: TierQualityResult): boolean {
  return result.requiresGate && !result.pass;
}

export function getReviewAgeBucket(
  dateLike: string | null | undefined
): "missing" | "0-7d" | "8-30d" | "31-90d" | "90d+" {
  const age = reviewedDaysAgo(dateLike);
  if (age === null) return "missing";
  if (age <= 7) return "0-7d";
  if (age <= 30) return "8-30d";
  if (age <= 90) return "31-90d";
  return "90d+";
}
