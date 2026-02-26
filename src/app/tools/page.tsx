import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { FeatureHubScaffold } from "@/components/FeatureHubScaffold";
import { ToolCard } from "@/components/ToolCard";
import { ToolsItemListJsonLd } from "@/components/ToolsItemListJsonLd";
import { ToolsDirectoryClient } from "@/components/ToolsDirectoryClient";
import {
  getAllTools,
  getFeaturedTools,
  TOOL_CATEGORIES,
} from "@/lib/tools-catalog";
import { BASE_URL } from "@/lib/site-url";

const TOOLS_META_DESCRIPTION =
  "Free tools for developers and designers: convert PDF to Markdown, DOCX to Markdown, check sitemaps, estimate chatbot ROI, optimize prompts, and more. No signup. Run in the browser.";

export const metadata: Metadata = {
  title: "Free Tools for Developers & Designers | The Stash",
  description: TOOLS_META_DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/tools` },
  openGraph: {
    title: "Free Tools for Developers & Designers | The Stash",
    description: TOOLS_META_DESCRIPTION,
    url: `${BASE_URL}/tools`,
    siteName: "The Stash",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tools for Developers & Designers | The Stash",
    description: TOOLS_META_DESCRIPTION,
  },
};

export default function ToolsPage() {
  const allTools = getAllTools();
  const featuredTools = getFeaturedTools(6);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Tools", url: `${BASE_URL}/tools` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <ToolsItemListJsonLd tools={allTools} />
      <AppNav />
      <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
        <FeatureHubScaffold
          breadcrumbs={[{ label: "The Stash", href: "/" }, { label: "Tools" }]}
          kicker="Free tool library"
          title="Tools"
          description="Run practical utilities for markdown conversion, AI-assisted writing, content Q&A, and technical site checks."
          primaryLinks={TOOL_CATEGORIES.map((category) => ({
            href: `/tools#${category.slug}`,
            label: category.label,
          }))}
          secondaryTitle="Related paths"
          secondaryLinks={[
            { href: "/compare", label: "Tool comparisons" },
            { href: "/migrate", label: "Migration playbooks" },
            { href: "/reports", label: "Reports" },
          ]}
        >
          <section className="mt-6 rounded-xl border border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground sm:p-5" aria-label="How to use these tools">
            <h2 className="sr-only">How to use these tools</h2>
            <p>
              Use these free tools to convert PDF to Markdown, DOCX to Markdown, check sitemaps, estimate chatbot ROI, generate prompts and FAQs, and chat with your documents. No signup required—paste input or upload a file, then run. Click &quot;Try with sample&quot; on any tool page to load example input.
            </p>
          </section>
          <section className="mt-8 section-panel sm:p-6">
            <h2 className="section-title">Featured tools</h2>
            <p className="section-copy">
              Start with high-traffic workflows, then explore the full catalog below.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTools.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Total tools: {allTools.length}
            </p>
          </section>

          <ToolsDirectoryClient tools={allTools} categories={TOOL_CATEGORIES} />
        </FeatureHubScaffold>
      </main>
    </div>
  );
}
