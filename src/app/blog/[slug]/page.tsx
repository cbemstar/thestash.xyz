import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllArticleSlugs, getArticleBySlug, getAllArticles } from "@/lib/sanity.article";
import { getQueuedArticlePreview } from "@/lib/agent-preview";
import { AppNav } from "@/components/AppNav";
import { ArticlePortableText } from "@/components/ArticlePortableText";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { BlogInlineConversionCta } from "@/components/BlogInlineConversionCta";
import { OnThisPageNav } from "@/components/OnThisPageNav";
import { WalineComments } from "@/components/WalineComments";
import type { Article } from "@/types/article";
import { evaluateArticleTierQuality } from "@/lib/content-tier";
import {
  buildHeadingIdByBlockKey,
  countArticleVisuals,
  estimateArticleReadingMinutes,
  extractArticleHeadings,
} from "@/lib/article-structure";
import { urlFor } from "@/lib/sanity.image";

import { BASE_URL } from "@/lib/site-url";

type PageSearchParams = {
  previewQueueId?: string | string[];
};

type AsyncPageSearchParams =
  | Promise<PageSearchParams>
  | PageSearchParams
  | undefined;

function firstQueryParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = entry?.trim();
      if (normalized) return normalized;
    }
  }
  return undefined;
}

async function resolvePreviewQueueId(
  searchParams: AsyncPageSearchParams
): Promise<string | undefined> {
  const resolved = (await searchParams) ?? {};
  return firstQueryParam(resolved.previewQueueId);
}

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: AsyncPageSearchParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const previewQueueId = await resolvePreviewQueueId(searchParams);
  const article =
    (previewQueueId
      ? getQueuedArticlePreview(previewQueueId, slug)
      : null) ?? (await getArticleBySlug(slug));
  if (!article) return { title: "Not found" };
  const quality = evaluateArticleTierQuality(article);

  const title = `${article.title} | The Stash`;
  const description =
    article.excerpt ||
    `${article.title} – in‑depth guide from The Stash for developers and designers.`;
  const canonical = `${BASE_URL}/blog/${slug}`;
  const ogImageUrl = `${BASE_URL}/api/og?${new URLSearchParams({
    title: article.title,
    description: description.slice(0, 200),
  }).toString()}`;
  const heroImageUrl = article.heroImage
    ? urlFor(article.heroImage).width(1600).height(900).auto("format").url()
    : null;
  const ogImages = heroImageUrl
    ? [
        {
          url: heroImageUrl,
          width: 1600,
          height: 900,
          alt: `${article.title} cover image`,
        },
        { url: ogImageUrl, width: 1200, height: 630, alt: article.title },
      ]
    : [{ url: ogImageUrl, width: 1200, height: 630, alt: article.title }];

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
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [heroImageUrl || ogImageUrl],
    },
    robots: { index: true, follow: true },
  };
}

type FaqEntry = {
  question: string;
  answer: string;
};

function textFromBlock(block: unknown): string {
  if (!block || typeof block !== "object") return "";
  const b = block as {
    _type?: string;
    children?: Array<{ _type?: string; text?: string }>;
  };
  if (b._type !== "block" || !Array.isArray(b.children)) return "";
  return b.children
    .filter((child) => child?._type === "span" && typeof child.text === "string")
    .map((child) => child.text ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFaqEntries(body: unknown): FaqEntry[] {
  if (!Array.isArray(body)) return [];
  const entries: FaqEntry[] = [];
  let inFaqSection = false;
  let currentQuestion = "";
  let answerParts: string[] = [];

  const flush = () => {
    if (!currentQuestion || answerParts.length === 0) return;
    const answer = answerParts.join(" ").replace(/\s+/g, " ").trim();
    if (answer.length < 24) return;
    entries.push({ question: currentQuestion, answer });
  };

  for (const block of body) {
    if (!block || typeof block !== "object") continue;
    const b = block as { _type?: string; style?: string };
    if (b._type !== "block") continue;
    const text = textFromBlock(block);
    if (!text) continue;

    if (b.style === "h2") {
      if (inFaqSection) flush();
      inFaqSection = /faq/i.test(text);
      currentQuestion = "";
      answerParts = [];
      continue;
    }

    if (!inFaqSection) continue;

    if (b.style === "h3" || b.style === "h4") {
      flush();
      currentQuestion = text;
      answerParts = [];
      continue;
    }

    if (currentQuestion) answerParts.push(text);
  }

  if (inFaqSection) flush();
  return entries.slice(0, 8);
}

type SourcedImage = {
  imageUrl: string;
  alt: string;
  width?: number;
  height?: number;
};

function extractSourcedImages(body: unknown): SourcedImage[] {
  if (!Array.isArray(body)) return [];
  return body
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>)
    .filter((item) => item._type === "sourcedImage")
    .map((item) => {
      const imageUrl =
        typeof item.imageUrl === "string" ? item.imageUrl.trim() : "";
      const alt = typeof item.alt === "string" ? item.alt.trim() : "";
      const width =
        typeof item.width === "number" && Number.isFinite(item.width)
          ? item.width
          : undefined;
      const height =
        typeof item.height === "number" && Number.isFinite(item.height)
          ? item.height
          : undefined;
      return { imageUrl, alt, width, height };
    })
    .filter((item) => Boolean(item.imageUrl));
}

function ArticleJsonLd({ article, slug }: { article: Article; slug: string }) {
  const canonical = `${BASE_URL}/blog/${slug}`;
  const description = article.excerpt;
  const heroImageUrl = article.heroImage
    ? urlFor(article.heroImage).width(1600).height(900).auto("format").url()
    : null;
  const sourcedImages = extractSourcedImages(article.body);
  const imageObjects = [
    ...(heroImageUrl
      ? [
          {
            "@type": "ImageObject" as const,
            url: heroImageUrl,
            width: 1600,
            height: 900,
            caption: `${article.title} cover image`,
          },
        ]
      : []),
    ...sourcedImages.map((image) => ({
      "@type": "ImageObject" as const,
      url: image.imageUrl,
      width: image.width,
      height: image.height,
      caption: image.alt || undefined,
    })),
  ];
  const citations = (article.sources ?? [])
    .map((source) => source.url)
    .filter((url): url is string => typeof url === "string" && url.length > 0);
  const faqEntries = extractFaqEntries(article.body);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description,
    url: canonical,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    keywords: article.tags?.length ? article.tags.join(", ") : undefined,
    articleSection: article.intentStage ? [article.intentStage] : undefined,
    author: {
      "@type": "Person" as const,
      name: article.author || "The Stash Editorial Team",
    },
    publisher: {
      "@type": "Organization" as const,
      name: "The Stash",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject" as const,
        url: `${BASE_URL}/favicon.ico`,
      },
    },
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.lastReviewedAt ?? article.publishedAt ?? undefined,
    image: imageObjects.length > 0 ? imageObjects : undefined,
    citation: citations.length > 0 ? citations : undefined,
    mainEntityOfPage: {
      "@type": "WebPage" as const,
      "@id": canonical,
    },
  };
  const faqJsonLd =
    faqEntries.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqEntries.map((entry) => ({
            "@type": "Question",
            name: entry.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: entry.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
    </>
  );
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: AsyncPageSearchParams;
}) {
  const { slug } = await params;
  const previewQueueId = await resolvePreviewQueueId(searchParams);
  const previewArticle = previewQueueId
    ? getQueuedArticlePreview(previewQueueId, slug)
    : null;
  const article = previewArticle ?? (await getArticleBySlug(slug));

  if (!article) notFound();
  const isPreview = Boolean(previewArticle);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Blog & guides", url: `${BASE_URL}/blog` },
    { name: article.title, url: `${BASE_URL}/blog/${slug}` },
  ];

  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString()
    : null;
  const reviewedDateLabel = article.lastReviewedAt
    ? new Date(article.lastReviewedAt).toLocaleDateString()
    : null;
  const heroImageUrl = article.heroImage
    ? urlFor(article.heroImage).width(1600).height(900).auto("format").url()
    : null;
  const headingItems = extractArticleHeadings(article.body).filter(
    (heading) => heading.level === 2 || heading.level === 3
  );
  const headingIdByBlockKey = buildHeadingIdByBlockKey(article.body);
  const visualStats = countArticleVisuals(article.body);
  const readMinutes = estimateArticleReadingMinutes(article.body);
  const sectionCount = headingItems.filter((heading) => heading.level === 2).length;
  const sourceCount = Array.isArray(article.sources) ? article.sources.length : 0;

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
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "The Stash", href: "/" },
              { label: "Blog & guides", href: "/blog" },
              { label: article.title },
            ]}
            className="mb-6"
          />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 lg:max-w-3xl">
              <article className="prose prose-neutral max-w-none dark:prose-invert">
                <header className="mb-6">
                  {isPreview ? (
                    <div className="not-prose mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                      Preview mode: rendering this draft from the local approval queue (not published).
                    </div>
                  ) : null}
                  <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                    {article.title}
                  </h1>
                  {dateLabel && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Published on {dateLabel}
                    </p>
                  )}
                  {reviewedDateLabel && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last reviewed on {reviewedDateLabel}
                    </p>
                  )}
                  {article.author && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      By {article.author}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">{article.excerpt}</p>

                  <div className="not-prose mt-5 rounded-2xl border border-border/80 bg-card/55 p-4 sm:p-5">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary/85">
                      Research snapshot
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                        <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                          Read time
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          ~{readMinutes} min
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                        <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                          Sections
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {sectionCount} major sections
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                        <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                          Visuals
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {visualStats.total} total ({visualStats.infographics} infographics)
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                        <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                          Sources
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {sourceCount} cited references
                        </p>
                      </div>
                    </div>
                  </div>

                  {headingItems.length > 0 ? (
                    <OnThisPageNav items={headingItems} className="not-prose mt-5 lg:hidden" />
                  ) : null}

                  {heroImageUrl ? (
                    <figure className="not-prose mt-5 overflow-hidden rounded-lg border border-border bg-muted/20">
                      <Image
                        src={heroImageUrl}
                        alt={`${article.title} cover image`}
                        width={1600}
                        height={900}
                        className="h-auto w-full"
                        priority
                      />
                    </figure>
                  ) : null}
                </header>

                <section aria-label="Article body" className="space-y-4">
                  <ArticlePortableText
                    value={article.body}
                    headingIdByBlockKey={headingIdByBlockKey}
                  />
                </section>

                <BlogInlineConversionCta slug={slug} />

                {article.sources?.length ? (
                  <section
                    aria-labelledby="article-sources-heading"
                    className="mt-10 border-t border-border pt-6"
                  >
                    <h2
                      id="article-sources-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Sources & review
                    </h2>
                    {reviewedDateLabel ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Reviewed on {reviewedDateLabel}
                      </p>
                    ) : null}
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
                        const relatedSlug = r.slug || "";
                        if (!relatedSlug) return null;
                        return (
                          <li key={r._id}>
                            <Link
                              href={`/${relatedSlug}`}
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
                        const relatedSlug =
                          a.slug && typeof a.slug === "string" ? a.slug : "";
                        if (!relatedSlug) return null;
                        return (
                          <li key={a._id}>
                            <Link
                              href={`/blog/${relatedSlug}`}
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
                  <WalineComments
                    path={`/blog/${slug}`}
                    placeholder={
                      <p className="mt-3 text-sm text-muted-foreground">
                        Comments are powered by Waline. Set{" "}
                        <code className="rounded bg-muted px-1">
                          NEXT_PUBLIC_WALINE_SERVER_URL
                        </code>{" "}
                        to your Waline server URL to enable. You can share feedback via
                        the links in the footer.
                      </p>
                    }
                  />
                </section>
              </article>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <OnThisPageNav items={headingItems} />
                <section className="hierarchy-nav">
                  <p className="hierarchy-nav-title">Visual coverage</p>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">
                        {visualStats.sourcedImages}
                      </span>{" "}
                      sourced image{visualStats.sourcedImages === 1 ? "" : "s"}
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        {visualStats.infographics}
                      </span>{" "}
                      infographic block{visualStats.infographics === 1 ? "" : "s"}
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        {visualStats.histogramInfographics}
                      </span>{" "}
                      histogram-style chart{visualStats.histogramInfographics === 1 ? "" : "s"}
                    </li>
                    <li>
                      Reviewed on{" "}
                      <span className="font-medium text-foreground">
                        {reviewedDateLabel ?? "Not set"}
                      </span>
                    </li>
                  </ul>
                </section>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
