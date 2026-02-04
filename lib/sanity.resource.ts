import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import {
  allResourcesQuery,
  resourceBySlugQuery,
  resourcesByCategoryQuery,
  resourcesByTypeQuery,
} from "@/lib/sanity.queries";
import { getResourceSlug } from "@/lib/slug";
import { getResourceTypeLabel } from "@/lib/resource-types";
import type { Resource } from "@/types/resource";
import type { ResourceCategory } from "@/types/resource";

/** Fetch a single resource by URL slug (slug field or title-derived). */
export async function getResourceBySlug(
  slug: string
): Promise<Resource | null> {
  if (!isSanityConfigured()) return null;
  const bySlug = await sanityClient.fetch<Resource | null>(resourceBySlugQuery, {
    slug,
  });
  if (bySlug) return bySlug;
  const all = await sanityClient.fetch<Resource[]>(allResourcesQuery);
  return all?.find((r) => getResourceSlug(r) === slug) ?? null;
}

/** All URL slugs for static generation (slug field or title-derived). */
export async function getAllResourceSlugs(): Promise<string[]> {
  if (!isSanityConfigured()) return [];
  const resources = await sanityClient.fetch<Resource[]>(allResourcesQuery);
  if (!resources?.length) return [];
  const slugs = resources.map((r) => getResourceSlug(r));
  return [...new Set(slugs)];
}

/** Resources that have a specific tag. */
export async function getResourcesByTag(tag: string): Promise<Resource[]> {
  if (!isSanityConfigured()) return [];
  const resources = await sanityClient.fetch<Resource[]>(allResourcesQuery);
  return (resources ?? []).filter(
    (r) => Array.isArray(r.tags) && r.tags.some((t) => String(t).toLowerCase() === tag.toLowerCase())
  );
}

/** All unique tags across all resources. */
export async function getAllTags(): Promise<string[]> {
  if (!isSanityConfigured()) return [];
  const resources = await sanityClient.fetch<Resource[]>(allResourcesQuery);
  const tags = new Set<string>();
  for (const r of resources ?? []) {
    for (const t of r.tags ?? []) {
      if (typeof t === "string" && t.trim()) tags.add(t);
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

/** Resources in the same category, excluding one by _id. For "Similar resources" internal linking. */
export async function getResourcesInCategory(
  category: ResourceCategory,
  excludeId: string,
  limit: number = 6
): Promise<Resource[]> {
  if (!isSanityConfigured()) return [];
  const id = excludeId.replace(/^drafts\./, "");
  return (
    (await sanityClient.fetch<Resource[]>(resourcesByCategoryQuery, {
      category,
      excludeId: id,
      limit,
    })) ?? []
  );
}

/** All resource types that have at least one resource. Returns { value, label, count }. */
export async function getResourceTypesWithCounts(): Promise<
  { value: string; label: string; count: number }[]
> {
  if (!isSanityConfigured()) return [];
  const resources = await sanityClient.fetch<Resource[]>(allResourcesQuery);
  const counts = new Map<string, number>();
  for (const r of resources ?? []) {
    const t = r.resourceType ?? null;
    if (t && typeof t === "string" && t.trim()) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: getResourceTypeLabel(value),
      count,
    }))
    .filter((t) => t.label)
    .sort((a, b) => b.count - a.count);
}

/** All resource type slugs (values) that have at least one resource. For static params. */
export async function getAllResourceTypeSlugs(): Promise<string[]> {
  const withCounts = await getResourceTypesWithCounts();
  return withCounts.map((t) => t.value);
}

/** Resources with a given resourceType (for /type/[slug] pages). */
export async function getResourcesByType(type: string): Promise<Resource[]> {
  if (!isSanityConfigured()) return [];
  return (
    (await sanityClient.fetch<Resource[]>(resourcesByTypeQuery, {
      resourceType: type,
    })) ?? []
  );
}
