#!/usr/bin/env node

/**
 * Backfill tiered-content metadata on existing Sanity resources/articles.
 *
 * Default mode is dry-run.
 * Apply mode patches Sanity documents directly.
 *
 * Run:
 *   node --env-file=.env.local scripts/backfill-content-tier-fields.mjs
 *   node --env-file=.env.local scripts/backfill-content-tier-fields.mjs --apply
 */

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

const RESOURCE_QUERY = `*[_type == "resource"]{
  _id,
  _updatedAt,
  title,
  slug,
  url,
  description,
  body,
  recommenderBlurb,
  contentTier,
  refreshCadenceDays,
  factCheckStatus,
  lastReviewedAt,
  changeLog,
  bestFor,
  notFor,
  pricingNotes,
  alternatives,
  sources
}`;

const ARTICLE_QUERY = `*[_type == "article"]{
  _id,
  _updatedAt,
  title,
  slug,
  excerpt,
  body,
  contentTier,
  lastReviewedAt,
  primaryKeyword,
  intentStage,
  relatedResources,
  sources,
  publishedAt
}`;

const VALID_FACT_CHECK_STATUS = new Set(["verified", "needs-review"]);
const VALID_INTENT_STAGES = new Set([
  "awareness",
  "consideration",
  "decision",
  "implementation",
]);

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

function usage() {
  console.log(`
Usage:
  node --env-file=.env.local scripts/backfill-content-tier-fields.mjs [options]

Options:
  --apply                    Apply patches (default is dry-run)
  --target=<both|resources|articles>
  --queue=<path>             Priority queue JSON path
  --limit=<n>                Limit docs patched per type
  --reviewed-at=<iso-date>   Override fallback lastReviewedAt
  --fallback-tier            Downgrade failing tiered docs (default)
  --no-fallback-tier         Do not downgrade failing tiered docs
  --help
`);
}

function parseArgs(argv) {
  const defaults = {
    apply: false,
    target: "both",
    queue: path.join(process.cwd(), "automation", "content-priority-queue.json"),
    limit: null,
    reviewedAt: null,
    fallbackTier: true,
  };

  const out = { ...defaults };

  for (const arg of argv) {
    if (arg === "--apply") {
      out.apply = true;
      continue;
    }
    if (arg === "--fallback-tier") {
      out.fallbackTier = true;
      continue;
    }
    if (arg === "--no-fallback-tier") {
      out.fallbackTier = false;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg.startsWith("--target=")) {
      const value = arg.slice("--target=".length).trim();
      if (value === "both" || value === "resources" || value === "articles") {
        out.target = value;
      } else {
        throw new Error(`Invalid --target value: ${value}`);
      }
      continue;
    }
    if (arg.startsWith("--queue=")) {
      out.queue = path.resolve(arg.slice("--queue=".length).trim());
      continue;
    }
    if (arg.startsWith("--limit=")) {
      const raw = Number(arg.slice("--limit=".length).trim());
      if (!Number.isInteger(raw) || raw < 1) {
        throw new Error("--limit must be a positive integer.");
      }
      out.limit = raw;
      continue;
    }
    if (arg.startsWith("--reviewed-at=")) {
      const value = arg.slice("--reviewed-at=".length).trim();
      if (!isValidIsoDate(value)) {
        throw new Error(`Invalid --reviewed-at value: ${value}`);
      }
      out.reviewedAt = new Date(value).toISOString();
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return out;
}

function isValidIsoDate(value) {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  const ts = Date.parse(value);
  return !Number.isNaN(ts);
}

function normalizeTier(value) {
  if (value === "tier1" || value === "tier2" || value === "tier3") return value;
  return null;
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeSlug(doc) {
  const slugValue =
    typeof doc.slug === "string"
      ? doc.slug
      : doc.slug && typeof doc.slug.current === "string"
        ? doc.slug.current
        : "";
  if (slugValue) return slugify(slugValue);
  return slugify(doc.title ?? "");
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getNowIso() {
  return new Date().toISOString();
}

function reviewedDateFallback(doc, overrideIso) {
  if (overrideIso) return overrideIso;
  if (isValidIsoDate(doc.lastReviewedAt)) return new Date(doc.lastReviewedAt).toISOString();
  if (isValidIsoDate(doc._updatedAt)) return new Date(doc._updatedAt).toISOString();
  if (isValidIsoDate(doc.publishedAt)) return new Date(doc.publishedAt).toISOString();
  return getNowIso();
}

function isCadenceValid(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 7 && value <= 365;
}

function asArrayLength(value) {
  return Array.isArray(value) ? value.filter(Boolean).length : 0;
}

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

function articleDepthPass(body, tier) {
  if (tier === "tier3") return true;
  const requirements = ARTICLE_DEPTH_REQUIREMENTS[tier];
  if (!requirements) return true;
  const metrics = articleDepthMetrics(body);
  if (metrics.wordCount < requirements.minWords) return false;
  if (metrics.headingCount < requirements.minHeadings) return false;
  if (metrics.listItemCount < requirements.minListItems) return false;
  if (metrics.linkCount < requirements.minLinks) return false;
  if (metrics.internalLinkCount < requirements.minInternalLinks) return false;
  if (metrics.externalLinkCount < requirements.minExternalLinks) return false;
  return true;
}

function firstSentence(text) {
  if (!hasText(text)) return "";
  const trimmed = text.trim().replace(/\s+/g, " ");
  const parts = trimmed.split(/(?<=[.!?])\s+/);
  return parts[0] || trimmed;
}

function buildRecommenderBlurb(resource) {
  const fromDescription = firstSentence(resource.description);
  if (fromDescription) return fromDescription.slice(0, 180);

  const fromBody = firstSentence(resource.body);
  if (fromBody) return fromBody.slice(0, 180);

  return `Best for teams evaluating ${resource.title} for practical, production workflows.`;
}

function inferBestFor(resource) {
  const category = String(resource.category ?? "this category").replace(/-/g, " ");
  return [`Teams looking for ${category} workflows that ship faster.`];
}

function inferNotFor() {
  return ["Teams that require fully offline or heavily self-hosted-only workflows."];
}

function inferPricingNotes(resource) {
  const host = (() => {
    try {
      return new URL(resource.url).hostname.replace(/^www\./, "");
    } catch {
      return "the vendor";
    }
  })();

  return `Pricing can change frequently. Confirm latest plans, limits, and enterprise terms on ${host}.`;
}

function inferPrimaryKeyword(article) {
  return slugify(article.title ?? "").replace(/-/g, " ").slice(0, 90).trim();
}

function inferIntentStage(article) {
  const title = String(article.title ?? "").toLowerCase();
  if (/(\bvs\b|versus|alternative|alternatives|compare|comparison)/.test(title)) {
    return "decision";
  }
  if (/(how to|guide|tutorial|playbook|checklist|implement|implementation|best practices)/.test(title)) {
    return "implementation";
  }
  if (/(best|top|tools|list|roundup)/.test(title)) {
    return "consideration";
  }
  return "awareness";
}

function isOlderThanDays(dateLike, days) {
  if (!isValidIsoDate(dateLike)) return true;
  const ts = Date.parse(dateLike);
  return Date.now() - ts > days * 24 * 60 * 60 * 1000;
}

function evaluateResourceGate(resource) {
  const tier = normalizeTier(resource.contentTier) || "tier3";
  if (tier === "tier3") {
    return { pass: true, reasons: [] };
  }

  const reasons = [];
  if (asArrayLength(resource.sources) < 3) reasons.push("sources<3");
  if (!hasText(resource.description) && !hasText(resource.body) && !hasText(resource.recommenderBlurb)) {
    reasons.push("missing-answer-first");
  }
  if (!isValidIsoDate(resource.lastReviewedAt)) reasons.push("missing-lastReviewedAt");
  if (isOlderThanDays(resource.lastReviewedAt, 90)) reasons.push("stale-lastReviewedAt");
  if (!isCadenceValid(resource.refreshCadenceDays)) reasons.push("invalid-refreshCadenceDays");
  if (!VALID_FACT_CHECK_STATUS.has(resource.factCheckStatus)) reasons.push("invalid-factCheckStatus");

  if (tier === "tier1") {
    if (asArrayLength(resource.bestFor) < 1) reasons.push("bestFor<1");
    if (asArrayLength(resource.notFor) < 1) reasons.push("notFor<1");
    if (!hasText(resource.pricingNotes)) reasons.push("missing-pricingNotes");
    if (asArrayLength(resource.alternatives) < 2) reasons.push("alternatives<2");
  }

  return { pass: reasons.length === 0, reasons };
}

function evaluateArticleGate(article) {
  const tier = normalizeTier(article.contentTier) || "tier3";
  if (tier === "tier3") {
    return { pass: true, reasons: [] };
  }

  const reasons = [];
  if (!hasText(article.excerpt)) reasons.push("missing-excerpt");
  if (!hasText(article.primaryKeyword)) reasons.push("missing-primaryKeyword");
  if (!VALID_INTENT_STAGES.has(article.intentStage)) reasons.push("missing-intentStage");
  if (asArrayLength(article.sources) < 3) reasons.push("sources<3");
  if (!isValidIsoDate(article.lastReviewedAt)) reasons.push("missing-lastReviewedAt");
  if (isOlderThanDays(article.lastReviewedAt, 90)) reasons.push("stale-lastReviewedAt");
  if (asArrayLength(article.relatedResources) < 2) reasons.push("relatedResources<2");
  if (!articleDepthPass(article.body, tier)) reasons.push("bodyDepth");

  return { pass: reasons.length === 0, reasons };
}

function randomKey() {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

function loadTierMap(queuePath) {
  if (!fs.existsSync(queuePath)) return new Map();

  try {
    const raw = JSON.parse(fs.readFileSync(queuePath, "utf8"));
    const queue = Array.isArray(raw?.queue) ? raw.queue : [];
    const map = new Map();
    for (const row of queue) {
      const slug = slugify(row?.slug ?? "");
      const tier = normalizeTier(row?.contentTier);
      if (!slug || !tier) continue;
      map.set(slug, tier);
    }
    return map;
  } catch (error) {
    console.warn(`Failed to read queue map from ${queuePath}:`, error.message);
    return new Map();
  }
}

function cadenceForTier(tier) {
  if (tier === "tier1") return 30;
  if (tier === "tier2") return 45;
  return 90;
}

function planResourcePatch(resource, tierMap, options) {
  const slug = normalizeSlug(resource);
  const explicitTier = normalizeTier(resource.contentTier);
  const queuedTier = tierMap.get(slug) || null;
  const workingTier = explicitTier || queuedTier || "tier3";

  if (workingTier === "tier3") return null;

  const set = {};
  const notes = [];
  const fromTier = explicitTier || "unset";

  if (resource.contentTier !== workingTier) {
    set.contentTier = workingTier;
    notes.push(`contentTier:${fromTier}->${workingTier}`);
  }

  if (!isCadenceValid(resource.refreshCadenceDays)) {
    set.refreshCadenceDays = cadenceForTier(workingTier);
    notes.push(`refreshCadenceDays=${set.refreshCadenceDays}`);
  }

  if (!VALID_FACT_CHECK_STATUS.has(resource.factCheckStatus)) {
    set.factCheckStatus = "needs-review";
    notes.push("factCheckStatus=needs-review");
  }

  if (!isValidIsoDate(resource.lastReviewedAt)) {
    set.lastReviewedAt = reviewedDateFallback(resource, options.reviewedAt);
    notes.push("lastReviewedAt=backfilled");
  }

  if (!hasText(resource.recommenderBlurb)) {
    set.recommenderBlurb = buildRecommenderBlurb(resource);
    notes.push("recommenderBlurb=backfilled");
  }

  if (workingTier === "tier1") {
    if (asArrayLength(resource.bestFor) < 1) {
      set.bestFor = inferBestFor(resource);
      notes.push("bestFor=backfilled");
    }
    if (asArrayLength(resource.notFor) < 1) {
      set.notFor = inferNotFor(resource);
      notes.push("notFor=backfilled");
    }
    if (!hasText(resource.pricingNotes)) {
      set.pricingNotes = inferPricingNotes(resource);
      notes.push("pricingNotes=backfilled");
    }
  }

  const simulated = { ...resource, ...set };
  const tier1Gate = evaluateResourceGate(simulated);

  if (!tier1Gate.pass && options.fallbackTier) {
    if ((set.contentTier || workingTier) === "tier1") {
      const tier2Simulated = { ...simulated, contentTier: "tier2" };
      const tier2Gate = evaluateResourceGate(tier2Simulated);
      if (tier2Gate.pass) {
        set.contentTier = "tier2";
        notes.push("fallback:tier1->tier2");
      } else {
        set.contentTier = "tier3";
        notes.push(`fallback:tier1->tier3(${tier2Gate.reasons.join(";")})`);
      }
    } else {
      set.contentTier = "tier3";
      notes.push(`fallback:${workingTier}->tier3(${tier1Gate.reasons.join(";")})`);
    }
  }

  if (Object.keys(set).length === 0) return null;

  const summary = notes
    .join(", ")
    .slice(0, 190);

  return {
    _id: resource._id,
    slug,
    title: resource.title,
    type: "resource",
    set,
    notes,
    changeLogEntry: {
      _key: randomKey(),
      _type: "object",
      summary: summary || "Fresh content metadata backfill",
      changedAt: getNowIso(),
    },
  };
}

function planArticlePatch(article, options) {
  const explicitTier = normalizeTier(article.contentTier);
  const workingTier = explicitTier || "tier3";
  if (workingTier === "tier3") return null;

  const set = {};
  const notes = [];

  if (!isValidIsoDate(article.lastReviewedAt)) {
    set.lastReviewedAt = reviewedDateFallback(article, options.reviewedAt);
    notes.push("lastReviewedAt=backfilled");
  }

  if (!hasText(article.primaryKeyword)) {
    set.primaryKeyword = inferPrimaryKeyword(article);
    notes.push("primaryKeyword=derived");
  }

  if (!VALID_INTENT_STAGES.has(article.intentStage)) {
    set.intentStage = inferIntentStage(article);
    notes.push(`intentStage=${set.intentStage}`);
  }

  const simulated = { ...article, ...set };
  const gate = evaluateArticleGate(simulated);
  if (!gate.pass && options.fallbackTier) {
    set.contentTier = "tier3";
    notes.push(`fallback:${workingTier}->tier3(${gate.reasons.join(";")})`);
  }

  if (Object.keys(set).length === 0) return null;

  return {
    _id: article._id,
    slug: normalizeSlug(article),
    title: article.title,
    type: "article",
    set,
    notes,
  };
}

async function applyPatch(client, plan) {
  let patch = client.patch(plan._id).set(plan.set);

  if (plan.type === "resource" && plan.changeLogEntry) {
    patch = patch.setIfMissing({ changeLog: [] }).append("changeLog", [plan.changeLogEntry]);
  }

  await patch.commit();
}

function printPlanSummary(label, plans, scannedCount) {
  console.log(`\n${label}`);
  console.log(`  scanned: ${scannedCount}`);
  console.log(`  patch candidates: ${plans.length}`);

  const downgraded = plans.filter(
    (plan) => plan.set.contentTier === "tier3" || plan.notes.some((note) => note.startsWith("fallback:"))
  ).length;
  console.log(`  fallback downgrades: ${downgraded}`);
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

  const tierMap = loadTierMap(options.queue);

  const runResources = options.target === "both" || options.target === "resources";
  const runArticles = options.target === "both" || options.target === "articles";

  const resources = runResources ? await client.fetch(RESOURCE_QUERY) : [];
  const articles = runArticles ? await client.fetch(ARTICLE_QUERY) : [];

  const resourcePlans = [];
  for (const resource of resources) {
    const plan = planResourcePatch(resource, tierMap, options);
    if (plan) resourcePlans.push(plan);
  }

  const articlePlans = [];
  for (const article of articles) {
    const plan = planArticlePatch(article, options);
    if (plan) articlePlans.push(plan);
  }

  const limitedResources = options.limit ? resourcePlans.slice(0, options.limit) : resourcePlans;
  const limitedArticles = options.limit ? articlePlans.slice(0, options.limit) : articlePlans;

  printPlanSummary("Resource backfill", limitedResources, resources.length);
  printPlanSummary("Article backfill", limitedArticles, articles.length);

  const totalCandidates = limitedResources.length + limitedArticles.length;
  if (totalCandidates === 0) {
    console.log("\nNo tiered documents require backfill.");
    return;
  }

  console.log(`\nMode: ${options.apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Fallback tiering: ${options.fallbackTier ? "enabled" : "disabled"}`);
  console.log(`Queue map: ${options.queue} (${tierMap.size} slugs)`);

  const preview = [...limitedResources, ...limitedArticles].slice(0, 12);
  console.log("\nPreview (first 12 planned patches):");
  for (const plan of preview) {
    console.log(`- [${plan.type}] ${plan.title} (${plan.slug})`);
    console.log(`  set: ${JSON.stringify(plan.set)}`);
    if (plan.notes.length > 0) console.log(`  notes: ${plan.notes.join(", ")}`);
  }

  if (!options.apply) {
    console.log("\nDry-run complete. Re-run with --apply to commit patches.");
    return;
  }

  const toApply = [...limitedResources, ...limitedArticles];
  let applied = 0;
  const failures = [];

  for (const plan of toApply) {
    try {
      await applyPatch(client, plan);
      applied += 1;
    } catch (error) {
      failures.push({ id: plan._id, title: plan.title, error: error.message || String(error) });
    }
  }

  console.log(`\nApplied patches: ${applied}/${toApply.length}`);

  if (failures.length > 0) {
    console.error("\nPatch failures:");
    for (const failure of failures) {
      console.error(`- ${failure.title} (${failure.id}): ${failure.error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
