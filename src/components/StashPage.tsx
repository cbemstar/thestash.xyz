"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { FilterBar } from "./FilterBar";
import { ResourceGrid } from "./ResourceGrid";
import { getCollectionSlug } from "@/lib/slug";
import type { Resource } from "@/types/resource";
import type { ResourceCategory } from "@/types/resource";
import type { Collection } from "@/types/collection";

interface StashPageProps {
  resources: Resource[];
  collections: Collection[];
}

function filterResources(
  resources: Resource[],
  category: ResourceCategory | "all",
  query: string
): Resource[] {
  const q = query.trim().toLowerCase();
  const byCategory =
    category === "all"
      ? resources
      : resources.filter((r) => r.category === category);
  if (!q) return byCategory;
  return byCategory.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
  );
}

export function StashPage({ resources, collections }: StashPageProps) {
  const [category, setCategory] = useState<ResourceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => filterResources(resources, category, search),
    [resources, category, search]
  );

  const handleSearchChange = (value: string) => {
    startTransition(() => setSearch(value));
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setCategory("all");
      setSearch("");
    });
  };

  const hasActiveFilters = category !== "all" || search.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mt-5">
          <FilterBar
            category={category}
            search={search}
            onCategoryChange={setCategory}
            onSearchChange={handleSearchChange}
            resultCount={filtered.length}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Intro + answer-engine friendly content */}
        <section className="mb-12 rounded-2xl border border-border bg-card p-6 sm:p-8" aria-labelledby="what-is-stash">
          <h2 id="what-is-stash" className="font-display text-lg font-semibold text-foreground">
            What is The Stash?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-2xl">
            The Stash is a curated directory of dev and design resources: tools, inspiration, courses, AI tools, and links for developers and designers. Browse by category or explore curated collections like Best Development Tools, Best Design Tools, and UI Components & Patterns.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-2xl">
            Each resource has a dedicated page with descriptions and links. Use the filter above to narrow by category or search by title, description, or tags.
          </p>
        </section>

        {/* Collections hub — internal linking */}
        {collections?.length > 0 && (
          <section className="mb-12" aria-labelledby="browse-collections">
            <h2 id="browse-collections" className="font-display text-lg font-semibold text-foreground mb-4">
              Browse collections
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => {
                const slug = getCollectionSlug(c);
                const count = c.resources?.length ?? 0;
                return (
                  <li key={c._id}>
                    <Link
                      href={`/collections/${slug}`}
                      className="block rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/30 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="block truncate">{c.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {count} resource{count !== 1 ? "s" : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* All resources grid */}
        <section aria-labelledby="all-resources">
          <h2 id="all-resources" className="font-display text-lg font-semibold text-foreground mb-4">
            All resources
          </h2>
          {isPending ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Updating…
            </p>
          ) : null}
          <ResourceGrid resources={filtered} />
        </section>
      </main>
    </div>
  );
}
