import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";
import { getAllFeedback } from "@/lib/feedback-store";
import { BASE_URL } from "@/lib/site-url";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roadmap | The Stash",
  description:
    "What we’re planning, building, and shipping for The Stash. Driven by feedback and votes from the community.",
  alternates: { canonical: `${BASE_URL}/roadmap` },
  robots: { index: true, follow: true },
};

const breadcrumbItems = [
  { name: "The Stash", url: `${BASE_URL}/` },
  { name: "Roadmap", url: `${BASE_URL}/roadmap` },
];

const STATUS_CONFIG = {
  planned: {
    label: "Planned",
    description: "On the list for a future release",
    icon: Circle,
    className: "text-muted-foreground",
  },
  in_progress: {
    label: "In progress",
    description: "Currently being worked on",
    icon: Loader2,
    className: "text-primary",
  },
  shipped: {
    label: "Shipped",
    description: "Already live",
    icon: CheckCircle2,
    className: "text-primary",
  },
} as const;

export default async function RoadmapPage() {
  const items = await getAllFeedback();

  const grouped = {
    planned: items.filter((item) => item.status === "planned"),
    in_progress: items.filter((item) => item.status === "in_progress"),
    shipped: items.filter((item) => item.status === "shipped"),
  };

  const hasAny =
    grouped.planned.length > 0 || grouped.in_progress.length > 0 || grouped.shipped.length > 0;

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: "The Stash", href: "/" }, { label: "Roadmap" }]}
            className="mb-6"
          />
          <header className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Roadmap
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              What we’re planning, building, and shipping. Ideas come from the{" "}
              <Link href="/feedback" className="text-foreground underline underline-offset-2 hover:text-primary">
                feedback page
              </Link>{" "}
              — you vote, we prioritize and move items through these columns.
            </p>
          </header>

          <section
            className="mb-10 rounded-xl border border-border bg-card p-5 shadow-sm"
            aria-labelledby="how-roadmap-works-heading"
          >
            <h2 id="how-roadmap-works-heading" className="text-base font-semibold text-foreground">
              How the roadmap works
            </h2>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>
                Anyone can submit and upvote ideas on the{" "}
                <Link href="/feedback" className="underline underline-offset-2 hover:text-foreground">
                  feedback page
                </Link>
                .
              </li>
              <li>
                We pick items from that list and move them into <strong className="text-foreground">Planned</strong>, then{" "}
                <strong className="text-foreground">In progress</strong>, then{" "}
                <strong className="text-foreground">Shipped</strong>.
              </li>
              <li>
                This page is a read-only view of those statuses so you can see what’s coming and what’s already done.
              </li>
            </ol>
          </section>

          {!hasAny ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No items on the roadmap yet. Once we promote ideas from the feedback board, they’ll
                show up here in Planned, In progress, or Shipped.
              </p>
              <p className="mt-4">
                <Link
                  href="/feedback"
                  className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary"
                >
                  Suggest or upvote an idea
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              {(["planned", "in_progress", "shipped"] as const).map((statusKey) => {
                const config = STATUS_CONFIG[statusKey];
                const columnItems = grouped[statusKey];
                const Icon = config.icon;
                return (
                  <section
                    key={statusKey}
                    className="flex flex-col rounded-xl border border-border bg-card shadow-sm"
                    aria-labelledby={`roadmap-${statusKey}-heading`}
                  >
                    <div className="border-b border-border px-4 py-3">
                      <h2
                        id={`roadmap-${statusKey}-heading`}
                        className="flex items-center gap-2 text-sm font-semibold text-foreground"
                      >
                        <Icon
                          className={`${config.className} ${statusKey === "in_progress" ? "animate-spin" : ""}`}
                          aria-hidden
                        />
                        {config.label}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                    <div className="flex-1 p-4">
                      {columnItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nothing here yet.</p>
                      ) : (
                        <ul className="space-y-3" role="list">
                          {columnItems.map((item) => (
                            <li
                              key={item.id}
                              className="rounded-lg border border-border bg-muted/30 p-3"
                            >
                              <h3 className="text-sm font-medium leading-snug text-foreground">
                                {item.title}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {item.votes} vote{item.votes === 1 ? "" : "s"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <p className="mt-10 text-center text-sm text-muted-foreground">
            <Link href="/feedback" className="underline underline-offset-2 hover:text-foreground">
              Feedback & ideas
            </Link>
          </p>
        </main>
      </div>
    </>
  );
}
