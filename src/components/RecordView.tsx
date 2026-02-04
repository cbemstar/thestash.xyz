"use client";

import { useEffect } from "react";

const STORAGE_KEY = "thestash-recently-viewed";
const MAX_ITEMS = 6;

export function RecordView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev: string[] = raw ? JSON.parse(raw) : [];
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore localStorage errors
    }
  }, [slug]);
  return null;
}
