"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type CookiePrefs,
  getStoredPrefs,
  saveCookiePrefs,
  DEFAULT_PREFS_ALL,
  DEFAULT_PREFS_REJECT_ADS,
} from "../lib/cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-YCFR0QKPKM";

export function CookieConsent() {
  const [prefs, setPrefs] = useState<CookiePrefs | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [managePrefs, setManagePrefs] = useState<CookiePrefs>(DEFAULT_PREFS_ALL);
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredPrefs();
    setPrefs(stored);
    if (stored) setManagePrefs(stored);
  }, []);

  useEffect(() => {
    if (!mounted || prefs !== null) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [mounted, prefs]);

  const save = (newPrefs: CookiePrefs) => {
    saveCookiePrefs(newPrefs, GA_ID);
    setPrefs(newPrefs);
    setManagePrefs(newPrefs);
    setManageOpen(false);
  };

  const openManage = () => {
    setManagePrefs(prefs ?? DEFAULT_PREFS_ALL);
    setManageOpen(true);
  };

  const saveManage = () => {
    save(managePrefs);
  };

  const updateManage = (key: "functionality" | "tracking" | "targeting", value: boolean) => {
    setManagePrefs((p) => ({ ...p, [key]: value }));
  };

  if (!mounted || prefs !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookies Preferences Center"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur p-4 shadow-lg transition-transform duration-300 sm:px-6 lg:px-8 motion-reduce:duration-0",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="mx-auto max-w-3xl">
        {!manageOpen ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              We use cookies for analytics (e.g. Google Analytics), ads (e.g. Google AdSense), and
              site functionality. By continuing you accept our{" "}
              <Link href="/privacy" className="text-foreground underline underline-offset-2 hover:text-primary">
                Privacy Policy
              </Link>
              . You can manage categories or reject personalized ads below.
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openManage}
                className="min-h-11 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Manage options
              </button>
              <button
                type="button"
                onClick={() => save(DEFAULT_PREFS_REJECT_ADS)}
                className="min-h-11 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Reject personalized ads
              </button>
              <button
                type="button"
                onClick={() => save(DEFAULT_PREFS_ALL)}
                className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">Cookies Preferences Center</h2>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close preferences"
              >
                <span className="sr-only">Close</span>
                <span aria-hidden>×</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Your privacy</p>
            <ul className="space-y-3 text-sm">
              <li className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">Strictly necessary cookies</span>
                  <span className="text-xs text-muted-foreground">Always on</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for the site to work (e.g. security, load balancing). These cannot be
                  disabled.
                </p>
              </li>
              <li className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="font-medium text-foreground">Functionality cookies</span>
                  <select
                    value={managePrefs.functionality ? "allow" : "reject"}
                    onChange={(e) => updateManage("functionality", e.target.value === "allow")}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Functionality cookies"
                  >
                    <option value="allow">Allow</option>
                    <option value="reject">Reject</option>
                  </select>
                </label>
                <p className="text-xs text-muted-foreground">
                  Support site features (e.g. language, theme). Maps to Google consent:
                  functionality_storage.
                </p>
              </li>
              <li className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="font-medium text-foreground">Tracking cookies</span>
                  <select
                    value={managePrefs.tracking ? "allow" : "reject"}
                    onChange={(e) => updateManage("tracking", e.target.value === "allow")}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Tracking cookies"
                  >
                    <option value="allow">Allow</option>
                    <option value="reject">Reject</option>
                  </select>
                </label>
                <p className="text-xs text-muted-foreground">
                  Analytics (e.g. visit duration, pages viewed). When allowed, we use a persistent
                  identifier for measurement (user-ID collection in Google Analytics 4). Maps to
                  analytics_storage.
                </p>
              </li>
              <li className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="font-medium text-foreground">Targeting and advertising cookies</span>
                  <select
                    value={managePrefs.targeting ? "allow" : "reject"}
                    onChange={(e) => updateManage("targeting", e.target.value === "allow")}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Targeting and advertising cookies"
                  >
                    <option value="allow">Allow</option>
                    <option value="reject">Reject</option>
                  </select>
                </label>
                <p className="text-xs text-muted-foreground">
                  Used to show you relevant ads (e.g. Google AdSense). Maps to ad_storage,
                  ad_user_data, ad_personalization.
                </p>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setMoreInfoOpen((o) => !o)}
                  className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                >
                  {moreInfoOpen ? "Less information" : "More information"}
                </button>
                {moreInfoOpen && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cookies are very small text files stored on your device when you visit a
                    website. We use them for analytics, advertising, and site functionality. You
                    can change these preferences anytime from{" "}
                    <Link href="/privacy/settings" className="underline hover:text-foreground">
                      Privacy and cookie settings
                    </Link>
                    .
                  </p>
                )}
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={saveManage}
                className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Save preferences
              </button>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="min-h-11 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Call from client to know if user rejected personalized ads (for data-npa on ad units).
 * Reads from the same cookie prefs; targeting = false means reject.
 */
export function getAdConsent(): "accept" | "reject" | null {
  if (typeof window === "undefined") return null;
  const prefs = getStoredPrefs();
  if (!prefs) return null;
  return prefs.targeting ? "accept" : "reject";
}
