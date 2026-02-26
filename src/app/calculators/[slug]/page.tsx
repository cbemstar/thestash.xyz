import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { CalculatorCard } from "@/components/CalculatorCard";
import { CalculatorWorkbench } from "@/components/CalculatorWorkbench";
import {
  getAllCalculatorSlugs,
  getCalculatorBySlug,
  getCalculatorCategory,
  getRelatedCalculators,
} from "@/lib/calculators-catalog";
import { BASE_URL } from "@/lib/site-url";

export async function generateStaticParams() {
  return getAllCalculatorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);
  if (!calculator) return { title: "Not found" };

  const canonical = `${BASE_URL}/calculators/${calculator.slug}`;
  const title = `${calculator.title} | The Stash`;

  return {
    title,
    description: calculator.heroDescription,
    alternates: { canonical },
    openGraph: {
      title,
      description: calculator.heroDescription,
      url: canonical,
      siteName: "The Stash",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: calculator.heroDescription,
    },
  };
}

export default async function CalculatorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);

  if (!calculator) {
    notFound();
  }

  const category = getCalculatorCategory(calculator.category);
  const related = getRelatedCalculators(calculator.slug, 6);

  const breadcrumbItems = [
    { name: "The Stash", url: `${BASE_URL}/` },
    { name: "Calculators", url: `${BASE_URL}/calculators` },
    { name: calculator.title, url: `${BASE_URL}/calculators/${calculator.slug}` },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <AppNav />
      <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Calculators", href: "/calculators" },
            { label: calculator.title },
          ]}
          className="mb-6"
        />

        <header className="insight-hero">
          <p className="insight-kicker">{category.kicker}</p>
          <h1 className="insight-title">{calculator.title}</h1>
          <p className="insight-lead">{calculator.heroDescription}</p>
          <div className="insight-meta">
            <span>
              Category:{" "}
              <span className="font-semibold text-foreground">{category.label}</span>
            </span>
            <span>
              <Link href="/calculators" className="text-link">
                Back to all calculators
              </Link>
            </span>
          </div>
        </header>

        <CalculatorWorkbench calculator={calculator} />

        <section className="mt-10 section-panel sm:p-6" aria-labelledby="related-calculators">
          <h2 id="related-calculators" className="section-title">
            Other calculators in this library
          </h2>
          <p className="section-copy">
            Explore adjacent calculators to compare assumptions and build complete planning workflows.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <li key={entry.slug}>
                <CalculatorCard calculator={entry} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
