"use client";

import { BookmarkIcon, BookmarkFilledIcon } from "@radix-ui/react-icons";
import { MicroExpander } from "@/components/satisui/micro-expander";
import { useSavedResources } from "@/hooks/useSavedResources";
import { cn } from "@/lib/utils";

interface ResourcePageSaveMicroExpanderProps {
  slug: string;
  className?: string;
}

export function ResourcePageSaveMicroExpander({ slug, className }: ResourcePageSaveMicroExpanderProps) {
  const { isSaved, toggleSaved } = useSavedResources();
  const saved = isSaved(slug);

  return (
    <MicroExpander
      text={saved ? "Saved" : "Save"}
      icon={saved ? <BookmarkFilledIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
      variant="ghost"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(slug);
      }}
      className={cn(saved && "text-primary", className)}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      aria-pressed={saved}
    />
  );
}
