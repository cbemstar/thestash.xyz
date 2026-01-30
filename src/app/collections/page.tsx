import Link from "next/link";
import { getAllCollections } from "@/lib/sanity.collection";
import { getCollectionSlug } from "@/lib/slug";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collections | The Stash",
  description:
    "Curated lists of dev & design resources. Hand-picked tools, inspiration, and links.",
};

export default async function CollectionsIndexPage() {
  const collections = await getAllCollections();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-background/90 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← The Stash
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-zinc-100 sm:text-3xl">
          Collections
        </h1>
        <p className="mt-2 text-zinc-400 max-w-2xl">
          Curated lists of tools and resources. Click a collection to see its
          resources.
        </p>

        {!collections?.length ? (
          <p className="mt-8 text-zinc-500">
            No collections yet. Create one in{" "}
            <Link href="/studio" className="text-accent hover:underline">
              Studio
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Collections">
            {collections.map((c) => {
              const slug = getCollectionSlug(c);
              const count = c.resources?.length ?? 0;
              return (
                <li key={c._id}>
                  <Link
                    href={`/collections/${slug}`}
                    className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-white/15 hover:bg-[var(--card-hover)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                  >
                    <h2 className="font-display font-semibold text-zinc-100">
                      {c.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {c.description}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {count} resource{count !== 1 ? "s" : ""}
                    </p>
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
