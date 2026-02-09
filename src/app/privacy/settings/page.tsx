"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  type CookiePrefs,
  getStoredPrefs,
  saveCookiePrefs,
  clearCookiePrefs,
  DEFAULT_PREFS_ALL,
} from "../../../lib/cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-YCFR0QKPKM";

export default function PrivacySettingsPage() {
  const [prefs, setPrefs] = useState<CookiePrefs | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editPrefs, setEditPrefs] = useState<CookiePrefs>(DEFAULT_PREFS_ALL);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredPrefs();
    setPrefs(stored);
    setEditPrefs(stored ?? DEFAULT_PREFS_ALL);
  }, []);

  const save = (newPrefs: CookiePrefs) => {
    saveCookiePrefs(newPrefs, GA_ID);
    setPrefs(newPrefs);
    setEditPrefs(newPrefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateEdit = (key: "functionality" | "tracking" | "targeting", value: boolean) => {
    setEditPrefs((p) => ({ ...p, [key]: value }));
  };

  const showBannerAgain = () => {
    clearCookiePrefs();
    setPrefs(null);
    window.location.reload();
  };

  const openGoogleConsent = () => {
    if (typeof window !== "undefined" && window.googlefc?.showRevocationMessage) {
      window.googlefc.showRevocationMessage();
    }
  };

  const hasGoogleCmp =
    mounted && typeof window !== "undefined" && typeof window.googlefc?.showRevocationMessage === "function";

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "The Stash", href: "/" },
            { label: "Privacy", href: "/privacy" },
            { label: "Cookie settings" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Privacy and cookie settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage cookie categories and how we use data for analytics and advertising (Google
          consent mode).
        </p>

        <div className="mt-8 space-y-8">
          <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-6">
            <h2 className="font-semibold text-foreground">Cookies Preferences Center</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These map to Google consent types (ad_storage, analytics_storage, functionality_storage,
              etc.). When you allow tracking, we use a persistent identifier for measurement
              (user-ID collection in Google Analytics 4).
            </p>
            {mounted && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <span className="font-medium text-foreground">Strictly necessary cookies</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Always on; required for the site.</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">Always on</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <span className="font-medium text-foreground">Functionality cookies</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Language, theme, preferences.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant={editPrefs.functionality ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateEdit("functionality", true)}
                    >
                      Allow
                    </Button>
                    <Button
                      variant={!editPrefs.functionality ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateEdit("functionality", false)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <span className="font-medium text-foreground">Tracking cookies</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Analytics (GA4); enables user-ID collection when allowed.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant={editPrefs.tracking ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateEdit("tracking", true)}
                    >
                      Allow
                    </Button>
                    <Button
                      variant={!editPrefs.tracking ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateEdit("tracking", false)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <span className="font-medium text-foreground">Targeting and advertising cookies</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Personalized ads (e.g. Google AdSense).</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant={editPrefs.targeting ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateEdit("targeting", true)}
                    >
                      Allow
                    </Button>
                    <Button
                      variant={!editPrefs.targeting ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateEdit("targeting", false)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => save(editPrefs)}
                >
                  Save preferences
                </Button>
                {saved && (
                  <p className="text-sm text-green-600 dark:text-green-400">Preferences saved. Consent state has been sent to Google.</p>
                )}
              </div>
            )}
            {mounted && prefs !== null && (
              <p className="mt-3 text-xs text-muted-foreground">
                Current: Functionality {prefs.functionality ? "on" : "off"}, Tracking{" "}
                {prefs.tracking ? "on" : "off"}, Targeting {prefs.targeting ? "on" : "off"}.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-6">
            <h2 className="font-semibold text-foreground">Show cookie banner again</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Clear your saved preference so the cookie consent banner appears again on your next
              visit.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={showBannerAgain}
            >
              Show cookie banner again
            </Button>
          </section>

          {hasGoogleCmp && (
            <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-6">
              <h2 className="font-semibold text-foreground">European regulations (EEA, UK, Switzerland)</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                If you are in the EEA, UK, or Switzerland, you can reopen Google’s consent message
                to change your choices (Consent, Do not consent, Manage options).
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={openGoogleConsent}
              >
                Open Google consent message
              </Button>
            </section>
          )}
        </div>

        <p className="mt-10">
          <Link href="/privacy" className="text-sm text-foreground underline underline-offset-2 hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </main>
    </div>
  );
}
