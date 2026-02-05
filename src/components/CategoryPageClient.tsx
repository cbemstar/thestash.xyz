"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MixIcon } from "@radix-ui/react-icons";
import { AppNav } from "./AppNav";
import { Breadcrumbs } from "./Breadcrumbs";
import { HeroSection } from "./HeroSection";
import { FilterBar, type ViewMode, type SortMode, type TimeFilter } from "./FilterBar";
import { ResourceGrid } from "./ResourceGrid";
import { useSavedResources } from "@/hooks/useSavedResources";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types/resource";
import type { ResourceCategory } from "@/types/resource";

function filterBySearchAndTime(
  resources: Resource[],
  query: string,
  timeFilter: TimeFilter
): Resource[] {
  const q = query.trim().toLowerCase();
  let result = resources;
  if (q) {
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }
  if (timeFilter !== "all") {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const cutoff = timeFilter === "week" ? weekMs : monthMs;
    result = result.filter((r) => {
      const created = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      return created && now - created <= cutoff;
    });
  }
  return result;
}

function sortResources(resources: Resource[], sortMode: SortMode): Resource[] {
  const copy = [...resources];
  if (sortMode === "a-z") {
    copy.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  } else {
    copy.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }
  return copy;
}

interface CategoryPageClientProps {
  resources: Resource[];
  categorySlug: ResourceCategory;
  categoryLabel: string;
}

export function CategoryPageClient({
  resources,
  categorySlug,
  categoryLabel,
}: CategoryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const sortParam = searchParams.get("sort");
  const whenParam = searchParams.get("when");

  const [search, setSearch] = useState(searchParam);
  const [sortMode, setSortMode] = useState<SortMode>(sortParam === "a-z" ? "a-z" : "newest");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(
    whenParam === "week" || whenParam === "month" ? whenParam : "all"
  );

  const { isSaved, toggleSaved } = useSavedResources();

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    if (sortParam === "a-z") setSortMode("a-z");
    if (whenParam === "week" || whenParam === "month") setTimeFilter(whenParam);
  }, [searchParam, sortParam, whenParam]);

  const categoryResources = useMemo(
    () => resources.filter((r) => r.category === categorySlug),
    [resources, categorySlug]
  );

  const filtered = useMemo(
    () =>
      sortResources(
        filterBySearchAndTime(categoryResources, search, timeFilter),
        sortMode
      ),
    [categoryResources, search, timeFilter, sortMode]
  );

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleCategoryChange = useCallback(
    (value: ResourceCategory | "all") => {
      if (value === "all") router.push("/");
      else router.push(`/category/${value}`);
    },
    [router]
  );
  const handleTagClick = useCallback((tag: string) => setSearch(tag), []);
  const handleCategoryClick = useCallback(
    (cat: string) => router.push(`/category/${cat}`),
    [router]
  );
  const handleClearFilters = useCallback(() => {
    setSearch("");
    setTimeFilter("all");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (timeFilter !== "all") params.set("when", timeFilter);
    if (sortMode !== "newest") params.set("sort", sortMode);
    const qs = params.toString();
    const desired = qs ? `?${qs}` : "";
    const current = typeof window !== "undefined" ? window.location.search : "";
    if (current !== desired) {
      router.replace(`/category/${categorySlug}${desired ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [search, timeFilter, sortMode, categorySlug, router]);

  const hasActiveFilters = search.length > 0 || timeFilter !== "all";
  const [filterOpen, setFilterOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  useEffect(() => {
    const stored = localStorage.getItem("thestash-view-mode") as ViewMode | null;
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, []);
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("thestash-view-mode", mode);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="min-h-screen">
      <AppNav />
      <HeroSection currentCategory={categorySlug} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Category", href: "/category" },
            { label: categoryLabel },
          ]}
          className="mb-6"
        />
        <section
          aria-labelledby="category-resources"
          className="mt-8 rounded-2xl border border-border bg-card/30 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 id="category-resources" className="font-display text-lg font-semibold text-foreground">
              {categoryLabel} resources
            </h2>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
              aria-controls="category-filter-panel"
              className={cn(
                "relative flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:hidden",
                (filterOpen || hasActiveFilters) &&
                  "border-primary/30 bg-accent text-accent-foreground"
              )}
              aria-label={filterOpen ? "Hide filters" : "Filter and sort"}
            >
              <MixIcon className="size-5" aria-hidden />
              {hasActiveFilters && (
                <span
                  className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </button>
          </div>
          <div
            id="category-filter-panel"
            role="region"
            aria-label="Filter and sort the resources below"
            className={cn(
              "mb-6 min-w-0 overflow-hidden",
              "sm:block",
              filterOpen ? "block" : "hidden sm:block"
            )}
          >
            <FilterBar
              category={categorySlug}
              search={search}
              onCategoryChange={handleCategoryChange}
              onSearchChange={handleSearchChange}
              resultCount={filtered.length}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
            />
          </div>
          <ResourceGrid
            resources={filtered}
            viewMode={viewMode}
            onTagClick={handleTagClick}
            onCategoryClick={handleCategoryClick}
            isSaved={isSaved}
            onSaveToggle={toggleSaved}
            onClearFilters={handleClearFilters}
          />
        </section>
      </main>
    </div>
  );
}
