"use client";

import { BookmarkIcon, BookmarkFilledIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface SaveButtonProps {
  slug: string;
  isSaved: boolean;
  onToggle: (slug: string) => void;
  className?: string;
  size?: "sm" | "default";
  showLabel?: boolean;
}

export function SaveButton({ slug, isSaved, onToggle, className, size = "sm", showLabel }: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(slug);
      }}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        isSaved && "text-primary",
        size === "sm" ? "p-1.5" : "p-2",
        className
      )}
      aria-label={isSaved ? "Remove from saved" : "Save for later"}
      aria-pressed={isSaved}
    >
      {isSaved ? (
        <BookmarkFilledIcon className="size-4 shrink-0" aria-hidden />
      ) : (
        <BookmarkIcon className="size-4 shrink-0" aria-hidden />
      )}
      {showLabel && (
        <span className="ml-1.5">{isSaved ? "Saved" : "Save for later"}</span>
      )}
    </button>
  );
}
