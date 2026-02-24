import type { ResourceCategory } from "@/types/resource";

/**
 * Map resource category to the primary collection slug for internal linking (hub-and-spoke).
 * Used on resource pages for "More in [Category]" to link to the category collection.
 */
export const CATEGORY_TO_COLLECTION_SLUG: Partial<Record<ResourceCategory, string>> = {
  "design-tools": "best-design-tools",
  "development-tools": "best-development-tools",
  "ai-tools": "ai-tools",
  "learning-resources": "learning-resources",
  "productivity": "productivity-tools",
  "webflow": "webflow",
  "shadcn": "shadcn",
  "coding": "coding",
  "github": "github",
  "html": "html",
  "css": "css",
  "javascript": "javascript",
  "languages": "languages",
};

export function getCollectionSlugForCategory(category: ResourceCategory): string | null {
  return CATEGORY_TO_COLLECTION_SLUG[category] ?? null;
}

/**
 * Reverse mapping: collection slug → category for showing directory-wide resource counts.
 * When a collection maps to a category, we show the count of all resources in that category
 * instead of only the curated resources in the collection.
 */
export const COLLECTION_SLUG_TO_CATEGORY: Partial<Record<string, ResourceCategory>> = {
  "best-design-tools": "design-tools",
  "best-development-tools": "development-tools",
  "ai-tools": "ai-tools",
  "learning-resources": "learning-resources",
  "productivity-tools": "productivity",
  "ui-components": "ui-ux-resources",
  webflow: "webflow",
  shadcn: "shadcn",
  coding: "coding",
  github: "github",
  html: "html",
  css: "css",
  javascript: "javascript",
  languages: "languages",
};
