"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type TrackedCompareLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    comparisonSlug: string;
  };

export function TrackedCompareLink({
  comparisonSlug,
  children,
  onClick,
  ...props
}: TrackedCompareLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackEvent("comparison_click", {
          comparison_slug: comparisonSlug,
          from_path:
            typeof window !== "undefined" ? window.location.pathname : "",
          to_path: `/compare/${comparisonSlug}`,
        });
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
