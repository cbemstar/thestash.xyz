"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu2, IconChevronDown } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Pill } from "@/components/kibo-ui/pill";
import { cn } from "@/lib/utils";

/** Top-level nav links */
const primaryNavItems = [
  { label: "Home", href: "/" },
  { label: "Tech stack", href: "/recommend" },
  { label: "Saved", href: "/saved" },
  { label: "Submit", href: "/studio" },
] as const;

/** Browse submenu items */
const browseItems = [
  { label: "Collections", href: "/collections" },
  { label: "Category", href: "/category" },
  { label: "Tags", href: "/tags" },
  { label: "Type", href: "/type" },
] as const;

/** All nav items for mobile */
const allNavItems = [...primaryNavItems, ...browseItems] as const;

function NavPill({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Pill asChild variant={isActive ? "default" : "secondary"}>
      <Link
        href={href}
        className={cn(
          "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </Link>
    </Pill>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const isBrowseActive = browseItems.some(
    ({ href }) => pathname === href || pathname?.startsWith(href + "/")
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="The Stash – Home"
        >
          The Stash
        </Link>

        {/* Desktop – pill-style nav with Kibo aesthetic */}
        <nav className="hidden md:flex md:items-center md:gap-1.5" aria-label="Primary">
          {primaryNavItems.map(({ label, href }) => (
            <NavPill
              key={href}
              href={href}
              label={label}
              isActive={
                pathname === href ||
                (href !== "/" && pathname?.startsWith(href))
              }
            />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isBrowseActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-expanded={undefined}
                aria-haspopup="menu"
              >
                Browse
                <IconChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {browseItems.map(({ label, href }) => {
                const isActive =
                  pathname === href || pathname?.startsWith(href + "/");
                return (
                  <DropdownMenuItem key={href} asChild>
                    <Link
                      href={href}
                      className={cn(isActive && "bg-accent font-medium")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile – Sheet with pill-styled links */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <IconMenu2 className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
            <nav
              className="mt-6 flex flex-col gap-1 border-t border-border pt-6"
              aria-label="Primary"
            >
              {allNavItems.map(({ label, href }) => {
                const isActive =
                  pathname === href ||
                  (href !== "/" && pathname?.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
