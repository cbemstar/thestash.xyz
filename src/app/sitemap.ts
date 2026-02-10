import { MetadataRoute } from "next";
import {
  getAllResourceSlugs,
  getAllTags,
  getResourceTypesWithCounts,
} from "@/lib/sanity.resource";
import { getAllCollectionSlugs } from "@/lib/sanity.collection";
import { getAllArticleSlugs } from "@/lib/sanity.article";
import { CATEGORIES } from "@/lib/categories";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

/** Always generate sitemap from live Sanity data; no static cache. Optimal for Search Console and AI crawlers. */
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [resourceSlugs, collectionSlugs, tags, typeSlugs, articleSlugs] =
    await Promise.all([
      getAllResourceSlugs(),
      getAllCollectionSlugs(),
      getAllTags(),
      getResourceTypesWithCounts().then((t) => t.map((x) => x.value)),
      getAllArticleSlugs(),
    ]);

  const reserved = ["studio", "api"];
  const filteredResourceSlugs = resourceSlugs.filter((s) => !reserved.includes(s));

  const resourceUrls: MetadataRoute.Sitemap = filteredResourceSlugs.map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const collectionUrls: MetadataRoute.Sitemap = collectionSlugs.map((slug) => ({
    url: `${BASE_URL}/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const tagUrls: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${BASE_URL}/tags/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const typeUrls: MetadataRoute.Sitemap = typeSlugs.map((slug) => ({
    url: `${BASE_URL}/type/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const articleUrls: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE_URL}/category/${c.value}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/llms.txt`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/llms-full.txt`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tags`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/recommend`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/type`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/category`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    ...categoryUrls,
    ...collectionUrls,
    ...tagUrls,
    ...typeUrls,
    ...articleUrls,
    ...resourceUrls,
  ];
}
