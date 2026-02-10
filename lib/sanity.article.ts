import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allArticlesQuery, articleBySlugQuery } from "@/lib/sanity.queries";
import type { Article } from "@/types/article";

/** All articles ordered by publishedAt/_createdAt desc. */
export async function getAllArticles(): Promise<Article[]> {
  if (!isSanityConfigured()) return [];
  return (await sanityClient.fetch<Article[]>(allArticlesQuery)) ?? [];
}

/** All article slugs for static params. */
export async function getAllArticleSlugs(): Promise<string[]> {
  if (!isSanityConfigured()) return [];
  const articles = await sanityClient.fetch<Article[]>(allArticlesQuery);
  if (!articles?.length) return [];
  const slugs = articles
    .map((a) => (a.slug && typeof a.slug === "string" ? a.slug : ""))
    .filter((s): s is string => Boolean(s));
  return [...new Set(slugs)];
}

/** Single article by slug. */
export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  if (!isSanityConfigured()) return null;
  const bySlug = await sanityClient.fetch<Article | null>(articleBySlugQuery, {
    slug,
  });
  if (bySlug) return bySlug;
  const all = await sanityClient.fetch<Article[]>(allArticlesQuery);
  return all?.find((a) => a.slug === slug) ?? null;
}

