import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";
import { getAllFeedback } from "@/lib/feedback-store";
import { BASE_URL } from "@/lib/site-url";
import { FeedbackClient } from "./FeedbackClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feedback | The Stash",
  description:
    "Share feature ideas and feedback for The Stash. Upvote what you’d like to see next so we can prioritize the roadmap.",
  alternates: { canonical: `${BASE_URL}/feedback` },
  robots: { index: true, follow: true },
};

const breadcrumbItems = [
  { name: "The Stash", url: `${BASE_URL}/` },
  { name: "Feedback", url: `${BASE_URL}/feedback` },
];

export default async function FeedbackPage() {
  const items = await getAllFeedback();
  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: "The Stash", href: "/" }, { label: "Feedback" }]}
            className="mb-6"
          />
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Feedback & feature ideas
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us what would make The Stash more useful. Submit an idea or upvote ones you like
              so we know what to build next. See our{" "}
              <Link href="/roadmap" className="text-foreground underline underline-offset-2 hover:text-primary">
                roadmap
              </Link>{" "}
              for what’s planned and shipped.
            </p>
          </div>
          <FeedbackClient initialItems={items} />
        </main>
      </div>
    </>
  );
}
