import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllAlternativeResourceSlugs,
  getResourceAlternativesBySlug,
} from "@/lib/sanity.resource";
import { getResourceSlug } from "@/lib/slug";
import {
  evaluateAlternativesQuality,
  getAllAlternativePageSlugs,
  getAlternativePageData,
  getComparisonPagesForTool,
} from "@/lib/seo-pages";
import { BASE_URL } from "@/lib/site-url";
import {
  getIndustryMetricSources,
  getIndustryMetricsForToolSlugs,
  getIndustryMetricsUpdatedDateLabel,
} from "@/lib/industry-metrics";
import { getMigrationSlug, hasMigrationPage } from "@/lib/migration-pages";
import type { Resource, ResourceReference } from "@/types/resource";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { ContentDensityShell } from "@/components/ContentDensityShell";
import { OnThisPageNav } from "@/components/OnThisPageNav";
import { OutboundLink } from "@/components/OutboundLink";
import { ProgressiveDisclosure } from "@/components/ProgressiveDisclosure";
import { TrackedCompareLink } from "@/components/TrackedCompareLink";
import { RoiCalculator } from "@/components/RoiCalculator";
import { StatusNotice } from "@/components/StatusNotice";

type AlternativesContext = {
  slug: string;
  title: string;
  summary: string;
  url: string;
  bestFor: string[];
  notFor: string[];
  pricingNotes: string;
  alternatives: Array<
    ResourceReference & {
      pricingNotes?: string | null;
      sources?: { label: string; url: string }[];
    }
  >;
  decisionMatrix: Array<{
    tool: string;
    pricing: string;
    setupSpeed: string;
    collaboration: string;
    extensibility: string;
    lockInRisk: string;
  }>;
  migrationChecklist: string[];
  faq: Array<{ question: string; answer: string }>;
  sources: { label: string; url: string }[];
  lastReviewedAt: string | null;
  quality: { pass: boolean; stale: boolean; reasons: string[] };
};

function dedupeSources(
  sources: Array<{ label: string; url: string }>,
): Array<{ label: string; url: string }> {
  const seen = new Set<string>();
  const out: Array<{ label: string; url: string }> = [];
  for (const source of sources) {
    if (!source.url || seen.has(source.url)) continue;
    seen.add(source.url);
    out.push(source);
  }
  return out;
}

function buildFallbackQuality(context: AlternativesContext): {
  pass: boolean;
  stale: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (context.sources.length < 3) reasons.push("Needs at least 3 sources.");
  if (context.bestFor.length === 0) reasons.push("Missing best-for bullets.");
  if (context.notFor.length === 0) reasons.push("Missing not-for bullets.");
  if (context.decisionMatrix.length < 3)
    reasons.push("Decision matrix must have at least 3 rows.");
  const stale = !context.lastReviewedAt
    ? true
    : Date.now() - Date.parse(context.lastReviewedAt) >
      90 * 24 * 60 * 60 * 1000;
  if (stale) reasons.push("Last reviewed date is older than 90 days.");
  return { pass: reasons.length === 0, stale, reasons };
}

async function getAlternativesContext(
  slug: string,
): Promise<AlternativesContext | null> {
  const [fallback, cmsResource] = await Promise.all([
    Promise.resolve(getAlternativePageData(slug)),
    getResourceAlternativesBySlug(slug),
  ]);

  if (!fallback && !cmsResource) return null;

  if (fallback) {
    const quality = evaluateAlternativesQuality(fallback);
    return {
      slug,
      title: fallback.tool.title,
      summary: fallback.summary,
      url: fallback.tool.url,
      bestFor: fallback.tool.bestFor,
      notFor: fallback.tool.notFor,
      pricingNotes: fallback.tool.pricingNotes,
      alternatives: fallback.alternatives,
      decisionMatrix: fallback.decisionMatrix,
      migrationChecklist: fallback.migrationChecklist,
      faq: fallback.faq,
      sources: dedupeSources(fallback.sources),
      lastReviewedAt: fallback.lastReviewedAt,
      quality,
    };
  }

  const resource = cmsResource as Resource;
  const alternatives = (resource.alternatives ?? []).slice(0, 6);
  const allRows = [resource, ...alternatives].slice(0, 5);
  const decisionMatrix = allRows.map((row) => ({
    tool: row.title,
    pricing: row.pricingNotes ?? "See official pricing documentation.",
    setupSpeed: "Varies by workflow",
    collaboration: "Varies by team setup",
    extensibility: "Varies by ecosystem",
    lockInRisk: "Varies by adoption depth",
  }));
  const sources = dedupeSources([
    ...(resource.sources ?? []),
    ...alternatives.flatMap((alternative) => alternative.sources ?? []),
  ]);
  const context: AlternativesContext = {
    slug,
    title: resource.title,
    summary: `Top ${resource.title} alternatives with practical tradeoffs, migration guidance, and decision criteria.`,
    url: resource.url,
    bestFor: resource.bestFor ?? [],
    notFor: resource.notFor ?? [],
    pricingNotes:
      resource.pricingNotes ??
      "Review official pricing pages before committing.",
    alternatives,
    decisionMatrix,
    migrationChecklist: [
      "List current workflows your team cannot break during migration.",
      "Run a 1 to 2 week pilot with one backup rollback option.",
      "Validate quality and team adoption before full switch.",
    ],
    faq: [
      {
        question: `How should I choose a ${resource.title} alternative?`,
        answer:
          "Use the matrix and pilot shortlist to compare workflow fit, team adoption friction, and long-term cost.",
      },
    ],
    sources,
    lastReviewedAt: resource.lastReviewedAt ?? null,
    quality: { pass: false, stale: true, reasons: [] },
  };
  context.quality = buildFallbackQuality(context);
  return context;
}

function AlternativesJsonLd({ context }: { context: AlternativesContext }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: context.faq.map((item) => ({
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

export async function generateStaticParams() {
  const [seedSlugs, cmsSlugs] = await Promise.all([
    Promise.resolve(getAllAlternativePageSlugs()),
    getAllAlternativeResourceSlugs(),
  ]);
  return [...new Set([...seedSlugs, ...cmsSlugs])].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const context = await getAlternativesContext(slug);
  if (!context) return { title: "Not found" };

  const canonical = `${BASE_URL}/alternatives/${slug}`;
  const title = `${context.title} alternatives (2026): best picks, pricing, and migration | The Stash`;
  const description = `${context.summary} Compare best-for, not-for, pricing notes, and migration checklist before switching.`;

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
    robots: { index: true, follow: true },
  };
}

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await getAlternativesContext(slug);
  if (!context) notFound();
  const marketMetrics = getIndustryMetricsForToolSlugs([context.slug], 4);
  const metricsUpdatedLabel = getIndustryMetricsUpdatedDateLabel();
  const marketSources = getIndustryMetricSources(marketMetrics);
  const allSources = dedupeSources([...context.sources, ...marketSources]);

  const comparePages = getComparisonPagesForTool(slug).slice(0, 6);
  const onThisPageItems = [
    { id: "top-alternatives", label: "Top alternatives" },
    { id: "decision-matrix", label: "Decision matrix" },
    { id: "migration-checklist", label: "Migration checklist" },
    { id: "alternatives-reference", label: "References" },
  ];
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Alternatives", url: `${BASE_URL}/alternatives/${slug}` },
  ];

  return (
    <>
      <AlternativesJsonLd context={context} />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: "Alternatives", href: `/alternatives/${slug}` },
              { label: `${context.title} alternatives` },
            ]}
            className="mb-6"
          />

          <header className="insight-hero">
            <p className="insight-kicker">Alternatives</p>
            <h1 className="insight-title">{context.title} alternatives</h1>
            <p className="insight-lead">{context.summary}</p>
            <div className="insight-meta">
              <span>
                Last reviewed:{" "}
                {context.lastReviewedAt
                  ? new Date(context.lastReviewedAt).toLocaleDateString()
                  : "Not set"}
              </span>
              <OutboundLink
                href={context.url}
                target="_blank"
                rel="noopener noreferrer"
                toolSlug={context.slug}
                className="text-link"
              >
                Visit {context.title}
              </OutboundLink>
            </div>
          </header>

          <ContentDensityShell pageKey="alternatives-detail">
            <OnThisPageNav items={onThisPageItems} className="mt-0" />

            {!context.quality.pass && (
              <StatusNotice
                variant="warning"
                title="Editorial review required"
                items={context.quality.reasons}
                className="mt-6"
              />
            )}

            <section
              className="section-panel"
              aria-labelledby="top-alternatives"
            >
              <h2 id="top-alternatives" className="section-title">
                Top alternatives
              </h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {context.alternatives.map((alternative) => {
                  const altSlug = alternative.slug
                    ? alternative.slug
                    : getResourceSlug(alternative as Resource);
                  const migrationSlug = getMigrationSlug(context.slug, altSlug);
                  const hasMigrationPlan = hasMigrationPage(
                    context.slug,
                    altSlug,
                  );
                  return (
                    <li key={alternative._id} className="tone-card">
                      <h3 className="font-semibold text-foreground">
                        {alternative.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {alternative.description ??
                          "Alternative option for this workflow."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        {alternative.url && (
                          <OutboundLink
                            href={alternative.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            toolSlug={altSlug}
                            className="text-link"
                          >
                            Visit site
                          </OutboundLink>
                        )}
                        <Link href={`/${altSlug}`} className="text-link">
                          Resource page
                        </Link>
                        {hasMigrationPlan && (
                          <Link
                            href={`/migrate/${migrationSlug}`}
                            className="text-link"
                          >
                            Migration plan
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section
              className="section-panel"
              aria-labelledby="decision-matrix"
            >
              <h2 id="decision-matrix" className="section-title">
                Decision matrix
              </h2>
              <div className="mt-3 matrix-shell">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Pricing</th>
                      <th>Setup speed</th>
                      <th>Collaboration</th>
                      <th>Extensibility</th>
                      <th>Lock-in risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {context.decisionMatrix.map((row) => (
                      <tr
                        key={row.tool}
                        className="border-t border-border align-top"
                      >
                        <td className="font-semibold text-foreground">
                          {row.tool}
                        </td>
                        <td>{row.pricing}</td>
                        <td>{row.setupSpeed}</td>
                        <td>{row.collaboration}</td>
                        <td>{row.extensibility}</td>
                        <td>{row.lockInRisk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              className="section-panel"
              aria-labelledby="migration-checklist"
            >
              <h2 id="migration-checklist" className="section-title">
                Migration checklist
              </h2>
              <ol className="section-list list-decimal pl-5">
                {context.migrationChecklist.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <RoiCalculator
              className="mt-10"
              contextLabel={`${context.title} alternatives`}
            />

            <ProgressiveDisclosure
              id="alternatives-reference"
              title="Reference and deeper context"
              description="Open fit notes, related comparisons, optional market context, FAQ, and sources."
            >
              <section aria-labelledby="alternatives-fit">
                <h3
                  id="alternatives-fit"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                >
                  Fit notes
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <article className="tone-card">
                    <h4 className="text-base font-semibold text-foreground">
                      Best for
                    </h4>
                    <ul className="section-list list-disc pl-5">
                      {context.bestFor.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article className="tone-card">
                    <h4 className="text-base font-semibold text-foreground">
                      Not for
                    </h4>
                    <ul className="section-list list-disc pl-5">
                      {context.notFor.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </section>

              {marketMetrics.length > 0 && (
                <section aria-labelledby="alternatives-market-context">
                  <h3
                    id="alternatives-market-context"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                  >
                    Market context (optional)
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Verified from official sources as of {metricsUpdatedLabel}.
                    These are category-level signals, not direct product
                    performance claims.
                  </p>
                  <ul className="mt-3 space-y-3">
                    {marketMetrics.map((item) => (
                      <li key={item.id} className="tone-card">
                        <p className="font-medium text-foreground">
                          {item.metric}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {comparePages.length > 0 && (
                <section aria-labelledby="related-comparisons">
                  <h3
                    id="related-comparisons"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                  >
                    Related comparisons
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {comparePages.map((comparison) => (
                      <li key={comparison.slug}>
                        <TrackedCompareLink
                          href={`/compare/${comparison.slug}`}
                          comparisonSlug={comparison.slug}
                          className="pill-link"
                        >
                          {comparison.title}
                        </TrackedCompareLink>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {context.faq.length > 0 && (
                <section aria-labelledby="alternatives-faq">
                  <h3
                    id="alternatives-faq"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                  >
                    FAQ
                  </h3>
                  <div className="mt-3 space-y-4">
                    {context.faq.map((item) => (
                      <article key={item.question} className="tone-card">
                        <h4 className="text-base font-semibold text-foreground">
                          {item.question}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.answer}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section aria-labelledby="alternatives-sources">
                <h3
                  id="alternatives-sources"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                >
                  Sources
                </h3>
                <ul className="section-list list-disc pl-5">
                  {allSources.map((source) => (
                    <li key={source.url}>
                      <OutboundLink
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        toolSlug={slug}
                        className="text-link"
                      >
                        {source.label}
                      </OutboundLink>
                    </li>
                  ))}
                </ul>
              </section>
            </ProgressiveDisclosure>
          </ContentDensityShell>
        </main>
      </div>
    </>
  );
}
