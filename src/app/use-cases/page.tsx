import Link from "next/link";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { getAllUseCasePages } from "@/lib/use-case-pages";
import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Use-case guides (2026) | The Stash",
  description:
    "Decision-first use-case guides for selecting dev and design tools by workflow, constraints, and team fit.",
  alternates: { canonical: `${BASE_URL}/use-cases` },
};

const KEYWORD_INTENT_HUBS = [
  {
    title: "Directory intent",
    links: [
      { label: "Design tools directory", href: "/category/design-tools" },
      { label: "Development tools list", href: "/category/development-tools" },
      { label: "AI tools directory", href: "/category/ai-tools" },
    ],
  },
  {
    title: "Component intent",
    links: [
      {
        label: "Best shadcn component libraries",
        href: "/use-cases/best-shadcn-component-libraries",
      },
      {
        label: "Tailwind templates and React dashboards",
        href: "/use-cases/tailwind-react-dashboard-templates",
      },
      { label: "Webflow resources", href: "/category/webflow" },
    ],
  },
  {
    title: "Privacy-first intent",
    links: [
      {
        label: "Open-source AI note-taking tools",
        href: "/use-cases/open-source-ai-note-taking-tools",
      },
      { label: "Learning resources", href: "/category/learning-resources" },
      { label: "GitHub resources", href: "/category/github" },
    ],
  },
];

export default function UseCasesIndexPage() {
  const pages = getAllUseCasePages();
  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Use cases", url: `${BASE_URL}/use-cases` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Use cases" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-3xl font-bold text-foreground">
          Use-case guides
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Practical buying and implementation guides for high-intent tool searches.
        </p>
        <div className="mt-4">
          <Link
            href="/reports/ai-coding-tools-benchmark"
            className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
          >
            Open benchmark dataset
          </Link>
        </div>
        <section
          className="mt-8 rounded-2xl border border-border bg-card/30 p-4 sm:p-6"
          aria-labelledby="keyword-clusters"
        >
          <h2 id="keyword-clusters" className="font-display text-xl font-semibold text-foreground">
            Keyword intent clusters
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hubs mapped from the current keyword research so each search family has one clear path.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {KEYWORD_INTENT_HUBS.map((hub) => (
              <div key={hub.title} className="rounded-xl border border-border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold text-foreground">{hub.title}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {hub.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-foreground underline underline-offset-2 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/use-cases/${page.slug}`}
                className="block rounded-xl border border-border bg-card/30 p-4 transition hover:bg-accent"
              >
                <h2 className="font-semibold text-foreground">{page.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {page.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
