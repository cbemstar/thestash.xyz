/**
 * Global type declarations for browser / third-party APIs.
 */
declare global {
  interface Window {
    googlefc?: {
      showRevocationMessage?: () => void;
    };
  }
}

export {};
