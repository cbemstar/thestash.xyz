"use client";

import { useState, useEffect, useCallback } from "react";

const VOTER_STORAGE_KEY = "thestash_voter_id";
const BASE = "";

function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VOTER_STORAGE_KEY);
    if (!id || id.length < 16) {
      id = crypto.randomUUID();
      localStorage.setItem(VOTER_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export type Vote = "up" | "down";

export interface VoteCounts {
  upvotes: number;
  downvotes: number;
  userVote: Vote | null;
}

export function useVotes(slug?: string | null) {
  const [data, setData] = useState<VoteCounts | null>(null);
  const [loading, setLoading] = useState(false);

  const voterId = typeof window !== "undefined" ? getOrCreateVoterId() : "";

  const fetchVotes = useCallback(
    async (s: string) => {
      if (!s) return;
      try {
        const res = await fetch(`${BASE}/api/resources/${encodeURIComponent(s)}/votes`, {
          headers: voterId ? { "x-stash-voter-id": voterId } : {},
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setData({
            upvotes: json.upvotes ?? 0,
            downvotes: json.downvotes ?? 0,
            userVote: json.userVote ?? null,
          });
        } else {
          setData({ upvotes: 0, downvotes: 0, userVote: null });
        }
      } catch {
        setData({ upvotes: 0, downvotes: 0, userVote: null });
      }
    },
    [voterId]
  );

  useEffect(() => {
    if (slug) void fetchVotes(slug);
  }, [slug, fetchVotes]);

  const voteFor = (s: string): Vote | null => {
    if (slug && s === slug && data) return data.userVote;
    return null;
  };

  const setUpvote = useCallback(
    async (s: string) => {
      if (!s) return;
      const current = slug && s === slug ? data?.userVote ?? null : null;
      const next = current === "up" ? null : "up";

      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/resources/${encodeURIComponent(s)}/votes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-stash-voter-id": voterId,
          },
          body: JSON.stringify({ vote: next }),
          credentials: "include",
        });
        const json = await res.json();
        if (res.ok && (slug === undefined || s === slug)) {
          setData({
            upvotes: json.upvotes ?? 0,
            downvotes: json.downvotes ?? 0,
            userVote: json.userVote ?? null,
          });
        }
        if (slug && s === slug) void fetchVotes(slug);
      } catch {
        // Keep optimistic UI or refetch
        if (slug && s === slug) void fetchVotes(slug);
      } finally {
        setLoading(false);
      }
    },
    [slug, data?.userVote, voterId, fetchVotes]
  );

  const setDownvote = useCallback(
    async (s: string) => {
      if (!s) return;
      const current = slug && s === slug ? data?.userVote ?? null : null;
      const next = current === "down" ? null : "down";

      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/resources/${encodeURIComponent(s)}/votes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-stash-voter-id": voterId,
          },
          body: JSON.stringify({ vote: next }),
          credentials: "include",
        });
        const json = await res.json();
        if (res.ok && (slug === undefined || s === slug)) {
          setData({
            upvotes: json.upvotes ?? 0,
            downvotes: json.downvotes ?? 0,
            userVote: json.userVote ?? null,
          });
        }
        if (slug && s === slug) void fetchVotes(slug);
      } catch {
        if (slug && s === slug) void fetchVotes(slug);
      } finally {
        setLoading(false);
      }
    },
    [slug, data?.userVote, voterId, fetchVotes]
  );

  return {
    voteFor,
    setUpvote,
    setDownvote,
    upvotes: data?.upvotes ?? 0,
    downvotes: data?.downvotes ?? 0,
    loading,
    refetch: slug ? () => fetchVotes(slug) : () => {},
  };
}
