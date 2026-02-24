import { MetadataRoute } from "next";

import { CATEGORIES } from "@/lib/categories";
import { getAllMigrationSlugs } from "@/lib/migration-pages";
import {
  getAllAlternativePageSlugs,
  getAllComparisonPageSlugs,
} from "@/lib/seo-pages";
import { getAllToolSlugs } from "@/lib/tools-catalog";
import { BASE_URL } from "@/lib/site-url";
import { getAllArticleSlugs } from "@/lib/sanity.article";
import { getAllCollectionSlugs } from "@/lib/sanity.collection";
import { getAllComparisonSlugs } from "@/lib/sanity.comparison";
import {
  getAllAlternativeResourceSlugs,
  getAllResourceSlugs,
  getAllTags,
  getResourceTypesWithCounts,
} from "@/lib/sanity.resource";
import { getAllUseCaseSlugs } from "@/lib/use-case-pages";
import { getAllWebflowHubResourceIds } from "@/lib/webflow-hub-data";

export const SITEMAP_REVALIDATE_SECONDS = 86400;

const SOURCE_TIMEOUT_MS = 4500;
const MAX_SITEMAP_URLS = 50_000;
const RESERVED_RESOURCE_SLUGS = new Set(["studio", "api"]);

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed) return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

function encodeSlugPath(slug: string): string {
  return slug
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function createEntry(
  pathname: string,
  generatedAt: Date,
  changeFrequency: ChangeFrequency,
  priority: number
): SitemapEntry {
  return {
    url: new URL(normalizePathname(pathname), BASE_URL).toString(),
    lastModified: generatedAt,
    changeFrequency,
    priority,
  };
}

function createEntriesFromSlugs(
  slugs: string[],
  prefixPath: string,
  generatedAt: Date,
  changeFrequency: ChangeFrequency,
  priority: number
): MetadataRoute.Sitemap {
  const prefix = normalizePathname(prefixPath);
  return slugs
    .map((slug) => slug.trim())
    .filter(Boolean)
    .map((slug) => {
      const encodedSlug = encodeSlugPath(slug);
      const pathname = prefix === "/" ? `/${encodedSlug}` : `${prefix}/${encodedSlug}`;
      return createEntry(pathname, generatedAt, changeFrequency, priority);
    });
}

function toEpochMs(value: SitemapEntry["lastModified"]): number {
  if (!value) return 0;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function dedupeEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const deduped = new Map<string, SitemapEntry>();
  for (const entry of entries) {
    const existing = deduped.get(entry.url);
    if (!existing) {
      deduped.set(entry.url, entry);
      continue;
    }

    deduped.set(entry.url, {
      ...existing,
      lastModified:
        toEpochMs(entry.lastModified) > toEpochMs(existing.lastModified)
          ? entry.lastModified
          : existing.lastModified,
      priority: Math.max(existing.priority ?? 0, entry.priority ?? 0),
      changeFrequency: existing.changeFrequency ?? entry.changeFrequency,
    });
  }
  return [...deduped.values()];
}

async function withTimeout<T>(
  label: string,
  action: () => Promise<T>,
  timeoutMs: number = SOURCE_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`[sitemap] timed out loading ${label} after ${timeoutMs}ms`));
    }, timeoutMs);

    action()
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function withFallback<T>(
  label: string,
  action: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await withTimeout(label, action);
  } catch (error) {
    // Keep sitemap endpoint healthy even if an upstream datasource fails.
    console.warn(`[sitemap] failed to load ${label}; using fallback`, error);
    return fallback;
  }
}

function withSyncFallback<T>(label: string, action: () => T, fallback: T): T {
  try {
    return action();
  } catch (error) {
    console.warn(`[sitemap] failed to load ${label}; using fallback`, error);
    return fallback;
  }
}

export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();

  const [
    resourceSlugs,
    collectionSlugs,
    tags,
    typeSlugs,
    articleSlugs,
    cmsAlternativeSlugs,
    cmsComparisonSlugs,
    useCaseSlugs,
  ] = await Promise.all([
    withFallback("resource slugs", getAllResourceSlugs, [] as string[]),
    withFallback("collection slugs", getAllCollectionSlugs, [] as string[]),
    withFallback("tags", getAllTags, [] as string[]),
    withFallback(
      "resource type slugs",
      () => getResourceTypesWithCounts().then((types) => types.map((item) => item.value)),
      [] as string[]
    ),
    withFallback("article slugs", getAllArticleSlugs, [] as string[]),
    withFallback("cms alternative slugs", getAllAlternativeResourceSlugs, [] as string[]),
    withFallback("cms comparison slugs", getAllComparisonSlugs, [] as string[]),
    withFallback("use-case slugs", async () => getAllUseCaseSlugs(), [] as string[]),
  ]);

  const filteredResourceSlugs = resourceSlugs.filter(
    (slug) => !RESERVED_RESOURCE_SLUGS.has(slug)
  );

  const staticAlternativePageSlugs = withSyncFallback(
    "static alternative page slugs",
    getAllAlternativePageSlugs,
    [] as string[]
  );
  const alternativeSlugs = [
    ...new Set([...staticAlternativePageSlugs, ...(cmsAlternativeSlugs ?? [])]),
  ];

  const staticComparisonPageSlugs = withSyncFallback(
    "static comparison page slugs",
    getAllComparisonPageSlugs,
    [] as string[]
  );
  const comparisonSlugs = [
    ...new Set([...staticComparisonPageSlugs, ...(cmsComparisonSlugs ?? [])]),
  ];

  const migrationSlugs = withSyncFallback(
    "migration slugs",
    getAllMigrationSlugs,
    [] as string[]
  );
  const toolSlugs = withSyncFallback("tool slugs", getAllToolSlugs, [] as string[]);

  const staticUrls: MetadataRoute.Sitemap = [
    createEntry("/", generatedAt, "daily", 1),
    createEntry("/sitemap-index", generatedAt, "weekly", 0.7),
    createEntry("/llms.txt", generatedAt, "daily", 0.9),
    createEntry("/llms-full.txt", generatedAt, "daily", 0.9),
    createEntry("/collections", generatedAt, "weekly", 0.9),
    createEntry("/alternatives", generatedAt, "weekly", 0.8),
    createEntry("/tags", generatedAt, "weekly", 0.9),
    createEntry("/recommend", generatedAt, "weekly", 0.9),
    createEntry("/type", generatedAt, "weekly", 0.9),
    createEntry("/category", generatedAt, "weekly", 0.9),
    createEntry("/blog", generatedAt, "weekly", 0.9),
    createEntry("/compare", generatedAt, "weekly", 0.8),
    createEntry("/reports", generatedAt, "weekly", 0.75),
    createEntry("/reports/ai-coding-tools-benchmark", generatedAt, "weekly", 0.8),
    createEntry("/reports/ai-adoption-trust-signals", generatedAt, "weekly", 0.78),
    createEntry(
      "/reports/seo-ai-answer-discoverability",
      generatedAt,
      "weekly",
      0.78
    ),
    createEntry("/use-cases", generatedAt, "weekly", 0.8),
    createEntry("/migrate", generatedAt, "weekly", 0.8),
    createEntry("/tools", generatedAt, "weekly", 0.82),
    createEntry("/decision-center", generatedAt, "weekly", 0.78),
    createEntry("/ecosystems", generatedAt, "weekly", 0.78),
    createEntry("/ecosystems/webflow", generatedAt, "weekly", 0.8),
    createEntry("/about", generatedAt, "monthly", 0.6),
    createEntry("/privacy", generatedAt, "monthly", 0.5),
    createEntry("/submit", generatedAt, "monthly", 0.7),
    createEntry("/feed.xml", generatedAt, "daily", 0.8),
    createEntry("/resume", generatedAt, "monthly", 0.5),
    createEntry("/privacy/settings", generatedAt, "monthly", 0.4),
  ];

  const allUrls = dedupeEntries([
    ...staticUrls,
    ...createEntriesFromSlugs(
      CATEGORIES.map((category) => category.value),
      "/category",
      generatedAt,
      "weekly",
      0.8
    ),
    ...createEntriesFromSlugs(collectionSlugs, "/collections", generatedAt, "weekly", 0.8),
    ...createEntriesFromSlugs(tags, "/tags", generatedAt, "weekly", 0.7),
    ...createEntriesFromSlugs(typeSlugs, "/type", generatedAt, "weekly", 0.7),
    ...createEntriesFromSlugs(articleSlugs, "/blog", generatedAt, "weekly", 0.7),
    ...createEntriesFromSlugs(alternativeSlugs, "/alternatives", generatedAt, "weekly", 0.75),
    ...createEntriesFromSlugs(comparisonSlugs, "/compare", generatedAt, "weekly", 0.8),
    ...createEntriesFromSlugs(useCaseSlugs, "/use-cases", generatedAt, "weekly", 0.75),
    ...createEntriesFromSlugs(migrationSlugs, "/migrate", generatedAt, "weekly", 0.75),
    ...createEntriesFromSlugs(toolSlugs, "/tools", generatedAt, "weekly", 0.76),
    ...createEntriesFromSlugs(
      getAllWebflowHubResourceIds(),
      "/ecosystems/webflow",
      generatedAt,
      "weekly",
      0.72
    ),
    ...createEntriesFromSlugs(filteredResourceSlugs, "/", generatedAt, "weekly", 0.8),
  ]);

  if (allUrls.length > MAX_SITEMAP_URLS) {
    console.warn(
      `[sitemap] URL count ${allUrls.length} exceeds limit ${MAX_SITEMAP_URLS}; truncating output`
    );
    return allUrls.slice(0, MAX_SITEMAP_URLS);
  }

  return allUrls;
}
