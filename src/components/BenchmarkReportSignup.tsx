"use client";

import { useState } from "react";
import { Spinner } from "@/components/kibo-ui/spinner";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { getRecaptchaToken, isRecaptchaConfigured } from "@/lib/recaptcha-client";

const API_ENDPOINT = "/api/subscribe";
const RECAPTCHA_ACTION = "newsletter_subscribe";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function BenchmarkReportSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setStatus("error");
      setMessage("Enter a valid work email to receive benchmark briefs.");
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
          email: normalizedEmail,
          recaptchaToken,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "Could not subscribe right now. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("You are subscribed. Check your inbox to confirm.");
      setEmail("");
      trackEvent("newsletter_signup", {
        source: "benchmark_report_signup",
      });
    } catch {
      setStatus("error");
      setMessage("Verification failed or subscription could not be completed.");
    }
  };

  return (
    <section
      aria-labelledby="benchmark-report-signup-heading"
      className="mt-12 rounded-2xl border border-border bg-gradient-to-b from-card/80 to-background p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
        Benchmark audience
      </p>
      <h2
        id="benchmark-report-signup-heading"
        className="mt-2 font-display text-xl font-semibold text-foreground"
      >
        Get official-source benchmark reports in your inbox
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Monthly benchmark brief with verified data points, new infographics, and source links you
        can cite in strategy docs, stakeholder updates, and tool evaluations.
      </p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="benchmark-report-email" className="sr-only">
          Email address
        </label>
        <input
          id="benchmark-report-email"
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
              Joining...
            </>
          ) : (
            "Send me benchmark briefs"
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
    </section>
  );
}
