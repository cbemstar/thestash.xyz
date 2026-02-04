import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export const metadata: Metadata = {
  title: "About | The Stash",
  description:
    "About The Stash: a curated directory of dev and design resources for developers and designers.",
  alternates: { canonical: `${BASE_URL}/about` },
  robots: { index: true, follow: true },
};

const breadcrumbItems = [
  { name: "The Stash", url: `${BASE_URL}/` },
  { name: "About", url: `${BASE_URL}/about` },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: "The Stash", href: "/" }, { label: "About" }]}
            className="mb-6"
          />
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            About The Stash
          </h1>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              The Stash is a curated directory of dev and design resources: tools, inspiration,
              courses, AI tools, and links hand-picked for developers and designers. We organize
              everything by category and into collections so you can find what you need quickly.
            </p>
            <p>
              You can browse by category, filter by type or tags, search, and submit your own
              resources. We also offer an RSS feed and email updates so you never miss new picks.
            </p>
          </div>

          <section className="mt-8" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="font-semibold text-foreground mb-2">
              Contact
            </h2>
            <p className="text-sm text-muted-foreground">
              For questions about the site, privacy, or advertising, please reach out via the
              contact method you prefer (e.g. the contact form or email listed on this site when
              available). You can also read our{" "}
              <Link href="/privacy" className="text-foreground underline underline-offset-2 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <p className="mt-10 text-center">
            <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary">
              Back to The Stash
            </Link>
          </p>
        </main>
      </div>
    </>
  );
}
