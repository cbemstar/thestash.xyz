import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { getSeoQualityReport } from "@/lib/seo-quality";
import { BASE_URL } from "@/lib/site-url";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO review queue | The Stash",
  description:
    "Freshness and quality status for alternatives, comparisons, and use-case SEO pages.",
  alternates: { canonical: `${BASE_URL}/seo/review` },
  robots: { index: false, follow: false },
};

export default async function SeoReviewPage() {
  const report = await getSeoQualityReport();
  const failingItems = report.items.filter((item) => !item.pass);
  const staleItems = report.items.filter((item) => item.stale);
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "SEO review", url: `${BASE_URL}/seo/review` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "SEO review queue" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          SEO review queue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generated {new Date(report.generatedAt).toLocaleString()} · total {report.summary.total} ·
          passing {report.summary.passing} · failing {report.summary.failing} · stale{" "}
          {report.summary.stale}
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-card/30 px-4 py-6 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Needs fixes</h2>
          {failingItems.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No quality gate failures.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {failingItems.map((item) => (
                <li key={`${item.type}-${item.slug}`} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {item.type}
                    </span>
                    <Link
                      href={item.url}
                      className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                    >
                      {item.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">({item.source})</span>
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card/30 px-4 py-6 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Stale pages (90d+)</h2>
          {staleItems.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No stale pages right now.</p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {staleItems.map((item) => (
                <li key={`stale-${item.type}-${item.slug}`}>
                  <Link
                    href={item.url}
                    className="block rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card/30 px-4 py-6 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Quality API</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Automation endpoint for monitoring:
            {" "}
            <code className="rounded bg-muted px-1">/api/seo/quality</code>
          </p>
        </section>
      </main>
    </div>
  );
}
