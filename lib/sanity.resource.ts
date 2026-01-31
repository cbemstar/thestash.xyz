import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import {
  allResourcesQuery,
  resourceBySlugQuery,
  resourcesByCategoryQuery,
} from "@/lib/sanity.queries";
import { getResourceSlug } from "@/lib/slug";
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
