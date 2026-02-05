import { notFound } from "next/navigation";
import Link from "next/link";
import { getResourcesByType, getResourceTypesWithCounts } from "@/lib/sanity.resource";
import { getResourceTypeLabel } from "@/lib/resource-types";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { ResourceGrid } from "@/components/ResourceGrid";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export async function generateStaticParams() {
  const types = await getResourceTypesWithCounts();
  return types.map((t) => ({ slug: t.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const label = getResourceTypeLabel(slug);
  if (!label) return { title: "Not found" };
  return {
    title: `${label} | Type | The Stash`,
    description: `Dev and design resources of type: ${label}. Curated tools, inspiration, and links.`,
    alternates: { canonical: `${BASE_URL}/type/${slug}` },
    openGraph: {
      title: `${label} | Type | The Stash`,
      description: `Resources of type: ${label}.`,
      url: `${BASE_URL}/type/${slug}`,
    },
  };
}

export default async function TypeSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [resources, allTypes] = await Promise.all([
    getResourcesByType(slug),
    getResourceTypesWithCounts(),
  ]);

  const label = getResourceTypeLabel(slug);
  if (!label || !resources?.length) {
    notFound();
  }

  const otherTypes = allTypes.filter((t) => t.value !== slug).slice(0, 6);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Type", url: `${BASE_URL}/type` },
    { name: label, url: `${BASE_URL}/type/${slug}` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Type", href: "/type" },
            { label },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {label}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {resources.length} resource{resources.length !== 1 ? "s" : ""} of this type.
        </p>
        <section className="mt-8" aria-labelledby="type-resources">
          <h2 id="type-resources" className="sr-only">
            Resources
          </h2>
          <ResourceGrid resources={resources} />
        </section>
        {otherTypes.length > 0 && (
          <section className="mt-12 pt-10 border-t border-border" aria-labelledby="more-types">
            <h2 id="more-types" className="font-display text-lg font-semibold text-foreground mb-3">
              More types
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherTypes.map((t) => (
                <li key={t.value}>
                  <Link
                    href={`/type/${t.value}`}
                    className="inline-flex min-h-[2.75rem] items-center rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground"
                  >
                    {t.label} ({t.count})
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <Link href="/type" className="text-foreground underline underline-offset-2 hover:text-primary">
                View all types
              </Link>
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
