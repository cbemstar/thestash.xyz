import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticleSlugs, getArticleBySlug, getAllArticles } from "@/lib/sanity.article";
import { AppNav } from "@/components/AppNav";
import { ArticlePortableText } from "@/components/ArticlePortableText";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Article } from "@/types/article";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Not found" };

  const title = `${article.title} | The Stash`;
  const description =
    article.excerpt ||
    `${article.title} – in‑depth guide from The Stash for developers and designers.`;
  const canonical = `${BASE_URL}/blog/${slug}`;
  const ogImageUrl = `${BASE_URL}/api/og?${new URLSearchParams({
    title: article.title,
    description: description.slice(0, 200),
  }).toString()}`;

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
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    robots: { index: true, follow: true },
  };
}

function ArticleJsonLd({ article, slug }: { article: Article; slug: string }) {
  const canonical = `${BASE_URL}/blog/${slug}`;
  const description = article.excerpt;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description,
    author: {
      "@type": "Person" as const,
      name: article.author || "The Stash Editorial Team",
    },
    publisher: {
      "@type": "Organization" as const,
      name: "The Stash",
      url: BASE_URL,
    },
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.publishedAt ?? undefined,
    mainEntityOfPage: {
      "@type": "WebPage" as const,
      "@id": canonical,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Blog & guides", url: `${BASE_URL}/blog` },
    { name: article.title, url: `${BASE_URL}/blog/${slug}` },
  ];

  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString()
    : null;

  // Simple related reading (internal linking): latest 3 other articles
  const allArticles = await getAllArticles();
  const related = allArticles
    .filter((a) => a._id !== article._id)
    .slice(0, 3);

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <ArticleJsonLd article={article} slug={slug} />
      <AppNav />
      <div className="min-h-screen">
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: "Blog & guides", href: "/blog" },
              { label: article.title },
            ]}
            className="mb-6"
          />
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <header className="mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {article.title}
              </h1>
              {dateLabel && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Published on {dateLabel}
                </p>
              )}
              {article.author && (
                <p className="mt-1 text-xs text-muted-foreground">
                  By {article.author}
                </p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">{article.excerpt}</p>
            </header>

            <section aria-label="Article body" className="space-y-4">
              <ArticlePortableText value={article.body} />
            </section>

            {article.sources?.length ? (
              <section
                aria-labelledby="article-sources-heading"
                className="mt-10 border-t border-border pt-6"
              >
                <h2
                  id="article-sources-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Sources & further reading
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {article.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {article.relatedResources?.length ? (
              <section
                aria-labelledby="related-resources-heading"
                className="mt-10 border-t border-border pt-6"
              >
                <h2
                  id="related-resources-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Related tools in The Stash
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {article.relatedResources.map((r) => {
                    const slug = r.slug || "";
                    if (!slug) return null;
                    return (
                      <li key={r._id}>
                        <Link
                          href={`/${slug}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {r.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {related.length ? (
              <section
                aria-labelledby="related-articles-heading"
                className="mt-10 border-t border-border pt-6"
              >
                <h2
                  id="related-articles-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Keep reading
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {related.map((a) => {
                    const slug =
                      a.slug && typeof a.slug === "string" ? a.slug : "";
                    if (!slug) return null;
                    return (
                      <li key={a._id}>
                        <Link
                          href={`/blog/${slug}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {a.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <section
              aria-labelledby="comments-heading"
              className="mt-10 border-t border-border pt-6"
            >
              <h2
                id="comments-heading"
                className="text-sm font-semibold text-foreground"
              >
                Comments
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Comment integration (e.g. Giscus, Disqus, or GitHub Issues) can be wired here.
                For now, you can share feedback by contacting us via the links in the footer.
              </p>
            </section>
          </article>
        </main>
      </div>
    </>
  );
}

