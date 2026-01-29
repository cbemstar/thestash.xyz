import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesQuery } from "@/lib/sanity.queries";
import { StashPage } from "@/components/StashPage";
import type { Resource } from "@/types/resource";

export const revalidate = 60;

export default async function Home() {
  const resources: Resource[] = isSanityConfigured()
    ? (await sanityClient.fetch<Resource[]>(allResourcesQuery)) ?? []
    : [];
  return <StashPage resources={resources} />;
}
