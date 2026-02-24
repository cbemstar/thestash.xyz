"use client";

import { ThemeProvider } from "@/components/ThemeProvider";
import { ProviderErrorBoundary } from "@/components/ProviderErrorBoundary";

interface SafeThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps ThemeProvider in an error boundary. In restricted contexts (e.g. AdSense preview iframe),
 * next-themes or theme-dependent code may throw (e.g. localStorage/matchMedia). When that happens,
 * we render the same tree without theme so the page still loads.
 */
export function SafeThemeProvider({ children }: SafeThemeProviderProps) {
  return (
    <ProviderErrorBoundary fallback={children}>
      <ThemeProvider>{children}</ThemeProvider>
    </ProviderErrorBoundary>
  );
}
