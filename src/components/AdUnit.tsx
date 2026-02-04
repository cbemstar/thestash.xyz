"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getAdConsent } from "./CookieConsent";

interface AdUnitProps {
  /** Ad slot ID from AdSense (e.g. 1234567890). */
  slot: string;
  /** Format: "rectangle", "horizontal", "vertical", "auto". Default "auto". */
  format?: "rectangle" | "horizontal" | "vertical" | "auto";
  /** Optional style object for the container. */
  className?: string;
  /** When true, use non-personalized ads (e.g. if user rejected consent). */
  nonPersonalized?: boolean;
}

/**
 * Renders a Google AdSense ad unit. Only works after AdSense script is loaded
 * (set NEXT_PUBLIC_ADSENSE_CLIENT_ID) and you have created an ad unit in AdSense.
 * Key by pathname so ads refresh on client-side navigation.
 */
export function AdUnit({
  slot,
  format = "auto",
  className = "",
  nonPersonalized: propNpa,
}: AdUnitProps) {
  const pathname = usePathname();
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;
    try {
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({});
    } catch {
      // Ignore
    }
  }, [pathname]);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <div className={className} key={pathname}>
      <ins
        ref={ref}
        className="adsbygoogle"
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(propNpa ?? getAdConsent() === "reject" ? { "data-npa": "1" } : {})}
        style={{ display: "block" }}
        data-ad-status="unfilled"
        aria-hidden
      />
    </div>
  );
}
