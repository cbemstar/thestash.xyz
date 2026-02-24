"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root error boundary. Catches client-side exceptions (e.g. in AdSense preview iframe
 * where localStorage may throw "Access is denied" in cross-origin context) and renders
 * a minimal fallback so the page does not show a blank "Application error" to crawlers
 * or preview tools.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Root error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 p-6 font-sans">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-600 mb-6">
          This can happen when the site is loaded in a restricted context (e.g. preview iframe).
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-white"
          >
            Go to The Stash
          </Link>
        </div>
      </div>
    </div>
  );
}
