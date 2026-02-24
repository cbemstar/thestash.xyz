import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { OnThisPageNav } from "@/components/OnThisPageNav";
import { OutboundLink } from "@/components/OutboundLink";
import { TrackedCompareLink } from "@/components/TrackedCompareLink";
import { getResourceBySlug } from "@/lib/sanity.resource";
import {
  getAllAlternativePageSlugs,
  getComparisonPageDataBySlug,
  getToolProfile,
  inferComparisonTitleFromSlug,
} from "@/lib/seo-pages";
import {
  evaluateUseCaseQuality,
  getAllUseCaseSlugs,
  getUseCasePageBySlug,
  getUseCasePagesForComparison,
  getUseCasePagesForTool,
} from "@/lib/use-case-pages";
import { getUseCaseEditorialSections } from "@/lib/use-case-editorial-content";
import {
  getIndustryMetricSources,
  getIndustryMetricsForToolSlugs,
  getIndustryMetricsUpdatedDateLabel,
} from "@/lib/industry-metrics";
import { BASE_URL } from "@/lib/site-url";
import type { Resource } from "@/types/resource";

type ToolCard = {
  slug: string;
  title: string;
  description: string;
  url?: string;
  source: "sanity" | "seed";
};

function UseCaseFaqJsonLd({
  faq,
}: {
  faq: Array<{ question: string; answer: string }>;
}) {
  if (faq.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

async function buildToolCards(slugs: string[]): Promise<ToolCard[]> {
  const tools = await Promise.all(
    slugs.map(async (slug) => {
      const [resource, profile] = await Promise.all([
        getResourceBySlug(slug),
        Promise.resolve(getToolProfile(slug)),
      ]);
      if (resource) {
        const r = resource as Resource;
        return {
          slug,
          title: r.title,
          description: r.description,
          url: r.url,
          source: "sanity" as const,
        };
      }
      if (profile) {
        return {
          slug,
          title: profile.title,
          description: profile.description,
          url: profile.url,
          source: "seed" as const,
        };
      }
      return {
        slug,
        title: slug.replace(/-/g, " "),
        description: "Tool profile pending enrichment.",
        source: "seed" as const,
      };
    })
  );
  return tools;
}

function dedupeSources(
  tools: ToolCard[],
  comparisonSlugs: string[],
  additionalSources: Array<{ label: string; url: string }> = []
): Array<{ label: string; url: string }> {
  const sources: Array<{ label: string; url: string }> = [];
  for (const tool of tools) {
    if (tool.url) {
      sources.push({ label: `${tool.title} official site`, url: tool.url });
    }
  }
  for (const comparisonSlug of comparisonSlugs) {
    const comparison = getComparisonPageDataBySlug(comparisonSlug);
    for (const source of comparison?.sources ?? []) {
      sources.push(source);
    }
  }
  sources.push(...additionalSources);
  const seen = new Set<string>();
  const deduped: Array<{ label: string; url: string }> = [];
  for (const source of sources) {
    if (!source.url || seen.has(source.url)) continue;
    seen.add(source.url);
    deduped.push(source);
  }
  return deduped.slice(0, 12);
}

export async function generateStaticParams() {
  return getAllUseCaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getUseCasePageBySlug(slug);
  if (!page) return { title: "Not found" };
  const quality = evaluateUseCaseQuality(page);
  const canonical = `${BASE_URL}/use-cases/${slug}`;
  const title = `${page.title} (2026): tools, comparisons, and checklist | The Stash`;
  const description = `${page.answerFirst} Use this guide to choose the best-fit stack for your workflow.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Stash",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: quality.pass ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getUseCasePageBySlug(slug);
  if (!page) notFound();
  const quality = evaluateUseCaseQuality(page);
  const editorialSections = getUseCaseEditorialSections(page.slug);
  const marketMetrics = getIndustryMetricsForToolSlugs(page.toolSlugs, 5);
  const marketSources = getIndustryMetricSources(marketMetrics);
  const metricsUpdatedLabel = getIndustryMetricsUpdatedDateLabel();

  const availableAlternativeSlugs = new Set(getAllAlternativePageSlugs());
  const tools = await buildToolCards(page.toolSlugs);
  const sources = dedupeSources(tools, page.comparisonSlugs, marketSources);
  const relatedFromTools = page.toolSlugs.flatMap((toolSlug) =>
    getUseCasePagesForTool(toolSlug).map((candidate) => candidate.slug)
  );
  const relatedFromComparisons = page.comparisonSlugs.flatMap((comparisonSlug) =>
    getUseCasePagesForComparison(comparisonSlug).map((candidate) => candidate.slug)
  );
  const relatedSlugs = [...new Set([...relatedFromTools, ...relatedFromComparisons])]
    .filter((candidate) => candidate !== page.slug)
    .slice(0, 6);
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Use cases", url: `${BASE_URL}/use-cases` },
    { name: page.title, url: `${BASE_URL}/use-cases/${slug}` },
  ];
  const onThisPageItems = [
    editorialSections.length > 0 ? { id: "in-depth-guide", label: "In-depth guide" } : null,
    marketMetrics.length > 0 ? { id: "market-signals", label: "Latest market signals" } : null,
    { id: "recommended-tools", label: "Recommended tools" },
    page.comparisonSlugs.length > 0
      ? { id: "use-case-comparisons", label: "Head-to-head comparisons" }
      : null,
    page.alternativeSlugs.length > 0
      ? { id: "use-case-alternatives", label: "Alternatives hubs" }
      : null,
    { id: "implementation-checklist", label: "Implementation checklist" },
    { id: "use-case-faq", label: "FAQ" },
    relatedSlugs.length > 0 ? { id: "related-use-cases", label: "Related use cases" } : null,
    { id: "use-case-sources", label: "Sources" },
  ].filter((item): item is { id: string; label: string } => Boolean(item));

  return (
    <>
      <UseCaseFaqJsonLd faq={page.faq} />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: "Use cases", href: "/use-cases" },
              { label: page.title },
            ]}
            className="mb-6"
          />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 lg:max-w-3xl">
              <header className="insight-hero">
                <p className="insight-kicker">Use case</p>
                <h1 className="insight-title">{page.title}</h1>
                <p className="insight-lead">{page.answerFirst}</p>
                <p className="insight-meta">
                  Last reviewed: {new Date(page.lastReviewedAt).toLocaleDateString()}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                      Recommended tools
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{tools.length}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                      Benchmarks
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{marketMetrics.length}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                      Comparisons
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {page.comparisonSlugs.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                      Sources
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{sources.length}</p>
                  </div>
                </div>
              </header>

              {onThisPageItems.length > 0 ? (
                <OnThisPageNav items={onThisPageItems} className="mt-4 lg:hidden" />
              ) : null}

              {!quality.pass && (
                <section className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
                  <p className="font-semibold">Editorial review required</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {quality.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </section>
              )}

              {editorialSections.length > 0 && (
                <section className="mt-10 space-y-4" aria-labelledby="in-depth-guide">
                  <h2
                    id="in-depth-guide"
                    className="font-display text-xl font-semibold text-foreground"
                  >
                    In-depth guide
                  </h2>
                  <div className="space-y-6">
                    {editorialSections.map((section) => (
                      <article key={section.heading} className="space-y-2">
                        <h3 className="text-base font-semibold text-foreground">
                          {section.heading}
                        </h3>
                        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                          {section.paragraphs.map((paragraph, paragraphIndex) => (
                            <p key={`${section.heading}-${paragraphIndex}`}>{paragraph}</p>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {marketMetrics.length > 0 && (
                <section className="mt-10 space-y-3" aria-labelledby="market-signals">
                  <h2
                    id="market-signals"
                    className="font-display text-xl font-semibold text-foreground"
                  >
                    Latest market signals
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Verified from official reports as of {metricsUpdatedLabel}.
                  </p>
                  <ul className="space-y-3">
                    {marketMetrics.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-border bg-muted/20 p-3"
                      >
                        <p className="font-medium text-foreground">{item.metric}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mt-10 space-y-3" aria-labelledby="recommended-tools">
                <h2 id="recommended-tools" className="font-display text-xl font-semibold text-foreground">
                  Recommended tools
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tools.map((tool) => (
                    <li key={tool.slug} className="rounded-xl border border-border bg-card/30 p-4">
                      <h3 className="font-semibold text-foreground">{tool.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <Link
                          href={`/${tool.slug}`}
                          className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                        >
                          Resource page
                        </Link>
                        {tool.url && (
                          <OutboundLink
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            toolSlug={tool.slug}
                            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                          >
                            Visit site
                          </OutboundLink>
                        )}
                        {availableAlternativeSlugs.has(tool.slug) && (
                          <Link
                            href={`/alternatives/${tool.slug}`}
                            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                          >
                            Alternatives
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {page.comparisonSlugs.length > 0 && (
                <section className="mt-10 space-y-3" aria-labelledby="use-case-comparisons">
                  <h2
                    id="use-case-comparisons"
                    className="font-display text-xl font-semibold text-foreground"
                  >
                    Head-to-head comparisons
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {page.comparisonSlugs.map((comparisonSlug) => (
                      <li key={comparisonSlug}>
                        <TrackedCompareLink
                          href={`/compare/${comparisonSlug}`}
                          comparisonSlug={comparisonSlug}
                          className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                        >
                          {inferComparisonTitleFromSlug(comparisonSlug)}
                        </TrackedCompareLink>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {page.alternativeSlugs.length > 0 && (
                <section className="mt-10 space-y-3" aria-labelledby="use-case-alternatives">
                  <h2
                    id="use-case-alternatives"
                    className="font-display text-xl font-semibold text-foreground"
                  >
                    Alternatives hubs
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {page.alternativeSlugs
                      .filter((candidate) => availableAlternativeSlugs.has(candidate))
                      .map((alternativeSlug) => (
                        <li key={alternativeSlug}>
                          <Link
                            href={`/alternatives/${alternativeSlug}`}
                            className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                          >
                            {alternativeSlug.replace(/-/g, " ")} alternatives
                          </Link>
                        </li>
                      ))}
                  </ul>
                </section>
              )}

              <section className="mt-10 space-y-3" aria-labelledby="implementation-checklist">
                <h2
                  id="implementation-checklist"
                  className="font-display text-xl font-semibold text-foreground"
                >
                  Implementation checklist
                </h2>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {page.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>

              <section className="mt-10 space-y-3" aria-labelledby="use-case-faq">
                <h2 id="use-case-faq" className="font-display text-xl font-semibold text-foreground">
                  FAQ
                </h2>
                <div className="space-y-4">
                  {page.faq.map((item) => (
                    <article key={item.question}>
                      <h3 className="font-semibold text-foreground">{item.question}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
                    </article>
                  ))}
                </div>
              </section>

              {relatedSlugs.length > 0 && (
                <section className="mt-10 space-y-3" aria-labelledby="related-use-cases">
                  <h2
                    id="related-use-cases"
                    className="font-display text-xl font-semibold text-foreground"
                  >
                    Related use cases
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {relatedSlugs.map((relatedSlug) => {
                      const related = getUseCasePageBySlug(relatedSlug);
                      if (!related) return null;
                      return (
                        <li key={relatedSlug}>
                          <Link
                            href={`/use-cases/${relatedSlug}`}
                            className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                          >
                            {related.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <section className="mt-10 space-y-3" aria-labelledby="use-case-sources">
                <h2 id="use-case-sources" className="font-display text-xl font-semibold text-foreground">
                  Sources
                </h2>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {sources.map((source) => (
                    <li key={source.url}>
                      <OutboundLink
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        toolSlug={page.slug}
                        className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                      >
                        {source.label}
                      </OutboundLink>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                {onThisPageItems.length > 0 ? <OnThisPageNav items={onThisPageItems} /> : null}
                <section className="hierarchy-nav">
                  <p className="hierarchy-nav-title">Use case snapshot</p>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">{tools.length}</span> recommended tools
                    </li>
                    <li>
                      <span className="font-medium text-foreground">{page.comparisonSlugs.length}</span>{" "}
                      comparison pages
                    </li>
                    <li>
                      <span className="font-medium text-foreground">{sources.length}</span> cited sources
                    </li>
                    <li>
                      Last reviewed{" "}
                      <span className="font-medium text-foreground">
                        {new Date(page.lastReviewedAt).toLocaleDateString()}
                      </span>
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
