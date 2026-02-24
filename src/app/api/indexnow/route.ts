import { NextRequest, NextResponse } from "next/server";

import { submitIndexNowUrls } from "@/lib/indexnow";
import { BASE_URL } from "@/lib/site-url";

export const runtime = "nodejs";

type Body = {
  url?: string;
  urls?: string[];
  keyLocation?: string;
};

function readSecretFromRequest(request: NextRequest): string {
  const headerSecret = request.headers.get("x-indexnow-secret")?.trim() ?? "";
  if (headerSecret) return headerSecret;
  const authHeader = request.headers.get("authorization")?.trim() ?? "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch?.[1]?.trim() ?? "";
}

function getDefaultUrls(): string[] {
  return [`${BASE_URL}/`, `${BASE_URL}/sitemap.xml`];
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.INDEXNOW_WEBHOOK_SECRET?.trim() ?? "";
  if (!configuredSecret) {
    return NextResponse.json(
      { error: "INDEXNOW_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  const providedSecret = readSecretFromRequest(request);
  if (providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body = {};
  const raw = await request.text();
  if (raw.trim()) {
    try {
      body = JSON.parse(raw) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  const requestedUrls = [
    ...(body.url ? [body.url] : []),
    ...(Array.isArray(body.urls) ? body.urls : []),
  ];
  const urls = requestedUrls.length > 0 ? requestedUrls : getDefaultUrls();

  const result = await submitIndexNowUrls(urls, {
    keyLocation: body.keyLocation,
  });

  const statusCode = result.ok ? 200 : result.status >= 400 ? result.status : 500;
  return NextResponse.json(result, { status: statusCode });
}

