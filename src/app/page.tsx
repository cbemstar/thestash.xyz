import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesQuery } from "@/lib/sanity.queries";
import { getAllCollections } from "@/lib/sanity.collection";
import { StashPage } from "@/components/StashPage";
import { HomepageFAQJsonLd } from "@/components/HomepageFAQJsonLd";
import type { Resource } from "@/types/resource";
import type { Collection } from "@/types/collection";

export const revalidate = 60;

export default async function Home() {
  const [resources, collections]: [Resource[], Collection[]] = isSanityConfigured()
    ? await Promise.all([
        sanityClient.fetch<Resource[]>(allResourcesQuery) ?? [],
        getAllCollections(),
      ])
    : [[], []];
  return (
    <>
      <HomepageFAQJsonLd />
      <StashPage resources={resources} collections={collections ?? []} />
    </>
  );
}
