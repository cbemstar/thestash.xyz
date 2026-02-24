import { getAllCollections } from "@/lib/sanity.collection";
import { getAllArticles } from "@/lib/sanity.article";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { resourcesTitlesSlugsQuery } from "@/lib/sanity.queries";
import { getCollectionSlug, slugify } from "@/lib/slug";
import { CATEGORIES } from "@/lib/categories";
import { getAllAlternativePagesData, getAllComparisonPagesData } from "@/lib/seo-pages";
import { getAllUseCasePages } from "@/lib/use-case-pages";

import { BASE_URL } from "@/lib/site-url";

const RESERVED_SLUGS = ["studio", "api"];

/**
 * Serves /llms-full.txt per the llms.txt spec (llmstxt.org / llms-txt.io).
 * Contains the complete content in one file so LLMs have full context without
 * following links. Complements llms.txt (navigation) with consolidated content.
 * See: https://llms-txt.io/blog/llms-txt-and-llms-full-txt
 */
export const dynamic = "force-dynamic";

type ResourceTitleSlug = { title: string; slug?: string | null };

function formatDate(dateLike?: string | null): string {
  if (!dateLike) return "unknown";
  const timestamp = Date.parse(dateLike);
  if (Number.isNaN(timestamp)) return "unknown";
  return new Date(timestamp).toISOString().slice(0, 10);
}

function short(text: string, max: number = 190): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export async function GET() {
  const [collections, resourcesRaw, articles] = await Promise.all([
    isSanityConfigured() ? getAllCollections() : Promise.resolve([]),
    isSanityConfigured()
      ? sanityClient.fetch<ResourceTitleSlug[]>(resourcesTitlesSlugsQuery)
      : Promise.resolve([]),
    getAllArticles(),
  ]);
  const alternatives = getAllAlternativePagesData();
  const comparisons = getAllComparisonPagesData();
  const useCases = getAllUseCasePages();

  const resources = (resourcesRaw ?? [])
    .map((r) => ({
      title: r.title,
      slug: (r.slug && /^[a-z0-9-]+$/.test(r.slug) ? r.slug : slugify(r.title)) as string,
    }))
    .filter((r) => !RESERVED_SLUGS.includes(r.slug));

  const resourceCount = resources.length;
  const collectionCount = collections.length;
  const categoryCount = CATEGORIES.length;
  const articleCount = articles.length;
  const alternativesCount = alternatives.length;
  const comparisonCount = comparisons.length;
  const useCaseCount = useCases.length;

  const lines: string[] = [
    "# The Stash — Full documentation",
    "",
    "The Stash is a curated, authoritative directory of design, development, and AI resources. It helps designers and developers discover high-quality tools, inspiration, learning resources, and productivity apps. Content is hand-picked and categorized (design tools, dev tools, AI tools, inspiration, learning, Webflow, and more) with descriptions, use cases, and citations so users and AI systems can quickly assess relevance and trustworthiness.",
    "",
    "The directory includes " + resourceCount + " resources, " + collectionCount + " collections, and " + categoryCount + " categories. It also includes " + articleCount + " blog guides, " + useCaseCount + " use-case pages, " + alternativesCount + " alternatives hubs, and " + comparisonCount + " comparison pages. This file contains full navigation plus answer-first snippets for AI systems that prefer one consolidated context source.",
    "",
    "For a shorter navigation-only overview with links, see [llms.txt](" + BASE_URL + "/llms.txt).",
    "",
    "---",
    "",
    "## Browse (main entry points)",
    "",
    "- **Home** " + BASE_URL + " — Discover all resources and featured collections.",
    "- **Collections** " + BASE_URL + "/collections — Curated lists (e.g. best design tools, best AI tools).",
    "- **Categories** " + BASE_URL + "/category — Browse by category (design tools, development tools, AI tools, inspiration, learning, etc.).",
    "- **Tags** " + BASE_URL + "/tags — Filter by tag.",
    "- **By type** " + BASE_URL + "/type — Filter by resource type (app, website, library, etc.).",
    "- **Blog** " + BASE_URL + "/blog — Editorial guides and benchmark updates.",
    "- **Use cases** " + BASE_URL + "/use-cases — High-intent decision pages with answer-first guidance.",
    "- **Alternatives** " + BASE_URL + "/alternatives — Tool alternatives hubs with migration checklists.",
    "- **Comparisons** " + BASE_URL + "/compare — Head-to-head decision matrices.",
    "- **Reports** " + BASE_URL + "/reports — Original benchmark datasets and analysis assets.",
    "- **AI coding tools benchmark** " + BASE_URL + "/reports/ai-coding-tools-benchmark — Weighted tool scoring dataset.",
    "- **AI adoption and trust signals** " + BASE_URL + "/reports/ai-adoption-trust-signals — Official adoption and trust metrics.",
    "- **SEO and AI-answer discoverability** " + BASE_URL + "/reports/seo-ai-answer-discoverability — Official AI-search signals and discoverability actions.",
    "- **Recommend** " + BASE_URL + "/recommend — Get personalized suggestions.",
    "",
    "---",
    "",
    "## Answer-first snippets (decision intent)",
    "",
    ...useCases.slice(0, 16).map((page) =>
      "- **" +
      page.title +
      "** — " +
      short(page.answerFirst, 180) +
      " (" +
      BASE_URL +
      "/use-cases/" +
      page.slug +
      ")"
    ),
    "",
    "---",
    "",
    "## Collections (full list)",
    "",
    ...collections.map((c) => {
      const slug = getCollectionSlug(c);
      const url = BASE_URL + "/collections/" + slug;
      const desc = (c.description || "").trim();
      return "### " + c.title + "\n\n" + (desc ? desc + "\n\n" : "") + "URL: " + url + "\n";
    }),
    "---",
    "",
    "## Categories (full list)",
    "",
    ...CATEGORIES.map((c) => {
      const url = BASE_URL + "/category/" + c.value;
      return "- **" + c.label + "** — " + url + " — Resources in the " + c.label.toLowerCase() + " category.";
    }),
    "",
    "---",
    "",
    "## Use cases (full list)",
    "",
    ...useCases.map((page) =>
      "- **" +
      page.title +
      "** — " +
      BASE_URL +
      "/use-cases/" +
      page.slug +
      " — " +
      short(page.description, 170)
    ),
    "",
    "---",
    "",
    "## Alternatives (full list)",
    "",
    ...alternatives.map((page) =>
      "- **" +
      page.tool.title +
      " alternatives** — " +
      BASE_URL +
      "/alternatives/" +
      page.slug +
      " — " +
      short(page.summary, 170)
    ),
    "",
    "---",
    "",
    "## Comparisons (full list)",
    "",
    ...comparisons.map((page) =>
      "- **" +
      page.title +
      "** — " +
      BASE_URL +
      "/compare/" +
      page.slug +
      " — " +
      short(page.summary, 170)
    ),
    "",
    "---",
    "",
    "## Blog index",
    "",
    ...articles
      .filter((article) => typeof article.slug === "string" && article.slug.length > 0)
      .map((article) =>
        "- **" +
        article.title +
        "** — " +
        BASE_URL +
        "/blog/" +
        article.slug +
        " — " +
        short(article.excerpt || "", 170) +
        " (reviewed: " +
        formatDate(article.lastReviewedAt ?? article.publishedAt ?? null) +
        ")"
      ),
    "",
    "---",
    "",
    "## Resources (full list)",
    "",
    "Each resource has a dedicated page with definition, benefits, use cases, and sources.",
    "",
    ...resources.map((r) => "- " + r.title + " — " + BASE_URL + "/" + r.slug),
    "",
    "---",
    "",
    "## About",
    "",
    "The Stash is a curated directory of dev and design resources: tools, inspiration, courses, AI tools, and links hand-picked for developers and designers. Resources are organized by category and into collections. You can browse by category, filter by type or tags, search, and submit your own resources. RSS feed and email updates are available.",
    "",
    "About page: " + BASE_URL + "/about",
    "",
    "---",
    "",
    "## Privacy and legal",
    "",
    "Privacy policy covers data collection, cookies, third-party advertising (Google AdSense), and user choices. Cookie consent and preferences can be managed via the footer link or " + BASE_URL + "/privacy/settings.",
    "",
    "Privacy policy: " + BASE_URL + "/privacy",
    "",
    "---",
    "",
    "## Optional links",
    "",
    "- robots.txt: " + BASE_URL + "/robots.txt",
    "- Sitemap (XML): " + BASE_URL + "/sitemap.xml",
    "- Submit a resource: " + BASE_URL + "/submit",
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
