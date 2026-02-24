import { MetadataRoute } from "next";

import { buildSitemapEntries } from "@/lib/sitemap-data";

/** Regenerate sitemap daily for fresh URLs while keeping cache stability. */
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries();
}
