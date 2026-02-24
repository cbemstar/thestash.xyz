import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/kibo-ui/announcement";
import { Pill } from "@/components/kibo-ui/pill";
import { Status, StatusIndicator, StatusLabel } from "@/components/kibo-ui/status";
import { OutboundLink } from "@/components/OutboundLink";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/categories";
import { getCompanyHubDirectoryData } from "@/lib/company-hub-data";
import { BASE_URL } from "@/lib/site-url";

export const revalidate = 21600; // 6 hr

export const metadata: Metadata = {
  title: "Company hubs | The Stash",
  description:
    "Centralized hub pages for major AI and developer companies: official links, products, tools, reports, articles, and related decision pages.",
  alternates: {
    canonical: `${BASE_URL}/companies`,
  },
};

function CollectionJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Company hubs",
    description:
      "Centralized hubs for major AI and developer companies with related tools, reports, and resources.",
    url: `${BASE_URL}/companies`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function CompaniesIndexPage() {
  const entries = await getCompanyHubDirectoryData();

  const totals = entries.reduce(
    (acc, entry) => ({
      resources: acc.resources + entry.resourceCount,
      articles: acc.articles + entry.articleCount,
      alternatives: acc.alternatives + entry.alternativeCount,
      comparisons: acc.comparisons + entry.comparisonCount,
    }),
    { resources: 0, articles: 0, alternatives: 0, comparisons: 0 },
  );
  const averageResourcesPerHub = entries.length
    ? (totals.resources / entries.length).toFixed(1)
    : "0";

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Company hubs", url: `${BASE_URL}/companies` },
  ];

  return (
    <div className="min-h-screen">
      <CollectionJsonLd />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Company hubs" },
          ]}
          className="mb-6"
        />

        <section className="browse-shell p-5 sm:p-7">
          <Announcement
            className="w-fit border-stash-line-soft bg-stash-control text-stash-muted-text"
            variant="outline"
          >
            <AnnouncementTag>Company Atlas</AnnouncementTag>
            <AnnouncementTitle>
              Unified research hubs for major AI and developer ecosystems
            </AnnouncementTitle>
          </Announcement>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="font-display text-[clamp(1.8rem,3.3vw,2.9rem)] tracking-tight text-foreground">
                One page per company, every key resource in one place
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stash-muted-text sm:text-base">
                Each hub acts like a live encyclopedia for a company or tool
                ecosystem. You get official links, product map, resource pages,
                alternatives, comparisons, reports, and source-backed references
                without context switching.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="lg" className="min-h-11">
                  <Link href="/reports/ai-coding-tools-benchmark">
                    Open benchmark report
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-11">
                  <Link href="/reports/ai-adoption-trust-signals">
                    View adoption signals
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-stash-muted-text">
                  Total hubs
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{entries.length}</p>
              </div>
              <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-stash-muted-text">
                  Total resources
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{totals.resources}</p>
              </div>
              <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-stash-muted-text">
                  Total source density
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {averageResourcesPerHub} per hub
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
            <Pill variant="outline" className="border-stash-line-soft bg-stash-control text-xs text-stash-muted-text">
              Resources
            </Pill>
            <p className="mt-2 text-lg font-semibold text-foreground">{totals.resources}</p>
          </div>
          <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
            <Pill variant="outline" className="border-stash-line-soft bg-stash-control text-xs text-stash-muted-text">
              Articles
            </Pill>
            <p className="mt-2 text-lg font-semibold text-foreground">{totals.articles}</p>
          </div>
          <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
            <Pill variant="outline" className="border-stash-line-soft bg-stash-control text-xs text-stash-muted-text">
              Alternatives
            </Pill>
            <p className="mt-2 text-lg font-semibold text-foreground">{totals.alternatives}</p>
          </div>
          <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
            <Pill variant="outline" className="border-stash-line-soft bg-stash-control text-xs text-stash-muted-text">
              Comparisons
            </Pill>
            <p className="mt-2 text-lg font-semibold text-foreground">{totals.comparisons}</p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
                Explore company hubs
              </h2>
              <p className="mt-1 text-sm text-stash-muted-text">
                Choose a company to open its complete tools, links, pages, and
                source index.
              </p>
            </div>
            <Status
              className="rounded-full border border-stash-line-soft bg-stash-control px-3 py-1 text-stash-muted-text"
              status="online"
            >
              <StatusIndicator />
              <StatusLabel>Hub dataset synced</StatusLabel>
            </Status>
          </div>

          <ul className="grid gap-4 md:grid-cols-2">
            {entries.map((entry) => (
              <li key={entry.hub.slug}>
                <article className="browse-card group h-full p-5">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Announcement
                        className="border-stash-line-soft bg-stash-control text-xs text-stash-muted-text"
                        variant="outline"
                      >
                        <AnnouncementTag>
                          {entry.hub.companyType ?? "Company hub"}
                        </AnnouncementTag>
                        <AnnouncementTitle>{entry.hub.shortName} hub</AnnouncementTitle>
                      </Announcement>
                      <Pill
                        variant="outline"
                        className="border-stash-line-soft bg-stash-control text-xs text-stash-muted-text"
                      >
                        {entry.hub.relatedCategories.length} categories
                      </Pill>
                    </div>
                    <div>
                      <h3 className="font-display text-2xl tracking-tight text-foreground">
                        {entry.hub.shortName}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-stash-muted-text">
                        {entry.hub.tagline}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-stash-line-soft bg-stash-control p-2.5">
                        <dt className="text-[0.64rem] uppercase tracking-[0.12em] text-stash-muted-text">
                          Resources
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground">
                          {entry.resourceCount}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-stash-line-soft bg-stash-control p-2.5">
                        <dt className="text-[0.64rem] uppercase tracking-[0.12em] text-stash-muted-text">
                          Articles
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground">
                          {entry.articleCount}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-stash-line-soft bg-stash-control p-2.5">
                        <dt className="text-[0.64rem] uppercase tracking-[0.12em] text-stash-muted-text">
                          Alternatives
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground">
                          {entry.alternativeCount}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-stash-line-soft bg-stash-control p-2.5">
                        <dt className="text-[0.64rem] uppercase tracking-[0.12em] text-stash-muted-text">
                          Comparisons
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground">
                          {entry.comparisonCount}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap gap-1.5">
                      {entry.hub.relatedCategories.slice(0, 3).map((category) => (
                        <Pill
                          key={`${entry.hub.slug}-${category}`}
                          variant="outline"
                          className="border-stash-line-soft bg-stash-control text-xs text-stash-muted-text"
                        >
                          {getCategoryLabel(category)}
                        </Pill>
                      ))}
                    </div>

                    <p className="text-sm leading-6 text-stash-muted-text">
                      {entry.hub.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button asChild size="lg" className="min-h-11">
                        <Link href={`/companies/${entry.hub.slug}`}>
                          Open {entry.hub.shortName} hub
                        </Link>
                      </Button>
                      <OutboundLink
                        className="inline-flex min-h-11 items-center justify-center rounded-md border border-stash-line-soft bg-stash-control px-4 text-sm font-medium text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover"
                        href={entry.hub.website}
                        rel="noopener noreferrer"
                        target="_blank"
                        toolSlug={entry.hub.slug}
                      >
                        Official website
                      </OutboundLink>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
