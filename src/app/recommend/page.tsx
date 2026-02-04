import { Suspense } from "react";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesQuery } from "@/lib/sanity.queries";
import { AppNav } from "@/components/AppNav";
import { RecommendClient } from "./RecommendClient";
import type { Resource } from "@/types/resource";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tech Stack Recommender",
  description:
    "Find the right tools for your project based on your industry and requirements. Curated recommendations for auth, payments, hosting, design, and more.",
  openGraph: {
    title: "Tech Stack Recommender — The Stash",
    description:
      "Find the right tools for your project based on your industry and requirements.",
  },
};

export const revalidate = 60;

export default async function RecommendPage() {
  const resources: Resource[] = isSanityConfigured()
    ? (await sanityClient.fetch<Resource[]>(allResourcesQuery)) ?? []
    : [];

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl animate-pulse space-y-6">
            <div className="h-8 w-3/4 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        }
      >
        <RecommendClient resources={resources} />
      </Suspense>
    </main>
    </>
  );
}
