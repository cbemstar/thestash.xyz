"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ResourceGrid } from "@/components/ResourceGrid";
import { useSavedResources } from "@/hooks/useSavedResources";
import { useVoteBatch } from "@/hooks/useVoteBatch";
import { getResourceSlug } from "@/lib/slug";
import type { Resource } from "@/types/resource";

interface LatestPageClientProps {
  resources: Resource[];
}

export function LatestPageClient({ resources }: LatestPageClientProps) {
  const { isSaved, toggleSaved } = useSavedResources();
  const voteSlugs = useMemo(
    () => resources.map((resource) => getResourceSlug(resource)).slice(0, 100),
    [resources]
  );
  const { voteFor, setUpvote, setDownvote, upvotes, downvotes } = useVoteBatch(voteSlugs);

  return (
    <div className="mt-8">
      {resources.length === 0 ? (
        <p className="text-muted-foreground">
          No new resources in the past 7 days. Check back next week or{" "}
          <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary">
            browse all resources
          </Link>
          .
        </p>
      ) : (
        <ResourceGrid
          resources={resources}
          pageSize={24}
          showPageSizeSelector={false}
          isSaved={isSaved}
          onSaveToggle={toggleSaved}
          voteFor={voteFor}
          onUpvote={setUpvote}
          onDownvote={setDownvote}
          upvotes={upvotes}
          downvotes={downvotes}
        />
      )}
    </div>
  );
}
