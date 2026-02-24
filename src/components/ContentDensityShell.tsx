"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

type DensityMode = "comfortable" | "compact";

interface ContentDensityShellProps {
  pageKey: string;
  children: ReactNode;
  className?: string;
}

const GLOBAL_STORAGE_KEY = "thestash:content-density";

function isDensityMode(value: string | null): value is DensityMode {
  return value === "comfortable" || value === "compact";
}

export function ContentDensityShell({
  pageKey,
  children,
  className = "",
}: ContentDensityShellProps) {
  const [mode, setMode] = useState<DensityMode>("comfortable");
  const [hydrated, setHydrated] = useState(false);
  const pageStorageKey = useMemo(
    () => `${GLOBAL_STORAGE_KEY}:${pageKey}`,
    [pageKey],
  );

  useEffect(() => {
    const fromPage = safeGetItem(pageStorageKey);
    const fromGlobal = safeGetItem(GLOBAL_STORAGE_KEY);
    if (isDensityMode(fromPage)) {
      setMode(fromPage);
    } else if (isDensityMode(fromGlobal)) {
      setMode(fromGlobal);
    }
    setHydrated(true);
  }, [pageStorageKey]);

  useEffect(() => {
    if (!hydrated) return;
    safeSetItem(pageStorageKey, mode);
    safeSetItem(GLOBAL_STORAGE_KEY, mode);
  }, [hydrated, mode, pageStorageKey]);

  return (
    <section
      data-density={mode}
      className={`density-host mt-6 ${className}`.trim()}
    >
      <div className="density-control-bar">
        <div>
          <p className="density-control-kicker">Reading density</p>
          <p className="density-control-copy">
            Switch between comfortable and compact spacing for long pages.
          </p>
        </div>
        <div
          className="density-switch"
          role="group"
          aria-label="Content density"
        >
          <button
            type="button"
            aria-pressed={mode === "comfortable"}
            data-active={mode === "comfortable"}
            className="density-switch-button"
            onClick={() => setMode("comfortable")}
          >
            Comfortable
          </button>
          <button
            type="button"
            aria-pressed={mode === "compact"}
            data-active={mode === "compact"}
            className="density-switch-button"
            onClick={() => setMode("compact")}
          >
            Compact
          </button>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
