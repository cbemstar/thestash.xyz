"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
  showDescription?: boolean;
}

export function Navbar({ className, showDescription = true }: NavbarProps) {
  return (
    <header
      className={cn(
        "border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10",
        className
      )}
    >
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                The Stash
              </Link>
              <span className="font-normal text-muted-foreground"> /</span>
            </h1>
            {showDescription && (
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                Hand-picked dev & design resources: tools, inspiration, and links.
              </p>
            )}
          </div>
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/collections" className={navigationMenuTriggerStyle()}>
                    Collections
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/studio" className={navigationMenuTriggerStyle()}>
                    Submit
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}
