import { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/site-url";

/**
 * Crawl rules: allow all bots, allow everything. No restrictions.
 * Sitemap and sitemap-index explicitly allowed for all crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/sitemap.xml", "/sitemap-index", "/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
