"use client";

import { useRef } from "react";
import { MagnifyingGlassIcon, ChevronDownIcon, Cross2Icon, GridIcon, ListBulletIcon } from "@radix-ui/react-icons";
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="stash-search" className="sr-only">
          Search resources by title, description, or tags
        </label>
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="stash-search"
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, description, or tags…"
            autoComplete="off"
            className={cn(
              "w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              "transition-colors motion-reduce:transition-none"
            )}
            aria-describedby="search-hint"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Clear search"
            >
              <Cross2Icon className="size-4" />
            </button>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:w-auto">
          <label htmlFor="category-filter" className="sr-only">
            Filter by category
          </label>
          <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[10rem]">
            <select
              id="category-filter"
              value={category}
              onChange={(e) =>
                onCategoryChange((e.target.value || "all") as ResourceCategory | "all")
              }
              className={cn(
                "w-full min-w-0 appearance-none rounded-lg border border-input bg-background py-2.5 pl-4 pr-9 text-sm text-foreground",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                "transition-colors motion-reduce:transition-none",
                "sm:min-w-[10rem]"
              )}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
          {onTimeFilterChange && (
            <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[8rem]">
              <label htmlFor="time-filter" className="sr-only">
                Filter by when added
              </label>
              <select
                id="time-filter"
                value={timeFilter}
                onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
                className={cn(
                  "w-full min-w-0 appearance-none rounded-lg border border-input bg-background py-2.5 pl-4 pr-9 text-sm text-foreground",
                  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                  "transition-colors motion-reduce:transition-none",
                  "sm:min-w-[8rem]"
                )}
                aria-label="Filter by when added"
              >
                <option value="all">All time</option>
                <option value="week">New this week</option>
                <option value="month">New this month</option>
              </select>
              <ChevronDownIcon
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          )}
          {onSortModeChange && (
            <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[8rem]">
              <label htmlFor="sort-filter" className="sr-only">
                Sort by
              </label>
              <select
                id="sort-filter"
                value={sortMode}
                onChange={(e) => onSortModeChange(e.target.value as SortMode)}
                className={cn(
                  "w-full min-w-0 appearance-none rounded-lg border border-input bg-background py-2.5 pl-4 pr-9 text-sm text-foreground",
                  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                  "transition-colors motion-reduce:transition-none",
                  "sm:min-w-[8rem]"
                )}
                aria-label="Sort by"
              >
                <option value="newest">Newest first</option>
                <option value="a-z">A–Z</option>
              </select>
              <ChevronDownIcon
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="flex shrink-0 min-h-10 min-w-10 items-center justify-center gap-1.5 rounded text-sm text-muted-foreground underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:min-h-11 sm:min-w-0 sm:px-2"
                aria-label="Clear all filters"
              >
                <Cross2Icon className="size-4 shrink-0 sm:hidden" aria-hidden />
                Clear
              </button>
            )}
            {onViewModeChange && (
              <div
                role="group"
                aria-label="View layout"
                className="flex shrink-0 rounded-lg border border-input bg-background p-0.5"
              >
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
                  "flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
      </div>
      <p id="search-hint" className="text-sm text-muted-foreground" role="status">
        {resultCount} resource{resultCount !== 1 ? "s" : ""} shown
      </p>
    </div>
  );
}
