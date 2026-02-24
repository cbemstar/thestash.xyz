import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { FeatureHubScaffold } from "@/components/FeatureHubScaffold";
import { getWebflowHubStats } from "@/lib/webflow-hub-data";
import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Ecosystem hubs | The Stash",
  description:
    "Curated ecosystem hubs that organize tools, templates, apps, and implementation resources by platform.",
  alternates: { canonical: `${BASE_URL}/ecosystems` },
};

export default function EcosystemsIndexPage() {
  const webflowStats = getWebflowHubStats();
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Ecosystems", url: `${BASE_URL}/ecosystems` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <FeatureHubScaffold
          breadcrumbs={[{ label: "The Stash", href: "/" }, { label: "Ecosystems" }]}
          kicker="Structured discovery"
          title="Ecosystem hubs"
          description="Platform-specific repositories that group practical resources in one consistent structure. Hubs are designed to scale as new ecosystems are added."
          primaryLinks={[
            { href: "/ecosystems/webflow", label: "Open Webflow ecosystem" },
            { href: "/category", label: "Browse all categories" },
          ]}
        >
          <section className="section-panel" aria-labelledby="ecosystem-hubs">
            <h2 id="ecosystem-hubs" className="section-title">
              Available hubs
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              <li className="tone-card-strong">
                <h3 className="text-base font-semibold text-foreground">
                  Webflow ecosystem
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {webflowStats.total} resources split across apps, cloneables,
                  templates, and inspiration.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                  <li>{webflowStats.byKind.app} apps</li>
                  <li>{webflowStats.byKind.cloneable} cloneables</li>
                  <li>{webflowStats.byKind.template} templates</li>
                  <li>{webflowStats.byKind.inspiration} inspiration</li>
                </ul>
                <Link
                  href="/ecosystems/webflow"
                  className="mt-4 inline-flex pill-link"
                >
                  Explore hub
                </Link>
              </li>
            </ul>
          </section>
        </FeatureHubScaffold>
      </main>
    </div>
  );
}

