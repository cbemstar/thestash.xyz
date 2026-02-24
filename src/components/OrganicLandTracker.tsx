"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isOrganicReferrer, trackEvent } from "@/lib/analytics";

const trackedPaths = new Set<string>();

export function OrganicLandTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || trackedPaths.has(pathname)) return;
    try {
      const referrer = typeof document !== "undefined" ? document.referrer ?? "" : "";
      if (!isOrganicReferrer(referrer)) return;
      trackedPaths.add(pathname);
      trackEvent("organic_land", {
        landing_path: pathname,
        referrer,
      });
    } catch {
      // document.referrer can throw in restricted iframes (e.g. AdSense preview)
    }
  }, [pathname]);

  return null;
}
