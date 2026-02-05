import Link from "next/link";
import { getResourceTypesWithCounts } from "@/lib/sanity.resource";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export const metadata: Metadata = {
  title: "Browse by type | The Stash",
  description:
    "Browse dev and design resources by type: apps, websites, libraries, tools, and more.",
  alternates: { canonical: `${BASE_URL}/type` },
  openGraph: {
    title: "Browse by type | The Stash",
    url: `${BASE_URL}/type`,
  },
};

export default async function TypeIndexPage() {
  const types = await getResourceTypesWithCounts();
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Type", url: `${BASE_URL}/type` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Type" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Browse by type
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Find resources by kind: apps, websites, libraries, tools, and more.
        </p>
        {!types?.length ? (
          <p className="mt-8 text-muted-foreground">
            No types yet. Add a resource type to resources in Studio to see them here.
          </p>
        ) : (
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Resource types">
            {types.map((t) => (
              <li key={t.value}>
                <Link
                  href={`/type/${t.value}`}
                  className="inline-block"
                >
                  <span className="inline-flex min-h-[2.75rem] items-center rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground">
                    {t.label}
                    <span className="ml-2 text-xs opacity-80">({t.count})</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
