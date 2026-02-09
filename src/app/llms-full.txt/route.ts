import { getAllCollections } from "@/lib/sanity.collection";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { resourcesTitlesSlugsQuery } from "@/lib/sanity.queries";
import { getCollectionSlug, slugify } from "@/lib/slug";
import { CATEGORIES } from "@/lib/categories";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

const RESERVED_SLUGS = ["studio", "api"];

/**
 * Serves /llms-full.txt per the llms.txt spec (llmstxt.org / llms-txt.io).
 * Contains the complete content in one file so LLMs have full context without
 * following links. Complements llms.txt (navigation) with consolidated content.
 * See: https://llms-txt.io/blog/llms-txt-and-llms-full-txt
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResourceTitleSlug = { title: string; slug?: string | null };

export async function GET() {
  const collections = isSanityConfigured()
    ? await getAllCollections()
    : [];
  const resourcesRaw: ResourceTitleSlug[] = isSanityConfigured()
    ? (await sanityClient.fetch<ResourceTitleSlug[]>(resourcesTitlesSlugsQuery)) ?? []
    : [];

  const resources = resourcesRaw
    .map((r) => ({
      title: r.title,
      slug: (r.slug && /^[a-z0-9-]+$/.test(r.slug) ? r.slug : slugify(r.title)) as string,
    }))
    .filter((r) => !RESERVED_SLUGS.includes(r.slug));

  const resourceCount = resources.length;
  const collectionCount = collections.length;
  const categoryCount = CATEGORIES.length;

  const lines: string[] = [
    "# The Stash — Full documentation",
    "",
    "The Stash is a curated, authoritative directory of design, development, and AI resources. It helps designers and developers discover high-quality tools, inspiration, learning resources, and productivity apps. Content is hand-picked and categorized (design tools, dev tools, AI tools, inspiration, learning, Webflow, and more) with descriptions, use cases, and citations so users and AI systems can quickly assess relevance and trustworthiness.",
    "",
    "The directory includes " + resourceCount + " resources, " + collectionCount + " collections, and " + categoryCount + " categories. Each resource has a dedicated page with a clear definition, benefits, use cases, and cited sources. This file contains the complete structure and resource list in one place for AI systems that prefer full context.",
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
    "- **Recommend** " + BASE_URL + "/recommend — Get personalized suggestions.",
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
