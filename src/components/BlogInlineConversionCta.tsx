"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/kibo-ui/spinner";
import { trackEvent } from "@/lib/analytics";
import {
  getRecaptchaToken,
  isRecaptchaConfigured,
} from "@/lib/recaptcha-client";

const API_ENDPOINT = "/api/subscribe";
const RECAPTCHA_ACTION = "newsletter_subscribe";

type BlogInlineConversionCtaProps = {
  slug: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function BlogInlineConversionCta({ slug }: BlogInlineConversionCtaProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const ctaLinks = useMemo(
    () => [
      { href: "/compare", label: "Compare Tools" },
      { href: "/alternatives", label: "Browse Alternatives" },
      { href: "/use-cases", label: "Find By Use Case" },
      { href: "/reports/ai-coding-tools-benchmark", label: "View 2026 Benchmarks" },
    ],
    []
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextEmail = email.trim().toLowerCase();
    if (!isValidEmail(nextEmail)) {
      setStatus("error");
      setMessage("Enter a valid email to get weekly updates.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const recaptchaToken = isRecaptchaConfigured
        ? await getRecaptchaToken(RECAPTCHA_ACTION)
        : undefined;

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nextEmail,
          recaptchaToken,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Subscription failed. Try again in a moment.");
        return;
      }

      setStatus("success");
      setMessage("You are in. Check your inbox to confirm your subscription.");
      setEmail("");
      trackEvent("newsletter_signup", {
        source: "blog_inline_conversion_cta",
        slug,
      });
    } catch {
      setStatus("error");
      setMessage("Verification failed or subscription could not be completed. Try again.");
    }
  };

  return (
    <section
      aria-labelledby="blog-conversion-cta-heading"
      className="not-prose mt-10 rounded-2xl border border-border bg-gradient-to-b from-card/90 to-background p-6 sm:p-8"
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
          Next Best Step
        </p>
        <h2
          id="blog-conversion-cta-heading"
          className="font-display text-xl font-semibold text-foreground"
        >
          Get one high-signal tools brief per week
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Weekly decisions for builders: what changed in AI and dev tooling, what to switch to,
          and which tools to avoid. One email. No noise.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`blog-inline-newsletter-${slug}`} className="sr-only">
          Email address
        </label>
        <input
          id={`blog-inline-newsletter-${slug}`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
          disabled={status === "loading"}
          className="h-11 min-h-[2.75rem] flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="submit" disabled={status === "loading"} className="h-11 min-h-[2.75rem] gap-2">
          {status === "loading" ? (
            <>
              <Spinner variant="ellipsis" size={16} className="text-primary-foreground" />
              Joining…
            </>
          ) : (
            "Send me weekly updates"
          )}
        </Button>
      </form>

      {isRecaptchaConfigured ? (
        <p className="mt-2 text-xs text-muted-foreground">
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

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`mt-3 text-sm ${status === "success" ? "text-primary" : "text-destructive"}`}
        >
          {message}
        </p>
      ) : null}

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Or keep reading by intent
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ctaLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
