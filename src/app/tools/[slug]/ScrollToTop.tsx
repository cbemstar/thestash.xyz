"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls to top when the tool detail page mounts (e.g. after clicking a tool from /tools).
 * Next.js client navigation or Lenis can preserve scroll position; this resets it so the
 * tool header and workbench are visible.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
