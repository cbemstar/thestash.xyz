"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SlidingCapsuleNav,
  type NavTab,
} from "@/components/satisui/sliding-capsule-nav";
import { ThemeSwitcherNav } from "@/components/ThemeSwitcherNav";
import ShinyText from "@/components/ShinyText";
import { cn } from "@/lib/utils";

/** Desktop: brief capsule; Browse dropdown at the end. Mobile: full flat list. */
const desktopTabs: NavTab[] = [
  { title: "Home", url: "/" },
  { title: "Tech stack", url: "/recommend" },
  { title: "Saved", url: "/saved" },
  { title: "Submit", url: "/submit" },
  { title: "Blog", url: "/blog" },
  { title: "Tools", url: "/tools" },
  {
    title: "Browse",
    items: [
      { title: "Collections", url: "/collections" },
      { title: "Companies", url: "/companies" },
      { title: "Reports", url: "/reports" },
      { title: "Use cases", url: "/use-cases" },
      { title: "Decision center", url: "/decision-center" },
      { title: "Ecosystems", url: "/ecosystems" },
      { title: "Category", url: "/category" },
    ],
  },
];

/** All items for mobile sheet (flat, no dropdown) */
const mobileNavItems = [
  { title: "Home", url: "/" },
  { title: "Tech stack", url: "/recommend" },
  { title: "Saved", url: "/saved" },
  { title: "Submit", url: "/submit" },
  { title: "Blog", url: "/blog" },
  { title: "Tools", url: "/tools" },
  { title: "Collections", url: "/collections" },
  { title: "Companies", url: "/companies" },
  { title: "Reports", url: "/reports" },
  { title: "Use cases", url: "/use-cases" },
  { title: "Decision center", url: "/decision-center" },
  { title: "Ecosystems", url: "/ecosystems" },
  { title: "Category", url: "/category" },
];

export function AppNav() {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stash-line-soft bg-stash-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-stash-canvas/70">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex w-[9.25rem] shrink-0 items-center justify-center rounded px-1 py-2 text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="The Stash – Home"
        >
          <ShinyText
            text="The Stash"
            className="font-logo-shuffle block w-full text-center text-[0.72rem] leading-[1.08] tracking-[0.02em] [padding-bottom:0.14em]"
            speed={2.8}
            color="var(--muted-foreground)"
            shineColor="var(--foreground)"
            spread={115}
            direction="left"
          />
        </Link>

        {/* Desktop – sliding capsule; width fits menu items */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center" aria-label="Primary">
          <SlidingCapsuleNav
            tabs={desktopTabs}
            layoutId="app-nav-capsule"
            variant="stash"
            className="w-fit"
          />
        </div>

        <div className="hidden md:block shrink-0">
          <ThemeSwitcherNav />
        </div>

        {/* Mobile – Sheet: only render after mount to avoid Radix Portal/state hydration mismatch */}
        {mounted && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="browse-control size-10 p-0 text-stash-muted-text hover:text-foreground md:hidden"
              aria-label="Open menu"
            >
              <HamburgerMenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-full max-w-[17.5rem] flex-col gap-0 border-l-stash-line-soft bg-stash-panel sm:max-w-[20rem]"
            style={{
              width: "min(20rem, 85vw)",
            }}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            {/* Responsive menu: start below close button (top-4 + ~32px), fluid spacing, 44px touch targets */}
            <nav
              className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden border-t border-stash-line-soft pt-12"
              aria-label="Primary"
              style={{
                paddingLeft: "clamp(1rem, 2.5vw, 2rem)",
                paddingRight: "clamp(1rem, 2.5vw, 2rem)",
                paddingBottom: "clamp(1rem, 2.5vw, 2rem)",
              }}
            >
              <ul className="flex list-none flex-col gap-0 p-0">
                {mobileNavItems.map(({ title, url }, index) => {
                  const isActive =
                    pathname === url ||
                    (url !== "/" && pathname?.startsWith(url));
                  const num = String(index + 1).padStart(2, "0");
                  return (
                    <li key={url} className="w-full leading-none">
                      <Link
                        href={url}
                        className={cn(
                          "browse-control relative flex min-h-[2.75rem] w-full min-w-0 items-baseline justify-between gap-4 rounded-[14px] px-4 py-3 text-left font-semibold uppercase leading-none tracking-[-0.02em] no-underline duration-[0.2s] [-webkit-tap-highlight-color:transparent]",
                          isActive
                            ? "border-stash-line-strong bg-stash-control-hover text-foreground"
                            : "text-stash-muted-text hover:text-foreground"
                        )}
                        style={{
                          fontSize: "clamp(1.05rem, 0.95rem + 1.4vw, 1.5rem)",
                        }}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="min-w-0 flex-1 truncate">{title}</span>
                        <span
                          className={cn(
                            "shrink-0 font-normal tabular-nums pointer-events-none select-none",
                            isActive
                              ? "text-foreground/80"
                              : "text-stash-muted-text"
                          )}
                          style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.95rem)" }}
                          aria-hidden
                        >
                          {num}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div
                className="mt-6 flex min-h-[2.75rem] items-center justify-between border-t border-stash-line-soft pt-6 sm:mt-8 sm:pt-8"
                style={{
                  marginTop: "clamp(1.5rem, 4vw, 2.5rem)",
                  paddingTop: "clamp(1.5rem, 4vw, 2.5rem)",
                }}
              >
                <span className="text-sm font-medium uppercase tracking-[0.08em] text-stash-muted-text">
                  Theme
                </span>
                <ThemeSwitcherNav />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        )}
        {!mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="browse-control size-10 p-0 text-stash-muted-text md:hidden"
            aria-label="Open menu"
            type="button"
            tabIndex={-1}
            aria-hidden
          >
            <HamburgerMenuIcon className="size-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
