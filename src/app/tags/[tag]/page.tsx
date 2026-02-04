import { notFound } from "next/navigation";
import { getResourcesByTag, getAllTags } from "@/lib/sanity.resource";
import { isSanityConfigured } from "@/lib/sanity.client";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { ResourceGrid } from "@/components/ResourceGrid";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export async function generateStaticParams() {
  if (!isSanityConfigured()) return [];
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `${decoded} Resources | The Stash`,
    description: `Dev and design resources tagged with "${decoded}". Curated tools, inspiration, and links.`,
    alternates: { canonical: `${BASE_URL}/tags/${tag}` },
    openGraph: {
      title: `${decoded} Resources | The Stash`,
      description: `Dev and design resources tagged with "${decoded}".`,
      url: `${BASE_URL}/tags/${tag}`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const resources = await getResourcesByTag(decodedTag);

  if (!resources?.length) {
    notFound();
  }

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Tags", url: `${BASE_URL}/tags` },
    { name: decodedTag, url: `${BASE_URL}/tags/${tag}` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Tags", href: "/tags" },
            { label: decodedTag },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Resources tagged &ldquo;{decodedTag}&rdquo;
        </h1>
        <p className="mt-2 text-muted-foreground">
          {resources.length} resource{resources.length !== 1 ? "s" : ""} found.
        </p>
        <section className="mt-8" aria-labelledby="tag-resources">
          <h2 id="tag-resources" className="sr-only">
            Resources
          </h2>
          <ResourceGrid resources={resources} />
        </section>
      </main>
    </div>
  );
}
