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
}

export function FeaturedCarousel({
  resources,
  onTagClick,
  onCategoryClick,
  isSaved,
  onSaveToggle,
}: FeaturedCarouselProps) {
  const featured = resources.filter((r) => r.featured).slice(0, 8);
  const display = featured.length >= 4 ? featured : resources.slice(0, 6);

  if (display.length === 0) return null;

  return (
    <section aria-labelledby="featured-resources">
      <h2 id="featured-resources" className="font-display text-lg font-semibold text-foreground mb-4">
        {featured.length >= 4 ? "Featured" : "Recently added"}
      </h2>
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-2 sm:-ml-4 pt-2">
          {display.map((resource) => (
            <CarouselItem key={resource._id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <ResourceCard
                resource={resource}
                onTagClick={onTagClick}
                onCategoryClick={onCategoryClick}
                isSaved={isSaved}
                onSaveToggle={onSaveToggle}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </section>
  );
}
