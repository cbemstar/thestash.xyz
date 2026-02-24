"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getCategoryLabel } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { StatusNotice } from "@/components/StatusNotice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResourceCategory } from "@/types/resource";

export type CompareFinderItem = {
  slug: string;
  title: string;
  leftSlug: string;
  leftTitle: string;
  rightSlug: string;
  rightTitle: string;
  categories: string[];
};

interface CompareFinderProps {
  items: CompareFinderItem[];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function formatSlugLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCategoryLabel(value: string): string {
  const label = getCategoryLabel(value as ResourceCategory);
  return label === value ? formatSlugLabel(value) : label;
}

export function CompareFinder({ items }: CompareFinderProps) {
  const [query, setQuery] = useState("");
  const [toolFilter, setToolFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const toolOptions = useMemo(() => {
    const toolMap = new Map<string, string>();
    for (const item of items) {
      toolMap.set(item.leftSlug, item.leftTitle);
      toolMap.set(item.rightSlug, item.rightTitle);
    }
    return [...toolMap.entries()]
      .sort((a, b) =>
        a[1].localeCompare(b[1], undefined, { sensitivity: "base" }),
      )
      .map(([slug, title]) => ({ slug, title }));
  }, [items]);

  const categoryOptions = useMemo(
    () =>
      uniqueSorted(
        items
          .flatMap((item) => item.categories)
          .filter((value) => value.length > 0),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (
        toolFilter !== "all" &&
        item.leftSlug !== toolFilter &&
        item.rightSlug !== toolFilter
      ) {
        return false;
      }
      if (
        categoryFilter !== "all" &&
        !item.categories.includes(categoryFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.leftTitle.toLowerCase().includes(q) ||
        item.rightTitle.toLowerCase().includes(q)
      );
    });
  }, [items, query, toolFilter, categoryFilter]);

  const hasActiveFilters =
    query.trim().length > 0 || toolFilter !== "all" || categoryFilter !== "all";

  return (
    <section
      aria-labelledby="compare-finder"
      className="mt-8 section-panel sm:p-6"
    >
      <h2 id="compare-finder" className="section-title">
        Find the right comparison
      </h2>
      <p className="section-copy">
        Search by tool name and filter by category to jump straight to relevant
        comparisons.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tool names..."
          aria-label="Search comparisons"
          className="h-10 border-border/80 bg-background/80 sm:col-span-2"
        />
        <Select value={toolFilter} onValueChange={setToolFilter}>
          <SelectTrigger
            className="h-10 border-border/80 bg-background/80"
            aria-label="Filter by tool"
          >
            <SelectValue placeholder="Filter by tool" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tools</SelectItem>
            {toolOptions.map((option) => (
              <SelectItem key={option.slug} value={option.slug}>
                {option.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger
            className="h-10 border-border/80 bg-background/80"
            aria-label="Filter by category"
          >
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {formatCategoryLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <p>
          {filtered.length} comparison{filtered.length === 1 ? "" : "s"} shown
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setToolFilter("all");
              setCategoryFilter("all");
            }}
            className="pill-link py-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <StatusNotice
          variant="helper"
          title="No comparisons match these filters"
          description="Try a broader category, search for one tool name, or clear all filters."
          className="mt-4"
        />
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/compare/${item.slug}`}
                className="block tone-card transition hover:border-primary/35 hover:bg-primary/[0.04]"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.leftTitle} vs {item.rightTitle}
                </p>
                {item.categories.length > 0 && (
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                    {item.categories
                      .map((category) => formatCategoryLabel(category))
                      .join(" · ")}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
