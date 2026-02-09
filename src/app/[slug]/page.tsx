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
import { ResourcePageSaveMicroExpander } from "@/components/ResourcePageSaveMicroExpander";
import { RecordView } from "@/components/RecordView";
import { AdUnit } from "@/components/AdUnit";
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
          <AdUnit
            slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT || "1234567890"}
            format="rectangle"
            className="my-6 min-h-[250px]"
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
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {getCategoryLabel(resource.category)}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl min-w-0">
                  {resource.title}
                </h1>
                {/* Visit site + Save/Share left-aligned under heading */}
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:px-5 sm:py-3"
                    aria-label={`Visit ${resource.title} (opens in new tab)`}
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
                  <div className="flex items-center gap-2" role="group" aria-label="Resource actions">
                    <ResourcePageSaveMicroExpander slug={resourceSlug} />
                    <ShareMenu
                      url={`${BASE_URL}/${resourceSlug}`}
                      title={resource.title}
                      description={resource.description}
                      showLabel={false}
                      useMicroExpander
                    />
                  </div>
                </div>
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
                  Sources &amp; further reading
                </h2>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {sourcesList.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
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
