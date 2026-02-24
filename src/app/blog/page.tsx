import type { Metadata } from "next";
import { getAllArticles } from "@/lib/sanity.article";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { BlogArticleCard } from "@/components/BlogArticleCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { BASE_URL } from "@/lib/site-url";

export const revalidate = 21600; // 6 hr — blog index does not require hourly regeneration

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

  const [hero, ...carouselArticles] = articles;
  const featuredCarousel = carouselArticles.slice(0, 4);
  const rest = articles.slice(5);
  const lastReviewedCount = articles.filter((article) => Boolean(article.lastReviewedAt)).length;

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <div className="min-h-screen">
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: "The Stash", href: "/" }, { label: "Blog & guides" }]}
            className="mb-8"
          />
          <header className="insight-hero mb-10">
            <p className="insight-kicker">Editorial hub</p>
            <h1 className="insight-title">Blog & guides for developers and designers</h1>
            <p className="insight-lead max-w-3xl">
              Deep dives, comparisons, and implementation guides on the tools, workflows, and
              patterns featured in The Stash.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                  Published articles
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{articles.length}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                  Reviewed articles
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{lastReviewedCount}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/75 p-3">
                <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                  Featured now
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{featuredCarousel.length + (hero ? 1 : 0)}</p>
              </div>
            </div>
          </header>

          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <p className="text-muted-foreground">
                No articles published yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {hero && (
                <section aria-labelledby="hero-heading">
                  <h2 id="hero-heading" className="sr-only">
                    Latest article
                  </h2>
                  <BlogArticleCard
                    article={hero}
                    variant="featured"
                    priority
                  />
                </section>
              )}
              {featuredCarousel.length > 0 && (
                <section aria-labelledby="latest-heading">
                  <h2
                    id="latest-heading"
                    className="mb-6 font-display text-lg font-semibold text-foreground"
                  >
                    Latest
                  </h2>
                  <Carousel
                    opts={{ align: "start", loop: false }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-3 sm:-ml-4">
                      {featuredCarousel.map((article, i) => (
                        <CarouselItem
                          key={article._id}
                          className="pl-3 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 flex flex-col"
                        >
                          <BlogArticleCard
                            article={article}
                            priority={i < 2}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                  </Carousel>
                </section>
              )}

              {rest.length > 0 && (
                <section aria-labelledby="all-articles-heading">
                  <h2
                    id="all-articles-heading"
                    className="mb-6 font-display text-lg font-semibold text-foreground"
                  >
                    All articles
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                    {rest.map((article) => (
                      <BlogArticleCard key={article._id} article={article} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
