import Link from "next/link";
import { getRecentResources } from "@/lib/sanity.resource";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { LatestPageClient } from "@/components/LatestPageClient";
import type { Resource } from "@/types/resource";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Latest resources | The Stash",
  description:
    "Recently added dev & design resources. New tools, inspiration, and links added to The Stash in the past week.",
  alternates: { canonical: `${BASE_URL}/latest` },
  openGraph: {
    title: "Latest resources | The Stash",
    url: `${BASE_URL}/latest`,
  },
  robots: { index: true, follow: true },
};

export const revalidate = 60; // 60 seconds - fresh enough for "Recently Added" while limiting ISR writes

export default async function LatestPage() {
  const resources: Resource[] = await getRecentResources(7);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Latest resources", url: `${BASE_URL}/latest` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Latest resources" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Latest resources
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Resources added in the past 7 days. Sent weekly to subscribers every Monday.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
            Browse all resources
          </Link>
          {" · "}
          <Link href="/collections" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
            Collections
          </Link>
        </p>

        <LatestPageClient resources={resources} />
      </main>
    </div>
  );
}
