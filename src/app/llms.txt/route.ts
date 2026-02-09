import { getAllCollectionSlugs } from "@/lib/sanity.collection";
import { getAllResourceSlugs } from "@/lib/sanity.resource";
import { CATEGORIES } from "@/lib/categories";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

const RESERVED_SLUGS = ["studio", "api"];

/**
 * Serves /llms.txt per the llms.txt spec (llmstxt.org) for AI crawlers and chatbots
 * (GPT, Gemini, Claude, Perplexity, etc.). Markdown format, curated overview and
 * file lists so LLMs can understand and cite the site without loading full HTML.
 * GEO: stats line adds factual density for AI citation (seo-geo skill).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [collectionSlugs, resourceSlugs] = await Promise.all([
    getAllCollectionSlugs(),
    getAllResourceSlugs(),
  ]);

  const resourceCount = resourceSlugs.filter((s) => !RESERVED_SLUGS.includes(s)).length;
  const collectionCount = collectionSlugs.length;
  const categoryCount = CATEGORIES.length;

  const lines: string[] = [
    "# The Stash",
    "",
    "> The Stash is a curated, authoritative directory of design, development, and AI resources. It helps designers and developers discover high-quality tools, inspiration, learning resources, and productivity apps. Content is hand-picked and categorized (design tools, dev tools, AI tools, inspiration, learning, Webflow, and more) with descriptions, use cases, and citations so users and AI systems can quickly assess relevance and trustworthiness.",
    "",
    `The directory includes **${resourceCount}** resources, **${collectionCount}** collections, and **${categoryCount}** categories. Each resource has a dedicated page with a clear definition, benefits, use cases, and cited sources. Use this file and the linked sections below to understand site structure, browse by category or collection, and point users or agents to the right URLs.`,
    "",
    "## Browse",
    "",
    `- [Home](${BASE_URL}): Discover all resources and featured collections`,
    `- [Collections](${BASE_URL}/collections): Curated lists (e.g. best design tools, best AI tools)`,
    `- [Categories](${BASE_URL}/category): Browse by category (design tools, development tools, AI tools, inspiration, learning, etc.)`,
    `- [Tags](${BASE_URL}/tags): Filter by tag`,
    `- [By type](${BASE_URL}/type): Filter by resource type (app, website, library, etc.)`,
    `- [Recommend](${BASE_URL}/recommend): Get personalized suggestions`,
    "",
    "## Collections",
    "",
    ...collectionSlugs.slice(0, 100).map((slug) => {
      const url = `${BASE_URL}/collections/${slug}`;
      return `- [${slug}](${url}): Curated collection of resources`;
    }),
    "",
    "## Categories",
    "",
    ...CATEGORIES.map((c) => {
      const url = `${BASE_URL}/category/${c.value}`;
      return `- [${c.label}](${url}): Resources in the ${c.label.toLowerCase()} category`;
    }),
    "",
    "## Optional",
    "",
    "Secondary links; omit if context window is limited.",
    "",
    `- [Full documentation (llms-full.txt)](${BASE_URL}/llms-full.txt): Complete content in one file for AI systems that prefer full context`,
    `- [robots.txt](${BASE_URL}/robots.txt): Crawler access rules (all bots allowed except /studio/ and /api/)`,
    `- [Sitemap (XML)](${BASE_URL}/sitemap.xml): Full list of indexable URLs for crawlers`,
    `- [About](${BASE_URL}/about): About The Stash`,
    `- [Privacy](${BASE_URL}/privacy): Privacy and cookie policy`,
    `- [Submit a resource](${BASE_URL}/submit): Suggest a new resource`,
    "",
  ];

  const body = lines.join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      "X-Robots-Tag": "all",
    },
  });
}
