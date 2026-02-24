import Link from "next/link";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesLiteQuery } from "@/lib/sanity.queries";
import { CATEGORIES } from "@/lib/categories";
import {
  getAllAlternativePageSlugs,
  getAllComparisonPageSlugs,
  inferComparisonTitleFromSlug,
} from "@/lib/seo-pages";
import { getAllUseCasePages } from "@/lib/use-case-pages";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Resource } from "@/types/resource";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/site-url";

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

export const revalidate = 21600; // 6 hr — reduce ISR writes on free plan

export default async function CategoryIndexPage() {
  const resources: Resource[] = isSanityConfigured()
    ? (await sanityClient.fetch<Resource[]>(allResourcesLiteQuery)) ?? []
    : [];

  const counts = CATEGORIES.map((c) => ({
    ...c,
    count: resources.filter((r) => r.category === c.value).length,
  }));
  const topAlternativeSlugs = getAllAlternativePageSlugs().slice(0, 4);
  const topComparisonSlugs = getAllComparisonPageSlugs().slice(0, 4);
  const topUseCases = getAllUseCasePages().slice(0, 4);

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
        <section
          className="mt-6 rounded-2xl border border-border bg-card/30 px-4 py-5 sm:px-6"
          aria-labelledby="seo-hubs"
        >
          <h2 id="seo-hubs" className="font-display text-lg font-semibold text-foreground">
            Compare and alternatives hubs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use these high-intent pages to decide faster.
          </p>
          <div className="mt-4 rounded-xl border border-border/80 bg-muted/25 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Featured
            </p>
            <Link href="/ecosystems/webflow" className="mt-2 inline-flex pill-link">
              Open Webflow ecosystem repository
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Alternatives
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {topAlternativeSlugs.map((slug) => (
                  <li key={slug}>
                    <Link
                      href={`/alternatives/${slug}`}
                      className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                    >
                      {slug.replace(/-/g, " ")} alternatives
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Use cases
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {topUseCases.map((useCase) => (
                  <li key={useCase.slug}>
                    <Link
                      href={`/use-cases/${useCase.slug}`}
                      className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                    >
                      {useCase.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Comparisons
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {topComparisonSlugs.map((slug) => (
                  <li key={slug}>
                    <Link
                      href={`/compare/${slug}`}
                      className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                    >
                      {inferComparisonTitleFromSlug(slug)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Categories">
          {counts.map((c) => (
            <li key={c.value}>
              <Link href={`/category/${c.value}`} className="inline-block">
                <span className="inline-flex min-h-[2.75rem] items-center rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground">
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
