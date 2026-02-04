import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesQuery } from "@/lib/sanity.queries";
import { SavedPageClient } from "./SavedPageClient";
import type { Resource } from "@/types/resource";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export const metadata: Metadata = {
  title: "Saved Resources | The Stash",
  description: "Your saved dev and design resources. Quick access to tools and links you want to revisit.",
  openGraph: {
    title: "Saved Resources | The Stash",
    url: `${BASE_URL}/saved`,
  },
};

export default async function SavedPage() {
  const resources: Resource[] = isSanityConfigured()
    ? (await sanityClient.fetch<Resource[]>(allResourcesQuery)) ?? []
    : [];

  return <SavedPageClient resources={resources} />;
}
