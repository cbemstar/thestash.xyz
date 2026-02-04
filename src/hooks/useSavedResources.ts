"use client";

import { useState, useEffect } from "react";
import { getSavedSlugs, toggleSaved as toggleSavedStorage } from "@/lib/saved-resources";

export function useSavedResources() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSavedSlugs(getSavedSlugs());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = () => setSavedSlugs(getSavedSlugs());
    window.addEventListener("thestash-saved-change", handler);
    return () => window.removeEventListener("thestash-saved-change", handler);
  }, [mounted]);

  const toggleSaved = (slug: string) => {
    const next = toggleSavedStorage(slug);
    setSavedSlugs(getSavedSlugs());
    return next;
  };

  const isSaved = (slug: string) => savedSlugs.includes(slug);

  return { savedSlugs, isSaved, toggleSaved };
}
