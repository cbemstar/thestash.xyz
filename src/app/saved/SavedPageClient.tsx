"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ResourceGrid } from "@/components/ResourceGrid";
import { useSavedResources } from "@/hooks/useSavedResources";
import { getResourceSlug } from "@/lib/slug";
import type { Resource } from "@/types/resource";

interface SavedPageClientProps {
  resources: Resource[];
}

export function SavedPageClient({ resources }: SavedPageClientProps) {
  const router = useRouter();
  const { savedSlugs, isSaved, toggleSaved } = useSavedResources();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const slugToResource = new Map(resources.map((r) => [getResourceSlug(r), r]));
  const savedResources = mounted
    ? savedSlugs
        .map((slug) => slugToResource.get(slug))
        .filter((r): r is Resource => Boolean(r))
    : [];

  const handleTagClick = (tag: string) => {
    router.push(`/?search=${encodeURIComponent(tag)}`);
  };

  const handleCategoryClick = (cat: string) => {
    router.push(`/category/${cat}`);
  };

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">
            The Stash
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Saved</span>
        </nav>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Saved for later
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Resources you&apos;ve bookmarked. Saved locally in your browser — no account needed.
        </p>

        {!mounted ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : savedResources.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <p className="text-muted-foreground">
              No saved resources yet. Browse the{" "}
              <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary">
                homepage
              </Link>{" "}
              and click the bookmark icon on any resource to save it here.
            </p>
          </div>
        ) : (
          <section className="mt-8" aria-labelledby="saved-resources">
            <h2 id="saved-resources" className="sr-only">
              Saved resources
            </h2>
            <ResourceGrid
              resources={savedResources}
              initialCount={savedResources.length}
              isSaved={isSaved}
              onSaveToggle={toggleSaved}
              onTagClick={handleTagClick}
              onCategoryClick={handleCategoryClick}
            />
          </section>
        )}
      </main>
    </div>
  );
}
