import { NextRequest, NextResponse } from "next/server";
import { getRecentResources } from "@/lib/sanity.resource";
import { getResourceSlug } from "@/lib/slug";
import { BASE_URL } from "@/lib/site-url";

const LOOPS_SEND_EVENT = "https://app.loops.so/api/v1/events/send";
const EVENT_NAME = "weeklyDigest";

async function getSubscriberEmails(request: NextRequest): Promise<string[]> {
  const auth =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.headers.get("x-cron-secret") ||
    "";
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
  if (!cronSecret || auth !== cronSecret) {
    return [];
  }

  const emailsEnv = process.env.LOOPS_DIGEST_EMAILS;
  if (emailsEnv && typeof emailsEnv === "string") {
    return emailsEnv
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  }

  try {
    const body = (await request.json()) as { emails?: string[] } | null;
    if (body && typeof body === "object" && Array.isArray(body.emails)) {
      return body.emails
        .map((e) => String(e).trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    }
  } catch {
    // no body or invalid JSON
  }
  return [];
}

export async function POST(request: NextRequest) {
  const emails = await getSubscriberEmails(request);
  if (emails.length === 0) {
    return NextResponse.json(
      { error: "Unauthorized or no subscriber emails. Set CRON_SECRET and LOOPS_DIGEST_EMAILS or pass { emails: [...] } with auth." },
      { status: 401 }
    );
  }

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "LOOPS_API_KEY not set." },
      { status: 500 }
    );
  }

  const resources = await getRecentResources(7);
  const resourcesCount = resources.length;
  const top5 = resources.slice(0, 5);
  const resourcesListHtml =
    top5.length === 0
      ? ""
      : top5
          .map(
            (r) =>
              `<li><a href="${BASE_URL}/${getResourceSlug(r)}" style="color:#ea580c;">${escapeHtml(r.title)}</a></li>`
          )
          .join("");

  const hasMoreThan5 = resourcesCount > 5;
  const buttonText = hasMoreThan5 ? "View all resources" : "Visit thestash.xyz";
  const buttonUrl = hasMoreThan5 ? `${BASE_URL}/latest` : BASE_URL;

  const eventProperties = {
    resourcesListHtml: resourcesListHtml ? `<ul style="margin:0.5em 0;padding-left:1.25em;">${resourcesListHtml}</ul>` : "<p>No new resources this week. Check back soon!</p>",
    resourcesCount,
    buttonText,
    buttonUrl,
    latestUrl: `${BASE_URL}/latest`,
  };

  const results: { email: string; success: boolean; error?: string }[] = [];
  for (const email of emails) {
    try {
      const res = await fetch(LOOPS_SEND_EVENT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          eventName: EVENT_NAME,
          eventProperties,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (res.ok && data.success) {
        results.push({ email, success: true });
      } else {
        results.push({ email, success: false, error: data.message ?? `HTTP ${res.status}` });
      }
    } catch (err) {
      results.push({
        email,
        success: false,
        error: err instanceof Error ? err.message : "fetch error",
      });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  return NextResponse.json({
    ok: true,
    eventName: EVENT_NAME,
    resourcesCount,
    buttonText,
    buttonUrl,
    totalEmails: emails.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
