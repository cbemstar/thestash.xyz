/**
 * POST /api/search-console/submit
 *
 * Submits sitemap(s) to Google Search Console and optionally notifies the
 * Indexing API for specific URLs. Secured by GSC_WEBHOOK_SECRET.
 *
 * Body (optional):
 *   - sitemaps: string[] — sitemap URLs to submit (default: [BASE_URL/sitemap.xml])
 *   - urls: string[] — up to 10 URLs to notify via Indexing API (optional; quota 200/day)
 *
 * Env: GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS,
 *      GSC_SITE_URL (optional, defaults to NEXT_PUBLIC_SITE_URL origin),
 *      GSC_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from "next/server";

import {
  getGscCredentialsFromEnv,
  submitSitemap,
} from "@/lib/google-search-console";
import {
  publishUrlNotification,
  INDEXING_API_QUOTA_PER_DAY,
} from "@/lib/google-indexing";
import { BASE_URL } from "@/lib/site-url";

export const runtime = "nodejs";

const DEFAULT_SITEMAPS = [`${BASE_URL}/sitemap.xml`];
const MAX_INDEXING_URLS_PER_REQUEST = 10;

type Body = {
  sitemaps?: string[];
  urls?: string[];
};

function readSecret(request: NextRequest): string {
  const header = request.headers.get("x-gsc-secret")?.trim() ?? "";
  if (header) return header;
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function getSiteUrl(): string {
  const env = process.env.GSC_SITE_URL?.trim();
  if (env) return env;
  return `${BASE_URL}/`;
}

export async function POST(request: NextRequest) {
  const secret = process.env.GSC_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "GSC_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  const provided = readSecret(request);
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const credentials = getGscCredentialsFromEnv();
  if (!credentials) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Google credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS",
      },
      { status: 503 }
    );
  }

  let body: Body = {};
  const raw = await request.text();
  if (raw.trim()) {
    try {
      body = JSON.parse(raw) as Body;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }
  }

  const siteUrl = getSiteUrl();
  const sitemaps =
    Array.isArray(body.sitemaps) && body.sitemaps.length > 0
      ? body.sitemaps.filter((s) => typeof s === "string" && s.startsWith("http"))
      : DEFAULT_SITEMAPS;

  const sitemapResults: Array<{ feedpath: string; ok: boolean; error?: string }> =
    [];

  for (const feedpath of sitemaps) {
    const result = await submitSitemap(siteUrl, feedpath, credentials);
    sitemapResults.push({
      feedpath: result.feedpath,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
    });
  }

  const indexingUrls = Array.isArray(body.urls)
    ? (body.urls as string[])
        .filter((u) => typeof u === "string" && u.startsWith("http"))
        .slice(0, MAX_INDEXING_URLS_PER_REQUEST)
    : [];

  const indexingResults: Array<{
    url: string;
    ok: boolean;
    error?: string;
    errorDetail?: { status?: number; statusText?: string; body?: unknown };
  }> = [];

  for (const url of indexingUrls) {
    const result = await publishUrlNotification(
      url,
      "URL_UPDATED",
      credentials
    );
    indexingResults.push({
      url: result.url,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
      errorDetail: result.ok ? undefined : result.errorDetail,
    });
  }

  const sitemapsOk = sitemapResults.every((r) => r.ok);
  const indexingOk = indexingResults.length === 0 || indexingResults.every((r) => r.ok);

  return NextResponse.json({
    ok: sitemapsOk && indexingOk,
    siteUrl,
    sitemaps: sitemapResults,
    indexing: {
      submitted: indexingResults.length,
      quotaNote: `Indexing API quota: ${INDEXING_API_QUOTA_PER_DAY} URLs/day`,
      results: indexingResults,
    },
  });
}
