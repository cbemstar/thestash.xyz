"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusNotice } from "@/components/StatusNotice";
import { ToolCard } from "@/components/ToolCard";
import type {
  ToolCategoryDefinition,
  ToolDefinition,
  ToolCategorySlug,
} from "@/lib/tools-catalog";

type ToolsDirectoryClientProps = {
  tools: ToolDefinition[];
  categories: ToolCategoryDefinition[];
};

function matchesSearch(tool: ToolDefinition, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    tool.title.toLowerCase().includes(normalized) ||
    tool.summary.toLowerCase().includes(normalized)
  );
}

export function ToolsDirectoryClient({
  tools,
  categories,
}: ToolsDirectoryClientProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ToolCategorySlug>(
    "all"
  );

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      if (categoryFilter !== "all" && tool.category !== categoryFilter) {
        return false;
      }
      return matchesSearch(tool, query);
    });
  }, [tools, query, categoryFilter]);

  const grouped = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          tools: filteredTools.filter((tool) => tool.category === category.slug),
        }))
        .filter((group) => group.tools.length > 0),
    [categories, filteredTools]
  );

  const hasFilters = query.trim().length > 0 || categoryFilter !== "all";

  return (
    <section aria-labelledby="tools-directory" className="mt-8 section-panel sm:p-6">
      <h2 id="tools-directory" className="section-title">
        Browse tool library
      </h2>
      <p className="section-copy">
        Search by outcome and open any tool page to run it with your own input.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools..."
          aria-label="Search tools"
          className="h-10 border-border/80 bg-background/80 sm:col-span-2"
        />
        <Select
          value={categoryFilter}
          onValueChange={(value) =>
            setCategoryFilter(value as "all" | ToolCategorySlug)
          }
        >
          <SelectTrigger
            className="h-10 border-border/80 bg-background/80"
            aria-label="Filter by category"
          >
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <p>
          {filteredTools.length} tool{filteredTools.length === 1 ? "" : "s"} shown
        </p>
        {hasFilters && (
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

      {filteredTools.length === 0 ? (
        <StatusNotice
          variant="helper"
          title="No tools match these filters"
          description="Try a broader query or reset filters to view the full catalog."
          className="mt-4"
        />
      ) : categoryFilter === "all" && query.trim().length === 0 ? (
        <div className="mt-6 space-y-8">
          {grouped.map(({ category, tools: groupedTools }) => (
            <section
              key={category.slug}
              id={category.slug}
              aria-labelledby={`group-${category.slug}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary/85">
                    {category.kicker}
                  </p>
                  <h3
                    id={`group-${category.slug}`}
                    className="mt-1 text-xl font-semibold tracking-tight text-foreground"
                  >
                    {category.label}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{groupedTools.length} tools</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedTools.map((tool) => (
                  <li key={tool.slug}>
                    <ToolCard tool={tool} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
