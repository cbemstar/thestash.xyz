import { MetadataRoute } from "next";
import { getAllResourceSlugs } from "@/lib/sanity.resource";
import { getAllCollectionSlugs } from "@/lib/sanity.collection";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [resourceSlugs, collectionSlugs] = await Promise.all([
    getAllResourceSlugs(),
    getAllCollectionSlugs(),
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

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...collectionUrls,
    ...resourceUrls,
  ];
}
