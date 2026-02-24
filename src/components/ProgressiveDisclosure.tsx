import type { ReactNode } from "react";

interface ProgressiveDisclosureProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function ProgressiveDisclosure({
  id,
  title,
  description,
  children,
  className = "",
  defaultOpen = false,
}: ProgressiveDisclosureProps) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className={`section-disclosure section-panel group ${className}`.trim()}
    >
      <summary className="section-disclosure-summary">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-copy">{description}</p>
        </div>
        <span className="mt-1 inline-flex rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground group-open:hidden">
          Expand
        </span>
        <span className="mt-1 hidden rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground group-open:inline-flex">
          Collapse
        </span>
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}
