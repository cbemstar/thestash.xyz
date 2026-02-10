import Link from "next/link";
import type { Metadata } from "next";
import { getAllArticles } from "@/lib/sanity.article";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog & Guides | The Stash",
  description:
    "In-depth guides and articles for developers and designers. Learn about workflow automation, CSS, AI tools, design systems, and more from The Stash.",
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
};

export default async function BlogIndexPage() {
  const articles = await getAllArticles();

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Blog & guides", url: `${BASE_URL}/blog` },
  ];

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <div className="min-h-screen">
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: "The Stash", href: "/" }, { label: "Blog & guides" }]}
            className="mb-6"
          />
          <header className="mb-8 space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Blog & guides for developers and designers
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base max-w-2xl">
              Deep dives, comparisons, and how‑tos on the tools, workflows, and patterns we
              feature in The Stash directory—written to be useful for both humans and AI systems.
            </p>
          </header>
          {articles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No articles published yet. Check back soon.
            </p>
          ) : (
            <ul className="space-y-6">
              {articles.map((article) => {
                const slug =
                  article.slug && typeof article.slug === "string"
                    ? article.slug
                    : "";
                if (!slug) return null;
                const href = `/blog/${slug}`;
                const dateLabel = article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString()
                  : null;
                return (
                  <li
                    key={article._id}
                    className="rounded-2xl border border-border bg-card/30 p-5 transition hover:border-primary/30 hover:bg-accent/40"
                  >
                    <article className="space-y-2">
                      <header>
                        <h2 className="font-display text-lg font-semibold text-foreground">
                          <Link
                            href={href}
                            className="hover:text-primary transition-colors underline-offset-4 hover:underline"
                          >
                            {article.title}
                          </Link>
                        </h2>
                        {dateLabel && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Published on {dateLabel}
                          </p>
                        )}
                      </header>
                      <p className="text-sm text-muted-foreground">
                        {article.excerpt}
                      </p>
                      {article.tags?.length ? (
                        <p className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {article.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-border px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </>
  );
}

