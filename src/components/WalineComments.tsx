"use client";

import { useEffect, useRef } from "react";

const WALINE_SERVER_URL = process.env.NEXT_PUBLIC_WALINE_SERVER_URL;

export interface WalineCommentsProps {
  /** Page path used as comment thread ID (e.g. `/blog/my-post`) */
  path: string;
  /** Optional placeholder when Waline is not configured */
  placeholder?: React.ReactNode;
}

/**
 * Embeds Waline comments (guest commenting, no signup).
 * Requires a deployed Waline server and NEXT_PUBLIC_WALINE_SERVER_URL.
 * Spam protection: configure Akismet (or similar) on the Waline server.
 */
export function WalineComments({ path, placeholder }: WalineCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ destroy: () => void; update: (opts: { path?: string }) => void } | null>(null);

  useEffect(() => {
    if (!WALINE_SERVER_URL || !containerRef.current) return;

    let mounted = true;

    void (async () => {
      const [{ init }] = await Promise.all([
        import("@waline/client/full"),
        // @ts-expect-error - package exports CSS only, no type declarations
        import("@waline/client/style"),
      ]);
      if (!mounted || !containerRef.current) return;

      const instance = init({
        el: containerRef.current,
        serverURL: WALINE_SERVER_URL,
        path,
        comment: true,
        pageview: false,
      });
      if (instance) instanceRef.current = instance;
    })();

    return () => {
      mounted = false;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [WALINE_SERVER_URL]);

  useEffect(() => {
    if (!instanceRef.current || !path) return;
    instanceRef.current.update({ path });
  }, [path]);

  if (!WALINE_SERVER_URL) {
    return placeholder ? <div className="text-sm text-muted-foreground">{placeholder}</div> : null;
  }

  return (
    <div ref={containerRef} className="mt-3 min-h-[120px]" aria-label="Comments" />
  );
}
