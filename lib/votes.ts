const STORAGE_KEY = "thestash-votes";

export type Vote = "up" | "down";

export function getVotes(): Record<string, Vote> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getVote(slug: string): Vote | null {
  return getVotes()[slug] ?? null;
}

export function setVote(slug: string, vote: Vote | null): void {
  const votes = getVotes();
  if (vote === null) {
    delete votes[slug];
  } else {
    votes[slug] = vote;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  window.dispatchEvent(new Event("thestash-votes-change"));
}

export function toggleUpvote(slug: string): Vote | null {
  const current = getVote(slug);
  if (current === "up") {
    setVote(slug, null);
    return null;
  }
  setVote(slug, "up");
  return "up";
}

export function toggleDownvote(slug: string): Vote | null {
  const current = getVote(slug);
  if (current === "down") {
    setVote(slug, null);
    return null;
  }
  setVote(slug, "down");
  return "down";
}
