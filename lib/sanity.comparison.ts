import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import {
  allComparisonsQuery,
  allComparisonSlugsQuery,
  comparisonBySlugQuery,
} from "@/lib/sanity.queries";
import type { Comparison } from "@/types/comparison";

function normalizeSlugValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "current" in value &&
    typeof (value as { current?: unknown }).current === "string"
  ) {
    return (value as { current: string }).current;
  }
  return "";
}

export async function getComparisonBySlug(slug: string): Promise<Comparison | null> {
  if (!isSanityConfigured()) return null;
  const bySlug = await sanityClient.fetch<Comparison | null>(comparisonBySlugQuery, { slug });
  if (bySlug) return bySlug;
  const all = await sanityClient.fetch<Comparison[]>(allComparisonsQuery);
  return all?.find((c) => normalizeSlugValue(c.slug) === slug) ?? null;
}

export async function getAllComparisons(): Promise<Comparison[]> {
  if (!isSanityConfigured()) return [];
  return (await sanityClient.fetch<Comparison[]>(allComparisonsQuery)) ?? [];
}

export async function getAllComparisonSlugs(): Promise<string[]> {
  if (!isSanityConfigured()) return [];
  const rows = await sanityClient.fetch<Array<{ slug?: string | { current?: string } }>>(
    allComparisonSlugsQuery
  );
  return [...new Set((rows ?? []).map((r) => normalizeSlugValue(r.slug)).filter(Boolean))];
}
