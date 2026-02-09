"use client";

import { useEffect } from "react";
import { getStoredPrefs, applyConsentToGtag } from "../lib/cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-YCFR0QKPKM";

/**
 * Applies stored cookie preferences to gtag on mount so consent state is correct
 * on every page load (e.g. after navigation or refresh).
 */
export function ConsentInitializer() {
  useEffect(() => {
    const prefs = getStoredPrefs();
    if (prefs) {
      applyConsentToGtag(prefs, GA_ID);
    }
  }, []);
  return null;
}
