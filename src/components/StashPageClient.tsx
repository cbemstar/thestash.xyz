"use client";

import { useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MixIcon } from "@radix-ui/react-icons";
import { AppNav } from "./AppNav";
import { HeroSection } from "./HeroSection";
import type { ViewMode, SortMode, TimeFilter } from "./FilterBar";
import { ResourceGrid } from "./ResourceGrid";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { useSavedResources } from "@/hooks/useSavedResources";
import { useVoteBatch } from "@/hooks/useVoteBatch";
import { getCollectionSlug, getResourceSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Pill } from "./kibo-ui/pill";
import type { Resource } from "@/types/resource";
import type { ResourceCategory } from "@/types/resource";
import type { Collection } from "@/types/collection";

// Lazily load "recently viewed" so it doesn't affect initial hydration.
const RecentlyViewed = dynamic(
  () => import("./RecentlyViewed").then((m) => m.RecentlyViewed),
  { ssr: false }
);

// Radix Select IDs can drift when SSR/client trees diverge, so render the
// filter controls client-only to avoid hydration attribute mismatches.
const FilterBar = dynamic(
  () => import("./FilterBar").then((m) => m.FilterBar),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="h-[168px] rounded-[16px] border border-stash-line-soft bg-stash-panel/40"
      />
    ),
  }
);

interface StashPageClientProps {
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

export function StashPageClient({ resources, collections }: StashPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search") ?? "";
  const sortParam = searchParams.get("sort");
  const whenParam = searchParams.get("when");
  const category: ResourceCategory | "all" =
    categoryParam && VALID_CATEGORIES.includes(categoryParam as ResourceCategory | "all")
      ? (categoryParam as ResourceCategory | "all")
      : "all";
  const search = searchParam;
  const sortMode: SortMode = sortParam === "a-z" ? "a-z" : "newest";
  const timeFilter: TimeFilter =
    whenParam === "week" || whenParam === "month" ? whenParam : "all";

  const { isSaved, toggleSaved } = useSavedResources();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thestash.xyz";

  const updateFilters = useCallback(
    (updates: {
      category?: ResourceCategory | "all";
      search?: string;
      sortMode?: SortMode;
      timeFilter?: TimeFilter;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.category !== undefined) {
        if (updates.category === "all") params.delete("category");
        else params.set("category", updates.category);
      }

      if (updates.search !== undefined) {
        if (updates.search.trim().length > 0) params.set("search", updates.search);
        else params.delete("search");
      }

      if (updates.timeFilter !== undefined) {
        if (updates.timeFilter === "all") params.delete("when");
        else params.set("when", updates.timeFilter);
      }

      if (updates.sortMode !== undefined) {
        if (updates.sortMode === "newest") params.delete("sort");
        else params.set("sort", updates.sortMode);
      }

      const next = params.toString();
      router.replace(next ? `/?${next}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  const filtered = useMemo(
    () => sortResources(filterResources(resources, category, search, timeFilter), sortMode),
    [resources, category, search, timeFilter, sortMode]
  );
  const featuredCount = useMemo(
    () => resources.filter((resource) => resource.featured).length,
    [resources]
  );
  const topTags = useMemo(() => {
    const tagCounts = new Map<string, { label: string; count: number }>();

    for (const resource of resources) {
      for (const rawTag of resource.tags ?? []) {
        const normalized = rawTag.trim().toLowerCase();
        if (!normalized) continue;

        const existing = tagCounts.get(normalized);
        if (existing) {
          existing.count += 1;
          continue;
        }

        tagCounts.set(normalized, { label: rawTag.trim(), count: 1 });
      }
    }

    return [...tagCounts.values()]
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 14)
      .map((item) => item.label);
  }, [resources]);

  const carouselSlugs = useMemo(() => {
    const featured = resources.filter((r) => r.featured).slice(0, 8);
    const display = featured.length >= 4 ? featured : resources.slice(0, 6);
    return display.map((r) => getResourceSlug(r));
  }, [resources]);

  const voteSlugs = useMemo(
    () =>
      [...new Set([...filtered.map((r) => getResourceSlug(r)), ...carouselSlugs])].slice(0, 100),
    [filtered, carouselSlugs]
  );

  const { voteFor, setUpvote, setDownvote, upvotes, downvotes } = useVoteBatch(voteSlugs);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilters({ search: value });
    },
    [updateFilters]
  );

  const handleCategoryChange = useCallback(
    (value: ResourceCategory | "all") => {
      updateFilters({ category: value });
    },
    [updateFilters]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      updateFilters({ search: tag });
    },
    [updateFilters]
  );

  const handleCategoryClick = useCallback(
    (cat: string) => {
      router.push(`/category/${cat}`);
    },
    [router]
  );

  const handleHeroCategorySelect = useCallback(
    (cat: ResourceCategory) => {
      updateFilters({ category: cat });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById("all-resources")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
    },
    [updateFilters]
  );

  const handleClearFilters = useCallback(() => {
    updateFilters({ category: "all", search: "", timeFilter: "all" });
  }, [updateFilters]);

  const hasActiveFilters = category !== "all" || search.length > 0 || timeFilter !== "all";
  const [filterOpen, setFilterOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") {
      return "grid";
    }
    try {
      const stored = window.localStorage.getItem("thestash-view-mode");
      return stored === "grid" || stored === "list" ? stored : "grid";
    } catch {
      return "grid";
    }
  });
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("thestash-view-mode", mode);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_2.5%,var(--stash-canvas))_0%,var(--stash-canvas)_20rem,var(--stash-canvas)_100%)]">
      <AppNav />
      <HeroSection
        currentCategory={category !== "all" ? category : undefined}
        onCategorySelect={handleHeroCategorySelect}
        resourceCount={resources.length}
        collectionCount={collections?.length ?? 0}
        featuredCount={featuredCount}
        topTags={topTags}
      />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-12 sm:space-y-14">
        <FeaturedCarousel
          resources={resources}
          onTagClick={handleTagClick}
          onCategoryClick={handleCategoryClick}
          isSaved={isSaved}
          onSaveToggle={toggleSaved}
          voteFor={voteFor}
          onUpvote={setUpvote}
          onDownvote={setDownvote}
          upvotes={upvotes}
          downvotes={downvotes}
          baseUrl={baseUrl}
        />

        {collections?.length > 0 && (
          <section
            className="browse-shell px-4 py-6 sm:px-6 sm:py-7"
            aria-labelledby="browse-collections"
          >
            <div className="mb-5 flex flex-wrap items-end justify-start gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stash-muted-text">
                  Curated sets
                </p>
                <h2 id="browse-collections" className="mt-1 font-display text-xl font-semibold text-foreground">
                  Browse collections
                </h2>
                <p className="mt-1 text-sm text-stash-muted-text">
                  Explore grouped stacks by workflow and outcome.
                </p>
              </div>
              <Link
                href="/collections"
                className="inline-flex min-h-10 items-center rounded-full border border-stash-line-soft bg-stash-control px-3.5 text-sm font-medium text-stash-muted-text transition hover:border-stash-line-strong hover:text-foreground"
              >
                View all collections
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => {
                const slug = getCollectionSlug(c);
                const count = c.resources?.length ?? 0;
                return (
                  <li key={c._id}>
                    <Link href={`/collections/${slug}`} className="block h-full">
                      <Card className="browse-card h-full gap-0 p-4 shadow-none cursor-pointer">
                        <CardContent className="p-0">
                          <div className="flex flex-wrap items-center justify-start gap-2">
                            <span className="font-medium text-foreground truncate">{c.title}</span>
                            <Pill variant="outline" className="shrink-0 border-stash-line-soft bg-stash-control text-xs text-stash-muted-text">
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

        <RecentlyViewed
          resources={resources}
          onTagClick={handleTagClick}
          onCategoryClick={handleCategoryClick}
          isSaved={isSaved}
          onSaveToggle={toggleSaved}
          voteFor={voteFor}
          onUpvote={setUpvote}
          onDownvote={setDownvote}
          upvotes={upvotes}
          downvotes={downvotes}
          baseUrl={baseUrl}
        />

        {/* All resources – filters below control this section only */}
        <section
          aria-labelledby="all-resources"
          className="browse-shell px-4 py-6 sm:px-6 sm:py-7 lg:px-8"
        >
          <div className="mb-5 flex flex-wrap items-start justify-start gap-3">
            <div>
              <h2 id="all-resources" className="font-display text-xl font-semibold text-foreground">
                All resources
              </h2>
              <p className="mt-1 text-sm text-stash-muted-text">
                Filter by category, recency, and keyword to find exactly what you need.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
              aria-controls="stash-filter-panel"
              className={cn(
                "browse-control relative flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center sm:hidden",
                (filterOpen || hasActiveFilters) && "border-stash-line-strong bg-stash-control-hover text-foreground"
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
              onSortModeChange={(mode) => updateFilters({ sortMode: mode })}
              timeFilter={timeFilter}
              onTimeFilterChange={(mode) => updateFilters({ timeFilter: mode })}
            />
          </div>
          <ResourceGrid
            resources={filtered}
            viewMode={viewMode}
            onTagClick={handleTagClick}
            onCategoryClick={handleCategoryClick}
            isSaved={isSaved}
            onSaveToggle={toggleSaved}
            voteFor={voteFor}
            onUpvote={setUpvote}
            onDownvote={setDownvote}
            upvotes={upvotes}
            downvotes={downvotes}
            baseUrl={baseUrl}
            onClearFilters={handleClearFilters}
          />
        </section>
        </div>
      </main>
    </div>
  );
}
