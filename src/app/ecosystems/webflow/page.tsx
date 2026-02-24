import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { FeatureHubScaffold } from "@/components/FeatureHubScaffold";
import { WebflowHubExplorer } from "@/components/WebflowHubExplorer";
import {
  getAllWebflowHubResources,
  getWebflowHubStats,
  WEBFLOW_HUB_UPDATED_AT,
} from "@/lib/webflow-hub-data";
import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Webflow ecosystem hub | The Stash",
  description:
    "First-party Webflow repository of apps, cloneables, templates, and inspiration organized for implementation speed.",
  alternates: { canonical: `${BASE_URL}/ecosystems/webflow` },
};

export default function WebflowEcosystemPage() {
  const resources = getAllWebflowHubResources();
  const stats = getWebflowHubStats();
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Ecosystems", url: `${BASE_URL}/ecosystems` },
    { name: "Webflow", url: `${BASE_URL}/ecosystems/webflow` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <FeatureHubScaffold
          breadcrumbs={[
            { label: "The Stash", href: "/" },
            { label: "Ecosystems", href: "/ecosystems" },
            { label: "Webflow" },
          ]}
          kicker="Webflow ecosystem"
          title="Webflow repository"
          description={`First-party repository of ${stats.total} Webflow resources, structured by use intent so teams can ship faster with less digging.`}
          primaryLinks={[
            { href: "/category/webflow", label: "Browse Webflow category" },
            { href: "/alternatives/webflow", label: "Webflow alternatives" },
            { href: "/compare/webflow-vs-framer", label: "Webflow vs Framer" },
          ]}
          secondaryTitle="Related guides"
          secondaryLinks={[
            {
              href: "/use-cases/best-web-design-inspiration-websites",
              label: "Best web design inspiration websites",
            },
            {
              href: "/use-cases/tailwind-react-dashboard-templates",
              label: "Tailwind templates and React dashboards",
            },
            { href: "/decision-center", label: "Decision center" },
          ]}
        >
          <WebflowHubExplorer
            resources={resources}
            updatedAt={WEBFLOW_HUB_UPDATED_AT}
            detailBasePath="/ecosystems/webflow"
          />
        </FeatureHubScaffold>
      </main>
    </div>
  );
}
