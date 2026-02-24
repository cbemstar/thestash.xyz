"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MixIcon } from "@radix-ui/react-icons";
import { AppNav } from "./AppNav";
import { Breadcrumbs } from "./Breadcrumbs";
import { HeroSection } from "./HeroSection";
import { AdUnit } from "./AdUnit";
import { TrackedCompareLink } from "./TrackedCompareLink";
import { FilterBar, type ViewMode, type SortMode, type TimeFilter } from "./FilterBar";
import { ResourceGrid } from "./ResourceGrid";
import { useSavedResources } from "@/hooks/useSavedResources";
import { useVoteBatch } from "@/hooks/useVoteBatch";
import { getResourceSlug } from "@/lib/slug";
import { getWebflowHubStats } from "@/lib/webflow-hub-data";
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
  alternatives: Array<{ slug: string; title: string }>;
  comparisons: Array<{ slug: string; title: string }>;
  useCases: Array<{ slug: string; title: string }>;
}

export function CategoryPageClient({
  resources,
  categorySlug,
  categoryLabel,
  alternatives,
  comparisons,
  useCases,
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thestash.xyz";

  useEffect(() => {
    // Keep local control state in sync with URL query params (supports back/forward navigation).
    setSearch(searchParams.get("search") ?? "");
    setSortMode(sortParam === "a-z" ? "a-z" : "newest");
    setTimeFilter(whenParam === "week" || whenParam === "month" ? whenParam : "all");
  }, [searchParams, sortParam, whenParam]);

  useEffect(() => {
    document.getElementById("category-resources")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [categorySlug]);

  const categoryResources = useMemo(
    () => resources.filter((r) => r.category === categorySlug),
    [resources, categorySlug]
  );
  const webflowHubStats = useMemo(
    () => (categorySlug === "webflow" ? getWebflowHubStats() : null),
    [categorySlug]
  );

  const filtered = useMemo(
    () =>
      sortResources(
        filterBySearchAndTime(categoryResources, search, timeFilter),
        sortMode
      ),
    [categoryResources, search, timeFilter, sortMode]
  );

  const voteSlugs = useMemo(
    () => filtered.map((r) => getResourceSlug(r)).slice(0, 100),
    [filtered]
  );
  const { voteFor, setUpvote, setDownvote, upvotes, downvotes } = useVoteBatch(voteSlugs);

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
    try {
      const stored = localStorage.getItem("thestash-view-mode") as ViewMode | null;
      if (stored === "grid" || stored === "list") {
        setViewMode(stored);
      }
    } catch {
      // localStorage can throw in cross-origin iframes (e.g. AdSense preview)
    }
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <AdUnit
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT || "1234567890"}
          format="horizontal"
          className="my-6"
        />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Category", href: "/category" },
            { label: categoryLabel },
          ]}
          className="mb-6"
        />
        {webflowHubStats && (
          <section className="browse-shell mb-8 px-4 py-6 sm:px-6">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Dedicated Webflow ecosystem repository
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore curated Webflow apps, cloneables, templates, and inspiration in one
              implementation-focused view.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="inline-flex rounded-full border border-stash-line-soft bg-stash-control px-3 py-1">
                {webflowHubStats.byKind.app} apps
              </span>
              <span className="inline-flex rounded-full border border-stash-line-soft bg-stash-control px-3 py-1">
                {webflowHubStats.byKind.cloneable} cloneables
              </span>
              <span className="inline-flex rounded-full border border-stash-line-soft bg-stash-control px-3 py-1">
                {webflowHubStats.byKind.template} templates
              </span>
              <span className="inline-flex rounded-full border border-stash-line-soft bg-stash-control px-3 py-1">
                {webflowHubStats.byKind.inspiration} inspiration picks
              </span>
              <span className="inline-flex rounded-full border border-stash-line-soft bg-stash-control px-3 py-1">
                {webflowHubStats.codeReady} code-ready resources
              </span>
            </div>
            <Link
              href="/ecosystems/webflow"
              className="mt-4 inline-flex rounded-full border border-stash-line-soft bg-stash-control px-4 py-2 text-sm font-medium text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover"
            >
              Open Webflow ecosystem repository
            </Link>
          </section>
        )}
        {(alternatives.length > 0 || comparisons.length > 0 || useCases.length > 0) && (
          <section
            className="browse-shell mb-8 px-4 py-6 sm:px-6"
            aria-labelledby="category-decision-guides"
          >
            <h2
              id="category-decision-guides"
              className="font-display text-lg font-semibold text-foreground"
            >
              Decision guides for {categoryLabel}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use alternatives and comparison pages to choose the best fit quickly.
            </p>
            {alternatives.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Alternatives
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {alternatives.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/alternatives/${item.slug}`}
                        className="inline-flex rounded-full border border-stash-line-soft bg-stash-control px-3 py-1.5 text-sm text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {useCases.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Use cases
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {useCases.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/use-cases/${item.slug}`}
                        className="inline-flex rounded-full border border-stash-line-soft bg-stash-control px-3 py-1.5 text-sm text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {comparisons.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Comparisons
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {comparisons.map((item) => (
                    <li key={item.slug}>
                      <TrackedCompareLink
                        href={`/compare/${item.slug}`}
                        comparisonSlug={item.slug}
                        className="inline-flex rounded-full border border-stash-line-soft bg-stash-control px-3 py-1.5 text-sm text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover"
                      >
                        {item.title}
                      </TrackedCompareLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        <section
          aria-labelledby="category-resources"
          className="browse-shell mt-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
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
                "browse-control relative flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center sm:hidden",
                (filterOpen || hasActiveFilters) && "border-stash-line-strong bg-stash-control-hover text-foreground"
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
            voteFor={voteFor}
            onUpvote={setUpvote}
            onDownvote={setDownvote}
            upvotes={upvotes}
            downvotes={downvotes}
            baseUrl={baseUrl}
            onClearFilters={handleClearFilters}
          />
        </section>
      </main>
    </div>
  );
}
