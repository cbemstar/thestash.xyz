"use client";

import { useMemo, useState, useTransition } from "react";
import { CategoryFilter } from "./CategoryFilter";
import { SearchBar } from "./SearchBar";
import { ResourceGrid } from "./ResourceGrid";
import type { Resource } from "@/types/resource";
import type { ResourceCategory } from "@/types/resource";

interface StashPageProps {
  resources: Resource[];
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

export function StashPage({ resources }: StashPageProps) {
  const [category, setCategory] = useState<ResourceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return filterResources(resources, category, search);
  }, [resources, category, search]);

  const handleSearchChange = (value: string) => {
    startTransition(() => setSearch(value));
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            The Stash
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Links, tools, and inspiration for dev &amp; design.
          </p>
          <div className="mt-4">
            <SearchBar value={search} onChange={handleSearchChange} />
          </div>
          <div className="mt-4">
            <CategoryFilter value={category} onChange={setCategory} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {isPending ? (
          <p className="text-sm text-zinc-500" aria-live="polite">
            Updating…
          </p>
        ) : null}
        <ResourceGrid resources={filtered} />
      </main>
    </div>
  );
}
