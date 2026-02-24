import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAiAdoptionTrustReportSummary } from "@/lib/ai-adoption-trust-report";
import { getAiDiscoverabilityReportSummary } from "@/lib/ai-discoverability-report";
import { getAiCodingBenchmarkSummary } from "@/lib/benchmark-reports";
import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Data reports | The Stash",
  description:
    "Data-driven reports for AI tooling decisions, SEO discoverability, and AI answer-surface visibility.",
  alternates: { canonical: `${BASE_URL}/reports` },
};

export default function ReportsIndexPage() {
  const benchmarkSummary = getAiCodingBenchmarkSummary();
  const adoptionSummary = getAiAdoptionTrustReportSummary();
  const discoverabilitySummary = getAiDiscoverabilityReportSummary();
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const reports = [
    {
      href: "/reports/ai-coding-tools-benchmark",
      kind: "Benchmark",
      title: benchmarkSummary.title,
      summary: benchmarkSummary.description,
      updatedAt: benchmarkSummary.updatedAt,
      highlights: [
        `${benchmarkSummary.totalTools} tools`,
        `Avg score ${benchmarkSummary.averageScore}`,
      ],
    },
    {
      href: `/reports/${adoptionSummary.slug}`,
      kind: "Adoption",
      title: adoptionSummary.title,
      summary: adoptionSummary.description,
      updatedAt: adoptionSummary.updatedAt,
      highlights: [
        `${adoptionSummary.totalMetrics} signals`,
        `${adoptionSummary.totalSources} sources`,
      ],
    },
    {
      href: `/reports/${discoverabilitySummary.slug}`,
      kind: "Discoverability",
      title: discoverabilitySummary.title,
      summary: discoverabilitySummary.description,
      updatedAt: discoverabilitySummary.updatedAt,
      highlights: [
        `${discoverabilitySummary.totalSignals} signals`,
        `${discoverabilitySummary.totalSources} sources`,
      ],
    },
  ];
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Reports", url: `${BASE_URL}/reports` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Reports" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-3xl font-bold text-foreground">Data reports</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Data-driven reports built for practical tool decisions, SEO discoverability,
          and AI answer-surface visibility.
        </p>

        <ul className="mt-8 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <li key={report.href} className="h-full">
              <Card className="group relative h-full gap-0 overflow-hidden border-border/80 bg-card/60 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/10">
                <div
                  className="pointer-events-none absolute right-0 top-0 h-20 w-20 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/15 blur-2xl transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
                <CardHeader className="space-y-3 px-5 pt-5 pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="border-primary/25 bg-primary/[0.08] text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-primary"
                    >
                      {report.kind}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDate(report.updatedAt)}
                    </p>
                  </div>
                  <CardTitle className="min-h-[3.5rem] text-lg leading-snug text-foreground">
                    <Link
                      href={report.href}
                      className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {report.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col px-5 pt-3">
                  <p className="min-h-[4.5rem] text-sm leading-relaxed text-muted-foreground">
                    {report.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.highlights.map((highlight) => (
                      <Badge
                        key={highlight}
                        variant="secondary"
                        className="bg-muted/75 text-[0.7rem] font-medium text-foreground/80"
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="mt-auto px-5 pt-4 pb-5">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full justify-between border-border/80 bg-background/80"
                  >
                    <Link href={report.href}>
                      Open report
                      <ArrowRightIcon className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
