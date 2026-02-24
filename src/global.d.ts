/**
 * Global type declarations for browser / third-party APIs.
 */
declare global {
  interface ReCaptcha {
    ready(callback: () => void): void;
    execute(siteKey: string, options: { action: string }): Promise<string>;
  }

  interface Window {
    googlefc?: {
      showRevocationMessage?: () => void;
    };
    grecaptcha?: ReCaptcha;
  }
}

export {};
