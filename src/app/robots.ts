import { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/site-url";

/**
 * Crawl rules:
 * - Keep all indexable content crawlable.
 * - Block non-indexable app surfaces and API routes to avoid crawl waste.
 * - /ads.txt is served via rewrite from /api/ads-txt; crawlers fetch /ads.txt (allowed).
 */
const DISALLOW_PATHS = [
  "/studio/",
  "/api/ads-txt",
  "/api/resources",
  "/api/revalidate-sitemap",
  "/api/submit",
  "/api/subscribe",
  "/saved",
];
const ALLOW_PATH = "/";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "Googlebot-Image", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "Googlebot-News", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "Googlebot-Video", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "AdsBot-Google", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "Bingbot", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "PerplexityBot", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "GPTBot", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "ChatGPT-User", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "ClaudeBot", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "anthropic-ai", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
      { userAgent: "*", allow: ALLOW_PATH, disallow: DISALLOW_PATHS },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
