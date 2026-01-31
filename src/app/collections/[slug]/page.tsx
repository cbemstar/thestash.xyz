import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCollectionBySlug, getAllCollectionSlugs, getAllCollections } from "@/lib/sanity.collection";
import { urlFor } from "@/lib/sanity.image";
import { getResourceSlug, getCollectionSlug } from "@/lib/slug";
import { getCollectionCoverImageUrl } from "@/lib/collection-images";
import { ResourceGrid } from "@/components/ResourceGrid";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Collection } from "@/types/collection";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

function CollectionItemListJsonLd({
  collection,
  baseUrl,
  imageUrl,
}: {
  collection: Collection;
  baseUrl: string;
  imageUrl: string | null;
}) {
  const items = (collection.resources ?? []).map((r, i) => ({
    "@type": "ListItem" as const,
    position: i + 1,
    url: `${baseUrl}/${getResourceSlug(r)}`,
    name: r.title,
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: collection.title,
    description: collection.description,
    numberOfItems: items.length,
    ...(imageUrl
      ? {
          image: {
            "@type": "ImageObject" as const,
            url: imageUrl,
            width: 1200,
            height: 630,
          },
        }
      : {}),
    itemListElement: items,
    publisher: {
      "@type": "Organization" as const,
      name: "The Stash",
      url: baseUrl,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function BreadcrumbListJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export async function generateStaticParams() {
  const slugs = await getAllCollectionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Not found" };

  const title = `${collection.title} | Collections | The Stash`;
  const description =
    collection.description ||
    `Curated list: ${collection.title}. ${collection.resources?.length ?? 0} resources.`;
  const canonical = `${BASE_URL}/collections/${slug}`;
  const coverUrl =
    collection.coverImage?.asset?._ref
      ? urlFor(collection.coverImage).width(1200).height(630).url()
      : getCollectionCoverImageUrl(slug);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Stash",
      type: "website",
      images: [{ url: coverUrl, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [coverUrl] },
    robots: { index: true, follow: true },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [collection, allCollections] = await Promise.all([
    getCollectionBySlug(slug),
    getAllCollections(),
  ]);
  if (!collection) notFound();

  const resources = collection.resources ?? [];
  const moreCollections = (allCollections ?? [])
    .filter((c) => getCollectionSlug(c) !== slug)
    .slice(0, 3);

  const coverUrl =
    collection.coverImage?.asset?._ref
      ? urlFor(collection.coverImage).width(1200).height(630).url()
      : getCollectionCoverImageUrl(slug);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Collections", url: `${BASE_URL}/collections` },
    { name: collection.title, url: `${BASE_URL}/collections/${slug}` },
  ];

  return (
    <>
      <CollectionItemListJsonLd
        collection={collection}
        baseUrl={BASE_URL}
        imageUrl={coverUrl}
      />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-background/90 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: "Collections", href: "/collections" },
              { label: collection.title },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-white/5 aspect-[1200/400] max-h-[280px] sm:aspect-[1200/350] sm:max-h-[320px]">
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1152px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <h1 className="font-display text-2xl font-bold text-zinc-100 sm:text-3xl drop-shadow-sm">
              {collection.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:text-base drop-shadow-sm">
              {collection.description}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {resources.length} resource{resources.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ResourceGrid resources={resources} />

        {moreCollections.length > 0 && (
          <section className="mt-12 pt-10 border-t border-[var(--border)]" aria-labelledby="more-collections">
            <h2 id="more-collections" className="font-display text-lg font-semibold text-zinc-100 mb-3">
              More collections
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              Explore other curated lists.
            </p>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moreCollections.map((c) => {
                const cSlug = getCollectionSlug(c);
                const count = c.resources?.length ?? 0;
                const moreCoverUrl = c.coverImage?.asset?._ref
                  ? urlFor(c.coverImage).width(400).height(200).url()
                  : getCollectionCoverImageUrl(cSlug);
                return (
                  <li key={c._id}>
                    <Link
                      href={`/collections/${cSlug}`}
                      className="block overflow-hidden rounded-xl border border-white/20 bg-white/5 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                    >
                      <div className="relative aspect-[400/180] w-full bg-white/5">
                        <Image
                          src={moreCoverUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized={moreCoverUrl.includes("unsplash.com")}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      </div>
                      <div className="px-4 py-3">
                        <span className="block truncate font-medium text-zinc-300">{c.title}</span>
                        <span className="mt-0.5 block text-xs text-zinc-500">
                          {count} resource{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
    </>
  );
}
