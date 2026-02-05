"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Nav link with Skiper-style animated underline (center expand).
 * Min touch target 2.75rem (44px) for mobile (UX guideline). Use for header nav.
 */
export function NavLink({
  href,
  children,
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const base =
    "group relative flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-md";
  const underline =
    "before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[0.05em] before:w-full before:bg-current before:content-[''] before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] hover:before:origin-left hover:before:scale-x-100 motion-reduce:before:transition-none";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, underline, className)}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(base, underline, className)}>
      {children}
    </Link>
  );
}
