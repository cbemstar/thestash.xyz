import Link from "next/link";
import { getAllTags } from "@/lib/sanity.resource";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export const metadata: Metadata = {
  title: "Tags | The Stash",
  description: "Browse dev and design resources by tag. Find tools, inspiration, and links by topic.",
  alternates: { canonical: `${BASE_URL}/tags` },
  openGraph: {
    title: "Tags | The Stash",
    url: `${BASE_URL}/tags`,
  },
};

export default async function TagsIndexPage() {
  const tags = await getAllTags();
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Tags", url: `${BASE_URL}/tags` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Tags" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Browse by tag
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Find resources by topic. Click a tag to see all resources with that tag.
        </p>
        {!tags?.length ? (
          <p className="mt-8 text-muted-foreground">
            No tags yet. Resources will appear here as they&apos;re added.
          </p>
        ) : (
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tags">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-block"
                >
                  <span className="inline-flex min-h-[2.75rem] items-center rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground">
                    {tag}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
