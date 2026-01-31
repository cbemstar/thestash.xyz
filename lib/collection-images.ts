/**
 * Fallback cover image URLs for collection pages when Sanity coverImage is not set.
 * Themed, high-quality images for aesthetic appeal. Uses Unsplash Source (attribution-friendly).
 * Keyed by collection slug.
 */
const COVER_IMAGES_BY_SLUG: Record<string, string> = {
  "best-design-tools":
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80&fit=crop",
  "best-development-tools":
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&fit=crop",
  "ai-tools":
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80&fit=crop",
  "productivity-tools":
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=80&fit=crop",
  "learning-resources":
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80&fit=crop",
  "ui-components":
    "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&q=80&fit=crop",
};

/** Default cover when slug has no themed image (abstract gradient / workspace). */
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80&fit=crop";

/**
 * Returns a cover image URL for a collection page.
 * Use when Sanity coverImage is not set to give the page visual appeal.
 */
export function getCollectionCoverImageUrl(slug: string): string {
  return COVER_IMAGES_BY_SLUG[slug] ?? DEFAULT_COVER;
}
