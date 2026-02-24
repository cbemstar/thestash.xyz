import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { FeatureHubScaffold } from "@/components/FeatureHubScaffold";
import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Decision center | The Stash",
  description:
    "Decision-focused routes for choosing tools, evaluating alternatives, and planning migrations.",
  alternates: { canonical: `${BASE_URL}/decision-center` },
};

export default function DecisionCenterPage() {
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Decision center", url: `${BASE_URL}/decision-center` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <FeatureHubScaffold
          breadcrumbs={[{ label: "The Stash", href: "/" }, { label: "Decision center" }]}
          kicker="Decision workflows"
          title="Decision center"
          description="Use structured decision pages to compare tools, evaluate alternatives, and execute migrations with less uncertainty."
          primaryLinks={[
            { href: "/compare", label: "Tool comparisons" },
            { href: "/alternatives", label: "Tool alternatives" },
            { href: "/migrate", label: "Migration playbooks" },
            { href: "/tools", label: "Free tools" },
          ]}
        >
          <section className="section-panel">
            <h2 className="section-title">How to use this area</h2>
            <ol className="section-list list-decimal pl-5">
              <li>Start in comparisons when evaluating two options directly.</li>
              <li>Use alternatives when replacing one existing tool.</li>
              <li>Use migration playbooks once you decide to switch.</li>
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/compare" className="pill-link">
                Open comparisons
              </Link>
              <Link href="/alternatives" className="pill-link">
                Open alternatives
              </Link>
              <Link href="/migrate" className="pill-link">
                Open migrations
              </Link>
            </div>
          </section>
        </FeatureHubScaffold>
      </main>
    </div>
  );
}
