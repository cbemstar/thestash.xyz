import { notFound } from "next/navigation";
import { Suspense } from "react";
import { sanityClient, isSanityConfigured } from "@/lib/sanity.client";
import { allResourcesQuery } from "@/lib/sanity.queries";
import { CATEGORIES, getCategoryLabel } from "@/lib/categories";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { CategoryPageClient } from "@/components/CategoryPageClient";
import type { Resource } from "@/types/resource";
import type { ResourceCategory } from "@/types/resource";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

const VALID_CATEGORY_SLUGS = new Set(CATEGORIES.map((c) => c.value));

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!VALID_CATEGORY_SLUGS.has(slug as ResourceCategory)) {
    return { title: "Not found" };
  }
  const label = getCategoryLabel(slug as ResourceCategory);
  const title = `${label} resources | Category | The Stash`;
  const description = `Curated ${label.toLowerCase()} resources: tools, links, and learning for developers and designers.`;
  const canonical = `${BASE_URL}/category/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Stash",
      type: "website",
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!VALID_CATEGORY_SLUGS.has(slug as ResourceCategory)) {
    notFound();
  }

  const resources: Resource[] = isSanityConfigured()
    ? (await sanityClient.fetch<Resource[]>(allResourcesQuery)) ?? []
    : [];

  const categoryLabel = getCategoryLabel(slug as ResourceCategory);
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Category", url: `${BASE_URL}/category` },
    { name: categoryLabel, url: `${BASE_URL}/category/${slug}` },
  ];

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <Suspense fallback={null}>
        <CategoryPageClient
          resources={resources}
          categorySlug={slug as ResourceCategory}
          categoryLabel={categoryLabel}
        />
      </Suspense>
    </>
  );
}
