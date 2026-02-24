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

export type AlternativesFinderItem = {
  slug: string;
  title: string;
  category: string;
};

interface AlternativesFinderProps {
  items: AlternativesFinderItem[];
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
  if (value === "uncategorized") return "Uncategorized";
  const label = getCategoryLabel(value as ResourceCategory);
  return label === value ? formatSlugLabel(value) : label;
}

export function AlternativesFinder({ items }: AlternativesFinderProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categoryOptions = useMemo(
    () => uniqueSorted(items.map((item) => item.category)),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter)
        return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    });
  }, [items, query, categoryFilter]);

  const hasActiveFilters = query.trim().length > 0 || categoryFilter !== "all";

  return (
    <section
      aria-labelledby="alternatives-finder"
      className="mt-8 section-panel sm:p-6"
    >
      <h2 id="alternatives-finder" className="section-title">
        Find alternatives quickly
      </h2>
      <p className="section-copy">
        Search by tool name and filter by category to narrow down alternatives
        with less scrolling.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tool names..."
          aria-label="Search alternatives"
          className="h-10 border-border/80 bg-background/80 sm:col-span-2"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger
            className="h-10 border-border/80 bg-background/80"
            aria-label="Filter alternatives by category"
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
          {filtered.length} alternative page{filtered.length === 1 ? "" : "s"}{" "}
          shown
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
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
          title="No alternatives match these filters"
          description="Try another category, search for a shorter term, or clear all filters."
          className="mt-4"
        />
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/alternatives/${item.slug}`}
                className="block tone-card transition hover:border-primary/35 hover:bg-primary/[0.04]"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {item.title} alternatives
                </h3>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                  {formatCategoryLabel(item.category)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
