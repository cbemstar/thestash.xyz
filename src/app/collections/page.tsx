import Image from "next/image";
import Link from "next/link";
import { getAllCollections } from "@/lib/sanity.collection";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import {
  totalResourceCountQuery,
  resourceCountsByCategoryQuery,
} from "@/lib/sanity.queries";
import { COLLECTION_SLUG_TO_CATEGORY } from "@/lib/collections-seo";
import { urlFor } from "@/lib/sanity.image";
import { getCollectionSlug } from "@/lib/slug";
import { getCollectionCoverImageUrl } from "@/lib/collection-images";
import {
  getAllAlternativePageSlugs,
  getAllComparisonPageSlugs,
  inferComparisonTitleFromSlug,
} from "@/lib/seo-pages";
import { getAllUseCasePages } from "@/lib/use-case-pages";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Collections | The Stash",
  description:
    "Curated lists of dev & design resources. Hand-picked tools, inspiration, and links.",
  alternates: { canonical: `${BASE_URL}/collections` },
  openGraph: {
    title: "Collections | The Stash",
    url: `${BASE_URL}/collections`,
  },
};

export default async function CollectionsIndexPage() {
  const [collections, totalResources, categoryCounts] = await Promise.all([
    getAllCollections(),
    isSanityConfigured()
      ? (sanityClient.fetch<number>(totalResourceCountQuery) ?? 0)
      : 0,
    isSanityConfigured()
      ? (sanityClient.fetch<Record<string, number>>(
          resourceCountsByCategoryQuery
        ) ?? ({} as Record<string, number>))
      : ({} as Record<string, number>),
  ]);
  const topAlternativeSlugs = getAllAlternativePageSlugs().slice(0, 6);
  const topComparisonSlugs = getAllComparisonPageSlugs().slice(0, 6);
  const topUseCases = getAllUseCasePages().slice(0, 6);
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Collections", url: `${BASE_URL}/collections` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Collections" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Collections
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          {totalResources > 0 ? (
            <>
              <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                {totalResources.toLocaleString()} resources
              </Link>
              {" "}in the directory. Pick a collection below or browse all.
            </>
          ) : (
            <>
              Curated lists of dev and design tools.{" "}
              <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                See all resources
              </Link>
              {" "}on the homepage or pick a collection below.
            </>
          )}
        </p>

        <section
          className="mt-6 rounded-2xl border border-border bg-card/30 px-4 py-5 sm:px-6"
          aria-labelledby="decision-guides"
        >
          <h2 id="decision-guides" className="font-display text-lg font-semibold text-foreground">
            Decision guides
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare tools and evaluate alternatives before choosing your stack.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
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

        {!collections?.length ? (
          <p className="mt-8 text-muted-foreground">
            No collections yet.{" "}
            <Link href="/submit" className="text-accent hover:underline">
              Submit a resource
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Collections">
            {collections.map((c) => {
              const slug = getCollectionSlug(c);
              const category = COLLECTION_SLUG_TO_CATEGORY[slug];
              const count =
                category && categoryCounts[category] != null
                  ? categoryCounts[category]!
                  : c.resourceCount ?? c.resources?.length ?? 0;
              const coverUrl = c.coverImage?.asset?._ref
                ? urlFor(c.coverImage).width(400).height(240).url()
                : getCollectionCoverImageUrl(slug);
              return (
                <li key={c._id}>
                  <Link
                    href={`/collections/${slug}`}
                    className="block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/20 hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  >
                    <div className="relative aspect-[400/200] w-full bg-muted/50">
                      <Image
                        src={coverUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={coverUrl.includes("unsplash.com")}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent" />
                    </div>
                    <div className="p-5">
                      <h2 className="font-display font-semibold text-foreground">
                        {c.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {c.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {count} resource{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
