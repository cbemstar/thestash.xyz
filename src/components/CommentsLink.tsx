"use client";

import { useEffect, useState } from "react";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

interface CommentsLinkProps {
  slug: string;
  className?: string;
}

export function CommentsLink({ slug, className }: CommentsLinkProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/comments/count?path=${encodeURIComponent(`/${slug}`)}`
        );
        if (cancelled) return;
        const json = await res.json();
        setCount(typeof json.count === "number" ? json.count : 0);
      } catch {
        if (!cancelled) setCount(0);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const label =
    count === null
      ? "Comments"
      : count === 0
        ? "Write the first comment"
        : `${count} comment${count !== 1 ? "s" : ""}`;

  return (
    <a
      href={`/${slug}#comments`}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      }
      aria-label={label}
    >
      <ChatBubbleIcon className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </a>
  );
}
