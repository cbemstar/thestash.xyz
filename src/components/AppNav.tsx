"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu2 } from "@tabler/icons-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Top-level nav links shown on desktop */
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

/** All nav items for mobile (flat list) */
const allNavItems = [
  ...primaryNavItems,
  ...browseItems,
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="The Stash – Home"
        >
          The Stash
        </Link>

        {/* Desktop nav – primary links + Browse dropdown */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1">
            {primaryNavItems.map(({ label, href }) => {
              const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
              return (
                <NavigationMenuItem key={href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "focus-visible:ring-ring/50",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  browseItems.some(({ href }) => pathname === href || pathname?.startsWith(href + "/"))
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : ""
                )}
                aria-expanded={browseItems.some(({ href }) => pathname === href || pathname?.startsWith(href + "/"))}
              >
                Browse
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[180px] gap-1 p-2">
                  {browseItems.map(({ label, href }) => {
                    const isActive = pathname === href || pathname?.startsWith(href + "/");
                    return (
                      <li key={href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={href}
                            className={cn(
                              "block select-none rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                              isActive && "bg-accent text-accent-foreground"
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    );
                  })}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile nav – Sheet */}
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
            <nav className="mt-4 flex flex-col items-start gap-0.5 border-t border-border pt-4" aria-label="Primary">
              {allNavItems.map(({ label, href }) => {
                const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "w-fit rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
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
