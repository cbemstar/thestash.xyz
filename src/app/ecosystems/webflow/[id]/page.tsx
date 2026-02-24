import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { ProgressiveDisclosure } from "@/components/ProgressiveDisclosure";
import { Pill } from "@/components/kibo-ui/pill";
import {
  getAllWebflowHubResourceIds,
  getWebflowHubResourceById,
  WEBFLOW_HUB_UPDATED_AT,
} from "@/lib/webflow-hub-data";
import { BASE_URL } from "@/lib/site-url";

function formatKindLabel(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export async function generateStaticParams() {
  return getAllWebflowHubResourceIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resource = getWebflowHubResourceById(id);
  if (!resource) return { title: "Not found" };

  const title = `${resource.name} | Webflow ecosystem | The Stash`;
  const description = `${resource.summary} Tagged for ${formatKindLabel(
    resource.kind,
  ).toLowerCase()} workflows and implementation planning.`;
  const canonical = `${BASE_URL}/ecosystems/webflow/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Stash",
      type: "article",
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function WebflowResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = getWebflowHubResourceById(id);
  if (!resource) notFound();

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Ecosystems", url: `${BASE_URL}/ecosystems` },
    { name: "Webflow", url: `${BASE_URL}/ecosystems/webflow` },
    { name: resource.name, url: `${BASE_URL}/ecosystems/webflow/${id}` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Ecosystems", href: "/ecosystems" },
            { label: "Webflow", href: "/ecosystems/webflow" },
            { label: resource.name },
          ]}
          className="mb-6"
        />

        <header className="insight-hero">
          <p className="insight-kicker">Webflow repository entry</p>
          <h1 className="insight-title">{resource.name}</h1>
          <p className="insight-lead">{resource.summary}</p>
          <div className="insight-meta">
            <span>Type: {formatKindLabel(resource.kind)}</span>
            <span>{resource.codeReady ? "Code-ready" : "Reference-only"}</span>
            <span>
              Snapshot updated:{" "}
              {new Date(WEBFLOW_HUB_UPDATED_AT).toLocaleDateString()}
            </span>
          </div>
        </header>

        <section className="section-panel">
          <h2 className="section-title">Tags and intent</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <li key={tag}>
                <Pill variant="secondary">{tag}</Pill>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/ecosystems/webflow" className="text-link">
              Back to Webflow repository
            </Link>
            <Link href="/category/webflow" className="text-link">
              Browse Webflow category
            </Link>
          </div>
        </section>

        <ProgressiveDisclosure
          id="webflow-entry-source"
          title="Source attribution"
          description="View where this entry was discovered and how we classify it."
        >
          <section aria-labelledby="webflow-entry-source-link">
            <h3
              id="webflow-entry-source-link"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80"
            >
              Discovery source
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This entry is part of The Stash repository and can include
              metadata sourced from public curation sites.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Source reference: <code>{resource.id}</code>
            </p>
          </section>
        </ProgressiveDisclosure>
      </main>
    </div>
  );
}
