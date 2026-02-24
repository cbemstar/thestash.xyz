import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { CompareFinder } from "@/components/CompareFinder";
import { FeatureHubScaffold } from "@/components/FeatureHubScaffold";
import {
  getAllComparisonPageSlugs,
  getToolProfile,
  inferComparisonTitleFromSlug,
} from "@/lib/seo-pages";
import { getAllUseCasePages } from "@/lib/use-case-pages";
import { BASE_URL } from "@/lib/site-url";
import type { ResourceCategory } from "@/types/resource";

function formatSlugLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const metadata: Metadata = {
  title: "Tool comparisons | The Stash",
  description:
    "Head-to-head tool comparisons with decision matrices, use-case winners, migration checklists, and sources.",
  alternates: { canonical: `${BASE_URL}/compare` },
};

export default function CompareIndexPage() {
  const slugs = getAllComparisonPageSlugs();
  const comparisonItems = slugs.map((slug) => {
    const [leftSlug = "", rightSlug = ""] = slug.split("-vs-");
    const leftTool = getToolProfile(leftSlug);
    const rightTool = getToolProfile(rightSlug);
    const leftTitle = leftTool?.title ?? formatSlugLabel(leftSlug);
    const rightTitle = rightTool?.title ?? formatSlugLabel(rightSlug);
    return {
      slug,
      title:
        leftSlug && rightSlug
          ? `${leftTitle} vs ${rightTitle}`
          : inferComparisonTitleFromSlug(slug),
      leftSlug,
      leftTitle,
      rightSlug,
      rightTitle,
      categories: [
        ...new Set(
          [leftTool?.category, rightTool?.category].filter(
            (value): value is ResourceCategory => Boolean(value),
          ),
        ),
      ],
    };
  });
  const useCases = getAllUseCasePages().slice(0, 6);
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Compare", url: `${BASE_URL}/compare` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <FeatureHubScaffold
          breadcrumbs={[{ label: "The Stash", href: "/" }, { label: "Compare" }]}
          kicker="Decision center"
          title="Tool comparisons"
          description="Compare top tools side by side by pricing model, setup speed, extensibility, collaboration, and lock-in risk."
          primaryLinks={[
            {
              href: "/reports/ai-coding-tools-benchmark",
              label: "Open benchmark dataset",
            },
            { href: "/migrate", label: "Open migration playbooks" },
          ]}
          secondaryTitle="Related use cases"
          secondaryLinks={useCases.map((useCase) => ({
            href: `/use-cases/${useCase.slug}`,
            label: useCase.title,
          }))}
        >
          <CompareFinder items={comparisonItems} />
        </FeatureHubScaffold>
      </main>
    </div>
  );
}
