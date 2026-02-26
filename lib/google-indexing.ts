/**
 * Google Indexing API — request indexing of individual URLs.
 * Quota: 200 URLs per day per project (use for high-priority or new URLs).
 * @see https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */

import { google } from "googleapis";
import type { GscCredentials } from "./google-search-console";

const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";

function getAuthClient(credentials: GscCredentials) {
  if (credentials.type === "json") {
    try {
      const keys = JSON.parse(credentials.credentialsJson) as {
        client_email?: string;
        private_key?: string;
      };
      return new google.auth.GoogleAuth({
        credentials: keys,
        scopes: [INDEXING_SCOPE],
      });
    } catch {
      throw new Error(
        "Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON for Indexing API"
      );
    }
  }
  return new google.auth.GoogleAuth({
    keyFile: credentials.credentialsPath,
    scopes: [INDEXING_SCOPE],
  });
}

/** Optional detail from Google's API response (status + body) for debugging. */
export type IndexingErrorDetail = {
  status?: number;
  statusText?: string;
  body?: unknown;
};

export type PublishUrlResult =
  | { ok: true; url: string }
  | { ok: false; url: string; error: string; errorDetail?: IndexingErrorDetail };

function getIndexingErrorDetail(err: unknown): IndexingErrorDetail | null {
  const res = (err as { response?: { status?: number; statusText?: string; data?: unknown } })
    ?.response;
  if (!res) return null;
  return {
    status: res.status,
    statusText: res.statusText,
    body: res.data,
  };
}

/**
 * Notify Google to crawl/update a URL (Indexing API).
 * Use for new or significantly updated pages; daily quota applies.
 */
export async function publishUrlNotification(
  url: string,
  type: "URL_UPDATED" | "URL_DELETED",
  credentials: GscCredentials
): Promise<PublishUrlResult> {
  const normalized = url.trim();
  const auth = getAuthClient(credentials);
  const indexing = google.indexing({ version: "v3", auth });

  try {
    await indexing.urlNotifications.publish({
      requestBody: { url: normalized, type },
    });
    return { ok: true, url: normalized };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorDetail = getIndexingErrorDetail(err);
    return { ok: false, url: normalized, error: message, ...(errorDetail && { errorDetail }) };
  }
}

/** Default daily quota for Indexing API; batch in small chunks to avoid rate limits. */
export const INDEXING_API_QUOTA_PER_DAY = 200;
