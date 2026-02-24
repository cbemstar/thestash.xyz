import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { AlternativesFinder } from "@/components/AlternativesFinder";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { FeatureHubScaffold } from "@/components/FeatureHubScaffold";
import { getAllAlternativePageSlugs, getToolProfile } from "@/lib/seo-pages";
import { getAlternativeResourceSummaries } from "@/lib/sanity.resource";
import { getAllUseCasePages } from "@/lib/use-case-pages";
import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Tool alternatives | The Stash",
  description:
    "Find better-fit alternatives for popular dev and design tools with decision matrices and migration checklists.",
  alternates: { canonical: `${BASE_URL}/alternatives` },
};

export default async function AlternativesIndexPage() {
  const [cmsAlternatives] = await Promise.all([
    getAlternativeResourceSummaries(),
  ]);
  const cmsBySlug = new Map(cmsAlternatives.map((item) => [item.slug, item]));
  const slugs = [
    ...new Set([
      ...getAllAlternativePageSlugs(),
      ...cmsAlternatives.map((item) => item.slug),
    ]),
  ];
  const alternativeItems = slugs.map((slug) => {
    const tool = getToolProfile(slug);
    const cms = cmsBySlug.get(slug);
    return {
      slug,
      title: tool?.title ?? cms?.title ?? slug.replace(/-/g, " "),
      category: tool?.category ?? "uncategorized",
    };
  });
  const useCases = getAllUseCasePages().slice(0, 6);
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Alternatives", url: `${BASE_URL}/alternatives` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <FeatureHubScaffold
          breadcrumbs={[
            { label: "The Stash", href: "/" },
            { label: "Alternatives" },
          ]}
          kicker="Alternative finder"
          title="Tool alternatives"
          description="Alternatives pages help you choose the right tool by fit, migration effort, and long-term tradeoffs."
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
          <AlternativesFinder items={alternativeItems} />
        </FeatureHubScaffold>
      </main>
    </div>
  );
}
