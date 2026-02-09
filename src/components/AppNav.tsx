"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";

/** Desktop: brief capsule; Browse dropdown at the end. Mobile: full flat list. */
const desktopTabs: NavTab[] = [
  { title: "Home", url: "/" },
  { title: "Tech stack", url: "/recommend" },
  { title: "Saved", url: "/saved" },
  { title: "Submit", url: "/submit" },
  {
    title: "Browse",
    items: [
      { title: "Collections", url: "/collections" },
      { title: "Category", url: "/category" },
      { title: "Tags", url: "/tags" },
      { title: "Type", url: "/type" },
    ],
  },
];

/** All items for mobile sheet (flat, no dropdown) */
const mobileNavItems = [
  { title: "Home", url: "/" },
  { title: "Tech stack", url: "/recommend" },
  { title: "Saved", url: "/saved" },
  { title: "Submit", url: "/submit" },
  { title: "Collections", url: "/collections" },
  { title: "Category", url: "/category" },
  { title: "Tags", url: "/tags" },
  { title: "Type", url: "/type" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 font-display text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="The Stash – Home"
        >
          The Stash
        </Link>

        {/* Desktop – sliding capsule; width fits menu items */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center" aria-label="Primary">
          <SlidingCapsuleNav
            tabs={desktopTabs}
            layoutId="app-nav-capsule"
            className="w-fit"
          />
        </div>

        <div className="hidden md:block shrink-0">
          <ThemeSwitcherNav />
        </div>

        {/* Mobile – Sheet with links */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <HamburgerMenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[17.5rem] sm:w-[20rem]">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
            <nav
              className="mt-6 flex flex-col gap-1 border-t border-border pt-6"
              aria-label="Primary"
            >
              {mobileNavItems.map(({ title, url }) => {
                const isActive =
                  pathname === url ||
                  (url !== "/" && pathname?.startsWith(url));
                return (
                  <Link
                    key={url}
                    href={url}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {title}
                  </Link>
                );
              })}
              <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Theme
                </span>
                <ThemeSwitcherNav />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
