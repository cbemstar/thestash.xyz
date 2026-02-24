import { Suspense } from "react";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesLiteQuery } from "@/lib/sanity.queries";
import { getAllCollections } from "@/lib/sanity.collection";
import { StashPage } from "@/components/StashPage";
import { HomepageFAQJsonLd } from "@/components/HomepageFAQJsonLd";
import { HomepageItemListJsonLd } from "@/components/HomepageItemListJsonLd";
import type { Resource } from "@/types/resource";
import type { Collection } from "@/types/collection";

import { BASE_URL } from "@/lib/site-url";

export const revalidate = 21600; // 6 hr — further reduce ISR writes on free plan

export const metadata = {
  alternates: {
    canonical: BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`,
  },
};

export default async function Home() {
  const [resources, collections]: [Resource[], Collection[]] = isSanityConfigured()
    ? await Promise.all([
        sanityClient.fetch<Resource[]>(allResourcesLiteQuery) ?? [],
        getAllCollections(),
      ])
    : [[], []];
  return (
    <>
      <HomepageFAQJsonLd />
      <HomepageItemListJsonLd resources={resources} />
      <Suspense fallback={null}>
        <StashPage resources={resources} collections={collections ?? []} />
      </Suspense>
    </>
  );
}
