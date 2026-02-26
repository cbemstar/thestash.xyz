import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { ToolCard } from "@/components/ToolCard";
import { ToolSoftwareApplicationJsonLd } from "@/components/ToolSoftwareApplicationJsonLd";
import { ToolWorkbench } from "@/components/ToolWorkbench";
import { ScrollToTop } from "./ScrollToTop";
import {
  getAllToolSlugs,
  getRelatedTools,
  getToolBySlug,
  getToolCategory,
  type ToolInputSource,
} from "@/lib/tools-catalog";
import { BASE_URL } from "@/lib/site-url";

function formatSourceLabel(source: ToolInputSource): string {
  if (source === "url") return "URL";
  if (source === "file") return "File";
  return "Text";
}

export async function generateStaticParams() {
  return getAllToolSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Not found" };

  const canonical = `${BASE_URL}/tools/${tool.slug}`;
  const title = `${tool.title} | The Stash`;
  const suffix = " Free, no signup.";
  const maxDesc = 160 - suffix.length;
  const description =
    tool.heroDescription.length > maxDesc
      ? `${tool.heroDescription.slice(0, maxDesc - 1)}…`
      : `${tool.heroDescription}${suffix}`;

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
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const category = getToolCategory(tool.category);
  const relatedTools = getRelatedTools(tool.slug, 6);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Tools", url: `${BASE_URL}/tools` },
    { name: tool.title, url: `${BASE_URL}/tools/${tool.slug}` },
  ];

  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <ToolSoftwareApplicationJsonLd tool={tool} />
      <AppNav />
      <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: tool.title },
          ]}
          className="mb-6"
        />

        <header className="insight-hero">
          <p className="insight-kicker">{category.kicker}</p>
          <h1 className="insight-title">{tool.title}</h1>
          <p className="insight-lead">{tool.heroDescription}</p>
          <div className="insight-meta">
            <span>
              Category: <span className="font-semibold text-foreground">{category.label}</span>
            </span>
            <span>
              Input: <span className="font-semibold text-foreground">{tool.inputSources.map(formatSourceLabel).join(" · ")}</span>
            </span>
            <span>
              <Link href="/tools" className="text-link">
                Back to all tools
              </Link>
            </span>
          </div>
        </header>

        <section className="mt-6 rounded-xl border border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground sm:p-5" aria-labelledby="how-to-use-tool">
          <h2 id="how-to-use-tool" className="font-semibold text-foreground">
            How to use {tool.title}
          </h2>
          <p className="mt-2">
            Paste your content or enter a URL in the field below, or upload a file if the tool supports it. Click &quot;Try with sample&quot; to load example input, then click the run button. Your result appears in the output area—you can copy or download it.
          </p>
          <p className="mt-2">
            Example: for conversion tools you get clean Markdown; for generators you get a first draft; for sitemap and ROI tools you get structured results you can use in reports or docs.
          </p>
        </section>

        <ToolWorkbench tool={tool} />

        <section className="mt-10 section-panel sm:p-6" aria-labelledby="related-tools">
          <h2 id="related-tools" className="section-title">
            Other tools in this library
          </h2>
          <p className="section-copy">
            Explore adjacent workflows and build complete execution paths across conversion, generation, and analysis.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map((relatedTool) => (
              <li key={relatedTool.slug}>
                <ToolCard tool={relatedTool} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
