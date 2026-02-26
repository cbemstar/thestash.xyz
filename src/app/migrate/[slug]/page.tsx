import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { ContentDensityShell } from "@/components/ContentDensityShell";
import { OnThisPageNav } from "@/components/OnThisPageNav";
import { OutboundLink } from "@/components/OutboundLink";
import { ProgressiveDisclosure } from "@/components/ProgressiveDisclosure";
import { StatusNotice } from "@/components/StatusNotice";
import {
  evaluateMigrationQuality,
  getAllMigrationSlugs,
  getMigrationPageBySlug,
} from "@/lib/migration-pages";
import { getAllAlternativePageSlugs } from "@/lib/seo-pages";
import { BASE_URL } from "@/lib/site-url";

function MigrationFaqJsonLd({
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

export async function generateStaticParams() {
  return getAllMigrationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getMigrationPageBySlug(slug);
  if (!page) return { title: "Not found" };

  const quality = evaluateMigrationQuality(page);
  const title = `${page.title} (2026): phased checklist and rollout plan | The Stash`;
  const description = `${page.summary} Includes migration phases, risk controls, and operational readiness checkpoints.`;
  const canonical = `${BASE_URL}/migrate/${slug}`;

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

export default async function MigrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getMigrationPageBySlug(slug);
  if (!page) notFound();
  const quality = evaluateMigrationQuality(page);
  const hasFromAlternatives = getAllAlternativePageSlugs().includes(
    page.fromSlug,
  );
  const hasToAlternatives = getAllAlternativePageSlugs().includes(page.toSlug);
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Migrate", url: `${BASE_URL}/migrate` },
    { name: page.title, url: `${BASE_URL}/migrate/${slug}` },
  ];
  const onThisPageItems = [
    { id: "start-here", label: "Start here" },
    { id: "switch-vs-stay", label: "Switch vs stay" },
    { id: "prerequisites", label: "Preconditions" },
    { id: "phased-rollout", label: "Phased rollout" },
    { id: "execution-checklist", label: "Checklist" },
    { id: "risk-controls", label: "Risk controls" },
    { id: "migration-reference", label: "References" },
  ];

  return (
    <>
      <MigrationFaqJsonLd faq={page.faq} />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: "Migrate", href: "/migrate" },
              { label: page.title },
            ]}
            className="mb-6"
          />

          <header className="insight-hero">
            <p className="insight-kicker">Migration playbook</p>
            <h1 className="insight-title">{page.title}</h1>
            <p className="insight-lead">{page.answerFirst}</p>
            <div className="insight-meta">
              <span>
                Effort:{" "}
                <span className="font-semibold text-foreground capitalize">
                  {page.effortTier}
                </span>
              </span>
              <span>
                Timeline:{" "}
                <span className="font-semibold text-foreground">
                  {page.estimatedTimeline}
                </span>
              </span>
              <span>
                Last reviewed:{" "}
                {page.lastReviewedAt
                  ? new Date(page.lastReviewedAt).toLocaleDateString()
                  : "Not set"}
              </span>
            </div>
          </header>

          <section
            id="start-here"
            className="mt-8 section-panel sm:p-5"
            aria-labelledby="start-here-title"
          >
            <h2 id="start-here-title" className="section-title">
              Start here
            </h2>
            <ul className="section-list list-disc pl-5">
              <li>
                Expected rollout window:{" "}
                <span className="font-semibold text-foreground">
                  {page.estimatedTimeline}
                </span>
                .
              </li>
              <li>
                Begin with prerequisites and pilot, then use the checklist for
                rollout sequencing.
              </li>
              <li>
                Validate results against your KPI baseline before full cutover.
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="#execution-checklist" className="pill-link">
                Jump to checklist
              </Link>
              <Link href="#risk-controls" className="pill-link">
                Jump to risk controls
              </Link>
            </div>
          </section>

          <ContentDensityShell pageKey="migrate-detail">
            <OnThisPageNav items={onThisPageItems} className="mt-0" />

            {!quality.pass && (
              <StatusNotice
                variant="warning"
                title="Editorial review required"
                items={quality.reasons}
                className="mt-6"
              />
            )}

            <section className="section-panel" aria-labelledby="switch-vs-stay">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h2 id="switch-vs-stay" className="section-title">
                    Why teams switch
                  </h2>
                  <ul className="section-list list-disc pl-5">
                    {page.switchDrivers.map((driver) => (
                      <li key={driver}>{driver}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="section-title">When staying is reasonable</h2>
                  <ul className="section-list list-disc pl-5">
                    {(page.stayDrivers.length > 0
                      ? page.stayDrivers
                      : [
                          "Current setup may still fit if switching cost is high.",
                        ]
                    ).map((driver) => (
                      <li key={driver}>{driver}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="section-panel" aria-labelledby="prerequisites">
              <h2 id="prerequisites" className="section-title">
                Preconditions before migration
              </h2>
              <ul className="section-list list-disc pl-5">
                {page.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="section-panel" aria-labelledby="phased-rollout">
              <h2 id="phased-rollout" className="section-title">
                Phased rollout plan
              </h2>
              <div className="mt-4 space-y-4">
                {page.phases.map((phase) => (
                  <article key={phase.title} className="tone-card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {phase.title}
                      </h3>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                        {phase.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {phase.objective}
                    </p>
                    <h4 className="section-subtitle">Tasks</h4>
                    <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                      {phase.tasks.map((task) => (
                        <li key={task}>{task}</li>
                      ))}
                    </ul>
                    <h4 className="section-subtitle">Exit criteria</h4>
                    <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                      {phase.successCriteria.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section
              className="section-panel"
              aria-labelledby="execution-checklist"
            >
              <h2 id="execution-checklist" className="section-title">
                Execution checklist
              </h2>
              <ol className="section-list list-decimal pl-5">
                {page.migrationChecklist.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="section-panel" aria-labelledby="risk-controls">
              <h2 id="risk-controls" className="section-title">
                Risk controls
              </h2>
              <ul className="section-list list-disc pl-5">
                {page.riskControls.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <ProgressiveDisclosure
              id="migration-reference"
              title="Reference and next steps"
              description="Open decision links, FAQ, sources, and related migration plans."
            >
              <section aria-labelledby="migration-links">
                <h3
                  id="migration-links"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                >
                  Related decision links
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  <li>
                    <Link
                      href={`/compare/${page.comparisonSlug}`}
                      className="pill-link"
                    >
                      Compare page
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${page.fromSlug}`} className="pill-link">
                      {page.fromTitle} resource
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${page.toSlug}`} className="pill-link">
                      {page.toTitle} resource
                    </Link>
                  </li>
                  {hasFromAlternatives && (
                    <li>
                      <Link
                        href={`/alternatives/${page.fromSlug}`}
                        className="pill-link"
                      >
                        {page.fromTitle} alternatives
                      </Link>
                    </li>
                  )}
                  {hasToAlternatives && (
                    <li>
                      <Link
                        href={`/alternatives/${page.toSlug}`}
                        className="pill-link"
                      >
                        {page.toTitle} alternatives
                      </Link>
                    </li>
                  )}
                </ul>
              </section>

              {page.faq.length > 0 && (
                <section aria-labelledby="migration-faq">
                  <h3
                    id="migration-faq"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                  >
                    FAQ
                  </h3>
                  <div className="mt-3 space-y-4">
                    {page.faq.map((item) => (
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

              {page.sources.length > 0 && (
                <section aria-labelledby="migration-sources">
                  <h3
                    id="migration-sources"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                  >
                    Sources
                  </h3>
                  <ul className="section-list list-disc pl-5">
                    {page.sources.map((source) => (
                      <li key={source.url}>
                        <OutboundLink
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          toolSlug={page.toSlug}
                          className="text-link"
                        >
                          {source.label}
                        </OutboundLink>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {page.relatedMigrationSlugs.length > 0 && (
                <section aria-labelledby="related-migrations">
                  <h3
                    id="related-migrations"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
                  >
                    Related migration plans
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {page.relatedMigrationSlugs.map((relatedSlug) => {
                      const related = getMigrationPageBySlug(relatedSlug);
                      if (!related) return null;
                      return (
                        <li key={relatedSlug}>
                          <Link
                            href={`/migrate/${relatedSlug}`}
                            className="pill-link"
                          >
                            {related.fromTitle} to {related.toTitle}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </ProgressiveDisclosure>
          </ContentDensityShell>
        </main>
      </div>
    </>
  );
}
