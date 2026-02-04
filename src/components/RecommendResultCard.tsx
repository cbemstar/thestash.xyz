"use client";

import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity.image";
import { getCategoryLabel } from "@/lib/categories";
import { getResourceSlug } from "@/lib/slug";
import { getPricingLabel, getAdoptionLabel } from "@/lib/recommender";
import { truncateAtWordBoundary } from "@/lib/utils";
import { Pill } from "./kibo-ui/pill";
import type { Resource } from "@/types/resource";
import type { ScoredResource } from "@/lib/recommender";

interface RecommendResultCardProps {
  scored: ScoredResource;
}

function faviconForUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return "";
  }
}

export function RecommendResultCard({ scored }: RecommendResultCardProps) {
  const { resource, reasons } = scored;
  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(80).height(80).url()
    : faviconForUrl(resource.url);
  const slug = getResourceSlug(resource);
  const shortDescription = truncateAtWordBoundary(resource.description, 100);
  const blurb = resource.recommenderBlurb?.trim();
  const pricingLabel = getPricingLabel(resource.pricing ?? undefined);
  const adoptionLabel = getAdoptionLabel(resource.adoptionTier ?? undefined);

  return (
    <Link
      href={`/${slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none"
    >
      <div className="flex gap-4">
        <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
          {iconSource ? (
            <Image
              src={iconSource}
              alt=""
              width={48}
              height={48}
              className="object-cover"
              unoptimized={iconSource.includes("google.com/s2/favicons")}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-lg text-muted-foreground">
              {resource.title.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
              {resource.title}
            </h2>
            <Pill variant="secondary" className="text-xs font-medium uppercase tracking-wider">
              {getCategoryLabel(resource.category)}
            </Pill>
            {pricingLabel && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {pricingLabel}
              </span>
            )}
            {adoptionLabel && (
              <span className="text-xs text-muted-foreground" title="Adoption">
                {adoptionLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {blurb || shortDescription}
          </p>
          {reasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reasons.slice(0, 4).map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
            View resource
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
