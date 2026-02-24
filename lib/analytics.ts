export type AnalyticsEventName =
  | "organic_land"
  | "comparison_click"
  | "newsletter_signup"
  | "outbound_tool_click"
  | "popup_view"
  | "popup_close"
  | "popup_submit_attempt";

type GtagFn = (
  command: "event",
  eventName: AnalyticsEventName,
  params?: Record<string, unknown>
) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const maybe = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof maybe === "function" ? maybe : null;
}

export function trackEvent(
  eventName: AnalyticsEventName,
  params: Record<string, unknown> = {}
): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", eventName, params);
}

const ORGANIC_HOST_SNIPPETS = [
  "google.",
  "bing.com",
  "duckduckgo.com",
  "search.yahoo.com",
  "ecosia.org",
  "brave.com",
  "perplexity.ai",
  "yandex.",
];

export function isOrganicReferrer(referrer: string): boolean {
  if (!referrer) return false;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return ORGANIC_HOST_SNIPPETS.some((snippet) => host.includes(snippet));
  } catch {
    return false;
  }
}
