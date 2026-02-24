"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { ResourceCard } from "./ResourceCard";
import { ResourceListItem } from "./ResourceListItem";
import { Button } from "./ui/button";
import { Pagination } from "./kibo-ui/pagination";
import type { Resource } from "@/types/resource";
import type { ViewMode } from "./FilterBar";

const PAGE_SIZE = 18;

interface ResourceGridProps {
  resources: Resource[];
  /** Items per page (used for pagination) */
  pageSize?: number;
  /** Show page size selector. Set false when using a fixed/custom page size (e.g. saved page). */
  showPageSizeSelector?: boolean;
  viewMode?: ViewMode;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  isSaved?: (slug: string) => boolean;
  onSaveToggle?: (slug: string) => void;
  /** Vote state and handlers for upvote/downvote */
  voteFor?: (slug: string) => "up" | "down" | null;
  onUpvote?: (slug: string) => void;
  onDownvote?: (slug: string) => void;
  upvotes?: (slug: string) => number;
  downvotes?: (slug: string) => number;
  baseUrl?: string;
  /** When no resources match: if provided, show "Clear filters" button; else show "Browse all" link. */
  onClearFilters?: () => void;
}

export function ResourceGrid({
  resources,
  pageSize: initialPageSize = PAGE_SIZE,
  showPageSizeSelector = true,
  viewMode = "grid",
  onTagClick,
  onCategoryClick,
  isSaved,
  onSaveToggle,
  voteFor,
  onUpvote,
  onDownvote,
  upvotes,
  downvotes,
  baseUrl,
  onClearFilters,
}: ResourceGridProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [resources]);

  useEffect(() => {
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    document.getElementById("resource-list")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    document.getElementById("resource-list")?.scrollIntoView({ behavior: "smooth" });
  };

  const totalPages = Math.max(1, Math.ceil(resources.length / pageSize));
  const start = (page - 1) * pageSize;
  const visible = resources.slice(start, start + pageSize);

  if (resources.length === 0) {
    return (
      <div
        className="browse-shell px-6 py-12 text-center sm:px-10"
        role="status"
      >
        <MagnifyingGlassIcon className="mx-auto size-10 text-stash-muted-text/80" aria-hidden />
        <p className="mt-4 text-sm text-stash-muted-text">
          No resources match your filters. Try another category or search.
        </p>
        <div className="mt-6">
          {onClearFilters ? (
            <Button variant="default" onClick={onClearFilters} className="min-h-11">
              Clear filters
            </Button>
          ) : (
            <Button variant="default" asChild className="min-h-11">
              <Link href="/">Browse all</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isList = viewMode === "list";

  return (
    <div className="space-y-8" id="resource-list">
      <ul
        className={isList ? "flex flex-col gap-2" : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"}
        aria-label="Resource list"
      >
        {visible.map((resource, index) => (
          <li key={resource._id} className="min-w-0">
            {isList ? (
              <ResourceListItem
                resource={resource}
                onTagClick={onTagClick}
                onCategoryClick={onCategoryClick}
                isSaved={isSaved}
                onSaveToggle={onSaveToggle}
                priority={index < 6}
              />
            ) : (
              <ResourceCard
                resource={resource}
                onTagClick={onTagClick}
                onCategoryClick={onCategoryClick}
                isSaved={isSaved}
                onSaveToggle={onSaveToggle}
                voteFor={voteFor}
                onUpvote={onUpvote}
                onDownvote={onDownvote}
                upvotes={upvotes}
                downvotes={downvotes}
                baseUrl={baseUrl}
                priority={index < 6}
              />
            )}
          </li>
        ))}
      </ul>
      {(totalPages > 1 || (showPageSizeSelector && resources.length > 0)) && (
        <Pagination
          page={page}
          totalItems={resources.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={showPageSizeSelector ? handlePageSizeChange : undefined}
          showPageSize={showPageSizeSelector}
          showFirstLast
          showSummary
          showJumpTo
          itemLabel="resources"
        />
      )}
    </div>
  );
}
