"use client";

import { useEffect, useState } from "react";
import { ResourceCard } from "./ResourceCard";
import { getResourceSlug } from "@/lib/slug";
import type { Resource } from "@/types/resource";

const STORAGE_KEY = "thestash-recently-viewed";
const MAX_ITEMS = 6;

export function RecentlyViewed({
  resources,
  currentSlug,
  onTagClick,
  onCategoryClick,
  isSaved,
  onSaveToggle,
}: {
  resources: Resource[];
  currentSlug?: string;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  isSaved?: (slug: string) => boolean;
  onSaveToggle?: (slug: string) => void;
}) {
  const [viewedSlugs, setViewedSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !currentSlug) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev: string[] = raw ? JSON.parse(raw) : [];
      const next = [currentSlug, ...prev.filter((s) => s !== currentSlug)].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setViewedSlugs(next);
    } catch {
      // Ignore localStorage errors
    }
  }, [mounted, currentSlug]);

  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const slugs: string[] = raw ? JSON.parse(raw) : [];
      setViewedSlugs(slugs);
    } catch {
      setViewedSlugs([]);
    }
  }, [mounted]);

  const slugToResource = new Map(resources.map((r) => [getResourceSlug(r), r]));
  const viewed = viewedSlugs
    .map((slug) => slugToResource.get(slug))
    .filter((r): r is Resource => Boolean(r));

  if (viewed.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed">
      <h2 id="recently-viewed" className="font-display text-lg font-semibold text-foreground mb-4">
        Continue exploring
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {viewed.map((resource) => (
          <li key={resource._id}>
            <ResourceCard
              resource={resource}
              onTagClick={onTagClick}
              onCategoryClick={onCategoryClick}
              isSaved={isSaved}
              onSaveToggle={onSaveToggle}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
