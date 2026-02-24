import { BASE_URL } from "@/lib/site-url";

const INDEXNOW_DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_MAX_URLS_PER_REQUEST = 10000;

export type IndexNowSubmitOptions = {
  endpoint?: string;
  key?: string;
  keyLocation?: string;
  timeoutMs?: number;
};

export type IndexNowSubmitResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  host: string;
  submittedCount: number;
  message: string;
};

function normalizeUrl(value: string): string {
  const parsed = new URL(value);
  parsed.hash = "";
  return parsed.toString();
}

function normalizeUrls(urls: string[]): string[] {
  const unique = new Set<string>();
  for (const value of urls) {
    if (!value || typeof value !== "string") continue;
    try {
      unique.add(normalizeUrl(value));
    } catch {
      // Skip malformed URLs.
    }
  }
  return [...unique].slice(0, INDEXNOW_MAX_URLS_PER_REQUEST);
}

function resolveSiteOrigin(): URL {
  return new URL(BASE_URL);
}

function resolveIndexNowKey(options: IndexNowSubmitOptions): string {
  return (options.key ?? process.env.INDEXNOW_KEY ?? "").trim();
}

function resolveIndexNowEndpoint(options: IndexNowSubmitOptions): string {
  return (options.endpoint ?? process.env.INDEXNOW_ENDPOINT ?? INDEXNOW_DEFAULT_ENDPOINT).trim();
}

function resolveKeyLocation(
  options: IndexNowSubmitOptions,
  key: string,
  siteOrigin: URL
): string {
  const explicit = (options.keyLocation ?? process.env.INDEXNOW_KEY_LOCATION ?? "").trim();
  if (explicit) return explicit;
  return `${siteOrigin.origin}/${key}.txt`;
}

export async function submitIndexNowUrls(
  urls: string[],
  options: IndexNowSubmitOptions = {}
): Promise<IndexNowSubmitResult> {
  const endpoint = resolveIndexNowEndpoint(options);
  const siteOrigin = resolveSiteOrigin();
  const siteHost = siteOrigin.hostname;
  const key = resolveIndexNowKey(options);

  if (!key) {
    return {
      ok: false,
      status: 503,
      endpoint,
      host: siteHost,
      submittedCount: 0,
      message: "INDEXNOW_KEY is not configured",
    };
  }

  const normalizedUrls = normalizeUrls(urls);
  if (normalizedUrls.length === 0) {
    return {
      ok: false,
      status: 400,
      endpoint,
      host: siteHost,
      submittedCount: 0,
      message: "No valid URLs to submit",
    };
  }

  const host = new URL(normalizedUrls[0]).hostname;
  if (host !== siteHost) {
    return {
      ok: false,
      status: 422,
      endpoint,
      host,
      submittedCount: 0,
      message: `URL host (${host}) does not match site host (${siteHost})`,
    };
  }

  const invalidHostUrl = normalizedUrls.find((value) => new URL(value).hostname !== host);
  if (invalidHostUrl) {
    return {
      ok: false,
      status: 422,
      endpoint,
      host,
      submittedCount: 0,
      message: "All submitted URLs must use the same host",
    };
  }

  const keyLocation = resolveKeyLocation(options, key, siteOrigin);

  const controller = new AbortController();
  const timeoutMs = Math.max(1000, options.timeoutMs ?? 10000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList: normalizedUrls,
      }),
      signal: controller.signal,
    });

    const responseBody = await response.text().catch(() => "");

    return {
      ok: response.ok,
      status: response.status,
      endpoint,
      host,
      submittedCount: normalizedUrls.length,
      message: response.ok ? "IndexNow submission accepted" : responseBody || "IndexNow submission failed",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "IndexNow submission failed";
    return {
      ok: false,
      status: 500,
      endpoint,
      host,
      submittedCount: normalizedUrls.length,
      message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

