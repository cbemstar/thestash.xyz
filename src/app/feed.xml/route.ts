import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesQuery } from "@/lib/sanity.queries";
import { getResourceSlug } from "@/lib/slug";
import type { Resource } from "@/types/resource";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const resources: Resource[] = isSanityConfigured()
    ? (await sanityClient.fetch<Resource[]>(allResourcesQuery)) ?? []
    : [];

  const items = resources
    .slice(0, 50)
    .map((r) => {
      const slug = getResourceSlug(r);
      const url = `${BASE_URL}/${slug}`;
      const date = r.createdAt ? new Date(r.createdAt).toUTCString() : new Date().toUTCString();
      const title = escapeXml(r.title);
      const description = escapeXml(r.description);
      return `<item>
  <title>${title}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <description>${description}</description>
  <pubDate>${date}</pubDate>
</item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Stash - Dev &amp; Design Resources</title>
    <link>${BASE_URL}</link>
    <description>Curated directory of dev and design resources: tools, inspiration, courses, AI tools, and links.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
