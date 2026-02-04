import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getResourceBySlug, getAllResourceSlugs, getResourcesInCategory } from "@/lib/sanity.resource";
import { getCollectionsContainingResource } from "@/lib/sanity.collection";
import { urlFor } from "@/lib/sanity.image";
import { getCategoryLabel } from "@/lib/categories";
import { getCollectionSlugForCategory } from "@/lib/collections-seo";
import { getResourceSlug, getCollectionSlug } from "@/lib/slug";
import { getResourceExtendedContent } from "@/lib/resource-content";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { ShareMenu } from "@/components/ShareMenu";
import { ResourcePageSaveButton } from "@/components/ResourcePageSaveButton";
import { RecordView } from "@/components/RecordView";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pill } from "@/components/kibo-ui/pill";
import type { Resource } from "@/types/resource";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";
const RESERVED_SLUGS = ["studio", "api"];

function faviconForUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return "";
  }
}

export async function generateStaticParams() {
  const slugs = await getAllResourceSlugs();
  return slugs
    .filter((s) => !RESERVED_SLUGS.includes(s))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource) return { title: "Not found" };

  const title = `${resource.title} | The Stash`;
  const description =
    resource.description ||
    `${resource.title} — dev & design resource. ${getCategoryLabel(resource.category)}.`;
  const canonical = `${BASE_URL}/${slug}`;
  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(120).height(120).url()
    : faviconForUrl(resource.url);
  const ogImage =
    resource.icon?.asset?._ref
      ? urlFor(resource.icon).width(1200).height(630).url()
      : iconSource;

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
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: resource.title }]
        : [],
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

function ResourceJsonLd({
  resource,
  slug,
  imageUrl,
  baseUrl,
}: {
  resource: Resource;
  slug: string;
  imageUrl: string | null;
  baseUrl: string;
}) {
  const description =
    (resource.body?.trim() && resource.body.length > 0
      ? resource.body.slice(0, 500) + (resource.body.length > 500 ? "…" : "")
      : null) || resource.description;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: resource.title,
    description,
    url: resource.url,
    applicationCategory: getCategoryLabel(resource.category),
    ...(imageUrl
      ? {
          image: {
            "@type": "ImageObject" as const,
            url: imageUrl,
            width: 120,
            height: 120,
          },
        }
      : {}),
    publisher: {
      "@type": "Organization" as const,
      name: "The Stash",
      url: baseUrl,
    },
    ...(resource.createdAt
      ? {
          datePublished: resource.createdAt,
          dateModified: resource.createdAt,
        }
      : {}),
    ...(resource.tags?.length
      ? { keywords: resource.tags.join(", ") }
      : {}),
    mainEntityOfPage: {
      "@type": "WebPage" as const,
      "@id": `${baseUrl}/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) notFound();
  const resource = await getResourceBySlug(slug);
  if (!resource) notFound();
  const [related, similar] = await Promise.all([
    getCollectionsContainingResource(resource._id),
    getResourcesInCategory(resource.category, resource._id, 6),
  ]);

  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(120).height(120).url()
    : faviconForUrl(resource.url);

  const breadcrumbItems = [
    { name: "The Stash", url: BASE_URL + "/" },
    { name: resource.title, url: `${BASE_URL}/${slug}` },
  ];

  const extendedContent = getResourceExtendedContent(slug);
  const definition = extendedContent?.definition ?? null;
  const overviewParagraphs =
    (resource.body?.trim() && [resource.body]) ||
    (extendedContent?.overview?.length ? extendedContent.overview : null);
  const benefitsList = extendedContent?.benefits?.length ? extendedContent.benefits : null;
  const useCasesList = extendedContent?.useCases?.length ? extendedContent.useCases : null;
  const sourcesList =
    (resource.sources?.length ? resource.sources : null) ||
    (extendedContent?.sources?.length ? extendedContent.sources : null);
  const categoryCollectionSlug = getCollectionSlugForCategory(resource.category);
  const categoryLabel = getCategoryLabel(resource.category);

  const resourceSlug = getResourceSlug(resource);

  return (
    <>
      <RecordView slug={resourceSlug} />
      <ResourceJsonLd
        resource={resource}
        slug={resourceSlug}
        imageUrl={iconSource || null}
        baseUrl={BASE_URL}
      />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />

        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: resource.title },
            ]}
            className="mb-6"
          />
          <article className="space-y-6">
            <div className="flex items-start gap-4">
              {iconSource ? (
                <span className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={iconSource}
                    alt=""
                    width={56}
                    height={56}
                    className="object-cover"
                    unoptimized={iconSource.includes("google.com/s2/favicons")}
                  />
                </span>
              ) : (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted font-display text-xl text-muted-foreground"
                  aria-hidden
                >
                  {resource.title.charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {getCategoryLabel(resource.category)}
                </p>
                <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl mt-0.5">
                  {resource.title}
                </h1>
              </div>
            </div>

            <p className="text-foreground leading-relaxed text-lg">
              {resource.description}
            </p>

            {/* Internal links: Explore (SEO + crawlability) */}
            <Card className="border-border" role="navigation" aria-label="Explore">
              <CardHeader className="pb-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Explore
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <li>
                  <Link href="/" className="text-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                    All resources
                  </Link>
                </li>
                <li>
                  <Link href="/collections" className="text-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                    Collections
                  </Link>
                </li>
                {categoryCollectionSlug && (
                  <li>
                    <Link href={`/collections/${categoryCollectionSlug}`} className="text-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                      More in {categoryLabel}
                    </Link>
                  </li>
                )}
                </ul>
              </CardContent>
            </Card>

            {definition && (
              <section className="space-y-2" aria-labelledby="what-is">
                <h2 id="what-is" className="font-display text-lg font-semibold text-foreground">
                  What is {resource.title}?
                </h2>
                <p className="text-foreground leading-relaxed">
                  {definition}
                  {categoryCollectionSlug && (
                    <>{" "}
                      <Link href={`/collections/${categoryCollectionSlug}`} className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
                        See it in our {categoryLabel} collection
                      </Link>.
                    </>
                  )}
                </p>
              </section>
            )}

            {benefitsList && benefitsList.length > 0 && (
              <section className="space-y-3" aria-labelledby="benefits">
                <h2 id="benefits" className="font-display text-lg font-semibold text-foreground">
                  Key benefits
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-foreground leading-relaxed">
                  {benefitsList.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </section>
            )}

            {useCasesList && useCasesList.length > 0 && (
              <section className="space-y-3" aria-labelledby="use-cases">
                <h2 id="use-cases" className="font-display text-lg font-semibold text-foreground">
                  Use cases
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-foreground leading-relaxed">
                  {useCasesList.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </section>
            )}

            {overviewParagraphs && overviewParagraphs.length > 0 && (
              <section className="space-y-4" aria-labelledby="about-resource">
                <h2 id="about-resource" className="font-display text-lg font-semibold text-foreground">
                  About {resource.title}
                </h2>
                <div className="space-y-3 text-foreground leading-relaxed">
                  {overviewParagraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )}

            {sourcesList && sourcesList.length > 0 && (
              <section className="space-y-3" aria-labelledby="sources">
                <h2 id="sources" className="font-display text-lg font-semibold text-foreground">
                  Sources &amp; further reading
                </h2>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {sourcesList.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {Array.isArray(resource.tags) && resource.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Tags">
                {resource.tags.map((tag) => (
                  <li key={tag}>
                    <Pill variant="secondary" className="font-normal">
                      {tag}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-3 pt-4">
              <ResourcePageSaveButton slug={resourceSlug} />
              <ShareMenu
                url={`${BASE_URL}/${resourceSlug}`}
                title={resource.title}
                description={resource.description}
                className="rounded-xl border-border bg-muted/50 px-5 py-3 hover:bg-muted"
              />
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Visit site
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              {getCollectionSlugForCategory(resource.category) && (
                <Link
                  href={`/collections/${getCollectionSlugForCategory(resource.category)}`}
                  className="inline-flex items-center rounded-xl border border-border bg-muted/50 px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  More in {getCategoryLabel(resource.category)}
                </Link>
              )}
              <Link
                href="/collections"
                className="inline-flex items-center rounded-xl border border-border bg-muted/50 px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Browse collections
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-border bg-muted/50 px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                All resources
              </Link>
            </div>

            {similar.length > 0 && (
              <section className="mt-10 pt-8 border-t border-border" aria-labelledby="similar-resources">
                <h2 id="similar-resources" className="font-display text-lg font-semibold text-foreground mb-3">
                  Similar resources in {categoryLabel}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  More {categoryLabel.toLowerCase()} to explore.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {similar.map((r) => (
                    <li key={r._id}>
                      <Link
                        href={`/${getResourceSlug(r)}`}
                        className="inline-flex"
                      >
                        <Pill variant="outline" className="cursor-pointer font-normal transition hover:bg-accent">
                          {r.title}
                        </Pill>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-10 pt-8 border-t border-border" aria-labelledby="related-collections">
                <h2 id="related-collections" className="font-display text-lg font-semibold text-foreground mb-3">
                  Related collections
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This resource appears in these curated lists.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {related.map((c) => (
                    <li key={c._id}>
                      <Link
                        href={`/collections/${getCollectionSlug(c)}`}
                        className="inline-flex"
                      >
                        <Pill variant="outline" className="cursor-pointer font-normal transition hover:bg-accent">
                          {c.title}
                        </Pill>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </main>
      </div>
    </>
  );
}
