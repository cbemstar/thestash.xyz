import "server-only";

import fs from "node:fs";
import path from "node:path";
import { slugify } from "@/lib/slug";
import type { Article } from "@/types/article";
import type {
  Resource,
  ResourceAdoptionTier,
  ResourceCategory,
  ResourceContentTier,
  ResourceFactCheckStatus,
  ResourceIndustry,
  ResourcePricing,
  ResourceType,
  ResourceUseCase,
} from "@/types/resource";

type QueueItemKind = "resource" | "blog";

type QueueItem = {
  queueId?: string;
  submittedAt?: string;
  type?: string;
  status?: string;
  data?: unknown;
};

const APPROVAL_QUEUE_PATH = path.join(
  process.cwd(),
  "automation",
  "agents",
  "approval-queue.json"
);

const RESOURCE_CATEGORY_SET = new Set<ResourceCategory>([
  "design-tools",
  "development-tools",
  "ui-ux-resources",
  "inspiration",
  "ai-tools",
  "productivity",
  "learning-resources",
  "miscellaneous",
  "webflow",
  "shadcn",
  "coding",
  "github",
  "html",
  "css",
  "javascript",
  "languages",
]);

const RESOURCE_TYPE_SET = new Set<ResourceType>([
  "app",
  "website",
  "utility",
  "library",
  "directory",
  "article",
  "tool",
  "component",
  "snippet",
  "course",
  "framework",
  "other",
]);

const CONTENT_TIER_SET = new Set<ResourceContentTier>(["tier1", "tier2", "tier3"]);
const FACT_CHECK_SET = new Set<ResourceFactCheckStatus>(["verified", "needs-review"]);
const ADOPTION_TIER_SET = new Set<ResourceAdoptionTier>(["low", "medium", "high", "popular"]);
const INDUSTRY_SET = new Set<ResourceIndustry>([
  "e-commerce",
  "saas",
  "content",
  "community",
  "developer",
  "marketing",
  "general",
]);
const PRICING_SET = new Set<ResourcePricing>([
  "free",
  "freemium",
  "paid",
  "enterprise",
  "open-source",
]);
const USE_CASE_SET = new Set<ResourceUseCase>([
  "auth",
  "payments",
  "email",
  "database",
  "hosting",
  "analytics",
  "ai",
  "design",
  "cms",
  "search",
  "storage",
  "apis",
]);

const ARTICLE_INTENT_STAGE_SET = new Set<NonNullable<Article["intentStage"]>>([
  "awareness",
  "consideration",
  "decision",
  "implementation",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asStringArray(value: unknown, limit: number = 24): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, limit);
}

function asEnum<T extends string>(value: unknown, allowed: Set<T>): T | undefined {
  const normalized = asString(value);
  if (!normalized) return undefined;
  return allowed.has(normalized as T) ? (normalized as T) : undefined;
}

function normalizeSources(
  value: unknown
): { label: string; url: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const sources = value
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => {
      const label = asString(entry.label);
      const url = asString(entry.url);
      if (!label || !url) return null;
      return { label, url };
    })
    .filter(
      (entry): entry is { label: string; url: string } => entry !== null
    )
    .slice(0, 32);
  return sources.length > 0 ? sources : undefined;
}

function normalizeArticleRelatedResources(
  value: unknown
): Article["relatedResources"] {
  if (!Array.isArray(value)) return undefined;
  const related = value
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => {
      const id = asString(entry._id) ?? asString(entry._ref);
      const title = asString(entry.title);
      const slug = asString(entry.slug);
      if (!id || !title) return null;
      return { _id: id, title, slug };
    })
    .filter(
      (entry): entry is { _id: string; title: string; slug: string | undefined } =>
        entry !== null
    )
    .slice(0, 24);
  return related.length > 0 ? related : undefined;
}

function normalizeArticlePrimaryResource(
  value: unknown
): Article["primaryResource"] {
  const entry = asRecord(value);
  if (!entry) return null;
  const id = asString(entry._id) ?? asString(entry._ref);
  const title = asString(entry.title);
  const slug = asString(entry.slug);
  if (!id || !title) return null;
  return { _id: id, title, slug };
}

function normalizeResourceAlternatives(value: unknown): Resource["alternatives"] {
  if (!Array.isArray(value)) return undefined;
  const alternatives = value
    .map((entry) => {
      if (typeof entry === "string") {
        const slug = asString(entry);
        if (!slug) return null;
        return {
          _id: `draft-alt-${slug}`,
          title: slug.replace(/-/g, " "),
          slug,
        };
      }
      const item = asRecord(entry);
      if (!item) return null;
      const slug = asString(item.slug);
      const title =
        asString(item.title) ?? (slug ? slug.replace(/-/g, " ") : undefined);
      if (!title) return null;
      const id = asString(item._id) ?? `draft-alt-${slug || slugify(title)}`;
      return {
        _id: id,
        title,
        slug,
        url: asString(item.url),
        description: asString(item.description),
        category: asEnum(item.category, RESOURCE_CATEGORY_SET),
        sources: normalizeSources(item.sources),
        bestFor: asStringArray(item.bestFor, 12),
        notFor: asStringArray(item.notFor, 12),
        pricingNotes: asString(item.pricingNotes) ?? null,
        lastReviewedAt: asString(item.lastReviewedAt) ?? null,
        contentTier: asEnum(item.contentTier, CONTENT_TIER_SET),
      };
    })
    .filter((entry): entry is Exclude<typeof entry, null> => entry !== null)
    .slice(0, 24);

  return alternatives.length > 0 ? alternatives : undefined;
}

function queueIdentity(item: QueueItem): string | null {
  if (typeof item.queueId === "string" && item.queueId.trim().length > 0) {
    return item.queueId.trim();
  }
  if (typeof item.submittedAt === "string" && item.submittedAt.trim().length > 0) {
    return item.submittedAt.trim();
  }
  return null;
}

function loadQueue(): QueueItem[] {
  try {
    const raw = fs.readFileSync(APPROVAL_QUEUE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => asRecord(entry)).filter((entry): entry is QueueItem => Boolean(entry));
  } catch {
    return [];
  }
}

function findQueueItem(itemId: string, kind: QueueItemKind, expectedSlug?: string): QueueItem | null {
  if (!itemId) return null;
  const requestedId = itemId.trim();
  const normalizedSlug = expectedSlug?.trim().toLowerCase();
  if (!requestedId) return null;

  return (
    loadQueue().find((item) => {
      if (item.type !== kind) return false;
      const id = queueIdentity(item);
      if (!id || id !== requestedId) return false;
      if (!normalizedSlug) return true;
      const data = asRecord(item.data);
      const itemSlug = asString(data?.slug)?.toLowerCase();
      return !itemSlug || itemSlug === normalizedSlug;
    }) ?? null
  );
}

export function getQueuedArticlePreview(
  itemId: string,
  expectedSlug?: string
): Article | null {
  const item = findQueueItem(itemId, "blog", expectedSlug);
  if (!item) return null;
  const data = asRecord(item.data);
  if (!data) return null;

  const id = queueIdentity(item) ?? itemId;
  const title = asString(data.title) ?? "Untitled draft article";
  const slug = asString(data.slug) ?? expectedSlug ?? slugify(title);
  const body = Array.isArray(data.body) ? data.body : [];
  const excerpt = asString(data.excerpt) ?? "Draft article preview.";
  const submittedAt = asString(item.submittedAt);

  const heroImageRecord = asRecord(data.heroImage);
  const heroImageAsset = asRecord(heroImageRecord?.asset);
  const heroImage =
    heroImageRecord && heroImageAsset
      ? {
          ...heroImageRecord,
          asset: {
            ...heroImageAsset,
            _ref: asString(heroImageAsset._ref),
            url: asString(heroImageAsset.url),
          },
        }
      : null;

  return {
    _id: `draft.${id}`,
    title,
    slug,
    primaryKeyword: asString(data.primaryKeyword),
    intentStage: asEnum(data.intentStage, ARTICLE_INTENT_STAGE_SET),
    contentTier: asEnum(data.contentTier, CONTENT_TIER_SET),
    lastReviewedAt: asString(data.lastReviewedAt) ?? submittedAt ?? undefined,
    excerpt,
    body,
    heroImage,
    tags: asStringArray(data.tags, 20),
    relatedResources: normalizeArticleRelatedResources(data.relatedResources),
    primaryResource: normalizeArticlePrimaryResource(data.primaryResource),
    sources: normalizeSources(data.sources),
    author: asString(data.author) ?? "The Stash Editorial Team",
    publishedAt: asString(data.publishedAt) ?? submittedAt ?? undefined,
  };
}

export function getQueuedResourcePreview(
  itemId: string,
  expectedSlug?: string
): Resource | null {
  const item = findQueueItem(itemId, "resource", expectedSlug);
  if (!item) return null;
  const data = asRecord(item.data);
  if (!data) return null;

  const id = queueIdentity(item) ?? itemId;
  const title = asString(data.title) ?? asString(data.url) ?? "Untitled draft resource";
  const slug = asString(data.slug) ?? expectedSlug ?? slugify(title);
  const submittedAt = asString(item.submittedAt);

  return {
    _id: `draft.${id}`,
    title,
    slug,
    url: asString(data.url) ?? "#",
    description: asString(data.description) ?? "Draft resource preview.",
    category: asEnum(data.category, RESOURCE_CATEGORY_SET) ?? "development-tools",
    resourceType: asEnum(data.resourceType, RESOURCE_TYPE_SET),
    tags: asStringArray(data.tags, 24),
    featured: Boolean(data.featured),
    createdAt: asString(data.createdAt) ?? submittedAt,
    body: asString(data.body),
    sources: normalizeSources(data.sources),
    alternatives: normalizeResourceAlternatives(data.alternatives),
    bestFor: asStringArray(data.bestFor, 12),
    notFor: asStringArray(data.notFor, 12),
    pricingNotes: asString(data.pricingNotes) ?? null,
    lastReviewedAt: asString(data.lastReviewedAt) ?? submittedAt ?? null,
    contentTier: asEnum(data.contentTier, CONTENT_TIER_SET),
    refreshCadenceDays: asNumber(data.refreshCadenceDays),
    factCheckStatus: asEnum(data.factCheckStatus, FACT_CHECK_SET),
    industries: asStringArray(data.industries, 8).filter((value): value is ResourceIndustry =>
      INDUSTRY_SET.has(value as ResourceIndustry)
    ),
    pricing: asEnum(data.pricing, PRICING_SET),
    useCases: asStringArray(data.useCases, 12).filter((value): value is ResourceUseCase =>
      USE_CASE_SET.has(value as ResourceUseCase)
    ),
    qualityScore: asNumber(data.qualityScore),
    adoptionTier: asEnum(data.adoptionTier, ADOPTION_TIER_SET),
    recommenderBlurb: asString(data.recommenderBlurb) ?? null,
    exampleSites: Array.isArray(data.exampleSites)
      ? data.exampleSites
          .map((entry) => asRecord(entry))
          .filter((entry): entry is Record<string, unknown> => Boolean(entry))
          .map((entry) => {
            const name = asString(entry.name);
            const url = asString(entry.url);
            if (!name) return null;
            return { name, url };
          })
          .filter((entry): entry is Exclude<typeof entry, null> => entry !== null)
          .slice(0, 12)
      : undefined,
    caseStudy: asString(data.caseStudy) ?? null,
  };
}
