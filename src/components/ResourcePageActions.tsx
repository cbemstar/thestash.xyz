"use client";

import { ResourcePageSaveMicroExpander } from "./ResourcePageSaveMicroExpander";
import { ShareMenu } from "./ShareMenu";
import { VoteButtons } from "./VoteButtons";
import { CopyLinkButton } from "./CopyLinkButton";
import { CommentsLink } from "./CommentsLink";
import { useVotes } from "@/hooks/useVotes";

interface ResourcePageActionsProps {
  slug: string;
  url: string;
  title: string;
  description?: string;
  /** Optional content to render before Save/Share in the first row (e.g. Visit site link) */
  firstRowContent?: React.ReactNode;
}

export function ResourcePageActions({
  slug,
  url,
  title,
  description,
  firstRowContent,
}: ResourcePageActionsProps) {
  const { voteFor, setUpvote, setDownvote, upvotes, downvotes } = useVotes(slug);
  const vote = voteFor(slug);

  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Resource actions">
      {/* Row 1: Visit site (if provided), Save, Share - micro-expanders need space to expand on hover */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {firstRowContent}
        <ResourcePageSaveMicroExpander slug={slug} />
        <ShareMenu
          url={url}
          title={title}
          description={description}
          showLabel={false}
          useMicroExpander
        />
      </div>
      {/* Row 2: Vote, Comments, Copy link */}
      <div className="flex flex-wrap items-center gap-2">
        <VoteButtons
          slug={slug}
          vote={vote}
          upvotes={upvotes}
          downvotes={downvotes}
          onUpvote={setUpvote}
          onDownvote={setDownvote}
        />
        <CommentsLink slug={slug} />
        <CopyLinkButton url={url} />
      </div>
    </div>
  );
}
