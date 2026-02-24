"use client";

import Link from "next/link";
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
  voteFor,
  onUpvote,
  onDownvote,
  upvotes,
  downvotes,
  baseUrl,
}: {
  resources: Resource[];
  currentSlug?: string;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  isSaved?: (slug: string) => boolean;
  onSaveToggle?: (slug: string) => void;
  voteFor?: (slug: string) => "up" | "down" | null;
  onUpvote?: (slug: string) => void;
  onDownvote?: (slug: string) => void;
  upvotes?: (slug: string) => number;
  downvotes?: (slug: string) => number;
  baseUrl?: string;
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
    <section
      aria-labelledby="recently-viewed"
      className="browse-shell px-4 py-6 sm:px-6 sm:py-7"
    >
      <div className="mb-5 flex flex-wrap items-end justify-start gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stash-muted-text">
            Continue
          </p>
          <h2 id="recently-viewed" className="mt-1 font-display text-xl font-semibold text-foreground">
            Continue exploring
          </h2>
          <p className="mt-1 text-sm text-stash-muted-text">
            Jump back into resources you viewed recently.
          </p>
        </div>
        <Link
          href="/saved"
          className="inline-flex min-h-10 items-center rounded-full border border-stash-line-soft bg-stash-control px-3.5 text-sm font-medium text-stash-muted-text transition hover:border-stash-line-strong hover:text-foreground"
        >
          Open saved list
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {viewed.map((resource) => (
          <li key={resource._id}>
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
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
