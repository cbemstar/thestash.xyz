"use client";

import { useRef, useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { ResourceCategory } from "@/types/resource";

interface CategoryFilterProps {
  value: ResourceCategory | "all";
  onChange: (value: ResourceCategory | "all") => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure active pill is in view on change (e.g. keyboard)
  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector("[data-active=true]");
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [value]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
      role="tablist"
      aria-label="Filter by category"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "all"}
        data-active={value === "all"}
        onClick={() => onChange("all")}
        className="shrink-0 rounded-full border border-[var(--border)] bg-white/5 px-4 py-2 text-sm font-medium transition-colors duration-200 hover:border-white/15 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none"
        style={{
          backgroundColor: value === "all" ? "rgb(var(--accent) / 0.15)" : undefined,
          borderColor: value === "all" ? "rgb(var(--accent))" : undefined,
          color: value === "all" ? "rgb(var(--accent))" : undefined,
        }}
      >
        All
      </button>
      {CATEGORIES.map(({ value: catValue, label }) => (
        <button
          key={catValue}
          type="button"
          role="tab"
          aria-selected={value === catValue}
          data-active={value === catValue}
          onClick={() => onChange(catValue)}
          className="shrink-0 rounded-full border border-[var(--border)] bg-white/5 px-4 py-2 text-sm font-medium transition-colors duration-200 hover:border-white/15 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none"
          style={{
            backgroundColor: value === catValue ? "rgb(var(--accent) / 0.15)" : undefined,
            borderColor: value === catValue ? "rgb(var(--accent))" : undefined,
            color: value === catValue ? "rgb(var(--accent))" : undefined,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
