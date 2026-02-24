#!/usr/bin/env node

/**
 * Content freshness gate for CI.
 *
 * Evaluates content freshness and fails when tier stale/missing
 * thresholds exceed configured limits.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

function usage() {
  console.log(`
Usage:
  node scripts/check-content-freshness-gate.mjs [options]

Options:
  --mode=<http|sanity|auto>             Data source mode (default: http)
  --base-url=<url>                      Base URL (default: https://thestash.xyz)
  --endpoint=<path>                     Endpoint path (default: /api/content/freshness)
  --input=<path>                        Read report JSON from file instead of URL/Sanity
  --output=<path>                       Write gate result JSON

  --sanity-project-id=<id>              Optional override for Sanity project ID
  --sanity-dataset=<name>               Optional override for Sanity dataset

  --max-tier1-resource-stale=<n>        Default: 0
  --max-tier2-resource-stale=<n>        Default: 25
  --max-tier1-article-stale=<n>         Default: 0
  --max-tier2-article-stale=<n>         Default: 10
  --max-tier1-resource-missing=<n>      Default: 0
  --max-tier2-resource-missing=<n>      Default: 40
  --max-tier1-article-missing=<n>       Default: 0
  --max-tier2-article-missing=<n>       Default: 20
  --min-weekly-completion-rate=<n>      Default: 70
  --min-tiered-resources=<n>            Default: 10

  --help
`);
}

function parseInteger(raw, label) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

function parseArgs(argv) {
  const defaults = {
    mode: "http",
    baseUrl: process.env.CONTENT_FRESHNESS_BASE_URL || "https://thestash.xyz",
    endpoint: "/api/content/freshness",
    input: null,
    output: null,
    sanityProjectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    sanityDataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    thresholds: {
      maxTier1ResourceStale: parseInteger(
        process.env.MAX_TIER1_RESOURCE_STALE ?? "0",
        "MAX_TIER1_RESOURCE_STALE"
      ),
      maxTier2ResourceStale: parseInteger(
        process.env.MAX_TIER2_RESOURCE_STALE ?? "25",
        "MAX_TIER2_RESOURCE_STALE"
      ),
      maxTier1ArticleStale: parseInteger(
        process.env.MAX_TIER1_ARTICLE_STALE ?? "0",
        "MAX_TIER1_ARTICLE_STALE"
      ),
      maxTier2ArticleStale: parseInteger(
        process.env.MAX_TIER2_ARTICLE_STALE ?? "10",
        "MAX_TIER2_ARTICLE_STALE"
      ),
      maxTier1ResourceMissing: parseInteger(
        process.env.MAX_TIER1_RESOURCE_MISSING ?? "0",
        "MAX_TIER1_RESOURCE_MISSING"
      ),
      maxTier2ResourceMissing: parseInteger(
        process.env.MAX_TIER2_RESOURCE_MISSING ?? "40",
        "MAX_TIER2_RESOURCE_MISSING"
      ),
      maxTier1ArticleMissing: parseInteger(
        process.env.MAX_TIER1_ARTICLE_MISSING ?? "0",
        "MAX_TIER1_ARTICLE_MISSING"
      ),
      maxTier2ArticleMissing: parseInteger(
        process.env.MAX_TIER2_ARTICLE_MISSING ?? "20",
        "MAX_TIER2_ARTICLE_MISSING"
      ),
      minWeeklyCompletionRate: parseInteger(
        process.env.MIN_WEEKLY_COMPLETION_RATE ?? "70",
        "MIN_WEEKLY_COMPLETION_RATE"
      ),
      minTieredResources: parseInteger(
        process.env.MIN_TIERED_RESOURCES ?? "10",
        "MIN_TIERED_RESOURCES"
      ),
    },
  };

  const out = structuredClone(defaults);

  const integerFlagMap = {
    "--max-tier1-resource-stale=": "maxTier1ResourceStale",
    "--max-tier2-resource-stale=": "maxTier2ResourceStale",
    "--max-tier1-article-stale=": "maxTier1ArticleStale",
    "--max-tier2-article-stale=": "maxTier2ArticleStale",
    "--max-tier1-resource-missing=": "maxTier1ResourceMissing",
    "--max-tier2-resource-missing=": "maxTier2ResourceMissing",
    "--max-tier1-article-missing=": "maxTier1ArticleMissing",
    "--max-tier2-article-missing=": "maxTier2ArticleMissing",
    "--min-weekly-completion-rate=": "minWeeklyCompletionRate",
    "--min-tiered-resources=": "minTieredResources",
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg.startsWith("--mode=")) {
      const value = arg.slice("--mode=".length).trim();
      if (!["http", "sanity", "auto"].includes(value)) {
        throw new Error("--mode must be one of: http, sanity, auto");
      }
      out.mode = value;
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      out.baseUrl = arg.slice("--base-url=".length).trim();
      continue;
    }
    if (arg.startsWith("--endpoint=")) {
      out.endpoint = arg.slice("--endpoint=".length).trim();
      continue;
    }
    if (arg.startsWith("--input=")) {
      out.input = path.resolve(arg.slice("--input=".length).trim());
      continue;
    }
    if (arg.startsWith("--output=")) {
      out.output = path.resolve(arg.slice("--output=".length).trim());
      continue;
    }
    if (arg.startsWith("--sanity-project-id=")) {
      out.sanityProjectId = arg.slice("--sanity-project-id=".length).trim();
      continue;
    }
    if (arg.startsWith("--sanity-dataset=")) {
      out.sanityDataset = arg.slice("--sanity-dataset=".length).trim();
      continue;
    }

    let parsed = false;
    for (const [prefix, key] of Object.entries(integerFlagMap)) {
      if (arg.startsWith(prefix)) {
        const value = parseInteger(arg.slice(prefix.length).trim(), key);
        out.thresholds[key] = value;
        parsed = true;
        break;
      }
    }
    if (parsed) continue;

    throw new Error(`Unknown argument: ${arg}`);
  }

  return out;
}

function toInt(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeTier(value) {
  if (value === "tier1" || value === "tier2" || value === "tier3") return value;
  return "tier3";
}

function isValidIsoDate(value) {
  if (!hasText(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

function reviewedDaysAgo(dateLike) {
  if (!isValidIsoDate(dateLike)) return null;
  const ts = Date.parse(dateLike);
  return Math.max(0, Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000)));
}

function isOlderThanDays(dateLike, days) {
  const age = reviewedDaysAgo(dateLike);
  if (age === null) return true;
  return age > days;
}

function countArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).length : 0;
}

const WORD_RE = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;

const ARTICLE_DEPTH_REQUIREMENTS = {
  tier1: {
    minWords: 1200,
    minHeadings: 6,
    minListItems: 6,
    minLinks: 5,
    minInternalLinks: 2,
    minExternalLinks: 2,
  },
  tier2: {
    minWords: 800,
    minHeadings: 4,
    minListItems: 4,
    minLinks: 3,
    minInternalLinks: 1,
    minExternalLinks: 2,
  },
};

function countWords(text) {
  return (String(text || "").match(WORD_RE) || []).length;
}

function classifyHref(href) {
  if (!hasText(href)) return { internal: false, external: false };
  const normalized = String(href).trim().toLowerCase();
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("#") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../")
  ) {
    return { internal: true, external: false };
  }
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return { internal: false, external: true };
  }
  return { internal: false, external: false };
}

function articleDepthMetrics(body) {
  const metrics = {
    wordCount: 0,
    headingCount: 0,
    listItemCount: 0,
    linkCount: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
  };

  if (!Array.isArray(body)) return metrics;

  for (const block of body) {
    if (!block || typeof block !== "object") continue;

    if (block._type === "block") {
      if (block.style === "h2" || block.style === "h3" || block.style === "h4") {
        metrics.headingCount += 1;
      }
      if (hasText(block.listItem)) metrics.listItemCount += 1;

      const text = Array.isArray(block.children)
        ? block.children
            .filter((child) => child && child._type === "span")
            .map((child) => String(child.text || ""))
            .join(" ")
            .trim()
        : "";
      if (text) metrics.wordCount += countWords(text);

      if (Array.isArray(block.markDefs)) {
        for (const mark of block.markDefs) {
          if (!mark || mark._type !== "link") continue;
          metrics.linkCount += 1;
          const href = classifyHref(mark.href);
          if (href.internal) metrics.internalLinkCount += 1;
          if (href.external) metrics.externalLinkCount += 1;
        }
      }
      continue;
    }

    if (block._type === "infographic") {
      const chunks = [];
      if (hasText(block.title)) chunks.push(block.title);
      if (Array.isArray(block.stats)) {
        for (const stat of block.stats) {
          if (!stat || typeof stat !== "object") continue;
          if (hasText(stat.label)) chunks.push(stat.label);
          if (hasText(stat.value)) chunks.push(stat.value);
          if (hasText(stat.subtext)) chunks.push(stat.subtext);
        }
      }
      const text = chunks.join(" ").trim();
      if (text) metrics.wordCount += countWords(text);
    }
  }

  return metrics;
}

function articleDepthPass(article, tier) {
  if (tier === "tier3") return true;
  const requirements = ARTICLE_DEPTH_REQUIREMENTS[tier];
  if (!requirements) return true;
  const metrics = articleDepthMetrics(article.body);
  if (metrics.wordCount < requirements.minWords) return false;
  if (metrics.headingCount < requirements.minHeadings) return false;
  if (metrics.listItemCount < requirements.minListItems) return false;
  if (metrics.linkCount < requirements.minLinks) return false;
  if (metrics.internalLinkCount < requirements.minInternalLinks) return false;
  if (metrics.externalLinkCount < requirements.minExternalLinks) return false;
  return true;
}

function incrementField(counter, key) {
  counter[key] = (counter[key] ?? 0) + 1;
}

function getReviewAgeBucket(dateLike) {
  const age = reviewedDaysAgo(dateLike);
  if (age === null) return "missing";
  if (age <= 7) return "0-7d";
  if (age <= 30) return "8-30d";
  if (age <= 90) return "31-90d";
  return "90d+";
}

function emptyDistribution() {
  return {
    missing: 0,
    "0-7d": 0,
    "8-30d": 0,
    "31-90d": 0,
    "90d+": 0,
  };
}

function addToDistribution(distribution, reviewedAt) {
  const bucket = getReviewAgeBucket(reviewedAt);
  distribution[bucket] += 1;
}

function emptyMissingBucket() {
  return {
    resourceDocs: 0,
    articleDocs: 0,
    resourceDocsWithMissing: 0,
    articleDocsWithMissing: 0,
    resources: {},
    articles: {},
  };
}

function normalizeSlug(doc) {
  if (typeof doc?.slug === "string") return doc.slug;
  if (doc?.slug && typeof doc.slug.current === "string") return doc.slug.current;
  const title = String(doc?.title ?? "").toLowerCase();
  return title
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resourceMissingFields(resource) {
  const tier = normalizeTier(resource.contentTier);
  if (tier === "tier3") return [];

  const missing = [];
  if (!resource.lastReviewedAt) missing.push("lastReviewedAt");
  if (countArray(resource.sources) < 3) missing.push("sources");
  if (!hasText(resource.description) && !hasText(resource.body) && !hasText(resource.recommenderBlurb)) {
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
    if (countArray(resource.bestFor) < 1) missing.push("bestFor");
    if (countArray(resource.notFor) < 1) missing.push("notFor");
    if (!hasText(resource.pricingNotes)) missing.push("pricingNotes");
    if (countArray(resource.alternatives) < 2) missing.push("alternatives");
  }

  return missing;
}

function articleMissingFields(article) {
  const tier = normalizeTier(article.contentTier);
  if (tier === "tier3") return [];

  const missing = [];
  if (!article.lastReviewedAt) missing.push("lastReviewedAt");
  if (countArray(article.sources) < 3) missing.push("sources");
  if (!hasText(article.excerpt)) missing.push("excerpt");
  if (!hasText(article.primaryKeyword)) missing.push("primaryKeyword");
  if (!hasText(article.intentStage)) missing.push("intentStage");
  if (countArray(article.relatedResources) < 2) missing.push("relatedResources");
  if (!articleDepthPass(article, tier)) missing.push("bodyDepth");
  return missing;
}

function inferDocsWithMissing(bucket, fieldKey) {
  if (!bucket || typeof bucket !== "object") return 0;

  const docsField =
    fieldKey === "resources" ? "resourceDocsWithMissing" : "articleDocsWithMissing";

  if (typeof bucket[docsField] === "number") {
    return bucket[docsField];
  }

  const fieldMap = bucket[fieldKey];
  if (!fieldMap || typeof fieldMap !== "object") return 0;
  const values = Object.values(fieldMap)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n));
  if (values.length === 0) return 0;
  return Math.max(...values);
}

function countStaleByTypeAndTier(stalePages, type, tier) {
  return stalePages.filter((item) => item.type === type && item.tier === tier).length;
}

async function fetchHttpReport(options) {
  const endpointUrl = new URL(options.endpoint, options.baseUrl).toString();
  const response = await fetch(endpointUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Freshness endpoint failed (${response.status}) at ${endpointUrl}`);
  }

  return {
    report: await response.json(),
    source: endpointUrl,
  };
}

async function fetchSanityReport(options) {
  const projectId = options.sanityProjectId || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const dataset = options.sanityDataset || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_API_TOKEN || "";

  if (!projectId || !token) {
    throw new Error("Sanity mode requires NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN.");
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2025-01-01",
    useCdn: false,
    token,
    perspective: "published",
  });

  const [resources, articles] = await Promise.all([
    client.fetch(`*[_type == "resource"]{
      _id,
      title,
      slug,
      contentTier,
      lastReviewedAt,
      sources,
      description,
      body,
      recommenderBlurb,
      refreshCadenceDays,
      factCheckStatus,
      bestFor,
      notFor,
      pricingNotes,
      alternatives
    }`),
    client.fetch(`*[_type == "article"]{
      _id,
      title,
      slug,
      contentTier,
      lastReviewedAt,
      sources,
      excerpt,
      primaryKeyword,
      intentStage,
      relatedResources,
      body
    }`),
  ]);

  const stalePages = [];
  const staleByType = {
    resource: 0,
    article: 0,
    alternative: 0,
    comparison: 0,
    "use-case": 0,
  };

  const missingFieldsByTier = {
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

  for (const resource of resources ?? []) {
    const tier = normalizeTier(resource.contentTier);
    const missing = resourceMissingFields(resource);

    const bucket = missingFieldsByTier[tier];
    bucket.resourceDocs += 1;
    if (missing.length > 0) bucket.resourceDocsWithMissing += 1;
    for (const field of missing) incrementField(bucket.resources, field);

    addToDistribution(resourcesDistribution, resource.lastReviewedAt ?? null);

    if (tier !== "tier3") {
      tieredResources += 1;
      const age = reviewedDaysAgo(resource.lastReviewedAt);
      if (age !== null && age <= 7) reviewedTieredResourcesLast7Days += 1;

      if (isOlderThanDays(resource.lastReviewedAt, 90)) {
        staleByType.resource += 1;
        const slug = normalizeSlug(resource);
        stalePages.push({
          type: "resource",
          source: "sanity",
          title: resource.title ?? slug,
          slug,
          url: `/${slug}`,
          tier,
          lastReviewedAt: resource.lastReviewedAt ?? null,
          daysSinceReview: reviewedDaysAgo(resource.lastReviewedAt),
          reasons: [
            resource.lastReviewedAt
              ? "Last reviewed date is older than 90 days."
              : "Missing last reviewed date.",
          ],
        });
      }
    }
  }

  for (const article of articles ?? []) {
    const tier = normalizeTier(article.contentTier);
    const missing = articleMissingFields(article);

    const bucket = missingFieldsByTier[tier];
    bucket.articleDocs += 1;
    if (missing.length > 0) bucket.articleDocsWithMissing += 1;
    for (const field of missing) incrementField(bucket.articles, field);

    addToDistribution(articlesDistribution, article.lastReviewedAt ?? null);

    if (tier !== "tier3") {
      tieredArticles += 1;

      if (isOlderThanDays(article.lastReviewedAt, 90)) {
        staleByType.article += 1;
        const slug = normalizeSlug(article);
        stalePages.push({
          type: "article",
          source: "sanity",
          title: article.title ?? slug,
          slug,
          url: slug ? `/blog/${slug}` : "/blog",
          tier,
          lastReviewedAt: article.lastReviewedAt ?? null,
          daysSinceReview: reviewedDaysAgo(article.lastReviewedAt),
          reasons: [
            article.lastReviewedAt
              ? "Last reviewed date is older than 90 days."
              : "Missing last reviewed date.",
          ],
        });
      }
    }
  }

  const weeklyTarget = 30;
  const weeklyCompletionRate = Math.min(
    100,
    Math.round((reviewedTieredResourcesLast7Days / weeklyTarget) * 100)
  );

  return {
    report: {
      generatedAt: new Date().toISOString(),
      summary: {
        totalItems: (resources?.length ?? 0) + (articles?.length ?? 0),
        staleItems: stalePages.length,
        staleByType,
        tieredResources,
        tieredArticles,
      },
      stalePages,
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
    },
    source: `sanity://${projectId}/${dataset}`,
  };
}

async function loadReport(options) {
  if (options.input) {
    if (!fs.existsSync(options.input)) {
      throw new Error(`Input report not found: ${options.input}`);
    }
    const raw = fs.readFileSync(options.input, "utf8");
    return {
      report: JSON.parse(raw),
      source: options.input,
    };
  }

  if (options.mode === "sanity") {
    return fetchSanityReport(options);
  }

  if (options.mode === "http") {
    return fetchHttpReport(options);
  }

  try {
    return await fetchHttpReport(options);
  } catch (httpError) {
    const sanityResult = await fetchSanityReport(options);
    return {
      ...sanityResult,
      source: `${sanityResult.source} (http fallback after: ${httpError.message})`,
    };
  }
}

function evaluateReport(report, thresholds) {
  const stalePages = Array.isArray(report?.stalePages) ? report.stalePages : [];

  const tier1Bucket = report?.missingFieldsByTier?.tier1 ?? {};
  const tier2Bucket = report?.missingFieldsByTier?.tier2 ?? {};

  const metrics = {
    generatedAt: report?.generatedAt ?? null,
    summary: report?.summary ?? {},
    weeklyCompletionRate: toInt(report?.weeklyCompletionRate?.completionRate, 0),
    stale: {
      tier1Resources: countStaleByTypeAndTier(stalePages, "resource", "tier1"),
      tier2Resources: countStaleByTypeAndTier(stalePages, "resource", "tier2"),
      tier1Articles: countStaleByTypeAndTier(stalePages, "article", "tier1"),
      tier2Articles: countStaleByTypeAndTier(stalePages, "article", "tier2"),
    },
    missing: {
      tier1Resources: inferDocsWithMissing(tier1Bucket, "resources"),
      tier2Resources: inferDocsWithMissing(tier2Bucket, "resources"),
      tier1Articles: inferDocsWithMissing(tier1Bucket, "articles"),
      tier2Articles: inferDocsWithMissing(tier2Bucket, "articles"),
    },
    tieredResources: toInt(report?.summary?.tieredResources, 0),
  };

  const violations = [];

  if (metrics.stale.tier1Resources > thresholds.maxTier1ResourceStale) {
    violations.push(
      `Tier1 resource stale pages ${metrics.stale.tier1Resources} > ${thresholds.maxTier1ResourceStale}`
    );
  }
  if (metrics.stale.tier2Resources > thresholds.maxTier2ResourceStale) {
    violations.push(
      `Tier2 resource stale pages ${metrics.stale.tier2Resources} > ${thresholds.maxTier2ResourceStale}`
    );
  }
  if (metrics.stale.tier1Articles > thresholds.maxTier1ArticleStale) {
    violations.push(
      `Tier1 article stale pages ${metrics.stale.tier1Articles} > ${thresholds.maxTier1ArticleStale}`
    );
  }
  if (metrics.stale.tier2Articles > thresholds.maxTier2ArticleStale) {
    violations.push(
      `Tier2 article stale pages ${metrics.stale.tier2Articles} > ${thresholds.maxTier2ArticleStale}`
    );
  }

  if (metrics.missing.tier1Resources > thresholds.maxTier1ResourceMissing) {
    violations.push(
      `Tier1 resource docs with missing fields ${metrics.missing.tier1Resources} > ${thresholds.maxTier1ResourceMissing}`
    );
  }
  if (metrics.missing.tier2Resources > thresholds.maxTier2ResourceMissing) {
    violations.push(
      `Tier2 resource docs with missing fields ${metrics.missing.tier2Resources} > ${thresholds.maxTier2ResourceMissing}`
    );
  }
  if (metrics.missing.tier1Articles > thresholds.maxTier1ArticleMissing) {
    violations.push(
      `Tier1 article docs with missing fields ${metrics.missing.tier1Articles} > ${thresholds.maxTier1ArticleMissing}`
    );
  }
  if (metrics.missing.tier2Articles > thresholds.maxTier2ArticleMissing) {
    violations.push(
      `Tier2 article docs with missing fields ${metrics.missing.tier2Articles} > ${thresholds.maxTier2ArticleMissing}`
    );
  }

  if (metrics.weeklyCompletionRate < thresholds.minWeeklyCompletionRate) {
    violations.push(
      `Weekly completion rate ${metrics.weeklyCompletionRate}% < ${thresholds.minWeeklyCompletionRate}%`
    );
  }

  if (metrics.tieredResources < thresholds.minTieredResources) {
    violations.push(
      `Tiered resources ${metrics.tieredResources} < ${thresholds.minTieredResources}`
    );
  }

  return {
    passed: violations.length === 0,
    thresholds,
    metrics,
    violations,
  };
}

function printSummary(result, source) {
  console.log("Content freshness gate summary");
  console.log(`- Source: ${source}`);
  console.log(`- Generated at: ${result.metrics.generatedAt ?? "unknown"}`);
  console.log(`- Tiered resources: ${result.metrics.tieredResources}`);
  console.log(`- Weekly completion rate: ${result.metrics.weeklyCompletionRate}%`);
  console.log(
    `- Stale (resource): tier1=${result.metrics.stale.tier1Resources}, tier2=${result.metrics.stale.tier2Resources}`
  );
  console.log(
    `- Stale (article): tier1=${result.metrics.stale.tier1Articles}, tier2=${result.metrics.stale.tier2Articles}`
  );
  console.log(
    `- Missing docs (resource): tier1=${result.metrics.missing.tier1Resources}, tier2=${result.metrics.missing.tier2Resources}`
  );
  console.log(
    `- Missing docs (article): tier1=${result.metrics.missing.tier1Articles}, tier2=${result.metrics.missing.tier2Articles}`
  );

  if (result.passed) {
    console.log("- Result: PASS");
    return;
  }

  console.log("- Result: FAIL");
  for (const violation of result.violations) {
    console.log(`  * ${violation}`);
  }
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage();
    process.exit(1);
  }

  const { report, source } = await loadReport(options);
  const result = evaluateReport(report, options.thresholds);

  const outputPayload = {
    checkedAt: new Date().toISOString(),
    source,
    ...result,
  };

  if (options.output) {
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, JSON.stringify(outputPayload, null, 2));
  }

  printSummary(outputPayload, source);

  if (!outputPayload.passed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Freshness gate failed:", error.message || error);
  process.exit(1);
});
