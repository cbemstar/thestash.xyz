"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/analytics";

type OutboundLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  toolSlug?: string;
};

export function OutboundLink({
  onClick,
  href,
  toolSlug,
  ...props
}: OutboundLinkProps) {
  const hrefValue = typeof href === "string" ? href : "";

  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        trackEvent("outbound_tool_click", {
          href: hrefValue,
          tool_slug: toolSlug ?? "",
          page_path:
            typeof window !== "undefined" ? window.location.pathname : "",
        });
        onClick?.(event);
      }}
    />
  );
}
