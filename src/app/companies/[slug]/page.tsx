import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { OutboundLink } from "@/components/OutboundLink";
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/kibo-ui/announcement";
import {
  Glimpse,
  GlimpseContent,
  GlimpseDescription,
  GlimpseTitle,
  GlimpseTrigger,
} from "@/components/kibo-ui/glimpse";
import { Pill } from "@/components/kibo-ui/pill";
import { Status, StatusIndicator, StatusLabel } from "@/components/kibo-ui/status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCategoryLabel } from "@/lib/categories";
import { getCompanyHubPageData } from "@/lib/company-hub-data";
import { getAllCompanyHubSlugs } from "@/lib/company-hubs";
import { getResourceSlug } from "@/lib/slug";
import { BASE_URL } from "@/lib/site-url";

const SOURCE_ORIGIN_ORDER = [
  "official",
  "product",
  "tool",
  "metric",
  "report",
  "article",
] as const;

export const revalidate = 21600; // 6 hr

function labelForLinkKind(kind: string): string {
  switch (kind) {
    case "api":
      return "API";
    case "docs":
      return "Docs";
    case "pricing":
      return "Pricing";
    case "security":
      return "Security";
    case "status":
      return "Status";
    case "community":
      return "Community";
    case "research":
      return "Research";
    case "blog":
      return "Blog";
    case "careers":
      return "Careers";
    default:
      return "Official";
  }
}

function descriptionForLinkKind(kind: string): string {
  switch (kind) {
    case "api":
      return "Core API references, endpoints, and implementation specs.";
    case "docs":
      return "Primary technical or product documentation for this ecosystem.";
    case "pricing":
      return "Current plans, pricing structure, and package options.";
    case "security":
      return "Security, safety, governance, and policy documentation.";
    case "status":
      return "Real-time operational status and incident updates.";
    case "community":
      return "Community forum, support channels, or ecosystem discussions.";
    case "research":
      return "Research publications, technical notes, and model updates.";
    case "blog":
      return "Product announcements, changelogs, and roadmap communication.";
    case "careers":
      return "Company hiring and team expansion information.";
    default:
      return "Official company endpoint in this hub.";
  }
}

function labelForSourceOrigin(origin: string): string {
  switch (origin) {
    case "official":
      return "Official";
    case "product":
      return "Product";
    case "tool":
      return "Tool";
    case "metric":
      return "Metric";
    case "report":
      return "Report";
    case "article":
      return "Article";
    default:
      return "Source";
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFreshnessStatus(
  ageInDays: number | null,
): "online" | "degraded" | "maintenance" {
  if (ageInDays === null) return "maintenance";
  if (ageInDays <= 45) return "online";
  if (ageInDays <= 120) return "degraded";
  return "maintenance";
}

function HubJsonLd({
  name,
  tagline,
  slug,
  website,
  sameAs,
}: {
  name: string;
  tagline: string;
  slug: string;
  website: string;
  sameAs: string[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description: tagline,
    url: website,
    sameAs,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/companies/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export async function generateStaticParams() {
  return getAllCompanyHubSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCompanyHubPageData(slug);
  if (!data) return { title: "Not found" };

  const title = `${data.hub.name} hub | The Stash`;
  const description = data.hub.summary;
  const canonical = `${BASE_URL}/companies/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Stash",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CompanyHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCompanyHubPageData(slug);
  if (!data) notFound();

  const sameAsLinks = data.hub.officialLinks.map((link) => link.url).slice(0, 20);
  const resourcesBySlug = new Map(
    data.resources.map((resource) => [getResourceSlug(resource), resource]),
  );
  const sourceOriginCounts = data.sourceLinks.reduce<Record<string, number>>(
    (acc, source) => {
      acc[source.origin] = (acc[source.origin] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const overviewFacts = [
    {
      label: "Type",
      value: data.hub.companyType ?? "Technology company",
    },
    {
      label: "Founded",
      value: data.hub.founded ?? "N/A",
    },
    {
      label: "Headquarters",
      value: data.hub.headquarters ?? "N/A",
    },
    {
      label: "Primary website",
      value: data.hub.website,
    },
  ];
  const toplineStats = [
    { label: "Resources", value: data.resources.length },
    { label: "Products", value: data.hub.products.length },
    { label: "Alternatives", value: data.alternativePages.length },
    { label: "Comparisons", value: data.comparisonPages.length },
    { label: "Articles", value: data.relatedArticles.length },
    { label: "Sources", value: data.sourceLinks.length },
  ];

  const categoryLabels = data.hub.relatedCategories.map((category) =>
    getCategoryLabel(category),
  );
  const categoryLabel = categoryLabels.join(" · ");

  const reviewTimestamps = data.toolProfiles
    .map((profile) => Date.parse(profile.lastReviewedAt))
    .filter((value): value is number => Number.isFinite(value));
  const latestReviewTimestamp = reviewTimestamps.length
    ? Math.max(...reviewTimestamps)
    : null;
  const latestReviewDate =
    latestReviewTimestamp === null ? null : new Date(latestReviewTimestamp);
  const freshnessAgeDays = latestReviewDate
    ? Math.floor((Date.now() - latestReviewDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const freshnessStatus = getFreshnessStatus(freshnessAgeDays);
  const freshnessLabel = latestReviewDate
    ? `Last reviewed ${formatDate(latestReviewDate)}`
    : "Review timestamp unavailable";

  const sourceGroups = SOURCE_ORIGIN_ORDER.map((origin) => ({
    origin,
    items: data.sourceLinks.filter((source) => source.origin === origin),
  })).filter((group) => group.items.length > 0);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Company hubs", url: `${BASE_URL}/companies` },
    { name: data.hub.name, url: `${BASE_URL}/companies/${data.hub.slug}` },
  ];

  return (
    <div className="min-h-screen">
      <HubJsonLd
        name={data.hub.name}
        tagline={data.hub.tagline}
        slug={data.hub.slug}
        website={data.hub.website}
        sameAs={sameAsLinks}
      />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Company hubs", href: "/companies" },
            { label: data.hub.shortName },
          ]}
          className="mb-6"
        />

        <section className="browse-shell p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Announcement
              className="border-stash-line-soft bg-stash-control text-stash-muted-text"
              variant="outline"
            >
              <AnnouncementTag>Company hub</AnnouncementTag>
              <AnnouncementTitle>{categoryLabel || "General ecosystem"}</AnnouncementTitle>
            </Announcement>
            <Status
              className="rounded-full border border-stash-line-soft bg-stash-control text-stash-muted-text"
              status={freshnessStatus}
            >
              <StatusIndicator />
              <StatusLabel>{freshnessLabel}</StatusLabel>
            </Status>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="font-display text-[clamp(1.95rem,3.8vw,3.15rem)] tracking-tight text-foreground">
                {data.hub.name}
              </h1>
              <p className="mt-2 text-base text-foreground/85">{data.hub.tagline}</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {data.hub.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {categoryLabels.map((label) => (
                  <Pill
                    key={`${data.hub.slug}-${label}`}
                    variant="outline"
                    className="border-stash-line-soft bg-stash-control text-xs"
                  >
                    {label}
                  </Pill>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <OutboundLink
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  href={data.hub.website}
                  rel="noopener noreferrer"
                  target="_blank"
                  toolSlug={data.hub.slug}
                >
                  Visit official site
                </OutboundLink>
                <Button asChild size="lg" variant="outline" className="min-h-11">
                  <Link href="/companies">All company hubs</Link>
                </Button>
              </div>
            </div>

            <div className="grid content-start gap-3">
              <div className="rounded-2xl border border-stash-line-soft bg-stash-control p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-stash-muted-text">
                  Hub highlights
                </p>
                <ul className="mt-2 space-y-2">
                  {data.hub.highlightFacts.map((fact) => (
                    <li key={fact.label}>
                      <p className="text-xs uppercase tracking-[0.1em] text-foreground/70">
                        {fact.label}
                      </p>
                      <p className="text-sm leading-6 text-foreground">{fact.value}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {toplineStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-stash-line-soft bg-stash-control p-2.5"
                  >
                    <p className="text-[0.63rem] uppercase tracking-[0.12em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="overview" className="mt-8 gap-5">
          <TabsList
            variant="line"
            className="w-full justify-start overflow-x-auto rounded-none border-b border-stash-line-soft bg-transparent p-0 pb-0.5"
          >
            <TabsTrigger className="min-h-11 whitespace-nowrap px-3" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-nowrap px-3" value="resources">
              Resources
            </TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-nowrap px-3" value="reports">
              Reports
            </TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-nowrap px-3" value="sources">
              Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-stash-line-soft bg-stash-panel shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-xl">Company snapshot</CardTitle>
                  <CardDescription>
                    Core identity details and baseline editorial context for this company.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <dl className="grid gap-2">
                    {overviewFacts.map((fact) => (
                      <div
                        key={fact.label}
                        className="rounded-xl border border-stash-line-soft bg-stash-control px-3 py-2"
                      >
                        <dt className="text-[0.64rem] uppercase tracking-[0.12em] text-muted-foreground">
                          {fact.label}
                        </dt>
                        <dd className="mt-1 break-words text-sm text-foreground">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>

              <Card className="border-stash-line-soft bg-stash-panel shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-xl">Official links</CardTitle>
                  <CardDescription>
                    Primary docs, APIs, pricing, status, and research links for this ecosystem.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 pt-0">
                  {data.hub.officialLinks.map((link) => (
                    <Glimpse key={link.url} closeDelay={80} openDelay={120}>
                      <GlimpseTrigger asChild>
                        <a
                          className="flex items-center justify-between gap-3 rounded-xl border border-stash-line-soft bg-stash-control px-3 py-2 text-sm transition hover:border-stash-line-strong hover:bg-stash-control-hover"
                          href={link.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <span className="font-medium text-foreground">{link.label}</span>
                          <Pill
                            variant="outline"
                            className="border-stash-line-soft bg-stash-control text-stash-muted-text text-[0.64rem]"
                          >
                            {labelForLinkKind(link.kind)}
                          </Pill>
                        </a>
                      </GlimpseTrigger>
                      <GlimpseContent align="start" className="w-80 border-stash-line-soft bg-stash-panel">
                        <GlimpseTitle>{link.label}</GlimpseTitle>
                        <GlimpseDescription>
                          {descriptionForLinkKind(link.kind)}
                        </GlimpseDescription>
                        <p className="mt-2 truncate text-xs text-muted-foreground">{link.url}</p>
                      </GlimpseContent>
                    </Glimpse>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-stash-line-soft bg-stash-panel shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl">Products and tools</CardTitle>
                <CardDescription>
                  Product map with direct paths to official destinations and The Stash pages.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-0 md:grid-cols-2">
                {data.hub.products.map((product) => {
                  const linkedResource = product.toolSlug
                    ? resourcesBySlug.get(product.toolSlug)
                    : undefined;

                  return (
                    <div
                      key={product.name}
                      className="rounded-xl border border-stash-line-soft bg-stash-control p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{product.name}</p>
                        <OutboundLink
                          className="text-xs text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
                          href={product.url}
                          rel="noopener noreferrer"
                          target="_blank"
                          toolSlug={data.hub.slug}
                        >
                          Official
                        </OutboundLink>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{product.summary}</p>
                      {linkedResource ? (
                        <div className="mt-3">
                          <Button asChild size="sm" variant="outline" className="min-h-10">
                            <Link href={`/${getResourceSlug(linkedResource)}`}>
                              Open in The Stash
                            </Link>
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-stash-line-soft bg-stash-panel shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl">Decision surfaces</CardTitle>
                <CardDescription>
                  Internal pages covering alternatives, comparisons, and strategic reports.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-0 md:grid-cols-3">
                <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
                  <Pill variant="outline" className="border-stash-line-soft bg-stash-control text-stash-muted-text text-xs">
                    Alternatives
                  </Pill>
                  {data.alternativePages.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {data.alternativePages.slice(0, 8).map((page) => (
                        <li key={page.slug}>
                          <Link
                            className="text-sm text-foreground underline underline-offset-2 transition hover:text-primary"
                            href={`/alternatives/${page.slug}`}
                          >
                            {page.tool.title} alternatives
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No alternatives yet.</p>
                  )}
                </div>

                <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
                  <Pill variant="outline" className="border-stash-line-soft bg-stash-control text-stash-muted-text text-xs">
                    Comparisons
                  </Pill>
                  {data.comparisonPages.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {data.comparisonPages.slice(0, 8).map((page) => (
                        <li key={page.slug}>
                          <Link
                            className="text-sm text-foreground underline underline-offset-2 transition hover:text-primary"
                            href={`/compare/${page.slug}`}
                          >
                            {page.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No comparisons yet.</p>
                  )}
                </div>

                <div className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
                  <Pill variant="outline" className="border-stash-line-soft bg-stash-control text-stash-muted-text text-xs">
                    Reports
                  </Pill>
                  {data.reportLinks.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {data.reportLinks.map((report) => (
                        <li key={report.href}>
                          <Link
                            className="text-sm text-foreground underline underline-offset-2 transition hover:text-primary"
                            href={report.href}
                          >
                            {report.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">{report.detail}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No report links yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card className="border-stash-line-soft bg-stash-panel shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl">Resources in The Stash</CardTitle>
                <CardDescription>
                  Canonical pages mapped to this company and its product surface.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {data.resources.length > 0 ? (
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {data.resources.map((resource) => (
                      <li
                        key={resource._id}
                        className="rounded-xl border border-stash-line-soft bg-stash-control p-3"
                      >
                        <Link
                          className="text-sm font-medium text-foreground underline underline-offset-2 transition hover:text-primary"
                          href={`/${getResourceSlug(resource)}`}
                        >
                          {resource.title}
                        </Link>
                        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                          {resource.description}
                        </p>
                        <div className="mt-2">
                          <Pill
                            variant="outline"
                            className="border-stash-line-soft bg-stash-control text-stash-muted-text text-[0.64rem]"
                          >
                            {getCategoryLabel(resource.category)}
                          </Pill>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No mapped resource pages yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-stash-line-soft bg-stash-panel shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl">Related articles and guides</CardTitle>
                <CardDescription>
                  Editorial content that references this company, products, or related workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {data.relatedArticles.length > 0 ? (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {data.relatedArticles.slice(0, 10).map((article) => {
                      if (!article.slug) return null;
                      return (
                        <li
                          key={article._id}
                          className="rounded-xl border border-stash-line-soft bg-stash-control p-3"
                        >
                          <Link
                            className="text-sm font-medium text-foreground underline underline-offset-2 transition hover:text-primary"
                            href={`/blog/${article.slug}`}
                          >
                            {article.title}
                          </Link>
                          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                            {article.excerpt}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No related articles found.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-stash-line-soft bg-stash-panel shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl">Tool profile signals</CardTitle>
                <CardDescription>
                  Operational notes captured for key tools connected to this company hub.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {data.toolProfiles.length > 0 ? (
                  <ul className="grid gap-3 md:grid-cols-2">
                    {data.toolProfiles.map((profile) => {
                      const relatedResource = resourcesBySlug.get(profile.slug);

                      return (
                        <li
                          key={profile.slug}
                          className="rounded-xl border border-stash-line-soft bg-stash-control p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            {relatedResource ? (
                              <Link
                                className="font-medium text-foreground underline underline-offset-2 transition hover:text-primary"
                                href={`/${getResourceSlug(relatedResource)}`}
                              >
                                {profile.title}
                              </Link>
                            ) : (
                              <p className="font-medium text-foreground">{profile.title}</p>
                            )}
                            <Pill
                              variant="outline"
                              className="border-stash-line-soft bg-stash-control text-stash-muted-text text-[0.64rem]"
                            >
                              {getCategoryLabel(profile.category)}
                            </Pill>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{profile.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Pill
                              variant="outline"
                              className="border-stash-line-soft bg-stash-control text-stash-muted-text text-[0.64rem]"
                            >
                              Setup: {profile.setupSpeed}
                            </Pill>
                            <Pill
                              variant="outline"
                              className="border-stash-line-soft bg-stash-control text-stash-muted-text text-[0.64rem]"
                            >
                              Collab: {profile.collaboration}
                            </Pill>
                            <Pill
                              variant="outline"
                              className="border-stash-line-soft bg-stash-control text-stash-muted-text text-[0.64rem]"
                            >
                              Extensibility: {profile.extensibility}
                            </Pill>
                            <Pill
                              variant="outline"
                              className="border-stash-line-soft bg-stash-control text-stash-muted-text text-[0.64rem]"
                            >
                              Lock-in: {profile.lockInRisk}
                            </Pill>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{profile.pricingNotes}</p>
                          {profile.sources.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {profile.sources.slice(0, 2).map((source) => (
                                <OutboundLink
                                  key={`${profile.slug}-${source.url}`}
                                  className="text-xs text-foreground underline underline-offset-2 transition hover:text-primary"
                                  href={source.url}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                  toolSlug={data.hub.slug}
                                >
                                  {source.label}
                                </OutboundLink>
                              ))}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No tool profile signals available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-stash-line-soft bg-stash-panel shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-xl">Internal report links</CardTitle>
                  <CardDescription>
                    The Stash reports connected to this company and its decision landscape.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {data.reportLinks.length > 0 ? (
                    <ul className="space-y-2">
                      {data.reportLinks.map((report) => (
                        <li key={report.href} className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
                          <Link
                            className="text-sm font-medium text-foreground underline underline-offset-2 transition hover:text-primary"
                            href={report.href}
                          >
                            {report.title}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">{report.detail}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No report links configured.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-stash-line-soft bg-stash-panel shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-xl">Official reports</CardTitle>
                  <CardDescription>
                    External organization reports and benchmark references mapped here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {data.officialReports.length > 0 ? (
                    <ul className="space-y-2">
                      {data.officialReports.map((report) => (
                        <li key={report.id} className="rounded-xl border border-stash-line-soft bg-stash-control p-3">
                          <Pill
                            variant="outline"
                            className="border-stash-line-soft bg-stash-control text-stash-muted-text text-[0.64rem]"
                          >
                            {report.organization}
                          </Pill>
                          <OutboundLink
                            className="mt-1 block text-sm font-medium text-foreground underline underline-offset-2 transition hover:text-primary"
                            href={report.reportUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                            toolSlug={data.hub.slug}
                          >
                            {report.title}
                          </OutboundLink>
                          <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No official reports mapped.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-stash-line-soft bg-stash-panel shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl">Market and adoption signals</CardTitle>
                <CardDescription>
                  Source-backed metrics tied to this ecosystem and adjacent workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {data.marketMetrics.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[35%]">Signal</TableHead>
                        <TableHead className="w-[45%]">Why it matters</TableHead>
                        <TableHead className="w-[20%]">Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.marketMetrics.map((metric) => (
                        <TableRow key={metric.id}>
                          <TableCell className="whitespace-normal text-sm font-medium text-foreground">
                            {metric.metric}
                          </TableCell>
                          <TableCell className="whitespace-normal text-sm text-muted-foreground">
                            {metric.detail}
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <OutboundLink
                              className="text-sm text-foreground underline underline-offset-2 transition hover:text-primary"
                              href={metric.sourceUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                              toolSlug={data.hub.slug}
                            >
                              {metric.sourceLabel}
                            </OutboundLink>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No market metrics available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card className="border-stash-line-soft bg-stash-panel shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl">Source index</CardTitle>
                <CardDescription>
                  Consolidated source inventory across official links, tools, reports, metrics, and articles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Status
                    className="rounded-full border border-stash-line-soft bg-stash-control text-stash-muted-text"
                    status={freshnessStatus}
                  >
                    <StatusIndicator />
                    <StatusLabel>{freshnessLabel}</StatusLabel>
                  </Status>
                  <Pill variant="outline" className="border-stash-line-soft bg-stash-control text-stash-muted-text text-xs">
                    {data.sourceLinks.length} total sources
                  </Pill>
                  {Object.entries(sourceOriginCounts).map(([origin, count]) => (
                    <Pill
                      key={origin}
                      variant="outline"
                      className="border-stash-line-soft bg-stash-control text-stash-muted-text text-xs"
                    >
                      {labelForSourceOrigin(origin)}: {count}
                    </Pill>
                  ))}
                </div>

                <Separator />

                {sourceGroups.length > 0 ? (
                  <div className="space-y-5">
                    {sourceGroups.map((group) => (
                      <section key={group.origin} className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Pill
                            variant="outline"
                            className="border-stash-line-soft bg-stash-control text-stash-muted-text text-xs"
                          >
                            {labelForSourceOrigin(group.origin)}
                          </Pill>
                          <p className="text-xs text-muted-foreground">{group.items.length} links</p>
                        </div>

                        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {group.items.map((source) => (
                            <li key={source.url}>
                              <OutboundLink
                                className="block rounded-xl border border-stash-line-soft bg-stash-control px-3 py-2 text-sm transition hover:border-stash-line-strong hover:bg-stash-control-hover"
                                href={source.url}
                                rel="noopener noreferrer"
                                target="_blank"
                                toolSlug={data.hub.slug}
                              >
                                <span className="block font-medium text-foreground">{source.label}</span>
                                <span className="mt-1 block truncate text-xs text-muted-foreground">
                                  {source.url.replace(/^https?:\/\//, "")}
                                </span>
                              </OutboundLink>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No source links available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
