"use client";

import { CaretUpIcon, CaretDownIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  slug: string;
  vote: "up" | "down" | null;
  upvotes?: number;
  downvotes?: number;
  onUpvote: (slug: string) => void;
  onDownvote: (slug: string) => void;
  className?: string;
}

export function VoteButtons({
  slug,
  vote,
  upvotes = 0,
  downvotes = 0,
  onUpvote,
  onDownvote,
  className,
}: VoteButtonsProps) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="group"
      aria-label="Vote"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUpvote(slug);
        }}
        className={cn(
          "flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          vote === "up" && "text-primary"
        )}
        aria-label={vote === "up" ? "Remove upvote" : "Upvote"}
        aria-pressed={vote === "up"}
      >
        <CaretUpIcon className="size-5" aria-hidden />
      </button>
      <span className="min-w-[1.25rem] text-center text-xs tabular-nums text-muted-foreground" aria-hidden>
        {upvotes}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDownvote(slug);
        }}
        className={cn(
          "flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          vote === "down" && "text-primary"
        )}
        aria-label={vote === "down" ? "Remove downvote" : "Downvote"}
        aria-pressed={vote === "down"}
      >
        <CaretDownIcon className="size-5" aria-hidden />
      </button>
      <span className="min-w-[1.25rem] text-center text-xs tabular-nums text-muted-foreground" aria-hidden>
        {downvotes}
      </span>
    </div>
  );
}
