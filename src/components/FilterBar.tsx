"use client";

import { useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { ResourceCategory } from "@/types/resource";

interface FilterBarProps {
  category: ResourceCategory | "all";
  search: string;
  onCategoryChange: (value: ResourceCategory | "all") => void;
  onSearchChange: (value: string) => void;
  resultCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FilterBar({
  category,
  search,
  onCategoryChange,
  onSearchChange,
  resultCount,
  hasActiveFilters,
  onClearFilters,
}: FilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="stash-search" className="sr-only">
          Search resources by title, description, or tags
        </label>
        <div className="relative flex-1">
          <Search
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
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              "transition-colors motion-reduce:transition-none"
            )}
            aria-describedby="search-hint"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Clear search"
            >
              <X className="size-4" />
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
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
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
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-sm text-muted-foreground underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <p id="search-hint" className="text-sm text-muted-foreground" role="status">
        {resultCount} resource{resultCount !== 1 ? "s" : ""} shown
      </p>
    </div>
  );
}
