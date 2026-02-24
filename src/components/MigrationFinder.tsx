"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { StatusNotice } from "@/components/StatusNotice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MigrationFinderPage = {
  slug: string;
  title: string;
  summary: string;
  fromTitle: string;
  toTitle: string;
  effortTier: "low" | "medium" | "high";
  estimatedTimeline: string;
};

interface MigrationFinderProps {
  pages: MigrationFinderPage[];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function MigrationFinder({ pages }: MigrationFinderProps) {
  const [query, setQuery] = useState("");
  const [effortFilter, setEffortFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [fromFilter, setFromFilter] = useState("all");
  const [toFilter, setToFilter] = useState("all");

  const fromOptions = useMemo(
    () => uniqueSorted(pages.map((page) => page.fromTitle)),
    [pages],
  );
  const toOptions = useMemo(
    () => uniqueSorted(pages.map((page) => page.toTitle)),
    [pages],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages.filter((page) => {
      if (effortFilter !== "all" && page.effortTier !== effortFilter)
        return false;
      if (fromFilter !== "all" && page.fromTitle !== fromFilter) return false;
      if (toFilter !== "all" && page.toTitle !== toFilter) return false;

      if (!q) return true;
      return (
        page.title.toLowerCase().includes(q) ||
        page.summary.toLowerCase().includes(q) ||
        page.fromTitle.toLowerCase().includes(q) ||
        page.toTitle.toLowerCase().includes(q)
      );
    });
  }, [pages, query, effortFilter, fromFilter, toFilter]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    effortFilter !== "all" ||
    fromFilter !== "all" ||
    toFilter !== "all";

  return (
    <section
      aria-labelledby="migration-finder"
      className="mt-8 section-panel sm:p-6"
    >
      <h2 id="migration-finder" className="section-title">
        Find your migration path
      </h2>
      <p className="section-copy">
        Filter by source tool, target tool, effort, or keyword to get to the
        right plan faster.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tool or workflow..."
          aria-label="Search migration plans"
          className="h-10 border-border/80 bg-background/80"
        />
        <Select
          value={effortFilter}
          onValueChange={(value) =>
            setEffortFilter(value as "all" | "low" | "medium" | "high")
          }
        >
          <SelectTrigger
            className="h-10 border-border/80 bg-background/80"
            aria-label="Filter by effort"
          >
            <SelectValue placeholder="Effort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All effort levels</SelectItem>
            <SelectItem value="low">Low effort</SelectItem>
            <SelectItem value="medium">Medium effort</SelectItem>
            <SelectItem value="high">High effort</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fromFilter} onValueChange={setFromFilter}>
          <SelectTrigger
            className="h-10 border-border/80 bg-background/80"
            aria-label="Filter by source tool"
          >
            <SelectValue placeholder="From tool" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All source tools</SelectItem>
            {fromOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={toFilter} onValueChange={setToFilter}>
          <SelectTrigger
            className="h-10 border-border/80 bg-background/80"
            aria-label="Filter by target tool"
          >
            <SelectValue placeholder="To tool" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All target tools</SelectItem>
            {toOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <p>
          {filtered.length} migration plan{filtered.length === 1 ? "" : "s"}{" "}
          shown
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setEffortFilter("all");
              setFromFilter("all");
              setToFilter("all");
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
          title="No migration plans match these filters"
          description="Try clearing one or more filters, or broaden your search terms."
          className="mt-4"
        />
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/migrate/${page.slug}`}
                className="block tone-card transition hover:border-primary/35 hover:bg-primary/[0.04]"
              >
                <h3 className="font-semibold text-foreground">
                  {page.fromTitle} to {page.toTitle}
                </h3>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                  {page.effortTier} effort · {page.estimatedTimeline}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {page.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
