"use client";

import React from "react";

type Props = {
  fallback: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Error boundary for provider components. When a provider (e.g. ThemeProvider, LenisProvider)
 * or any of its descendants throws (e.g. in restricted iframe context), we render the fallback
 * so the rest of the app can still display (e.g. without theme or smooth scroll).
 */
export class ProviderErrorBoundary extends React.Component<
  Props,
  { hasError: boolean }
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.warn("[ProviderErrorBoundary] Caught in restricted context (e.g. iframe):", error?.message ?? error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
