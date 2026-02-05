"use client";

import { SaveButton } from "./SaveButton";
import { useSavedResources } from "@/hooks/useSavedResources";

interface ResourcePageSaveButtonProps {
  slug: string;
  /** When false, only the bookmark icon is shown (e.g. in compact action bars). */
  showLabel?: boolean;
}

export function ResourcePageSaveButton({ slug, showLabel = true }: ResourcePageSaveButtonProps) {
  const { isSaved, toggleSaved } = useSavedResources();

  return (
    <SaveButton
      slug={slug}
      isSaved={isSaved(slug)}
      onToggle={toggleSaved}
      size="default"
      showLabel={showLabel}
      className={
        showLabel
          ? "inline-flex items-center rounded-xl border border-border bg-muted/50 px-5 py-3 hover:bg-muted"
          : "inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-xl border border-border bg-muted/50 px-0 hover:bg-muted"
      }
    />
  );
}
