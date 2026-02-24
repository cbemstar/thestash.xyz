"use client";

/**
 * Catches errors in the root layout (e.g. ThemeProvider or other layout client components
 * throwing when localStorage is blocked in an iframe). Renders a minimal document so
 * tools like Google AdSense preview see a valid page instead of "Application error".
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 p-6 font-sans antialiased">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-6">
            This can happen when the site is loaded in a restricted context (e.g. preview iframe).
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 text-sm font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
