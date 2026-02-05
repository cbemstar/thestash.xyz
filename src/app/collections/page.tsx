import Image from "next/image";
import Link from "next/link";
import { getAllCollections } from "@/lib/sanity.collection";
import { urlFor } from "@/lib/sanity.image";
import { getCollectionSlug } from "@/lib/slug";
import { getCollectionCoverImageUrl } from "@/lib/collection-images";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

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
  const collections = await getAllCollections();
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
          Curated lists of dev and design tools.{" "}
          <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
            See all resources
          </Link>
          {" "}on the homepage or pick a collection below.
        </p>

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
              const count = c.resources?.length ?? 0;
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
