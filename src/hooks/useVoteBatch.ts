"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const VOTER_STORAGE_KEY = "thestash_voter_id";
const BASE = "";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VOTER_STORAGE_KEY);
    if (!id || id.length < 16) {
      id = generateUUID();
      localStorage.setItem(VOTER_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return generateUUID();
  }
}

export type Vote = "up" | "down";

export interface VoteData {
  upvotes: number;
  downvotes: number;
  userVote: Vote | null;
}

export function useVoteBatch(slugsInput?: string[]) {
  const [data, setData] = useState<Record<string, VoteData>>({});
  const [loading, setLoading] = useState(false);
  const slugs = useMemo(
    () => (Array.isArray(slugsInput) ? slugsInput.filter((s): s is string => typeof s === "string" && s.length > 0) : []),
    [slugsInput]
  );
  const slugsKey = useMemo(() => slugs.join(","), [slugs]);

  const voterId = typeof window !== "undefined" ? getOrCreateVoterId() : "";

  const fetchBatch = useCallback(
    async (s: string[]) => {
      if (s.length === 0) return;
      try {
        const res = await fetch(
          `${BASE}/api/resources/votes?slugs=${s.map(encodeURIComponent).join(",")}`,
          { headers: voterId ? { "x-stash-voter-id": voterId } : {} }
        );
        if (res.ok) {
          const json = (await res.json()) as Record<string, { upvotes: number; downvotes: number; userVote: Vote | null }>;
          setData(json);
        }
      } catch {
        setData({});
      }
    },
    [voterId]
  );

  useEffect(() => {
    if (slugs.length > 0) void fetchBatch(slugs);
  }, [slugs, slugsKey, fetchBatch]);

  const voteFor = (slug: string): Vote | null => data[slug]?.userVote ?? null;
  const upvotes = (slug: string): number => data[slug]?.upvotes ?? 0;
  const downvotes = (slug: string): number => data[slug]?.downvotes ?? 0;

  const setUpvote = useCallback(
    async (slug: string) => {
      const current = data[slug]?.userVote ?? null;
      const next = current === "up" ? null : "up";

      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/resources/${encodeURIComponent(slug)}/votes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-stash-voter-id": voterId,
          },
          body: JSON.stringify({ vote: next }),
          credentials: "include",
        });
        const json = await res.json();
        if (res.ok) {
          setData((prev) => ({
            ...prev,
            [slug]: {
              upvotes: json.upvotes ?? prev[slug]?.upvotes ?? 0,
              downvotes: json.downvotes ?? prev[slug]?.downvotes ?? 0,
              userVote: json.userVote ?? null,
            },
          }));
        } else {
          void fetchBatch(slugs);
        }
      } catch {
        void fetchBatch(slugs);
      } finally {
        setLoading(false);
      }
    },
    [data, voterId, slugs, fetchBatch]
  );

  const setDownvote = useCallback(
    async (slug: string) => {
      const current = data[slug]?.userVote ?? null;
      const next = current === "down" ? null : "down";

      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/resources/${encodeURIComponent(slug)}/votes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-stash-voter-id": voterId,
          },
          body: JSON.stringify({ vote: next }),
          credentials: "include",
        });
        const json = await res.json();
        if (res.ok) {
          setData((prev) => ({
            ...prev,
            [slug]: {
              upvotes: json.upvotes ?? prev[slug]?.upvotes ?? 0,
              downvotes: json.downvotes ?? prev[slug]?.downvotes ?? 0,
              userVote: json.userVote ?? null,
            },
          }));
        } else {
          void fetchBatch(slugs);
        }
      } catch {
        void fetchBatch(slugs);
      } finally {
        setLoading(false);
      }
    },
    [data, voterId, slugs, fetchBatch]
  );

  return {
    voteFor,
    setUpvote,
    setDownvote,
    upvotes,
    downvotes,
    loading,
  };
}
