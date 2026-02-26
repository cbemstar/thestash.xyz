import { getAllCollectionSlugs } from "@/lib/sanity.collection";
import { getAllResourceSlugs } from "@/lib/sanity.resource";
import { CATEGORIES } from "@/lib/categories";
import { getAllUseCasePages } from "@/lib/use-case-pages";
import { getAllAlternativePagesData, getAllComparisonPageSlugs } from "@/lib/seo-pages";
import { getAllArticles } from "@/lib/sanity.article";

import { BASE_URL } from "@/lib/site-url";

const RESERVED_SLUGS = ["studio", "api"];

/**
 * Serves /llms.txt per the llms.txt spec (llmstxt.org) for AI crawlers and chatbots
 * (GPT, Gemini, Claude, Perplexity, etc.). Markdown format, curated overview and
 * file lists so LLMs can understand and cite the site without loading full HTML.
 * GEO: stats line adds factual density for AI citation (seo-geo skill).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const [collectionSlugs, resourceSlugs, articles] = await Promise.all([
    getAllCollectionSlugs(),
    getAllResourceSlugs(),
    getAllArticles(),
  ]);
  const useCases = getAllUseCasePages();
  const alternatives = getAllAlternativePagesData();
  const comparisonSlugs = getAllComparisonPageSlugs();

  const resourceCount = resourceSlugs.filter((s) => !RESERVED_SLUGS.includes(s)).length;
  const collectionCount = collectionSlugs.length;
  const categoryCount = CATEGORIES.length;
  const articleCount = articles.length;
  const useCaseCount = useCases.length;
  const alternativesCount = alternatives.length;
  const comparisonCount = comparisonSlugs.length;
  const latestArticles = articles
    .filter((article) => typeof article.slug === "string" && article.slug.length > 0)
    .slice(0, 6);

  const lines: string[] = [
    "# The Stash",
    "",
    "> The Stash is a curated, authoritative directory of design, development, and AI resources. It helps designers and developers discover high-quality tools, inspiration, learning resources, and productivity apps. Content is hand-picked and categorized (design tools, dev tools, AI tools, inspiration, learning, Webflow, and more) with descriptions, use cases, and citations so users and AI systems can quickly assess relevance and trustworthiness.",
    "",
    `The directory includes **${resourceCount}** resources, **${collectionCount}** collections, **${categoryCount}** categories, **${articleCount}** blog guides, **${useCaseCount}** use-case pages, **${alternativesCount}** alternatives hubs, and **${comparisonCount}** comparison pages. Use this file and the linked sections below to route users and agents to canonical URLs quickly.`,
    "",
    "## Browse",
    "",
    `- [Home](${BASE_URL}): Discover all resources and featured collections`,
    `- [Collections](${BASE_URL}/collections): Curated lists (e.g. best design tools, best AI tools)`,
    `- [Categories](${BASE_URL}/category): Browse by category (design tools, development tools, AI tools, inspiration, learning, etc.)`,
    `- [Tags](${BASE_URL}/tags): Filter by tag`,
    `- [By type](${BASE_URL}/type): Filter by resource type (app, website, library, etc.)`,
    `- [Blog](${BASE_URL}/blog): Editorial guides and benchmark refreshes`,
    `- [Use cases](${BASE_URL}/use-cases): Answer-first decision pages`,
    `- [Alternatives](${BASE_URL}/alternatives): Tool alternatives with migration guidance`,
    `- [Comparisons](${BASE_URL}/compare): Head-to-head decision matrices`,
    `- [Reports](${BASE_URL}/reports): Original benchmark datasets and analysis assets`,
    `- [AI coding tools benchmark](${BASE_URL}/reports/ai-coding-tools-benchmark): Weighted tool scoring dataset`,
    `- [AI adoption and trust signals](${BASE_URL}/reports/ai-adoption-trust-signals): Official adoption and trust metrics`,
    `- [SEO and AI-answer discoverability](${BASE_URL}/reports/seo-ai-answer-discoverability): Official AI-search signals and execution framework`,
    `- [Recommend](${BASE_URL}/recommend): Get personalized suggestions`,
    "",
    "## Answer-first snippets",
    "",
    ...useCases.slice(0, 8).map(
      (page) =>
        `- **${page.title}**: ${page.answerFirst} (${BASE_URL}/use-cases/${page.slug})`
    ),
    "",
    "## Latest blog updates",
    "",
    ...latestArticles.map(
      (article) =>
        `- [${article.title}](${BASE_URL}/blog/${article.slug}): ${article.excerpt}`
    ),
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
    `- [robots.txt](${BASE_URL}/robots.txt): Crawler access rules (all bots allowed, no restrictions)`,
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
