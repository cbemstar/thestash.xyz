"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { urlFor } from "@/lib/sanity.image";
import { getCategoryLabel } from "@/lib/categories";
import { getResourceSlug } from "@/lib/slug";
import { cn, truncateAtWordBoundary } from "@/lib/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Pill } from "./kibo-ui/pill";
import { SaveButton } from "./SaveButton";
import { VoteButtons } from "./VoteButtons";
import { CopyLinkButton } from "./CopyLinkButton";
import type { Resource } from "@/types/resource";

const DESCRIPTION_MAX_CHARS = 90;
const getBaseUrl = () =>
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thestash.xyz");

interface ResourceCardProps {
  resource: Resource;
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
  /** Base URL for copy link (defaults to current origin) */
  baseUrl?: string;
  /** Set for above-the-fold images to improve LCP */
  priority?: boolean;
}

/** Favicon URL for a given origin. */
function faviconForUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return "";
  }
}

export function ResourceCard({ resource, onTagClick, onCategoryClick, isSaved, onSaveToggle, voteFor, onUpvote, onDownvote, upvotes, downvotes, baseUrl, priority }: ResourceCardProps) {
  const router = useRouter();
  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(160).height(160).url()
    : faviconForUrl(resource.url);

  const slug = getResourceSlug(resource);

  const shortDescription = truncateAtWordBoundary(resource.description, DESCRIPTION_MAX_CHARS);

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(tag);
    } else {
      router.push(`/?search=${encodeURIComponent(tag)}`);
    }
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCategoryClick) {
      onCategoryClick(resource.category);
    } else {
      router.push(`/category/${resource.category}`);
    }
  };

  return (
    <Link
      href={`/${slug}`}
      className="browse-card group relative z-0 flex h-full min-w-0 cursor-pointer flex-col p-5 text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none"
    >
      {onSaveToggle && isSaved && (
        <div className="absolute right-3 top-3 z-10">
          <SaveButton slug={slug} isSaved={isSaved(slug)} onToggle={onSaveToggle} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "mb-2 flex min-w-0 items-start justify-start gap-3",
            onSaveToggle && isSaved && "pr-12"
          )}
        >
          {iconSource ? (
            <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stash-control">
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
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stash-control font-mono text-sm text-stash-muted-text" aria-hidden>
              {resource.title.charAt(0).toUpperCase()}
            </span>
          )}
          <h2 className="min-w-0 flex-1 break-words font-display text-lg font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary" title={resource.title}>
            {resource.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleCategoryClick}
          className="mb-3 w-fit text-left"
          title={getCategoryLabel(resource.category)}
        >
          <Pill
            variant="outline"
            className="max-w-full truncate border-stash-line-soft bg-stash-control px-2.5 py-0.5 text-[10px] font-medium uppercase leading-tight tracking-[0.08em] text-stash-muted-text hover:border-stash-line-strong hover:bg-stash-control-hover hover:text-foreground cursor-pointer"
          >
            {getCategoryLabel(resource.category)}
          </Pill>
        </button>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-stash-muted-text" title={resource.description ?? undefined}>
          {shortDescription}
        </p>
        {Array.isArray(resource.tags) && resource.tags.length > 0 && (
          <ul className="mt-3 flex min-w-0 w-fit flex-wrap gap-1.5" aria-label="Tags">
            {resource.tags.slice(0, 4).map((tag) => (
              <li key={tag} className="min-w-0 max-w-full">
                <button
                  type="button"
                  onClick={(e) => handleTagClick(e, tag)}
                  className="max-w-full text-left"
                  title={tag}
                >
                  <Pill variant="outline" className="max-w-full truncate border-stash-line-soft bg-stash-control text-xs font-normal text-stash-muted-text cursor-pointer transition hover:border-stash-line-strong hover:bg-stash-control-hover hover:text-foreground">
                    {tag}
                  </Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto">
          <div
            className="mt-4 flex items-center justify-between border-t border-stash-line-soft pt-3"
            onClick={(e) => e.preventDefault()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1">
              {voteFor && onUpvote && onDownvote && (
                <VoteButtons
                  slug={slug}
                  vote={voteFor(slug)}
                  upvotes={upvotes?.(slug) ?? 0}
                  downvotes={downvotes?.(slug) ?? 0}
                  onUpvote={onUpvote}
                  onDownvote={onDownvote}
                />
              )}
              <CopyLinkButton
                url={`${baseUrl ?? getBaseUrl()}/${slug}`}
                className={voteFor ? "-ml-0.5" : ""}
              />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-stash-muted-text transition-colors group-hover:text-primary" aria-hidden>
              View resource
              <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
