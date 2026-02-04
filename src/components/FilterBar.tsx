"use client";

import { useRef } from "react";
import { IconSearch, IconChevronDown, IconX, IconLayoutGrid, IconList } from "@tabler/icons-react";
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="stash-search" className="sr-only">
          Search resources by title, description, or tags
        </label>
        <div className="relative flex-1">
          <IconSearch
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Clear search"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="sr-only">
            Filter by category
          </label>
          <div className="relative">
            <select
              id="category-filter"
              value={category}
              onChange={(e) =>
                onCategoryChange((e.target.value || "all") as ResourceCategory | "all")
              }
              className={cn(
                "appearance-none rounded-lg border border-input bg-background py-2.5 pl-4 pr-9 text-sm text-foreground",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                "transition-colors motion-reduce:transition-none",
                "min-w-[10rem]"
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
            <IconChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
          {onTimeFilterChange && (
            <div className="relative">
              <label htmlFor="time-filter" className="sr-only">
                Filter by when added
              </label>
              <select
                id="time-filter"
                value={timeFilter}
                onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
                className={cn(
                  "appearance-none rounded-lg border border-input bg-background py-2.5 pl-4 pr-9 text-sm text-foreground",
                  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                  "transition-colors motion-reduce:transition-none",
                  "min-w-[8rem]"
                )}
                aria-label="Filter by when added"
              >
                <option value="all">All time</option>
                <option value="week">New this week</option>
                <option value="month">New this month</option>
              </select>
              <IconChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          )}
          {onSortModeChange && (
            <div className="relative">
              <label htmlFor="sort-filter" className="sr-only">
                Sort by
              </label>
              <select
                id="sort-filter"
                value={sortMode}
                onChange={(e) => onSortModeChange(e.target.value as SortMode)}
                className={cn(
                  "appearance-none rounded-lg border border-input bg-background py-2.5 pl-4 pr-9 text-sm text-foreground",
                  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                  "transition-colors motion-reduce:transition-none",
                  "min-w-[8rem]"
                )}
                aria-label="Sort by"
              >
                <option value="newest">Newest first</option>
                <option value="a-z">A–Z</option>
              </select>
              <IconChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-sm text-muted-foreground underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded"
            >
              Clear
            </button>
          )}
          {onViewModeChange && (
            <div
              role="group"
              aria-label="View layout"
              className="flex rounded-lg border border-input bg-background p-0.5"
            >
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <IconLayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={cn(
                  "flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <IconList className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <p id="search-hint" className="text-sm text-muted-foreground" role="status">
        {resultCount} resource{resultCount !== 1 ? "s" : ""} shown
      </p>
    </div>
  );
}
