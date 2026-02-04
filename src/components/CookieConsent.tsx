"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "thestash-consent";

type Consent = "accept" | "reject" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(CONSENT_KEY) as Consent | null;
      if (stored === "accept" || stored === "reject") setConsent(stored);
      else setConsent(null);
    } catch {
      setConsent(null);
    }
  }, []);

  const save = (value: "accept" | "reject") => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
      setConsent(value);
    } catch {
      setConsent(value);
    }
  };

  if (!mounted || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur p-4 shadow-lg sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies and similar tech for analytics and to show ads (e.g. Google AdSense).
          By continuing you accept our{" "}
          <Link href="/privacy" className="text-foreground underline underline-offset-2 hover:text-primary">
            Privacy Policy
          </Link>
          . You can reject personalized ads below.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => save("reject")}
            className="rounded-md border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Reject personalized ads
          </button>
          <button
            type="button"
            onClick={() => save("accept")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/** Call from client to know if user rejected personalized ads (for data-npa on ad units). */
export function getAdConsent(): "accept" | "reject" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accept" || v === "reject" ? v : null;
  } catch {
    return null;
  }
}
