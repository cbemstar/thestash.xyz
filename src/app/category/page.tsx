import Link from "next/link";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesQuery } from "@/lib/sanity.queries";
import { CATEGORIES } from "@/lib/categories";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Resource } from "@/types/resource";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export const metadata: Metadata = {
  title: "Browse by category | The Stash",
  description:
    "Browse dev and design resources by category: design tools, development, AI, learning, Webflow, Shadcn, HTML, CSS, JavaScript, and more.",
  alternates: { canonical: `${BASE_URL}/category` },
  openGraph: {
    title: "Browse by category | The Stash",
    url: `${BASE_URL}/category`,
  },
};

export const revalidate = 60;

export default async function CategoryIndexPage() {
  const resources: Resource[] = isSanityConfigured()
    ? (await sanityClient.fetch<Resource[]>(allResourcesQuery)) ?? []
    : [];

  const counts = CATEGORIES.map((c) => ({
    ...c,
    count: resources.filter((r) => r.category === c.value).length,
  }));

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Category", url: `${BASE_URL}/category` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Category" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Browse by category
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Find resources by category: design tools, development, AI, learning, Webflow, Shadcn,
          HTML, CSS, JavaScript, and more.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Categories">
          {counts.map((c) => (
            <li key={c.value}>
              <Link href={`/category/${c.value}`} className="inline-block">
                <span className="inline-flex min-h-[44px] items-center rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground">
                  {c.label}
                  <span className="ml-2 text-xs opacity-80">({c.count})</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
