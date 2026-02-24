"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconCode, IconLayoutGrid } from "@tabler/icons-react";
import { MicroExpander } from "@/components/satisui/micro-expander";
import { Pill } from "@/components/kibo-ui/pill";
import {
  Status,
  StatusIndicator,
  StatusLabel,
} from "@/components/kibo-ui/status";
import { StatusNotice } from "@/components/StatusNotice";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  WebflowHubResource,
  WebflowResourceKind,
} from "@/lib/webflow-hub-data";

const KIND_LABELS: Record<WebflowResourceKind, string> = {
  app: "Apps",
  cloneable: "Cloneables",
  template: "Templates",
  inspiration: "Inspiration",
};

const KIND_ORDER: WebflowResourceKind[] = [
  "app",
  "cloneable",
  "template",
  "inspiration",
];

interface WebflowHubExplorerProps {
  resources: WebflowHubResource[];
  updatedAt: string;
  detailBasePath: string;
}

export function WebflowHubExplorer({
  resources,
  updatedAt,
  detailBasePath,
}: WebflowHubExplorerProps) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | WebflowResourceKind>(
    "all",
  );
  const [codeOnly, setCodeOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources
      .filter((resource) => {
        if (kindFilter !== "all" && resource.kind !== kindFilter) return false;
        if (codeOnly && !resource.codeReady) return false;
        if (!q) return true;
        return (
          resource.name.toLowerCase().includes(q) ||
          resource.summary.toLowerCase().includes(q) ||
          resource.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [resources, query, kindFilter, codeOnly]);

  const grouped = useMemo(() => {
    const map = new Map<WebflowResourceKind, WebflowHubResource[]>();
    for (const kind of KIND_ORDER) map.set(kind, []);
    for (const resource of filtered) {
      map.get(resource.kind)?.push(resource);
    }
    return map;
  }, [filtered]);

  const counts = useMemo(() => {
    const byKind = {
      app: resources.filter((item) => item.kind === "app").length,
      cloneable: resources.filter((item) => item.kind === "cloneable").length,
      template: resources.filter((item) => item.kind === "template").length,
      inspiration: resources.filter((item) => item.kind === "inspiration").length,
    };
    return byKind;
  }, [resources]);

  const clearFilters = () => {
    setQuery("");
    setKindFilter("all");
    setCodeOnly(false);
  };

  return (
    <>
      <section className="section-panel sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title mb-0">Webflow resource breakdown</h2>
          <Status status="online" className="online">
            <StatusIndicator />
            <StatusLabel>
              Synced snapshot • {new Date(updatedAt).toLocaleDateString()}
            </StatusLabel>
          </Status>
        </div>
        <p className="section-copy">
          Curated from Flowfav and grouped by intent so Webflow builders can
          find implementation-ready assets faster.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill variant="secondary">
            <IconLayoutGrid className="size-3.5" aria-hidden />
            {counts.app} apps
          </Pill>
          <Pill variant="secondary">{counts.cloneable} cloneables</Pill>
          <Pill variant="secondary">{counts.template} templates</Pill>
          <Pill variant="secondary">{counts.inspiration} inspiration picks</Pill>
          <Pill variant="secondary">
            <IconCode className="size-3.5" aria-hidden />
            {resources.filter((item) => item.codeReady).length} code-ready
          </Pill>
        </div>
      </section>

      <section
        aria-labelledby="webflow-hub-explorer"
        className="mt-8 section-panel sm:p-6"
      >
        <h2 id="webflow-hub-explorer" className="section-title">
          Explore Webflow stack resources
        </h2>
        <p className="section-copy">
          Filter by resource type and code-readiness to quickly find what you
          need for your next build.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search apps, cloneables, tags..."
            aria-label="Search Webflow resources"
            className="h-10 border-border/80 bg-background/80 sm:col-span-2"
          />
          <Select
            value={kindFilter}
            onValueChange={(value) =>
              setKindFilter(value as "all" | WebflowResourceKind)
            }
          >
            <SelectTrigger
              className="h-10 border-border/80 bg-background/80"
              aria-label="Filter by resource type"
            >
              <SelectValue placeholder="Resource type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resource types</SelectItem>
              {KIND_ORDER.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <p>
            {filtered.length} resource{filtered.length === 1 ? "" : "s"} shown
          </p>
          <MicroExpander
            text={codeOnly ? "Code-ready only" : "Show code-ready only"}
            variant={codeOnly ? "default" : "outline"}
            onClick={() => setCodeOnly((value) => !value)}
            className="h-10"
          />
          {(query || kindFilter !== "all" || codeOnly) && (
            <button
              type="button"
              onClick={clearFilters}
              className="pill-link py-1"
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <StatusNotice
            variant="helper"
            title="No Webflow resources match these filters"
            description="Try another keyword, broaden to all resource types, or disable code-only mode."
            className="mt-4"
          />
        ) : (
          <div className="mt-6 space-y-6">
            {KIND_ORDER.map((kind) => {
              const items = grouped.get(kind) ?? [];
              if (items.length === 0) return null;
              return (
                <section key={kind} aria-labelledby={`webflow-kind-${kind}`}>
                  <h3
                    id={`webflow-kind-${kind}`}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                  >
                    {KIND_LABELS[kind]}
                  </h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {items.map((resource) => (
                      <li key={resource.id} className="tone-card">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {resource.name}
                          </p>
                          {resource.codeReady && (
                            <Pill variant="outline" className="h-6 px-2 text-xs">
                              Code/JS
                            </Pill>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {resource.summary}
                        </p>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {resource.tags.slice(0, 4).map((tag) => (
                            <li key={`${resource.id}-${tag}`}>
                              <Pill variant="secondary" className="h-6 px-2 text-xs">
                                {tag}
                              </Pill>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                          <Link
                            href={`${detailBasePath}/${resource.id}`}
                            className="text-link inline-flex items-center gap-1"
                          >
                            Open details
                            <IconArrowRight className="size-3.5" aria-hidden />
                          </Link>
                          <Link href="/category/webflow" className="text-link">
                            Webflow category
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <section className="section-panel">
        <h2 className="section-title">Source and quality notes</h2>
        <ul className="section-list list-disc pl-5">
          <li>
            Data is curated into The Stash repository and normalized into
            consistent resource types for discovery.
          </li>
          <li>
            This section prioritizes implementation utility: apps, cloneables,
            templates, and inspiration are grouped separately to avoid mixed
            intent.
          </li>
          <li>
            Resource cards route to internal detail pages first. Source links
            are preserved only for attribution and research traceability.
          </li>
          <li>
            Code-ready flag is applied only where a resource clearly supports
            JavaScript/CSS/interaction workflows.
          </li>
        </ul>
      </section>
    </>
  );
}
