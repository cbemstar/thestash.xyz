import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

/** Same allow/disallow for all crawlers. Explicit rules for AI bots per SEO/GEO skill (skills.sh/resciencelab/opc-skills/seo-geo). */
const CRAWL_RULES = {
  allow: "/" as const,
  disallow: ["/studio/", "/api/"] as const,
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...CRAWL_RULES },
      { userAgent: "Googlebot", ...CRAWL_RULES },
      { userAgent: "Bingbot", ...CRAWL_RULES },
      { userAgent: "PerplexityBot", ...CRAWL_RULES },
      { userAgent: "GPTBot", ...CRAWL_RULES },
      { userAgent: "ChatGPT-User", ...CRAWL_RULES },
      { userAgent: "ClaudeBot", ...CRAWL_RULES },
      { userAgent: "anthropic-ai", ...CRAWL_RULES },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
