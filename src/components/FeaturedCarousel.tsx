"use client";

import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ResourceCard } from "./ResourceCard";
import type { Resource } from "@/types/resource";

interface FeaturedCarouselProps {
  resources: Resource[];
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
}

export function FeaturedCarousel({
  resources,
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
}: FeaturedCarouselProps) {
  const display = [...resources]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 8);

  if (display.length === 0) return null;

  return (
    <section aria-labelledby="featured-resources" className="browse-shell px-4 py-6 sm:px-6 sm:py-7">
      <div className="mb-5 flex flex-wrap items-end justify-start gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stash-muted-text">
            Latest
          </p>
          <h2 id="featured-resources" className="mt-1 font-display text-xl font-semibold text-foreground">
            Recently added resources
          </h2>
          <p className="mt-1 text-sm text-stash-muted-text">
            Newest additions from the directory.
          </p>
        </div>
        <Link
          href="/latest"
          className="inline-flex min-h-10 items-center rounded-full border border-stash-line-soft bg-stash-control px-3.5 text-sm font-medium text-stash-muted-text transition hover:border-stash-line-strong hover:text-foreground"
        >
          View latest
        </Link>
      </div>
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-2 items-stretch sm:-ml-4">
          {display.map((resource, index) => (
            <CarouselItem
              key={resource._id}
              className="flex h-full basis-full pl-2 sm:basis-1/2 sm:pl-4 lg:basis-1/3"
            >
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
                priority={index < 3}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex sm:-left-3" />
        <CarouselNext className="hidden sm:flex sm:-right-3" />
      </Carousel>
    </section>
  );
}
