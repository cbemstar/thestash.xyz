import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "About | The Stash",
  description:
    "About The Stash and Karan Kumar: curated dev and design resources, contact details, and editorial mission.",
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
            <p>
              The Stash is built and curated by Karan Kumar in Christchurch, New Zealand, with a
              focus on practical, high-signal resources teams can use in real workflows.
            </p>
          </div>

          <section className="mt-8" aria-labelledby="about-creator-heading">
            <h2 id="about-creator-heading" className="font-semibold text-foreground mb-2">
              About the creator
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">Name:</span> Karan Kumar
              </li>
              <li>
                <span className="text-foreground font-medium">Location:</span> Christchurch, New
                Zealand
              </li>
              <li>
                <span className="text-foreground font-medium">LinkedIn:</span>{" "}
                <a
                  href="https://www.linkedin.com/in/cbemstar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-primary"
                >
                  linkedin.com/in/cbemstar
                </a>
              </li>
              <li>
                <span className="text-foreground font-medium">X:</span>{" "}
                <a
                  href="https://x.com/KaranKumarEm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-primary"
                >
                  x.com/KaranKumarEm
                </a>
              </li>
            </ul>
          </section>

          <section className="mt-8" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="font-semibold text-foreground mb-2">
              Contact
            </h2>
            <p className="text-sm text-muted-foreground">
              For questions about the site, privacy, corrections, partnerships, or advertising,
              contact Karan directly at{" "}
              <a
                href="mailto:karankumar230@gmail.com"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                karankumar230@gmail.com
              </a>
              {" "}or connect on{" "}
              <a
                href="https://www.linkedin.com/in/cbemstar/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                LinkedIn
              </a>
              {" "}or{" "}
              <a
                href="https://x.com/KaranKumarEm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                X
              </a>
              . You can also read our{" "}
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
