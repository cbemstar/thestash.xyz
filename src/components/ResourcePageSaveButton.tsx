"use client";

import { SaveButton } from "./SaveButton";
import { useSavedResources } from "@/hooks/useSavedResources";

interface ResourcePageSaveButtonProps {
  slug: string;
}

export function ResourcePageSaveButton({ slug }: ResourcePageSaveButtonProps) {
  const { isSaved, toggleSaved } = useSavedResources();

  return (
    <SaveButton
      slug={slug}
      isSaved={isSaved(slug)}
      onToggle={toggleSaved}
      size="default"
      showLabel
      className="inline-flex items-center rounded-xl border border-border bg-muted/50 px-5 py-3 hover:bg-muted"
    />
  );
}
