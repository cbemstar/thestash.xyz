"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OnThisPageItem = {
  id: string;
  label: string;
  level?: 2 | 3 | 4;
};

interface OnThisPageNavProps {
  items: OnThisPageItem[];
  className?: string;
}

export function OnThisPageNav({ items, className = "" }: OnThisPageNavProps) {
  if (items.length === 0) return null;

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const [activeId, setActiveId] = useState<string | null>(itemIds[0] ?? null);

  useEffect(() => {
    setActiveId(itemIds[0] ?? null);
  }, [itemIds]);

  useEffect(() => {
    if (typeof window === "undefined" || itemIds.length === 0) return undefined;
    const hashId = window.location.hash.replace(/^#/, "");
    if (hashId && itemIds.includes(hashId)) {
      setActiveId(hashId);
    }
    const onHashChange = () => {
      const nextId = window.location.hash.replace(/^#/, "");
      if (nextId && itemIds.includes(nextId)) {
        setActiveId(nextId);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [itemIds]);

  useEffect(() => {
    if (typeof window === "undefined" || itemIds.length === 0) return undefined;

    const headingEls = itemIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (headingEls.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
          return;
        }

        const passed = headingEls.filter((el) => el.getBoundingClientRect().top <= 140);
        if (passed.length > 0) {
          setActiveId(passed[passed.length - 1].id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: [0, 1],
      }
    );

    for (const el of headingEls) observer.observe(el);
    return () => observer.disconnect();
  }, [itemIds]);

  return (
    <nav
      aria-label="On this page"
      className={`hierarchy-nav ${className}`.trim()}
    >
      <p className="hierarchy-nav-title">On this page</p>
      <ul className="mt-3 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`#${item.id}`}
              className={`block rounded-md border px-2.5 py-1.5 text-sm leading-snug transition ${
                activeId === item.id
                  ? "border-primary/35 bg-primary/[0.12] text-primary"
                  : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/55 hover:text-foreground"
              } ${item.level && item.level > 2 ? "ml-3 text-[0.82rem]" : ""}`.trim()}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
