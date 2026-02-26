import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { CalculatorCard } from "@/components/CalculatorCard";
import { FeatureHubScaffold } from "@/components/FeatureHubScaffold";
import {
  CALCULATOR_CATEGORIES,
  getAllCalculators,
  getCalculatorsByCategory,
  getFeaturedCalculators,
} from "@/lib/calculators-catalog";
import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Calculators | The Stash",
  description:
    "Financial, health, math, and date calculators built in The Stash style with practical output and transparent formulas.",
  alternates: { canonical: `${BASE_URL}/calculators` },
  openGraph: {
    title: "Calculators | The Stash",
    description:
      "Use calculators for mortgage, loan, BMI, percentage, age, and interest projections.",
    url: `${BASE_URL}/calculators`,
    siteName: "The Stash",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calculators | The Stash",
    description:
      "Use calculators for mortgage, loan, BMI, percentage, age, and interest projections.",
  },
};

export default function CalculatorsPage() {
  const allCalculators = getAllCalculators();
  const featured = getFeaturedCalculators(6);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Calculators", url: `${BASE_URL}/calculators` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
        <FeatureHubScaffold
          breadcrumbs={[{ label: "The Stash", href: "/" }, { label: "Calculators" }]}
          kicker="Calculator library"
          title="Calculators"
          description="Use practical calculators for finance, health, percentage math, and date planning in a clean, branded workflow."
          primaryLinks={CALCULATOR_CATEGORIES.map((category) => ({
            href: `/calculators#${category.slug}`,
            label: category.label,
          }))}
          secondaryTitle="Related sections"
          secondaryLinks={[
            { href: "/tools", label: "Tools" },
            { href: "/compare", label: "Comparisons" },
            { href: "/reports", label: "Reports" },
          ]}
        >
          <section className="mt-8 section-panel sm:p-6">
            <h2 className="section-title">Featured calculators</h2>
            <p className="section-copy">
              Start with the most-used scenarios, then explore all categories below.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((calculator) => (
                <li key={calculator.slug}>
                  <CalculatorCard calculator={calculator} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Total calculators: {allCalculators.length}
            </p>
          </section>

          {CALCULATOR_CATEGORIES.map((category) => {
            const calculators = getCalculatorsByCategory(category.slug);
            if (calculators.length === 0) return null;

            return (
              <section
                key={category.slug}
                id={category.slug}
                className="mt-8 section-panel sm:p-6"
              >
                <p className="insight-kicker">{category.kicker}</p>
                <h2 className="section-title mt-2">{category.label}</h2>
                <p className="section-copy">{category.description}</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {calculators.map((calculator) => (
                    <li key={calculator.slug}>
                      <CalculatorCard calculator={calculator} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </FeatureHubScaffold>
      </main>
    </div>
  );
}
