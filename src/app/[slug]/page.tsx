import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getResourceBySlug, getAllResourceSlugs, getResourcesInCategory } from "@/lib/sanity.resource";
import { getQueuedResourcePreview } from "@/lib/agent-preview";
import { getCollectionsContainingResource } from "@/lib/sanity.collection";
import { urlFor } from "@/lib/sanity.image";
import { getCategoryLabel } from "@/lib/categories";
import { getCollectionSlugForCategory } from "@/lib/collections-seo";
import { getResourceSlug, getCollectionSlug } from "@/lib/slug";
import { getResourceExtendedContent } from "@/lib/resource-content";
import {
  getAlternativePageData,
  getComparisonPagesForTool,
} from "@/lib/seo-pages";
import { getCompanyHubSlugForToolSlug } from "@/lib/company-hubs";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { OnThisPageNav } from "@/components/OnThisPageNav";
import { OutboundLink } from "@/components/OutboundLink";
import { ResourcePageActions } from "@/components/ResourcePageActions";
import { TrackedCompareLink } from "@/components/TrackedCompareLink";
import { WalineComments } from "@/components/WalineComments";
import { RecordView } from "@/components/RecordView";
import { AdUnit } from "@/components/AdUnit";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pill } from "@/components/kibo-ui/pill";
import type { Resource } from "@/types/resource";
import type { Metadata } from "next";
import {
  evaluateResourceTierQuality,
  shouldNoindexFromTierQuality,
} from "@/lib/content-tier";

import { BASE_URL } from "@/lib/site-url";
const RESERVED_SLUGS = ["studio", "api"];

type PageSearchParams = {
  previewQueueId?: string | string[];
};

type AsyncPageSearchParams =
  | Promise<PageSearchParams>
  | PageSearchParams
  | undefined;

function firstQueryParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = entry?.trim();
      if (normalized) return normalized;
    }
  }
  return undefined;
}

async function resolvePreviewQueueId(
  searchParams: AsyncPageSearchParams
): Promise<string | undefined> {
  const resolved = (await searchParams) ?? {};
  return firstQueryParam(resolved.previewQueueId);
}

function faviconForUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return "";
  }
}

function buildGeneratedExtendedContent(resource: Resource) {
  const title = resource.title.trim();
  const description = (resource.description || "").trim();
  const categoryLabel = getCategoryLabel(resource.category);

  const definition =
    description ||
    `${title} is a ${categoryLabel.toLowerCase()} resource featured on The Stash to help designers and developers discover high-quality tools and references.`;

  const overview: string[] = [];
  if (description) {
    overview.push(description);
  }
  overview.push(
    `${title} appears in The Stash under the ${categoryLabel.toLowerCase()} category so you can quickly understand what it does, when to use it, and where it fits into your workflow.`
  );

  const benefits: string[] = [];
  switch (resource.category) {
    case "ai-tools":
      benefits.push(
        `Use ${title} to explore modern AI capabilities without building and hosting your own models.`,
        `${title} can speed up day-to-day work compared to purely manual workflows.`,
        `${title} helps you experiment with AI safely before deeply integrating it into production systems.`
      );
      break;
    case "design-tools":
      benefits.push(
        `${title} helps you design or prototype interfaces faster than starting from scratch.`,
        `${title} supports modern product design workflows, from early exploration through handoff.`,
        `Teams can use ${title} alongside tools like Figma, Webflow, or Framer for a more complete design stack.`
      );
      break;
    case "development-tools":
      benefits.push(
        `${title} fits into a modern web development toolchain and can reduce boilerplate work.`,
        `Using ${title} can improve developer productivity versus ad‑hoc scripts and manual processes.`,
        `${title} typically integrates with Git-based workflows, CI/CD, or popular runtimes and frameworks.`
      );
      break;
    case "ui-ux-resources":
      benefits.push(
        `${title} gives you concrete UI and UX patterns instead of designing every flow from a blank page.`,
        `Referencing ${title} can improve the usability and consistency of new product work.`,
        `${title} is useful for quickly benchmarking your designs against real products and flows.`
      );
      break;
    case "inspiration":
      benefits.push(
        `${title} is a reliable place to browse real-world examples when you need visual or UX inspiration.`,
        `Using ${title} can help you spot current design and interaction trends before committing to a direction.`
      );
      break;
    case "learning-resources":
      benefits.push(
        `${title} provides structured learning material so you can level up faster than piecing together random links.`,
        `Using ${title} regularly can help you stay current on best practices across design and development.`
      );
      break;
    default:
      if (description) {
        benefits.push(`Quick summary of ${title}: ${description}`);
      }
      break;
  }

  const useCases: string[] = [];
  switch (resource.category) {
    case "ai-tools":
      useCases.push(
        `Trying out ${title} when you want to prototype AI-assisted features for your product.`,
        `Using ${title} as a companion while coding, writing, or exploring datasets.`,
        `Evaluating whether ${title} can replace or augment part of your current workflow.`
      );
      break;
    case "design-tools":
      useCases.push(
        `Using ${title} during early sketching and wireframing for a new product or feature.`,
        `Relying on ${title} to maintain design systems, component libraries, or tokens.`,
        `Pairing ${title} with your dev stack so handoff to engineering is smoother.`
      );
      break;
    case "development-tools":
      useCases.push(
        `Integrating ${title} into your local dev or CI pipeline to automate repetitive work.`,
        `Using ${title} to monitor, debug, or optimize applications in production.`,
        `Adopting ${title} as a standard tool across your engineering team for consistency.`
      );
      break;
    case "ui-ux-resources":
      useCases.push(
        `Referencing ${title} when designing a new screen, flow, or component to see proven patterns.`,
        `Using ${title} in design reviews to communicate ideas with concrete examples.`,
        `Keeping ${title} bookmarked as a go‑to library when you are stuck on UX decisions.`
      );
      break;
    case "learning-resources":
      useCases.push(
        `Working through ${title} as a structured path when learning a new language, framework, or tool.`,
        `Dipping into ${title} to fill specific gaps (for example accessibility, performance, or UX).`
      );
      break;
    default:
      if (description) {
        useCases.push(`Use ${title} any time its strengths match the needs described above.`);
      }
      break;
  }

  const sources = resource.url
    ? [
        {
          label: "Official site",
          url: resource.url,
        },
      ]
    : [];

  return { definition, overview, benefits, useCases, sources };
}

export async function generateStaticParams() {
  const slugs = await getAllResourceSlugs();
  return slugs
    .filter((s) => !RESERVED_SLUGS.includes(s))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: AsyncPageSearchParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const previewQueueId = await resolvePreviewQueueId(searchParams);
  const resource =
    (previewQueueId
      ? getQueuedResourcePreview(previewQueueId, slug)
      : null) ?? (await getResourceBySlug(slug));
  if (!resource) return { title: "Not found" };
  const quality = evaluateResourceTierQuality(resource);

  const title = `${resource.title} | The Stash`;
  const description =
    resource.description ||
    `${resource.title} — dev & design resource. ${getCategoryLabel(resource.category)}.`;
  const canonical = `${BASE_URL}/${slug}`;
  const ogImageUrl = `${BASE_URL}/api/og?${new URLSearchParams({
    title: resource.title,
    description: description.slice(0, 200),
  }).toString()}`;

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
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: resource.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    robots: shouldNoindexFromTierQuality(quality)
      ? { index: false, follow: false }
      : { index: true, follow: true },
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
          dateModified: resource.lastReviewedAt ?? resource.createdAt,
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: AsyncPageSearchParams;
}) {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) notFound();
  const previewQueueId = await resolvePreviewQueueId(searchParams);
  const previewResource = previewQueueId
    ? getQueuedResourcePreview(previewQueueId, slug)
    : null;
  const resource = previewResource ?? (await getResourceBySlug(slug));
  if (!resource) notFound();
  const isPreview = Boolean(previewResource);
  const tierQuality = evaluateResourceTierQuality(resource);
  const reviewedDateLabel = resource.lastReviewedAt
    ? new Date(resource.lastReviewedAt).toLocaleDateString()
    : null;
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
  const generated = buildGeneratedExtendedContent(resource);

  const definition = extendedContent?.definition ?? generated.definition;

  const overviewParagraphs =
    (resource.body?.trim() && [resource.body]) ||
    (extendedContent?.overview?.length ? extendedContent.overview : null) ||
    generated.overview;

  const benefitsList =
    extendedContent?.benefits?.length && extendedContent.benefits.length > 0
      ? extendedContent.benefits
      : generated.benefits;

  const useCasesList =
    extendedContent?.useCases?.length && extendedContent.useCases.length > 0
      ? extendedContent.useCases
      : generated.useCases;

  const sourcesList =
    (resource.sources?.length ? resource.sources : null) ||
    (extendedContent?.sources?.length ? extendedContent.sources : null) ||
    (generated.sources.length ? generated.sources : null);
  const categoryCollectionSlug = getCollectionSlugForCategory(resource.category);
  const categoryLabel = getCategoryLabel(resource.category);

  const resourceSlug = getResourceSlug(resource);
  const companyHubSlug = getCompanyHubSlugForToolSlug(resourceSlug);
  const alternativesHub = getAlternativePageData(resourceSlug);
  const comparisonPages = getComparisonPagesForTool(resourceSlug).slice(0, 6);
  const onThisPageItems = [
    definition ? { id: "what-is", label: `What is ${resource.title}?` } : null,
    benefitsList?.length ? { id: "benefits", label: "Key benefits" } : null,
    useCasesList?.length ? { id: "use-cases", label: "Use cases" } : null,
    overviewParagraphs?.length ? { id: "about-resource", label: `About ${resource.title}` } : null,
    sourcesList?.length ? { id: "sources", label: "Sources & review" } : null,
    alternativesHub ? { id: "alternatives-hub", label: `${resource.title} alternatives` } : null,
    comparisonPages.length > 0 ? { id: "compare-pages", label: `Compare ${resource.title}` } : null,
    similar.length > 0 ? { id: "similar-resources", label: `Similar ${categoryLabel}` } : null,
    related.length > 0 ? { id: "related-collections", label: "Related collections" } : null,
    { id: "comments-heading", label: "Comments" },
  ].filter((item): item is { id: string; label: string } => Boolean(item));
  const metadataStats = {
    sources: sourcesList?.length ?? 0,
    comparisons: comparisonPages.length,
    collections: related.length,
    similar: similar.length,
  };

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

        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: resource.title },
            ]}
            className="mb-6"
          />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 lg:max-w-3xl">
              {onThisPageItems.length > 0 ? (
                <OnThisPageNav items={onThisPageItems} className="mb-4 lg:hidden" />
              ) : null}
              <AdUnit
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT || "1234567890"}
                format="rectangle"
                className="my-6"
              />
              <article className="space-y-6">
                <header className="insight-hero not-prose">
                  {isPreview ? (
                    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                      Preview mode: rendering this resource from the local approval queue (not published).
                    </div>
                  ) : null}
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
                    <div className="min-w-0 flex-1">
                      <p className="insight-kicker">{getCategoryLabel(resource.category)}</p>
                      <h1 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl min-w-0">
                        {resource.title}
                      </h1>
                      <p className="mt-3 text-base leading-relaxed text-foreground/90">
                        {resource.description}
                      </p>
                      <p className="insight-meta">
                        Last reviewed: {reviewedDateLabel ?? "Not set"}
                      </p>
                      {/* Row 1: Visit site, Save, Share | Row 2: Vote, Comments, Copy link */}
                      <div className="mt-3">
                        <ResourcePageActions
                          slug={resourceSlug}
                          url={`${BASE_URL}/${resourceSlug}`}
                          title={resource.title}
                          description={resource.description}
                          firstRowContent={
                            <OutboundLink
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:px-5 sm:py-3"
                              aria-label={`Visit ${resource.title} (opens in new tab)`}
                              toolSlug={resourceSlug}
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
                            </OutboundLink>
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                      <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                        Sources
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {metadataStats.sources} references
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                      <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                        Comparisons
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {metadataStats.comparisons} head-to-head pages
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                      <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                        Related collections
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {metadataStats.collections} linked collections
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                      <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                        Similar resources
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {metadataStats.similar} suggestions
                      </p>
                    </div>
                  </div>
                </header>

            {tierQuality.requiresGate && !tierQuality.pass ? (
              <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
                <p className="font-semibold">Editorial quality gate failed</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {tierQuality.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </section>
            ) : null}

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
                  <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                    All resources
                  </Link>
                </li>
                <li>
                  <Link href="/collections" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                    Collections
                  </Link>
                </li>
                {categoryCollectionSlug && (
                  <li>
                    <Link href={`/collections/${categoryCollectionSlug}`} className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                      More in {categoryLabel}
                    </Link>
                  </li>
                )}
                {companyHubSlug && (
                  <li>
                    <Link
                      href={`/companies/${companyHubSlug}`}
                      className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                    >
                      {resource.title} company hub
                    </Link>
                  </li>
                )}
                {alternativesHub && (
                  <li>
                    <Link
                      href={`/alternatives/${resourceSlug}`}
                      className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                    >
                      {resource.title} alternatives
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
                      <Link href={`/collections/${categoryCollectionSlug}`} className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
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
                  Sources &amp; review
                </h2>
                {reviewedDateLabel ? (
                  <p className="text-xs text-muted-foreground">
                    Reviewed on {reviewedDateLabel}
                  </p>
                ) : null}
                <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {sourcesList.map((s, i) => (
                    <li key={i}>
                      <OutboundLink
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                        toolSlug={resourceSlug}
                      >
                        {s.label}
                      </OutboundLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {alternativesHub && (
              <section className="mt-10 pt-8 border-t border-border" aria-labelledby="alternatives-hub">
                <h2
                  id="alternatives-hub"
                  className="font-display text-lg font-semibold text-foreground mb-3"
                >
                  {resource.title} alternatives
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Compare top alternatives with a decision matrix, best-fit guidance, and migration checklist.
                </p>
                <Link
                  href={`/alternatives/${resourceSlug}`}
                  className="inline-flex items-center rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                >
                  Open alternatives page
                </Link>
              </section>
            )}

            {comparisonPages.length > 0 && (
              <section className="mt-10 pt-8 border-t border-border" aria-labelledby="compare-pages">
                <h2 id="compare-pages" className="font-display text-lg font-semibold text-foreground mb-3">
                  Compare {resource.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Open detailed head-to-head comparisons for this tool.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {comparisonPages.map((comparison) => (
                    <li key={comparison.slug}>
                      <TrackedCompareLink
                        href={`/compare/${comparison.slug}`}
                        comparisonSlug={comparison.slug}
                        className="inline-flex"
                      >
                        <Pill variant="outline" className="cursor-pointer font-normal transition hover:bg-accent">
                          {comparison.title}
                        </Pill>
                      </TrackedCompareLink>
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

            <section
              id="comments"
              className="mt-10 pt-8 border-t border-border scroll-mt-20"
              aria-labelledby="comments-heading"
            >
              <h2
                id="comments-heading"
                className="text-sm font-semibold text-foreground"
              >
                Comments
              </h2>
              <WalineComments
                path={`/${resourceSlug}`}
                placeholder={
                  <p className="mt-3 text-sm text-muted-foreground">
                    Comments are powered by Waline. Set{" "}
                    <code className="rounded bg-muted px-1">NEXT_PUBLIC_WALINE_SERVER_URL</code> to
                    your Waline server URL to enable. You can share feedback via the links in the footer.
                  </p>
                }
              />
            </section>
              </article>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                {onThisPageItems.length > 0 ? <OnThisPageNav items={onThisPageItems} /> : null}
                <section className="hierarchy-nav">
                  <p className="hierarchy-nav-title">Resource snapshot</p>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">{metadataStats.sources}</span>{" "}
                      cited sources
                    </li>
                    <li>
                      <span className="font-medium text-foreground">{metadataStats.comparisons}</span>{" "}
                      comparison pages
                    </li>
                    <li>
                      <span className="font-medium text-foreground">{metadataStats.collections}</span>{" "}
                      related collections
                    </li>
                    <li>
                      Reviewed on{" "}
                      <span className="font-medium text-foreground">{reviewedDateLabel ?? "Not set"}</span>
                    </li>
                  </ul>
                </section>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
