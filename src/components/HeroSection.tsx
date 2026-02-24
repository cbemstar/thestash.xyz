"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Pill } from "@/components/kibo-ui/pill";
import { CurtainButton } from "@/components/satisui/curtain-button";
import { Input } from "./ui/input";
import { CATEGORIES } from "@/lib/categories";
import { trackEvent } from "@/lib/analytics";
import {
  getRecaptchaToken,
  isRecaptchaConfigured,
} from "@/lib/recaptcha-client";
import { cn } from "@/lib/utils";
import type { ResourceCategory } from "@/types/resource";

const API_ENDPOINT = "/api/subscribe";
const RECAPTCHA_ACTION = "newsletter_subscribe";

interface HeroSectionProps {
  /** When set, the matching category pill is shown as active (e.g. on category page). */
  currentCategory?: ResourceCategory;
  /** When set, pills filter in place and scroll to resources (e.g. homepage). When unset, pills link to category pages. */
  onCategorySelect?: (category: ResourceCategory) => void;
  /** Optional homepage metrics to render in stat tiles. */
  resourceCount?: number;
  collectionCount?: number;
  featuredCount?: number;
  /** Optional list of top tags shown in quick links. */
  topTags?: string[];
}

const PRIORITY_CATEGORIES: ResourceCategory[] = [
  "development-tools",
  "design-tools",
  "ai-tools",
  "ui-ux-resources",
  "webflow",
  "shadcn",
  "productivity",
  "learning-resources",
];

const FALLBACK_TOP_TAGS = [
  "ai-tools",
  "shadcn",
  "webflow",
  "design systems",
  "devtools",
  "productivity",
  "frontend",
  "automation",
];

export function HeroSection({
  currentCategory,
  onCategorySelect,
  resourceCount,
  collectionCount,
  featuredCount,
  topTags,
}: HeroSectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const numberFormatter = new Intl.NumberFormat("en-US");
  const displayTags = (topTags && topTags.length > 0 ? topTags : FALLBACK_TOP_TAGS).slice(0, 6);
  const quickCategoryValues = new Set(PRIORITY_CATEGORIES);
  if (currentCategory) {
    quickCategoryValues.add(currentCategory);
  }
  const quickCategories = CATEGORIES.filter((category) => quickCategoryValues.has(category.value));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const recaptchaToken = isRecaptchaConfigured
        ? await getRecaptchaToken(RECAPTCHA_ACTION)
        : undefined;

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          recaptchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("Check your email for a confirmation to ensure we got it right.");
      trackEvent("newsletter_signup", {
        source: "hero_section",
      });
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Verification failed or request could not be completed. Please try again.");
    }
  };

  return (
    <section
      className="relative overflow-hidden border-b border-stash-line-soft bg-stash-canvas px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      aria-labelledby="hero-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_38%),linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_2%,var(--stash-canvas)),var(--stash-canvas))]"
      />
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-stash-line-soft bg-stash-panel/95 px-5 py-6 shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_36px_-28px_color-mix(in_oklab,var(--foreground)_22%,transparent)] sm:px-7 sm:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-stash-line-soft bg-stash-control px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stash-muted-text">
              Curated developer directory
            </span>
            <h1
              id="hero-heading"
              className="mt-4 text-balance font-display text-[1.85rem] font-semibold tracking-tight text-foreground sm:text-[2.25rem] lg:text-[2.5rem]"
            >
              Discover vetted tools for building, designing, and shipping faster.
            </h1>
            <p className="mt-4 max-w-[68ch] text-sm leading-relaxed text-stash-muted-text sm:text-base sm:leading-[1.68]">
              The Stash is a cleaner way to find trusted resources across development, design, and
              growth. Browse curated collections, then dive into the full searchable index.
            </p>

            <div className="mt-6 flex w-fit flex-wrap items-center gap-3">
              <Link
                href="/collections"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stash-line-strong bg-stash-control-hover px-4 text-sm font-semibold text-foreground transition hover:bg-stash-control"
              >
                Explore collections
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
              <Link
                href="#all-resources"
                className="inline-flex min-h-11 items-center rounded-full border border-stash-line-soft bg-stash-control px-4 text-sm font-medium text-stash-muted-text transition hover:border-stash-line-strong hover:text-foreground"
              >
                Browse all resources
              </Link>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-2 sm:max-w-2xl sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <label htmlFor="subscribe-email" className="sr-only">
                Email address for updates
              </label>
              <Input
                id="subscribe-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Get weekly picks in your inbox"
                required
                disabled={status === "loading"}
                autoComplete="email"
                aria-describedby={message ? "subscribe-message" : undefined}
                className="h-11 border-stash-line-soft bg-stash-control placeholder:text-stash-muted-text"
              />
              <CurtainButton
                type="submit"
                text={status === "loading" ? "Subscribing..." : "Subscribe"}
                isLoading={status === "loading"}
                isDisabled={status === "loading"}
                className="h-11 rounded-full px-5"
                aria-label="Subscribe to newsletter"
              />
            </form>
            {isRecaptchaConfigured ? (
              <p className="mt-2 text-xs text-stash-muted-text">
                Protected by reCAPTCHA. Google{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Terms of Service
                </a>{" "}
                apply.
              </p>
            ) : null}
            {message && (
              <p
                id="subscribe-message"
                role="status"
                aria-live="polite"
                className={cn(
                  "mt-3 text-sm",
                  status === "success" ? "text-primary" : "text-destructive"
                )}
              >
                {message}
              </p>
            )}
          </div>

          <div className="mt-8 flex w-fit flex-col items-start justify-center border-t border-stash-line-soft pt-5">
            <div className="flex flex-wrap gap-2.5">
              <Pill
                variant="outline"
                className="h-8 border-stash-line-soft bg-stash-control px-3 text-xs text-stash-muted-text"
              >
                {resourceCount ? numberFormatter.format(resourceCount) : "1,000+"} resources
              </Pill>
              <Pill
                variant="outline"
                className="h-8 border-stash-line-soft bg-stash-control px-3 text-xs text-stash-muted-text"
              >
                {collectionCount ? numberFormatter.format(collectionCount) : "50+"} collections
              </Pill>
              <Pill
                variant="outline"
                className="h-8 border-stash-line-soft bg-stash-control px-3 text-xs text-stash-muted-text"
              >
                {featuredCount ? numberFormatter.format(featuredCount) : "Daily"} featured picks
              </Pill>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-start gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stash-muted-text">
                Quick categories
              </p>
              <Link
                href="/category"
                className="text-xs font-medium text-stash-muted-text underline underline-offset-2 transition hover:text-foreground"
              >
                View all categories
              </Link>
            </div>
            <div className="mt-2 flex h-fit w-full flex-wrap items-start justify-start gap-2.5">
              {quickCategories.map((c) => {
                const isActive = currentCategory === c.value;
                const baseClass = cn(
                  "inline-flex min-h-10 items-center rounded-full border px-3.5 py-1.5 text-sm transition",
                  isActive
                    ? "border-stash-line-strong bg-stash-control-hover text-foreground"
                    : "border-stash-line-soft bg-stash-control text-stash-muted-text hover:border-stash-line-strong hover:text-foreground"
                );

                if (onCategorySelect) {
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onCategorySelect(c.value)}
                      className={baseClass}
                    >
                      {c.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={c.value}
                    href={`/category/${c.value}`}
                    className={baseClass}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-stash-muted-text">
              <span className="font-medium uppercase tracking-[0.12em]">Trending tags:</span>
              {displayTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/?search=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-stash-line-soft bg-stash-control px-2.5 py-1 transition hover:border-stash-line-strong hover:text-foreground"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
