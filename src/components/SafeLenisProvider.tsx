"use client";

import { LenisProvider } from "@/components/LenisProvider";
import { ProviderErrorBoundary } from "@/components/ProviderErrorBoundary";

interface SafeLenisProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps LenisProvider in an error boundary. In restricted contexts (e.g. AdSense preview iframe),
 * Lenis may throw when initializing scroll. When that happens, we render children without smooth
 * scroll so the page still displays.
 */
export function SafeLenisProvider({ children }: SafeLenisProviderProps) {
  return (
    <ProviderErrorBoundary fallback={children}>
      <LenisProvider>{children}</LenisProvider>
    </ProviderErrorBoundary>
  );
}
