"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { urlFor } from "@/lib/sanity.image";
import { getCategoryLabel } from "@/lib/categories";
import { getResourceSlug } from "@/lib/slug";
import { truncateAtWordBoundary } from "@/lib/utils";
import { Pill } from "./kibo-ui/pill";
import { SaveButton } from "./SaveButton";
import type { Resource } from "@/types/resource";

const DESCRIPTION_MAX_CHARS = 140;

interface ResourceListItemProps {
  resource: Resource;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  isSaved?: (slug: string) => boolean;
  onSaveToggle?: (slug: string) => void;
}

function faviconForUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return "";
  }
}

export function ResourceListItem({
  resource,
  onTagClick,
  onCategoryClick,
  isSaved,
  onSaveToggle,
}: ResourceListItemProps) {
  const router = useRouter();
  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(80).height(80).url()
    : faviconForUrl(resource.url);

  const slug = getResourceSlug(resource);
  const shortDescription = truncateAtWordBoundary(resource.description, DESCRIPTION_MAX_CHARS);
  const addedAt = resource.createdAt ? formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true }) : null;

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) onTagClick(tag);
    else router.push(`/?search=${encodeURIComponent(tag)}`);
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCategoryClick) onCategoryClick(resource.category);
    else router.push(`/category/${resource.category}`);
  };

  return (
    <Link
      href={`/${slug}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-primary/30 hover:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      {iconSource ? (
        <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={iconSource}
            alt=""
            width={40}
            height={40}
            className="object-cover"
            unoptimized={iconSource.includes("google.com/s2/favicons")}
          />
        </span>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-sm text-muted-foreground" aria-hidden>
          {resource.title.charAt(0).toUpperCase()}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display font-semibold text-foreground group-hover:text-primary truncate">
            {resource.title}
          </h2>
          <button type="button" onClick={handleCategoryClick} className="shrink-0 text-left">
            <Pill variant="secondary" className="text-xs font-medium uppercase tracking-wider hover:bg-primary/20">
              {getCategoryLabel(resource.category)}
            </Pill>
          </button>
          {addedAt && (
            <span className="shrink-0 text-xs text-muted-foreground" title="Added">
              {addedAt}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{shortDescription}</p>
        {Array.isArray(resource.tags) && resource.tags.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Tags">
            {resource.tags.slice(0, 5).map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={(e) => handleTagClick(e, tag)}
                  className="text-left"
                >
                  <Pill variant="outline" className="text-xs font-normal transition hover:bg-accent">
                    {tag}
                  </Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {onSaveToggle && isSaved && (
          <SaveButton slug={slug} isSaved={isSaved(slug)} onToggle={onSaveToggle} />
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
          aria-hidden
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
