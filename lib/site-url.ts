const DEFAULT_SITE_URL = "https://www.thestash.xyz";
const APEX_HOSTNAME = "thestash.xyz";
const WWW_HOSTNAME = "www.thestash.xyz";

/**
 * Canonical site URL (www preferred for SEO).
 * Set NEXT_PUBLIC_SITE_URL in env to override.
 */
export function normalizeSiteUrl(rawUrl?: string): string {
  if (!rawUrl) return DEFAULT_SITE_URL;
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_SITE_URL;

  try {
    const parsed = new URL(trimmed);
    // Canonical host policy for this project: always use https://www.thestash.xyz.
    const hostname =
      parsed.hostname === APEX_HOSTNAME || parsed.hostname === WWW_HOSTNAME
        ? WWW_HOSTNAME
        : parsed.hostname;

    const canonical = new URL(DEFAULT_SITE_URL);
    canonical.hostname = hostname;
    canonical.protocol = "https:";
    canonical.port = "";
    canonical.pathname = "/";
    canonical.search = "";
    canonical.hash = "";

    return canonical.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const BASE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
