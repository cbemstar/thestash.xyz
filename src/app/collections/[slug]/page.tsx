import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionBySlug, getAllCollectionSlugs } from "@/lib/sanity.collection";
import { ResourceGrid } from "@/components/ResourceGrid";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

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
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const resources = collection.resources ?? [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-background/90 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <Link
            href="/collections"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Collections
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-zinc-100 sm:text-3xl">
            {collection.title}
          </h1>
          <p className="mt-2 text-zinc-400 leading-relaxed max-w-2xl">
            {collection.description}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {resources.length} resource{resources.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ResourceGrid resources={resources} />
      </main>
    </div>
  );
}
