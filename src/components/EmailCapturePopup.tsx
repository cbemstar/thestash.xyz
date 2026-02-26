"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { XIcon } from "lucide-react";
import { Spinner } from "@/components/kibo-ui/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";
import { getRecaptchaToken, isRecaptchaConfigured } from "@/lib/recaptcha-client";

const API_ENDPOINT = "/api/subscribe";
const RECAPTCHA_ACTION = "newsletter_subscribe";
const POPUP_DISMISSED_AT_KEY = "thestash-signup-popup-dismissed-at";
const POPUP_SUBSCRIBED_KEY = "thestash-signup-popup-subscribed";
const POPUP_SESSION_SEEN_KEY = "thestash-signup-popup-session-seen";
const POPUP_ID = "email_capture_popup_v2";
const POPUP_TIME_TRIGGER_MS = 42000;
const POPUP_SCROLL_TRIGGER_RATIO = 0.45;
const POPUP_MIN_SCROLL_ELAPSED_MS = 12000;
const POPUP_REOPEN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shouldOpenPopup(): boolean {
  try {
    if (window.sessionStorage.getItem(POPUP_SESSION_SEEN_KEY) === "1") {
      return false;
    }

    if (window.localStorage.getItem(POPUP_SUBSCRIBED_KEY) === "1") {
      return false;
    }

    const dismissedAtRaw = window.localStorage.getItem(POPUP_DISMISSED_AT_KEY);
    if (!dismissedAtRaw) {
      return true;
    }

    const dismissedAt = Number(dismissedAtRaw);
    if (!Number.isFinite(dismissedAt)) {
      return true;
    }

    return Date.now() - dismissedAt > POPUP_REOPEN_AFTER_MS;
  } catch {
    return true;
  }
}

function persistSessionSeenState(): void {
  try {
    window.sessionStorage.setItem(POPUP_SESSION_SEEN_KEY, "1");
  } catch {
    // Ignore blocked sessionStorage contexts.
  }
}

function persistDismissedState(): void {
  try {
    window.localStorage.setItem(POPUP_DISMISSED_AT_KEY, String(Date.now()));
  } catch {
    // Ignore blocked localStorage contexts (e.g. sandboxed iframe previews).
  }
}

function persistSubscribedState(): void {
  try {
    window.localStorage.setItem(POPUP_SUBSCRIBED_KEY, "1");
    window.localStorage.removeItem(POPUP_DISMISSED_AT_KEY);
    persistSessionSeenState();
  } catch {
    // Ignore blocked localStorage contexts (e.g. sandboxed iframe previews).
  }
}

export function EmailCapturePopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!shouldOpenPopup()) return;

    const mountedAt = Date.now();
    let opened = false;

    const openPopup = (trigger: "time" | "scroll") => {
      if (opened) return;
      opened = true;
      persistSessionSeenState();
      setOpen(true);
      trackEvent("popup_view", {
        popup_id: POPUP_ID,
        trigger,
      });
    };

    const onScroll = () => {
      if (opened) return;
      if (Date.now() - mountedAt < POPUP_MIN_SCROLL_ELAPSED_MS) return;

      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const scrollRatio = window.scrollY / scrollableHeight;
      if (scrollRatio >= POPUP_SCROLL_TRIGGER_RATIO) {
        openPopup("scroll");
      }
    };

    const timeoutId = window.setTimeout(() => {
      openPopup("time");
    }, POPUP_TIME_TRIGGER_MS);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const closeAsDismissed = (reason: "close_button" | "decline_link" | "overlay_or_escape") => {
    persistDismissedState();
    persistSessionSeenState();
    trackEvent("popup_close", {
      popup_id: POPUP_ID,
      reason,
    });
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && status !== "success") {
      closeAsDismissed("overlay_or_escape");
      return;
    }
    setOpen(nextOpen);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setStatus("error");
      setMessage("Enter a valid email to get the weekly tools brief.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      trackEvent("popup_submit_attempt", {
        popup_id: POPUP_ID,
      });

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

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not subscribe right now. Try again in a moment.");
        return;
      }

      setStatus("success");
      setMessage("You are in. Check your inbox to confirm your subscription.");
      setEmail("");
      persistSubscribedState();
      setTimeout(() => setOpen(false), 1100);

      trackEvent("newsletter_signup", {
        source: "email_capture_popup",
        popup_id: POPUP_ID,
      });
    } catch {
      setStatus("error");
      setMessage("Verification failed or subscription could not be completed. Try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] min-h-[min(600px,92vh)] w-[min(960px,calc(100vw-2rem))] max-w-[min(960px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border-border/70 bg-background p-0 shadow-[0_36px_120px_rgba(15,23,42,0.45)] sm:min-w-[min(640px,calc(100vw-2rem))] sm:min-h-[min(640px,90vh)] sm:max-h-[90vh]"
      >
        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[1fr_1fr] md:grid-rows-none md:min-h-[520px]">
          <div className="relative h-48 min-w-0 shrink-0 border-b border-border/60 md:h-full md:min-h-0 md:border-b-0 md:border-r">
            <Image
              src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80"
              alt="Workspace desk with laptop and notebook."
              fill
              sizes="(max-width: 768px) 100vw, 52vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent md:bg-gradient-to-b" />
            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/20 bg-black/35 px-3 py-2 backdrop-blur-sm">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/90">
                Weekly Signal, Zero Noise
              </p>
              <p className="mt-1 text-sm text-white/90">
                A 3-minute weekly read on what changed in AI + dev tooling.
              </p>
            </div>
          </div>

          <div className="relative flex min-w-0 flex-col overflow-y-auto overflow-x-hidden p-6 sm:p-8 lg:p-10">
            <button
              type="button"
              onClick={() => closeAsDismissed("close_button")}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close signup popup"
            >
              <XIcon className="size-4" />
            </button>

            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
              Weekly Builder Brief
            </p>
            <DialogTitle className="mt-3 min-w-0 pr-10 font-display text-2xl font-semibold leading-tight text-foreground sm:text-[2rem] lg:text-[2.2rem]">
              Get the exact tools worth trying each week.
            </DialogTitle>
            <DialogDescription className="mt-3 min-w-0 text-sm leading-relaxed text-muted-foreground sm:text-[0.98rem] sm:leading-6">
              Every Monday, get a concise brief with hand-picked launches, practical use cases, and
              what to skip so you do not waste build time.
            </DialogDescription>

            <ul className="mt-5 grid w-full min-w-0 max-w-full gap-3 text-sm text-foreground/90 sm:grid-cols-2">
              <li className="min-w-0 rounded-lg border border-border/70 bg-muted/30 px-4 py-2.5">
                5-7 vetted tool picks
              </li>
              <li className="min-w-0 rounded-lg border border-border/70 bg-muted/30 px-4 py-2.5">
                Decision-ready comparisons
              </li>
              <li className="min-w-0 rounded-lg border border-border/70 bg-muted/30 px-4 py-2.5">
                Migration and alternatives notes
              </li>
              <li className="min-w-0 rounded-lg border border-border/70 bg-muted/30 px-4 py-2.5">
                3-minute read, once a week
              </li>
            </ul>

            <form onSubmit={onSubmit} className="mt-7 w-full min-w-0 max-w-full space-y-3">
              <label htmlFor="email-capture-popup-input" className="sr-only">
                Email address
              </label>
              <input
                id="email-capture-popup-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@work.com"
                autoComplete="email"
                required
                disabled={status === "loading"}
                aria-describedby={message ? "email-capture-popup-message" : undefined}
                className="h-12 w-full rounded-xl border border-border/80 bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <Button
                type="submit"
                disabled={status === "loading"}
                className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"
              >
                {status === "loading" ? (
                  <>
                    <Spinner variant="ellipsis" size={16} className="text-primary-foreground" />
                    Joining…
                  </>
                ) : (
                  "Send My Weekly Brief"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                No spam. Unsubscribe in one click.
              </p>
            </form>

            {isRecaptchaConfigured ? (
              <p className="mt-3 min-w-0 text-[0.72rem] leading-relaxed text-muted-foreground">
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
                id="email-capture-popup-message"
                role="status"
                aria-live="polite"
                className={`mt-3 min-w-0 text-sm ${status === "success" ? "text-primary" : "text-destructive"}`}
              >
                {message}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => closeAsDismissed("decline_link")}
              className="mt-5 text-sm font-medium text-muted-foreground underline decoration-transparent underline-offset-4 transition hover:text-foreground hover:decoration-current"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
