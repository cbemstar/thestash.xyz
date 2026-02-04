"use client";

import { useState, useEffect } from "react";
import { ResourceCard } from "./ResourceCard";
import { ResourceListItem } from "./ResourceListItem";
import { Button } from "./ui/button";
import { Spinner } from "./kibo-ui/spinner";
import type { Resource } from "@/types/resource";
import type { ViewMode } from "./FilterBar";

const INITIAL_COUNT = 18;
const LOAD_MORE_COUNT = 12;

interface ResourceGridProps {
  resources: Resource[];
  initialCount?: number;
  loadMoreCount?: number;
  viewMode?: ViewMode;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  isSaved?: (slug: string) => boolean;
  onSaveToggle?: (slug: string) => void;
}

export function ResourceGrid({
  resources,
  initialCount = INITIAL_COUNT,
  loadMoreCount = LOAD_MORE_COUNT,
  viewMode = "grid",
  onTagClick,
  onCategoryClick,
  isSaved,
  onSaveToggle,
}: ResourceGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [resources, initialCount]);

  const visible = resources.slice(0, visibleCount);
  const hasMore = visibleCount < resources.length;
  const remaining = resources.length - visibleCount;

  if (resources.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground" role="status">
        No resources match your filters. Try another category or search.
      </p>
    );
  }

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + loadMoreCount, resources.length));
      setTimeout(() => setIsLoadingMore(false), 150);
    });
  };

  const isList = viewMode === "list";

  return (
    <div className="space-y-8">
      <ul
        className={isList ? "flex flex-col gap-2" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"}
        aria-label="Resource list"
      >
        {visible.map((resource) => (
          <li key={resource._id}>
            {isList ? (
              <ResourceListItem
                resource={resource}
                onTagClick={onTagClick}
                onCategoryClick={onCategoryClick}
                isSaved={isSaved}
                onSaveToggle={onSaveToggle}
              />
            ) : (
              <ResourceCard
                resource={resource}
                onTagClick={onTagClick}
                onCategoryClick={onCategoryClick}
                isSaved={isSaved}
                onSaveToggle={onSaveToggle}
              />
            )}
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="min-w-[160px] gap-2"
          >
            {isLoadingMore ? (
              <>
                <Spinner variant="ellipsis" size={16} />
                Loading…
              </>
            ) : (
              `Load more (${remaining} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
