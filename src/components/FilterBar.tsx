"use client";

import { MagnifyingGlassIcon, Cross2Icon, GridIcon, ListBulletIcon } from "@radix-ui/react-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { ResourceCategory } from "@/types/resource";

export type ViewMode = "grid" | "list";
export type SortMode = "newest" | "a-z";
export type TimeFilter = "all" | "week" | "month";

interface FilterBarProps {
  category: ResourceCategory | "all";
  search: string;
  onCategoryChange: (value: ResourceCategory | "all") => void;
  onSearchChange: (value: string) => void;
  resultCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  sortMode?: SortMode;
  onSortModeChange?: (mode: SortMode) => void;
  timeFilter?: TimeFilter;
  onTimeFilterChange?: (mode: TimeFilter) => void;
}

export function FilterBar({
  category,
  search,
  onCategoryChange,
  onSearchChange,
  resultCount,
  hasActiveFilters,
  onClearFilters,
  viewMode = "grid",
  onViewModeChange,
  sortMode = "newest",
  onSortModeChange,
  timeFilter = "all",
  onTimeFilterChange,
}: FilterBarProps) {
  const controlTriggerClass = cn(
    "browse-control-trigger",
    "data-[size=default]:h-11 data-[placeholder]:text-stash-muted-text"
  );

  return (
    <div className="min-w-0 space-y-3">
      <label htmlFor="stash-search" className="sr-only">
        Search resources by title, description, or tags
      </label>
      <div className="relative min-w-0">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stash-muted-text"
          aria-hidden
        />
        <input
          id="stash-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, description, or tags…"
          autoComplete="off"
          className={cn(
            "browse-control h-11 w-full pl-9 pr-9 placeholder:text-stash-muted-text",
            "transition-colors motion-reduce:transition-none"
          )}
          aria-describedby="search-hint"
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-[8px] text-stash-muted-text transition-colors hover:bg-stash-control-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Clear search"
          >
            <Cross2Icon className="size-4" />
          </button>
        )}
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <div className="min-w-0 flex-[1_1_14rem] sm:flex-[0_1_11rem]">
          <label htmlFor="category-filter-trigger" className="sr-only">
            Filter by category
          </label>
          <Select
            value={category}
            onValueChange={(value) =>
              onCategoryChange((value || "all") as ResourceCategory | "all")
            }
          >
            <SelectTrigger
              id="category-filter-trigger"
              className={controlTriggerClass}
              aria-label="Filter by category"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="browse-select-content">
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {onTimeFilterChange && (
          <div className="min-w-0 flex-[1_1_10rem] sm:flex-[0_1_9rem]">
            <label htmlFor="time-filter-trigger" className="sr-only">
              Filter by when added
            </label>
            <Select
              value={timeFilter}
              onValueChange={(value) => onTimeFilterChange(value as TimeFilter)}
            >
              <SelectTrigger
                id="time-filter-trigger"
                className={controlTriggerClass}
                aria-label="Filter by when added"
              >
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent className="browse-select-content">
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="week">New this week</SelectItem>
                <SelectItem value="month">New this month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {onSortModeChange && (
          <div className="min-w-0 flex-[1_1_10rem] sm:flex-[0_1_9rem]">
            <label htmlFor="sort-filter-trigger" className="sr-only">
              Sort by
            </label>
            <Select
              value={sortMode}
              onValueChange={(value) => onSortModeChange(value as SortMode)}
            >
              <SelectTrigger
                id="sort-filter-trigger"
                className={controlTriggerClass}
                aria-label="Sort by"
              >
                <SelectValue placeholder="Newest first" />
              </SelectTrigger>
              <SelectContent className="browse-select-content">
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="browse-control inline-flex min-h-11 items-center justify-center gap-1.5 px-3 text-stash-muted-text hover:text-foreground"
              aria-label="Clear all filters"
            >
              <Cross2Icon className="size-4 shrink-0" aria-hidden />
              Clear filters
            </button>
          )}
          {onViewModeChange && (
            <div
              role="group"
              aria-label="View layout"
              className="flex shrink-0 justify-center rounded-[10px] border border-stash-line-soft bg-stash-control p-0.5"
            >
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "flex min-h-10 min-w-10 items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  viewMode === "grid"
                    ? "bg-stash-panel-strong text-foreground"
                    : "text-stash-muted-text hover:text-foreground"
                )}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <GridIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={cn(
                  "flex min-h-10 min-w-10 items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  viewMode === "list"
                    ? "bg-stash-panel-strong text-foreground"
                    : "text-stash-muted-text hover:text-foreground"
                )}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <ListBulletIcon className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p id="search-hint" className="text-sm text-stash-muted-text" role="status">
          {resultCount} resource{resultCount !== 1 ? "s" : ""} shown
        </p>
        {hasActiveFilters && (
          <span className="inline-flex items-center rounded-full border border-stash-line-soft bg-stash-control px-2.5 py-1 text-xs font-medium text-stash-muted-text">
            Filters active
          </span>
        )}
      </div>
    </div>
  );
}
