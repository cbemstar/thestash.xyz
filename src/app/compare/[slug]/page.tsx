import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllComparisonSlugs,
  getComparisonBySlug,
} from "@/lib/sanity.comparison";
import {
  evaluateComparisonQuality,
  getAllAlternativePageSlugs,
  getAllComparisonPageSlugs,
  getCanonicalComparisonSlug,
  getComparisonPagesForTool,
  getComparisonPageDataBySlug,
  getReversedComparisonSlug,
  inferComparisonTitleFromSlug,
} from "@/lib/seo-pages";
import { BASE_URL } from "@/lib/site-url";
import {
  getIndustryMetricSources,
  getIndustryMetricsForToolSlugs,
  getIndustryMetricsUpdatedDateLabel,
} from "@/lib/industry-metrics";
import { getMigrationSlug, hasMigrationPage } from "@/lib/migration-pages";
import type {
  Comparison,
  ComparisonCriteriaRow,
  ComparisonFaq,
  ComparisonUseCaseWinner,
} from "@/types/comparison";
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

type ComparisonContext = {
  slug: string;
  title: string;
  summary: string;
  left: {
    slug: string;
    title: string;
    description: string;
    url: string;
    bestFor: string[];
    notFor: string[];
    pricingNotes: string;
  };
  right: {
    slug: string;
    title: string;
    description: string;
    url: string;
    bestFor: string[];
    notFor: string[];
    pricingNotes: string;
  };
  winnerByUseCase: ComparisonUseCaseWinner[];
  criteriaTable: ComparisonCriteriaRow[];
  migrationChecklist: string[];
  faq: ComparisonFaq[];
  sources: { label: string; url: string }[];
  compareNext: string[];
  lastReviewedAt: string | null;
  quality: { pass: boolean; stale: boolean; reasons: string[] };
};

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function buildCompareNext(
  currentSlug: string,
  leftSlug: string,
  rightSlug: string,
  seedSlugs: string[] = [],
): string[] {
  const related = [
    ...getComparisonPagesForTool(leftSlug).map((comparison) => comparison.slug),
    ...getComparisonPagesForTool(rightSlug).map(
      (comparison) => comparison.slug,
    ),
  ];
  return [...new Set([...seedSlugs, ...related])]
    .filter((slug) => slug !== currentSlug)
    .slice(0, 6);
}

async function getComparisonContext(
  slug: string,
): Promise<ComparisonContext | null> {
  const [fallback, cmsComparison] = await Promise.all([
    Promise.resolve(getComparisonPageDataBySlug(slug)),
    getComparisonBySlug(slug),
  ]);

  if (fallback) {
    const quality = evaluateComparisonQuality(fallback);
    return {
      slug,
      title: fallback.title,
      summary: fallback.summary,
      left: {
        slug: fallback.leftSlug,
        title: fallback.leftResource?.title ?? fallback.leftSlug,
        description: normalizeText(
          fallback.leftResource?.description,
          `${fallback.leftResource?.title ?? "Left tool"} overview.`,
        ),
        url: normalizeText(fallback.leftResource?.url, "#"),
        bestFor: fallback.leftResource?.bestFor ?? [],
        notFor: fallback.leftResource?.notFor ?? [],
        pricingNotes: normalizeText(
          fallback.leftResource?.pricingNotes,
          "Check official pricing for details.",
        ),
      },
      right: {
        slug: fallback.rightSlug,
        title: fallback.rightResource?.title ?? fallback.rightSlug,
        description: normalizeText(
          fallback.rightResource?.description,
          `${fallback.rightResource?.title ?? "Right tool"} overview.`,
        ),
        url: normalizeText(fallback.rightResource?.url, "#"),
        bestFor: fallback.rightResource?.bestFor ?? [],
        notFor: fallback.rightResource?.notFor ?? [],
        pricingNotes: normalizeText(
          fallback.rightResource?.pricingNotes,
          "Check official pricing for details.",
        ),
      },
      winnerByUseCase: fallback.winnerByUseCase ?? [],
      criteriaTable: fallback.criteriaTable ?? [],
      migrationChecklist: fallback.migrationChecklist ?? [],
      faq: fallback.faq ?? [],
      sources: fallback.sources ?? [],
      compareNext: buildCompareNext(
        slug,
        fallback.leftSlug,
        fallback.rightSlug,
        fallback.compareNext ?? [],
      ),
      lastReviewedAt: fallback.lastReviewedAt ?? null,
      quality,
    };
  }

  if (!cmsComparison) return null;
  const comparison = cmsComparison as Comparison;
  const leftSlug = comparison.leftResource?.slug ?? "left";
  const rightSlug = comparison.rightResource?.slug ?? "right";
  const fallbackQuality = evaluateComparisonQuality({
    ...comparison,
    leftSlug,
    rightSlug,
    slug,
    compareNext: [],
  });
  return {
    slug,
    title: normalizeText(comparison.title, inferComparisonTitleFromSlug(slug)),
    summary: normalizeText(
      comparison.summary,
      "Compare both tools by practical criteria to choose the best fit.",
    ),
    left: {
      slug: leftSlug,
      title: normalizeText(comparison.leftResource?.title, "Left tool"),
      description: normalizeText(
        comparison.leftResource?.description,
        "See official documentation.",
      ),
      url: normalizeText(comparison.leftResource?.url, "#"),
      bestFor: comparison.leftResource?.bestFor ?? [],
      notFor: comparison.leftResource?.notFor ?? [],
      pricingNotes: normalizeText(
        comparison.leftResource?.pricingNotes,
        "Check official pricing for details.",
      ),
    },
    right: {
      slug: rightSlug,
      title: normalizeText(comparison.rightResource?.title, "Right tool"),
      description: normalizeText(
        comparison.rightResource?.description,
        "See official documentation.",
      ),
      url: normalizeText(comparison.rightResource?.url, "#"),
      bestFor: comparison.rightResource?.bestFor ?? [],
      notFor: comparison.rightResource?.notFor ?? [],
      pricingNotes: normalizeText(
        comparison.rightResource?.pricingNotes,
        "Check official pricing for details.",
      ),
    },
    winnerByUseCase: comparison.winnerByUseCase ?? [],
    criteriaTable: comparison.criteriaTable ?? [],
    migrationChecklist: comparison.migrationChecklist ?? [],
    faq: comparison.faq ?? [],
    sources: comparison.sources ?? [],
    compareNext: buildCompareNext(slug, leftSlug, rightSlug),
    lastReviewedAt: comparison.lastReviewedAt ?? null,
    quality: fallbackQuality,
  };
}

function ComparisonFaqJsonLd({ faq }: { faq: ComparisonFaq[] }) {
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

export async function generateStaticParams() {
  const [seedSlugs, cmsSlugs] = await Promise.all([
    Promise.resolve(getAllComparisonPageSlugs()),
    getAllComparisonSlugs(),
  ]);
  return [...new Set([...seedSlugs, ...cmsSlugs])].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let canonicalSlug = getCanonicalComparisonSlug(slug) ?? slug;
  if (canonicalSlug === slug) {
    const reversedSlug = getReversedComparisonSlug(slug);
    if (reversedSlug) {
      const reversedComparison = await getComparisonBySlug(reversedSlug);
      if (reversedComparison) canonicalSlug = reversedSlug;
    }
  }
  const context = await getComparisonContext(canonicalSlug);
  if (!context) return { title: "Not found" };

  const title = `${context.title} (2026): which tool should you choose? | The Stash`;
  const description = `${context.summary} Compare winners by use case, decision matrix criteria, and migration steps.`;
  const canonical = `${BASE_URL}/compare/${canonicalSlug}`;

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

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = getCanonicalComparisonSlug(slug);
  if (canonicalSlug && canonicalSlug !== slug) {
    redirect(`/compare/${canonicalSlug}`);
  }
  if (!canonicalSlug) {
    const reversedSlug = getReversedComparisonSlug(slug);
    if (reversedSlug) {
      const reversedComparison = await getComparisonBySlug(reversedSlug);
      if (reversedComparison) {
        redirect(`/compare/${reversedSlug}`);
      }
    }
  }

  const context = await getComparisonContext(slug);
  if (!context) notFound();
  const availableAlternativeSlugs = new Set(getAllAlternativePageSlugs());
  const marketMetrics = getIndustryMetricsForToolSlugs(
    [context.left.slug, context.right.slug],
    4,
  );
  const metricsUpdatedLabel = getIndustryMetricsUpdatedDateLabel();
  const marketSources = getIndustryMetricSources(marketMetrics);
  const sourceMap = new Map<string, { label: string; url: string }>();
  for (const source of [...context.sources, ...marketSources]) {
    if (!source.url || sourceMap.has(source.url)) continue;
    sourceMap.set(source.url, source);
  }
  const allSources = [...sourceMap.values()];

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Compare", url: `${BASE_URL}/compare/${slug}` },
  ];
  const leftToRightMigrationSlug = getMigrationSlug(
    context.left.slug,
    context.right.slug,
  );
  const rightToLeftMigrationSlug = getMigrationSlug(
    context.right.slug,
    context.left.slug,
  );
  const migrationLinks = [
    hasMigrationPage(context.left.slug, context.right.slug)
      ? {
          slug: leftToRightMigrationSlug,
          label: `Migrate ${context.left.title} to ${context.right.title}`,
        }
      : null,
    hasMigrationPage(context.right.slug, context.left.slug)
      ? {
          slug: rightToLeftMigrationSlug,
          label: `Migrate ${context.right.title} to ${context.left.title}`,
        }
      : null,
  ].filter((item): item is { slug: string; label: string } => Boolean(item));
  const onThisPageItems = [
    { id: "winner-by-use-case", label: "Use-case winners" },
    { id: "criteria-table", label: "Decision matrix" },
    ...(context.migrationChecklist.length > 0
      ? [{ id: "migration-checklist", label: "Migration checklist" }]
      : []),
    { id: "comparison-reference", label: "References" },
  ];

  return (
    <>
      <ComparisonFaqJsonLd faq={context.faq} />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: "Compare", href: `/compare/${slug}` },
              { label: context.title },
            ]}
            className="mb-6"
          />

          <header className="insight-hero">
            <p className="insight-kicker">Comparison</p>
            <h1 className="insight-title">{context.title}</h1>
            <p className="insight-lead">{context.summary}</p>
            <p className="insight-meta">
              Last reviewed:{" "}
              {context.lastReviewedAt
                ? new Date(context.lastReviewedAt).toLocaleDateString()
                : "Not set"}
            </p>
            {migrationLinks.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {migrationLinks.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/migrate/${item.slug}`} className="pill-link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </header>

          <ContentDensityShell pageKey="compare-detail">
            <OnThisPageNav items={onThisPageItems} className="mt-0" />

            {!context.quality.pass && (
              <StatusNotice
                variant="warning"
                title="Editorial review required"
                items={context.quality.reasons}
                className="mt-6"
              />
            )}

            <RoiCalculator
              className="mt-10"
              contextLabel={`${context.left.title} vs ${context.right.title}`}
            />

            <section className="section-panel">
              <div className="grid gap-4 sm:grid-cols-2">
                {[context.left, context.right].map((tool) => (
                  <article key={tool.slug} className="tone-card-strong">
                    <h2 className="text-lg font-semibold text-foreground">
                      {tool.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {tool.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link href={`/${tool.slug}`} className="text-link">
                        Resource page
                      </Link>
                      {availableAlternativeSlugs.has(tool.slug) && (
                        <Link
                          href={`/alternatives/${tool.slug}`}
                          className="text-link"
                        >
                          {tool.title} alternatives
                        </Link>
                      )}
                      <OutboundLink
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        toolSlug={tool.slug}
                        className="text-link"
                      >
                        Visit site
                      </OutboundLink>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section
              className="section-panel"
              aria-labelledby="winner-by-use-case"
            >
              <h2 id="winner-by-use-case" className="section-title">
                Winner by use case
              </h2>
              <ul className="mt-3 space-y-3">
                {context.winnerByUseCase.map((item) => (
                  <li
                    key={`${item.useCase}-${item.winner}`}
                    className="tone-card"
                  >
                    <p className="font-medium text-foreground">
                      {item.useCase}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Winner:{" "}
                      <span className="font-semibold text-foreground">
                        {item.winner === "left"
                          ? context.left.title
                          : item.winner === "right"
                            ? context.right.title
                            : "Tie"}
                      </span>
                      {" · "}
                      {item.reason}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="section-panel" aria-labelledby="criteria-table">
              <h2 id="criteria-table" className="section-title">
                Decision matrix
              </h2>
              <div className="mt-3 matrix-shell">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th>{context.left.title}</th>
                      <th>{context.right.title}</th>
                      <th>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {context.criteriaTable.map((row, index) => (
                      <tr
                        key={`${row.criterion}-${index}`}
                        className="border-t border-border align-top"
                      >
                        <td className="font-semibold text-foreground">
                          {row.criterion}
                        </td>
                        <td>{row.left}</td>
                        <td>{row.right}</td>
                        <td>
                          {row.winner === "left"
                            ? context.left.title
                            : row.winner === "right"
                              ? context.right.title
                              : "Tie"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {context.migrationChecklist.length > 0 && (
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
            )}

            <ProgressiveDisclosure
              id="comparison-reference"
              title="Reference and deeper context"
              description="Open team-fit notes, optional market context, FAQ, related comparisons, and sources."
            >
              <section aria-labelledby="comparison-fit">
                <h3
                  id="comparison-fit"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                >
                  Team fit notes
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <article className="tone-card">
                    <h4 className="text-base font-semibold text-foreground">
                      {context.left.title}: best for / not for
                    </h4>
                    <ul className="section-list list-disc pl-5">
                      {context.left.bestFor.map((item) => (
                        <li key={`left-best-${item}`}>Best for: {item}</li>
                      ))}
                      {context.left.notFor.map((item) => (
                        <li key={`left-not-${item}`}>Not for: {item}</li>
                      ))}
                    </ul>
                  </article>
                  <article className="tone-card">
                    <h4 className="text-base font-semibold text-foreground">
                      {context.right.title}: best for / not for
                    </h4>
                    <ul className="section-list list-disc pl-5">
                      {context.right.bestFor.map((item) => (
                        <li key={`right-best-${item}`}>Best for: {item}</li>
                      ))}
                      {context.right.notFor.map((item) => (
                        <li key={`right-not-${item}`}>Not for: {item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </section>

              {marketMetrics.length > 0 && (
                <section aria-labelledby="comparison-market-context">
                  <h3
                    id="comparison-market-context"
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

              {context.faq.length > 0 && (
                <section aria-labelledby="comparison-faq">
                  <h3
                    id="comparison-faq"
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

              {context.compareNext.length > 0 && (
                <section aria-labelledby="compare-next">
                  <h3
                    id="compare-next"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                  >
                    Compare next
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {context.compareNext.map((nextSlug) => (
                      <li key={nextSlug}>
                        <TrackedCompareLink
                          href={`/compare/${nextSlug}`}
                          comparisonSlug={nextSlug}
                          className="pill-link"
                        >
                          {inferComparisonTitleFromSlug(nextSlug)}
                        </TrackedCompareLink>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section aria-labelledby="comparison-sources">
                <h3
                  id="comparison-sources"
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
                        toolSlug={context.slug}
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
