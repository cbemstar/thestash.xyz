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
const MOBILE_TAG_LIMIT = 4;

interface ResourceListItemProps {
  resource: Resource;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  isSaved?: (slug: string) => boolean;
  onSaveToggle?: (slug: string) => void;
  /** Set for above-the-fold images to improve LCP */
  priority?: boolean;
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
  priority,
}: ResourceListItemProps) {
  const router = useRouter();
  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(160).height(160).url()
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
      className="browse-card group flex items-start gap-3 px-3.5 py-3 text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:items-center sm:gap-4 sm:px-4"
    >
      {iconSource ? (
        <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-stash-control sm:h-10 sm:w-10">
          <Image
            src={iconSource}
            alt=""
            width={40}
            height={40}
            className="object-cover"
            unoptimized={iconSource.includes("google.com/s2/favicons")}
            priority={priority}
          />
        </span>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stash-control font-mono text-sm text-stash-muted-text sm:h-10 sm:w-10" aria-hidden>
          {resource.title.charAt(0).toUpperCase()}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="min-w-0 truncate font-display font-semibold text-foreground group-hover:text-primary">
            {resource.title}
          </h2>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleCategoryClick}
              className="min-w-0 max-w-full text-left"
              title={getCategoryLabel(resource.category)}
            >
              <Pill
                variant="outline"
                className="max-w-[12rem] truncate border-stash-line-soft bg-stash-control text-xs font-medium uppercase tracking-[0.08em] text-stash-muted-text hover:border-stash-line-strong hover:bg-stash-control-hover hover:text-foreground sm:max-w-full"
              >
                {getCategoryLabel(resource.category)}
              </Pill>
            </button>
            {addedAt && (
              <span className="shrink-0 text-xs text-stash-muted-text" title="Added">
                {addedAt}
              </span>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-stash-muted-text line-clamp-2">{shortDescription}</p>
        {Array.isArray(resource.tags) && resource.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tags">
            {resource.tags.slice(0, MOBILE_TAG_LIMIT).map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={(e) => handleTagClick(e, tag)}
                  className="max-w-full text-left"
                >
                  <Pill variant="outline" className="max-w-[10rem] truncate border-stash-line-soft bg-stash-control text-xs font-normal text-stash-muted-text transition hover:border-stash-line-strong hover:bg-stash-control-hover hover:text-foreground sm:max-w-full">
                    {tag}
                  </Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 self-start sm:self-center">
        {onSaveToggle && isSaved && (
          <SaveButton slug={slug} isSaved={isSaved(slug)} onToggle={onSaveToggle} />
        )}
        <span className="inline-flex min-h-11 min-w-9 items-center justify-center" aria-hidden>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-stash-muted-text transition-colors group-hover:text-primary"
            aria-hidden
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
