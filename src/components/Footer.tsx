"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { ThemeSwitcherNav } from "@/components/ThemeSwitcherNav";
import TextPressure from "@/components/TextPressure";

export type FooterType = { value: string; label: string };

interface FooterProps {
  /** Tags to show in footer (e.g. top 28). Links to /tags/[tag]. */
  tags?: string[];
  /** Resource types with at least one resource. Links to /type/[value]. */
  types?: FooterType[];
  /** Total resource count for stats line. */
  resourceCount?: number;
  /** Total collection count for stats line. */
  collectionCount?: number;
}

export function Footer({ tags = [], types = [], resourceCount = 0, collectionCount = 0 }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/80 mt-auto" role="contentinfo">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        {/* Nocodesupply-style: Industries (categories), Type, Tags + Browse & Participate */}
        <nav
          className="grid grid-cols-1 items-start gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
          aria-label="Footer navigation"
        >
          <div className="text-left w-fit">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Browse
            </p>
            <ul className="grid justify-items-start gap-y-1.5 text-left text-sm text-muted-foreground">
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
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-foreground transition-colors">
                  Tools
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-foreground transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-foreground transition-colors">
                  Reports
                </Link>
              </li>
              <li>
                <Link href="/use-cases" className="hover:text-foreground transition-colors">
                  Use cases
                </Link>
              </li>
              <li>
                <Link href="/migrate" className="hover:text-foreground transition-colors">
                  Migrate
                </Link>
              </li>
              <li>
                <Link href="/alternatives" className="hover:text-foreground transition-colors">
                  Alternatives
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-foreground transition-colors">
                  Compare
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
          <div className="text-left w-fit">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Industries
            </p>
            <ul className="grid justify-items-start gap-y-1.5 text-left text-sm text-muted-foreground">
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
            <div className="text-left w-fit">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Type
              </p>
              <ul className="grid justify-items-start gap-y-1.5 text-left text-sm text-muted-foreground">
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
          <div className="text-left w-fit">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tags
            </p>
            <ul className="grid justify-items-start gap-y-1.5 text-left text-sm text-muted-foreground">
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
          <div className="text-left w-fit">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Participate
            </p>
            <ul className="grid justify-items-start gap-y-1.5 text-left text-sm text-muted-foreground">
              <li>
                <Link href="/submit" className="hover:text-foreground transition-colors">
                  Submit a resource
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="hover:text-foreground transition-colors">
                  RSS
                </Link>
              </li>
              <li>
                <Link href="/sitemap-index" className="hover:text-foreground transition-colors">
                  Sitemap
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="hover:text-foreground transition-colors">
                  Sitemap XML
                </Link>
              </li>
              <li>
                <Link href="/llms.txt" className="hover:text-foreground transition-colors">
                  llms.txt
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-left w-fit">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Legal
            </p>
            <ul className="grid justify-items-start gap-y-1.5 text-left text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy/settings" className="hover:text-foreground transition-colors">
                  Privacy and cookie settings
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-left w-fit">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Theme
            </p>
            <div className="w-fit">
              <ThemeSwitcherNav />
            </div>
          </div>
        </nav>
        {(resourceCount > 0 || collectionCount > 0) && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {resourceCount.toLocaleString()} resources across {collectionCount.toLocaleString()} collections and counting. Updated weekly.
          </p>
        )}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {year} The Stash. Some links may be affiliate links.
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Made with love ❤️ in Christchurch, New Zealand
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Developed by Karan Kumar and AI.{" "}
          <Link href="/resume" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
            Check out my resume
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Contact:{" "}
          <a
            href="mailto:karankumar230@gmail.com"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            karankumar230@gmail.com
          </a>
          {" · "}
          <a
            href="https://www.linkedin.com/in/cbemstar/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            LinkedIn
          </a>
          {" · "}
          <a
            href="https://x.com/KaranKumarEm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            X
          </a>
        </p>

        {/* Large stylistic app name at the very bottom */}
        <div className="mt-12 flex items-center justify-center overflow-hidden pt-8 pb-2 text-left sm:mt-16 sm:pt-10 sm:pb-3">
          <Link
            href="/"
            className="inline-flex w-full max-w-full items-center justify-center rounded px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="The Stash – Home"
          >
            <div className="flex h-[6.25rem] w-full max-w-[min(100%,22rem)] items-center justify-center overflow-hidden px-1 pb-2 text-foreground sm:h-[7.25rem] sm:px-2 sm:pb-3 lg:h-[8rem]">
              <TextPressure
                text="The Stash"
                className="font-display tracking-tight"
                fontFamily="Compressa VF"
                width={false}
                flex={false}
                stroke={false}
                italic={false}
                alpha={false}
                scale={false}
                textColor="var(--foreground)"
                minFontSize={52}
              />
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
}
