"use client";

import { useEffect, useRef, useState } from "react";
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
  const [isUnfilled, setIsUnfilled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;

    const node = ref.current;
    setIsUnfilled(false);

    const syncStatus = () => {
      const status = node.getAttribute("data-ad-status");
      if (status === "filled") {
        setIsUnfilled(false);
      } else if (status === "unfilled") {
        setIsUnfilled(true);
      }
    };

    const observer = new MutationObserver(syncStatus);
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });

    try {
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({});
    } catch {
      // Ignore
    }

    syncStatus();

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;
  if (isUnfilled) return null;

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
        aria-hidden
      />
    </div>
  );
}
