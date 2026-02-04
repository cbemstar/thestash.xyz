"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export type FooterType = { value: string; label: string };

interface FooterProps {
  /** Tags to show in footer (e.g. top 28). Links to /tags/[tag]. */
  tags?: string[];
  /** Resource types with at least one resource. Links to /type/[value]. */
  types?: FooterType[];
}

export function Footer({ tags = [], types = [] }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/80 mt-auto" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Nocodesupply-style: Industries (categories), Type, Tags + Browse & Participate */}
        <nav
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
          aria-label="Footer navigation"
        >
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Browse
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/recommend" className="hover:text-foreground transition-colors">
                  Tech stack
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-foreground transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/type" className="hover:text-foreground transition-colors">
                  Type
                </Link>
              </li>
              <li>
                <Link href="/tags" className="hover:text-foreground transition-colors">
                  Tags
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Industries
            </p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
              {CATEGORIES.map((c) => (
                <li key={c.value}>
                  <Link
                    href={`/category/${c.value}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {types.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Type
              </p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                {types.map((t) => (
                  <li key={t.value}>
                    <Link
                      href={`/type/${t.value}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tags
            </p>
            <ul className="flex flex-wrap gap-x-2 gap-y-1.5 text-sm text-muted-foreground">
              {tags.length === 0 ? (
                <li>
                  <Link href="/tags" className="hover:text-foreground transition-colors">
                    All tags
                  </Link>
                </li>
              ) : (
                <>
                  {tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/tags" className="hover:text-foreground transition-colors font-medium">
                      All tags →
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Participate
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/studio" className="hover:text-foreground transition-colors">
                  Submit a resource
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="hover:text-foreground transition-colors">
                  RSS
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Legal
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {year} The Stash
        </p>
      </div>
    </footer>
  );
}
