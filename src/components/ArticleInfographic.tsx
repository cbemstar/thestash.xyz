"use client";

export interface InfographicStat {
  label: string;
  value: string;
  subtext?: string;
}

export interface ArticleInfographicValue {
  _type?: "infographic";
  _key?: string;
  variant?: "callout" | "grid" | "comparison" | "histogram";
  title?: string;
  stats?: InfographicStat[];
  sourceLabel?: string;
  sourceUrl?: string;
}

interface ArticleInfographicProps {
  value?: ArticleInfographicValue;
}

function parseStatPercent(value: string): number | null {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const next = Number.parseFloat(match[1]);
  if (!Number.isFinite(next) || next <= 0) return null;
  return Math.min(next, 100);
}

export function ArticleInfographic({ value }: ArticleInfographicProps) {
  const {
    variant = "grid",
    title = "By the numbers",
    stats = [],
    sourceLabel,
    sourceUrl,
  } = value ?? {};

  if (!value || !stats?.length) return null;

  return (
    <aside
      className="my-8 rounded-xl border border-border bg-muted/40 p-6 not-prose"
      aria-label="Key statistics"
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>

      {variant === "callout" && stats[0] && (
        <div className="flex flex-col items-start gap-2">
          <span className="text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
            {stats[0].value}
          </span>
          <span className="text-sm text-muted-foreground">{stats[0].label}</span>
          {stats[0].subtext && (
            <span className="text-xs text-muted-foreground">{stats[0].subtext}</span>
          )}
        </div>
      )}

      {variant === "grid" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-lg bg-background/60 p-3">
              <span className="block text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {stat.value}
              </span>
              <span className="block text-xs text-muted-foreground">{stat.label}</span>
              {stat.subtext && (
                <span className="mt-0.5 block text-xs text-muted-foreground/80">
                  {stat.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {variant === "comparison" && (
        <div className="space-y-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {variant === "histogram" && (
        <div className="space-y-3">
          {stats.map((stat, i) => {
            const percent = parseStatPercent(stat.value);
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground/90">{stat.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-background/80">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-[width] duration-500"
                    style={{ width: `${percent ?? 100}%` }}
                    aria-hidden="true"
                  />
                </div>
                {stat.subtext ? (
                  <span className="block text-xs text-muted-foreground/85">
                    {stat.subtext}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {sourceLabel && (
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          Source:{" "}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {sourceLabel}
            </a>
          ) : (
            sourceLabel
          )}
        </p>
      )}
    </aside>
  );
}
