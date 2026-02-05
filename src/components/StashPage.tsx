"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MixIcon } from "@radix-ui/react-icons";
import { AppNav } from "./AppNav";
import { HeroSection } from "./HeroSection";
import { FilterBar, type ViewMode, type SortMode, type TimeFilter } from "./FilterBar";
import { ResourceGrid } from "./ResourceGrid";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { RecentlyViewed } from "./RecentlyViewed";
import { useSavedResources } from "@/hooks/useSavedResources";
import { getCollectionSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Pill } from "./kibo-ui/pill";
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
  query: string,
  timeFilter: TimeFilter
): Resource[] {
  const q = query.trim().toLowerCase();
  let result =
    category === "all"
      ? resources
      : resources.filter((r) => r.category === category);
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

const VALID_CATEGORIES: (ResourceCategory | "all")[] = [
  "all",
  "design-tools",
  "development-tools",
  "ui-ux-resources",
  "inspiration",
  "ai-tools",
  "productivity",
  "learning-resources",
  "webflow",
  "shadcn",
  "coding",
  "github",
  "html",
  "css",
  "javascript",
  "languages",
  "miscellaneous",
];

export function StashPage({ resources, collections }: StashPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search") ?? "";
  const sortParam = searchParams.get("sort");
  const whenParam = searchParams.get("when");
  const [category, setCategory] = useState<ResourceCategory | "all">(() =>
    categoryParam && VALID_CATEGORIES.includes(categoryParam as ResourceCategory | "all")
      ? (categoryParam as ResourceCategory | "all")
      : "all"
  );
  const [search, setSearch] = useState(() => searchParam);
  const [sortMode, setSortMode] = useState<SortMode>(() =>
    sortParam === "a-z" ? "a-z" : "newest"
  );
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() =>
    whenParam === "week" || whenParam === "month" ? whenParam : "all"
  );

  const { isSaved, toggleSaved } = useSavedResources();

  useEffect(() => {
    if (categoryParam && VALID_CATEGORIES.includes(categoryParam as ResourceCategory | "all")) {
      setCategory(categoryParam as ResourceCategory | "all");
    }
    setSearch(searchParam);
    if (sortParam === "a-z") setSortMode("a-z");
    if (whenParam === "week" || whenParam === "month") setTimeFilter(whenParam);
  }, [categoryParam, searchParam, sortParam, whenParam]);

  const filtered = useMemo(
    () => sortResources(filterResources(resources, category, search, timeFilter), sortMode),
    [resources, category, search, timeFilter, sortMode]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleCategoryChange = useCallback((value: ResourceCategory | "all") => {
    setCategory(value);
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setSearch(tag);
  }, []);

  const handleCategoryClick = useCallback(
    (cat: string) => {
      router.push(`/category/${cat}`);
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    setCategory("all");
    setSearch("");
    setTimeFilter("all");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    if (timeFilter !== "all") params.set("when", timeFilter);
    if (sortMode !== "newest") params.set("sort", sortMode);
    const qs = params.toString();
    const desired = qs ? `/?${qs}` : "/";
    const current = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search || ""}` : "";
    if (current !== desired) {
      router.replace(desired, { scroll: false });
    }
  }, [category, search, timeFilter, sortMode, router]);

  const hasActiveFilters = category !== "all" || search.length > 0 || timeFilter !== "all";
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
      <HeroSection currentCategory={category !== "all" ? category : undefined} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <FeaturedCarousel
          resources={resources}
          onTagClick={handleTagClick}
          onCategoryClick={handleCategoryClick}
          isSaved={isSaved}
          onSaveToggle={toggleSaved}
        />

        <div className="my-12" />

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
                    <Link href={`/collections/${slug}`} className="block h-full">
                      <Card className="h-full gap-0 p-4 transition hover:border-primary/30 hover:bg-accent/50 cursor-pointer">
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground truncate">{c.title}</span>
                            <Pill variant="secondary" className="shrink-0 text-xs">
                              {count} resource{count !== 1 ? "s" : ""}
                            </Pill>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="mt-12">
          <RecentlyViewed
            resources={resources}
            onTagClick={handleTagClick}
            onCategoryClick={handleCategoryClick}
            isSaved={isSaved}
            onSaveToggle={toggleSaved}
          />
        </div>

        {/* All resources – filters below control this section only */}
        <section
          aria-labelledby="all-resources"
          className="mt-16 rounded-2xl border border-border bg-card/30 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 id="all-resources" className="font-display text-lg font-semibold text-foreground">
              All resources
            </h2>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
              aria-controls="stash-filter-panel"
              className={cn(
                "relative flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:hidden",
                (filterOpen || hasActiveFilters) && "border-primary/30 bg-accent text-accent-foreground"
              )}
              aria-label={filterOpen ? "Hide filters" : "Filter and sort"}
            >
              <MixIcon className="size-5" aria-hidden />
              {hasActiveFilters && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" aria-hidden />
              )}
            </button>
          </div>
          <div
            id="stash-filter-panel"
            role="region"
            aria-label="Filter and sort the resources below"
            className={cn(
              "mb-6 min-w-0 overflow-hidden",
              "sm:block",
              filterOpen ? "block" : "hidden sm:block"
            )}
          >
            <FilterBar
              category={category}
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
