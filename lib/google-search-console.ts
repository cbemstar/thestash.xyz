/**
 * Google Search Console API integration.
 * Submits sitemaps, lists sitemaps, and inspects URL index status.
 * @see https://developers.google.com/webmaster-tools/v1/prereqs
 * @see https://developers.google.com/webmaster-tools/v1/sitemaps/submit
 * @see https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
 */

import { google } from "googleapis";

const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";

export type GscCredentials =
  | { type: "json"; credentialsJson: string }
  | { type: "path"; credentialsPath: string };

function getAuthClient(credentials: GscCredentials) {
  if (credentials.type === "json") {
    try {
      const keys = JSON.parse(credentials.credentialsJson) as {
        client_email?: string;
        private_key?: string;
      };
      return new google.auth.GoogleAuth({
        credentials: keys,
        scopes: [WEBMASTERS_SCOPE],
      });
    } catch (e) {
      throw new Error(
        "Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON: must be valid JSON with client_email and private_key"
      );
    }
  }
  return new google.auth.GoogleAuth({
    keyFile: credentials.credentialsPath,
    scopes: [WEBMASTERS_SCOPE],
  });
}

/**
 * Resolve Search Console "site URL" for the property.
 * Must match the property in Search Console (URL-prefix or domain property).
 * @param siteUrl - e.g. https://www.thestash.xyz/ or sc-domain:thestash.xyz
 */
function normalizeSiteUrl(siteUrl: string): string {
  const trimmed = siteUrl.trim();
  if (trimmed.startsWith("sc-domain:")) return trimmed;
  try {
    const u = new URL(trimmed);
    if (!u.pathname || u.pathname === "/") return u.origin + "/";
    return u.origin + "/";
  } catch {
    return trimmed;
  }
}

export type SubmitSitemapResult =
  | { ok: true; feedpath: string }
  | { ok: false; feedpath: string; error: string };

/**
 * Submit a sitemap URL to Google Search Console.
 * Uses PUT to webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}.
 */
export async function submitSitemap(
  siteUrl: string,
  feedpath: string,
  credentials: GscCredentials
): Promise<SubmitSitemapResult> {
  const normalizedSite = normalizeSiteUrl(siteUrl);
  const auth = getAuthClient(credentials);
  const webmasters = google.webmasters({ version: "v3", auth });

  try {
    await webmasters.sitemaps.submit({
      siteUrl: normalizedSite,
      feedpath: feedpath.trim(),
    });
    return { ok: true, feedpath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, feedpath, error: message };
  }
}

export type ListSitemapsResult =
  | { ok: true; sitemaps: Array<{ path?: string | null; lastSubmitted?: string | null }> }
  | { ok: false; error: string };

/**
 * List sitemaps submitted for the site.
 */
export async function listSitemaps(
  siteUrl: string,
  credentials: GscCredentials
): Promise<ListSitemapsResult> {
  const normalizedSite = normalizeSiteUrl(siteUrl);
  const auth = getAuthClient(credentials);
  const webmasters = google.webmasters({ version: "v3", auth });

  try {
    const res = await webmasters.sitemaps.list({
      siteUrl: normalizedSite,
    });
    const list = res.data.sitemap ?? [];
    return {
      ok: true,
      sitemaps: list.map((s) => ({
        path: s.path,
        lastSubmitted: s.lastSubmitted ?? undefined,
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Resolve credentials from environment.
 * Prefer GOOGLE_APPLICATION_CREDENTIALS_JSON (string) for serverless; fallback to GOOGLE_APPLICATION_CREDENTIALS (file path).
 */
/**
 * Simplified index status for one URL (from URL Inspection API).
 */
export type UrlIndexStatus =
  | {
      ok: true;
      url: string;
      verdict?: string;
      coverageState?: string;
      indexingState?: string;
      pageFetchState?: string;
      lastCrawlTime?: string;
      robotsTxtState?: string;
    }
  | { ok: false; url: string; error: string };

/**
 * Inspect a single URL's index status via Search Console URL Inspection API.
 * Quota: ~2000/day, ~600/min per property.
 */
export async function inspectUrl(
  siteUrl: string,
  inspectionUrl: string,
  credentials: GscCredentials
): Promise<UrlIndexStatus> {
  const normalizedSite = normalizeSiteUrl(siteUrl);
  const auth = getAuthClient(credentials);
  const searchconsole = google.searchconsole({ version: "v1", auth });

  try {
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: inspectionUrl.trim(),
        siteUrl: normalizedSite,
        languageCode: "en-US",
      },
    });
    const result = res.data.inspectionResult?.indexStatusResult;
    return {
      ok: true,
      url: inspectionUrl.trim(),
      verdict: result?.verdict ?? undefined,
      coverageState: result?.coverageState ?? undefined,
      indexingState: result?.indexingState ?? undefined,
      pageFetchState: result?.pageFetchState ?? undefined,
      lastCrawlTime: result?.lastCrawlTime ?? undefined,
      robotsTxtState: result?.robotsTxtState ?? undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, url: inspectionUrl.trim(), error: message };
  }
}

/** Max URLs per index-status request (API quota ~600/min, 2000/day). */
export const MAX_INSPECT_URLS_PER_REQUEST = 50;

/**
 * Inspect index status for multiple URLs. Runs sequentially to avoid rate limits.
 */
export async function inspectUrls(
  siteUrl: string,
  urls: string[],
  credentials: GscCredentials
): Promise<UrlIndexStatus[]> {
  const capped = urls.slice(0, MAX_INSPECT_URLS_PER_REQUEST);
  const results: UrlIndexStatus[] = [];
  for (const url of capped) {
    const status = await inspectUrl(siteUrl, url, credentials);
    results.push(status);
  }
  return results;
}

export function getGscCredentialsFromEnv(): GscCredentials | null {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (json) return { type: "json", credentialsJson: json };

  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (path) return { type: "path", credentialsPath: path };

  return null;
}
