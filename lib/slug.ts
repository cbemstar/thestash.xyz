/**
 * Generate a URL-safe slug from a string (e.g. title).
 * Used when a resource has no slug set in Sanity.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "resource";
}

/**
 * Resolve the public path slug for a resource (slug field or derived from title).
 */
export function getResourceSlug(resource: { slug?: string | null; title: string }): string {
  if (resource.slug && /^[a-z0-9-]+$/.test(resource.slug)) return resource.slug;
  return slugify(resource.title);
}

/**
 * Resolve the public path slug for a collection (slug field or derived from title).
 */
export function getCollectionSlug(collection: { slug?: string | null; title: string }): string {
  if (collection.slug && /^[a-z0-9-]+$/.test(collection.slug)) return collection.slug;
  return slugify(collection.title);
}
