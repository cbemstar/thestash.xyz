"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { urlFor } from "@/lib/sanity.image";
import { getCategoryLabel } from "@/lib/categories";
import { getResourceSlug } from "@/lib/slug";
import { truncateAtWordBoundary } from "@/lib/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Pill } from "./kibo-ui/pill";
import { SaveButton } from "./SaveButton";
import type { Resource } from "@/types/resource";

const DESCRIPTION_MAX_CHARS = 90;

interface ResourceCardProps {
  resource: Resource;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  isSaved?: (slug: string) => boolean;
  onSaveToggle?: (slug: string) => void;
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

export function ResourceCard({ resource, onTagClick, onCategoryClick, isSaved, onSaveToggle }: ResourceCardProps) {
  const router = useRouter();
  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(80).height(80).url()
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
      className="group relative z-0 flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:z-10 hover:border-primary/30 hover:bg-card hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100"
    >
      {onSaveToggle && isSaved && (
        <div className="absolute right-3 top-3 z-10">
          <SaveButton slug={slug} isSaved={isSaved(slug)} onToggle={onSaveToggle} />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-center gap-3">
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
          <button
            type="button"
            onClick={handleCategoryClick}
            className="text-left"
          >
            <Pill variant="secondary" className="text-xs font-medium uppercase tracking-wider hover:bg-primary/20 cursor-pointer">
              {getCategoryLabel(resource.category)}
            </Pill>
          </button>
        </div>
        <h2 className="font-display text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {resource.title}
        </h2>
        <p className="mt-1.5 min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground">
          {shortDescription}
        </p>
        {Array.isArray(resource.tags) && resource.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
            {resource.tags.slice(0, 4).map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={(e) => handleTagClick(e, tag)}
                  className="text-left"
                >
                  <Pill variant="outline" className="text-xs font-normal cursor-pointer transition hover:bg-accent">
                    {tag}
                  </Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors" aria-hidden>
          View resource
          <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
