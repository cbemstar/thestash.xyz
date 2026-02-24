import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { FeatureHubScaffold } from "@/components/FeatureHubScaffold";
import { MigrationFinder } from "@/components/MigrationFinder";
import { getAllMigrationPages } from "@/lib/migration-pages";
import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Migration playbooks | The Stash",
  description:
    "Phased migration guides to move from one tool to another with execution checklists, risk controls, and timeline estimates.",
  alternates: { canonical: `${BASE_URL}/migrate` },
};

export default function MigrationIndexPage() {
  const pages = getAllMigrationPages();
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Migrate", url: `${BASE_URL}/migrate` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <FeatureHubScaffold
          breadcrumbs={[{ label: "The Stash", href: "/" }, { label: "Migrate" }]}
          kicker="Migration library"
          title="Migration playbooks"
          description="Practical migration plans for switching tools without breaking team workflows. Each page includes phased rollout steps, risk controls, and operational checklists."
          primaryLinks={[
            { href: "/compare", label: "Browse comparisons" },
            { href: "/alternatives", label: "Browse alternatives" },
          ]}
        >
          <MigrationFinder
            pages={pages.map((page) => ({
              slug: page.slug,
              title: page.title,
              summary: page.summary,
              fromTitle: page.fromTitle,
              toTitle: page.toTitle,
              effortTier: page.effortTier,
              estimatedTimeline: page.estimatedTimeline,
            }))}
          />
        </FeatureHubScaffold>
      </main>
    </div>
  );
}
