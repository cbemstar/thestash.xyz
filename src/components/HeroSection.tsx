"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Spinner } from "./kibo-ui/spinner";
import { CATEGORIES } from "@/lib/categories";
import type { ResourceCategory } from "@/types/resource";

const API_ENDPOINT = "/api/subscribe";

interface HeroSectionProps {
  /** When set, the matching category pill is shown as active (e.g. on category page). */
  currentCategory?: ResourceCategory;
}

export function HeroSection({ currentCategory }: HeroSectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("Check your email for a confirmation to ensure we got it right.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section
      className="border-b border-border bg-gradient-to-b from-card/50 to-background px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h1
          id="hero-heading"
          className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
        >
          Dev and design resources, hand-picked for you
        </h1>

        <div className="mx-auto mt-6 max-w-[65ch] space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-[1.65]">
            The Stash is a curated directory of tools, inspiration, and learning resources for
            developers and designers.{" "}
            <Link href="/collections" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
              Browse curated collections
            </Link>
            , filter{" "}
            <Link href="/#all-resources" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
              all resources
            </Link>
            {" "}by category below, or search by title and tags. Subscribe for new picks in your inbox.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="sr-only">Browse by category:</span>
          {CATEGORIES.map((c) => {
            const isActive = currentCategory === c.value;
            return (
              <Link
                key={c.value}
                href={`/category/${c.value}`}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  isActive
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-muted/50 text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:gap-2 sm:mt-10"
        >
          <label htmlFor="subscribe-email" className="sr-only">
            Email address for updates
          </label>
          <input
            id="subscribe-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={status === "loading"}
            autoComplete="email"
            aria-describedby={message ? "subscribe-message" : undefined}
            className="flex h-11 min-h-[44px] flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
          />
          <Button
            type="submit"
            disabled={status === "loading"}
            className="min-h-[44px] shrink-0 cursor-pointer gap-2"
          >
            {status === "loading" ? (
              <>
                <Spinner variant="ellipsis" size={16} className="text-primary-foreground" />
                Subscribing…
              </>
            ) : (
              "Get updates"
            )}
          </Button>
        </form>

        {message && (
          <p
            id="subscribe-message"
            role="status"
            aria-live="polite"
            className={`mt-4 text-center text-sm ${status === "success" ? "text-primary" : "text-destructive"}`}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
