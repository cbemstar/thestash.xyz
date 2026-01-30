import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import {
  allCollectionsQuery,
  collectionBySlugQuery,
} from "@/lib/sanity.queries";
import { getCollectionSlug } from "@/lib/slug";
import type { Collection } from "@/types/collection";

export async function getCollectionBySlug(
  slug: string
): Promise<Collection | null> {
  if (!isSanityConfigured()) return null;
  const bySlug = await sanityClient.fetch<Collection | null>(
    collectionBySlugQuery,
    { slug }
  );
  if (bySlug) return bySlug;
  const all = await sanityClient.fetch<Collection[]>(allCollectionsQuery);
  return all?.find((c) => getCollectionSlug(c) === slug) ?? null;
}

export async function getAllCollections(): Promise<Collection[]> {
  if (!isSanityConfigured()) return [];
  return (await sanityClient.fetch<Collection[]>(allCollectionsQuery)) ?? [];
}

export async function getAllCollectionSlugs(): Promise<string[]> {
  if (!isSanityConfigured()) return [];
  const collections = await sanityClient.fetch<Collection[]>(allCollectionsQuery);
  if (!collections?.length) return [];
  return collections.map((c) => getCollectionSlug(c));
}
