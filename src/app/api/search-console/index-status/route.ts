/**
 * GET/POST /api/search-console/index-status
 *
 * Returns index status for given URLs via Search Console URL Inspection API.
 * Secured by GSC_WEBHOOK_SECRET.
 *
 * GET: ?urls=https://example.com/page1,https://example.com/page2
 * POST body: { "urls": ["https://example.com/page1", ...] }
 * Max 50 URLs per request. Quota: ~2000/day, ~600/min per property.
 *
 * Env: GOOGLE_APPLICATION_CREDENTIALS_JSON (or path), GSC_SITE_URL, GSC_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from "next/server";

import {
  getGscCredentialsFromEnv,
  inspectUrls,
  MAX_INSPECT_URLS_PER_REQUEST,
} from "@/lib/google-search-console";
import { BASE_URL } from "@/lib/site-url";

export const runtime = "nodejs";

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

function parseUrls(request: NextRequest): string[] {
  const url = new URL(request.url);
  const queryUrls = url.searchParams.get("urls")?.trim();
  if (queryUrls) {
    return queryUrls
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));
  }
  return [];
}

export async function GET(request: NextRequest) {
  const secret = process.env.GSC_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return NextResponse.json(
      { error: "GSC_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }
  if (readSecret(request) !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = getGscCredentialsFromEnv();
  if (!credentials) {
    return NextResponse.json(
      { error: "Google credentials not configured" },
      { status: 500 }
    );
  }

  const urls = parseUrls(request);
  if (urls.length === 0) {
    return NextResponse.json(
      {
        error: "No URLs provided. Use ?urls=url1,url2 or POST body { urls: [...] }",
      },
      { status: 400 }
    );
  }

  const siteUrl = getSiteUrl();
  const results = await inspectUrls(siteUrl, urls, credentials);

  return NextResponse.json({
    siteUrl,
    requested: urls.length,
    limit: MAX_INSPECT_URLS_PER_REQUEST,
    results,
    summary: {
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      indexed: results.filter(
        (r) => r.ok && r.coverageState !== undefined && r.verdict === "PASS"
      ).length,
    },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.GSC_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return NextResponse.json(
      { error: "GSC_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }
  if (readSecret(request) !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = getGscCredentialsFromEnv();
  if (!credentials) {
    return NextResponse.json(
      { error: "Google credentials not configured" },
      { status: 500 }
    );
  }

  let urls: string[] = [];
  try {
    const body = await request.json();
    const raw = body?.urls;
    if (Array.isArray(raw)) {
      urls = raw
        .filter((u): u is string => typeof u === "string")
        .map((u) => u.trim())
        .filter((u) => u.startsWith("http"));
    }
  } catch {
    // ignore invalid JSON
  }

  if (urls.length === 0) {
    return NextResponse.json(
      { error: "Body must include urls: string[]" },
      { status: 400 }
    );
  }

  const siteUrl = getSiteUrl();
  const results = await inspectUrls(siteUrl, urls, credentials);

  return NextResponse.json({
    siteUrl,
    requested: urls.length,
    limit: MAX_INSPECT_URLS_PER_REQUEST,
    results,
    summary: {
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      indexed: results.filter(
        (r) => r.ok && r.coverageState !== undefined && r.verdict === "PASS"
      ).length,
    },
  });
}
