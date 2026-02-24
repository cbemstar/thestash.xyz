import type { Metadata } from "next";
import Link from "next/link";

import { buildSitemapEntries } from "@/lib/sitemap-data";

/** Match sitemap-data revalidate (daily). */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "HTML Sitemap | The Stash",
  description:
    "Browse all indexable pages on The Stash in one place. This page updates automatically as new pages are added.",
  alternates: {
    canonical: "/sitemap-index",
  },
};

type SitemapGroup = {
  title: string;
  paths: string[];
};

const GROUP_ORDER: Array<{ title: string; match: (path: string) => boolean }> = [
  { title: "Core", match: (path) => path === "/" || path === "/sitemap-index" || path === "/sitemap.xml" },
  { title: "Collections", match: (path) => path.startsWith("/collections") },
  { title: "Categories", match: (path) => path.startsWith("/category") },
  { title: "Types", match: (path) => path.startsWith("/type") },
  { title: "Tags", match: (path) => path.startsWith("/tags") },
  { title: "Alternatives", match: (path) => path.startsWith("/alternatives") },
  { title: "Comparisons", match: (path) => path.startsWith("/compare") },
  { title: "Use Cases", match: (path) => path.startsWith("/use-cases") },
  { title: "Migrations", match: (path) => path.startsWith("/migrate") },
  { title: "Tools", match: (path) => path.startsWith("/tools") },
  { title: "Blog", match: (path) => path.startsWith("/blog") },
  { title: "Reports", match: (path) => path.startsWith("/reports") },
  { title: "Legal", match: (path) => path.startsWith("/privacy") || path === "/about" },
  { title: "Utility", match: (path) => path.startsWith("/feed.xml") || path.startsWith("/llms") || path === "/submit" || path === "/recommend" || path === "/resume" },
  { title: "Resources", match: (path) => /^\/[^/]+$/.test(path) },
];

function toPathname(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return "/";
  }
}

function buildGroups(paths: string[]): SitemapGroup[] {
  const buckets = new Map<string, string[]>();
  const leftovers: string[] = [];

  for (const path of paths) {
    const group = GROUP_ORDER.find((candidate) => candidate.match(path));
    if (!group) {
      leftovers.push(path);
      continue;
    }
    const existing = buckets.get(group.title) ?? [];
    existing.push(path);
    buckets.set(group.title, existing);
  }

  const orderedGroups = GROUP_ORDER.map((group) => ({
    title: group.title,
    paths: (buckets.get(group.title) ?? []).sort((a, b) => a.localeCompare(b)),
  })).filter((group) => group.paths.length > 0);

  if (leftovers.length > 0) {
    orderedGroups.push({
      title: "Other",
      paths: leftovers.sort((a, b) => a.localeCompare(b)),
    });
  }

  return orderedGroups;
}

export default async function HtmlSitemapPage() {
  const entries = await buildSitemapEntries();
  const paths = [...new Set(entries.map((entry) => toPathname(entry.url)))].sort((a, b) =>
    a.localeCompare(b)
  );
  const groups = buildGroups(paths);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">HTML Sitemap</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
          This page auto-updates from the same data source as <Link className="underline underline-offset-2" href="/sitemap.xml">/sitemap.xml</Link>.
          Total links: {paths.length.toLocaleString()}.
        </p>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <section key={group.title} className="rounded-lg border border-border p-4">
            <h2 className="mb-3 text-base font-semibold">
              {group.title} <span className="text-muted-foreground">({group.paths.length})</span>
            </h2>
            <ul className="space-y-1.5 text-sm">
              {group.paths.map((path) => (
                <li key={path}>
                  <Link href={path} className="text-muted-foreground hover:text-foreground hover:underline">
                    {path}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
