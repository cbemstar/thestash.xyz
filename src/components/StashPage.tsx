"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Filter } from "lucide-react";
import { FilterBar } from "./FilterBar";
import { ResourceGrid } from "./ResourceGrid";
import PillNav from "./PillNav";
import { getCollectionSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
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
  const [filterOpen, setFilterOpen] = useState(false);
  const pathname = usePathname();

  const pillNavItems = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Collections", href: "/collections" },
      { label: "Submit", href: "/studio" },
    ],
    []
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          {/* Row 1: PillNav (logo + nav pills) + filter toggle (mobile) */}
          <div className="flex items-center justify-between gap-3">
            <PillNav
              logoNode={
                <span className="font-display text-sm font-bold tracking-tight text-foreground sm:text-base">
                  The Stash
                </span>
              }
              items={pillNavItems}
              activeHref={pathname ?? "/"}
              absolute={false}
              className="flex-1 min-w-0"
              baseColor="var(--background)"
              pillColor="var(--muted)"
              pillTextColor="var(--foreground)"
              hoveredPillTextColor="var(--primary-foreground)"
              initialLoadAnimation={false}
            />
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
              aria-controls="stash-filter-panel"
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background sm:hidden",
                (filterOpen || hasActiveFilters) && "border-primary/30 bg-muted/50 text-foreground"
              )}
              aria-label={filterOpen ? "Close filter" : "Open filter"}
            >
              <Filter className="size-5" aria-hidden />
              {hasActiveFilters && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" aria-hidden />
              )}
            </button>
          </div>
          {/* Row 2: FilterBar — always visible on sm+, collapsible on mobile */}
          <div
            id="stash-filter-panel"
            role="region"
            aria-label="Filter resources"
            className={cn(
              "overflow-hidden transition-[height] duration-200 ease-out motion-reduce:transition-none",
              "sm:block",
              filterOpen ? "mt-4 block" : "mt-0 hidden sm:block"
            )}
          >
            <div className={cn(!filterOpen && "sm:mt-4", filterOpen && "mt-4")}>
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
        </div>
      </header>

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
