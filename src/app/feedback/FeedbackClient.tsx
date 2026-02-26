"use client";

import { useState } from "react";
import Link from "next/link";
import type { FeedbackItem } from "@/lib/feedback-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";

type Props = {
  initialItems: FeedbackItem[];
};

export function FeedbackClient({ initialItems }: Props) {
  const [items, setItems] = useState<FeedbackItem[]>(initialItems);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle || !trimmedDescription) {
      setError("Please add a title and a short description.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, description: trimmedDescription }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      const created = (await res.json()) as FeedbackItem;
      setItems((prev) =>
        [created, ...prev].sort((a, b) => {
          if (b.votes !== a.votes) return b.votes - a.votes;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
      );
      setTitle("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(id: string, delta: 1 | -1) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextVotes = Math.max(0, item.votes + delta);
        return { ...item, votes: nextVotes };
      }),
    );

    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delta }),
    });

    if (!res.ok) {
      const refreshed = await fetch("/api/feedback").then((r) => r.json());
      setItems(refreshed.items as FeedbackItem[]);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section
        className="rounded-xl border border-border bg-card p-6 shadow-sm"
        aria-labelledby="feedback-form-heading"
      >
        <h2 id="feedback-form-heading" className="text-lg font-semibold text-foreground">
          Suggest an idea
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Short title and a sentence or two on what you’d like to see.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="feedback-title" className="sr-only">
              Title
            </label>
            <Input
              id="feedback-title"
              type="text"
              placeholder="e.g. Webflow-only filters, dark theme tweaks…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="feedback-description" className="sr-only">
              Description
            </label>
            <textarea
              id="feedback-description"
              placeholder="Describe what you’d like to see or improve."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
              className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:opacity-50"
              )}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit feedback"}
          </Button>
        </form>
      </section>

      <section aria-labelledby="feedback-list-heading">
        <h2
          id="feedback-list-heading"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Ideas so far
        </h2>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No ideas yet. Be the first to suggest something.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
              >
                <button
                  type="button"
                  onClick={() => handleVote(item.id, 1)}
                  className="flex shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/50 px-3 py-2 text-center transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Upvote “${item.title}”. Current votes: ${item.votes}`}
                >
                  <ChevronUp className="size-4" aria-hidden />
                  <span className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                    {item.votes}
                  </span>
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-medium leading-snug text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/roadmap" className="underline underline-offset-2 hover:text-foreground">
          View roadmap
        </Link>
      </p>
    </div>
  );
}
