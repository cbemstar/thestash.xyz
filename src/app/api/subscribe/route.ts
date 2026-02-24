import { NextRequest, NextResponse } from "next/server";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

const LOOPS_CREATE = "https://app.loops.so/api/v1/contacts/create";
const LOOPS_UPDATE = "https://app.loops.so/api/v1/contacts/update";
const RECAPTCHA_ACTION = "newsletter_subscribe";
const MAILING_LIST_ID_RE = /^[A-Za-z0-9_-]+$/;

/** Simple email validation. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseMailingListIds(raw: string | undefined): string[] {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];

  const normalized = raw
    .split(",")
    .map((value) => value.trim().replace(/^["'`]+|["'`]+$/g, ""))
    .filter(Boolean);

  return normalized.filter((id) => MAILING_LIST_ID_RE.test(id));
}

/**
 * Newsletter subscription endpoint.
 * Uses Loops.so when LOOPS_API_KEY is set.
 * Calls Create contact first so "Contact added" fires (welcome Loop); on 409 (already exists), falls back to Update contact.
 * https://loops.so/docs/api-reference/create-contact
 * https://loops.so/docs/api-reference/update-contact
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; recaptchaToken?: string };
  try {
    body = (await request.json()) as { email?: string; recaptchaToken?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const recaptchaToken = typeof body.recaptchaToken === "string" ? body.recaptchaToken : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const remoteIp = forwardedFor?.split(",")[0]?.trim();
  const verification = await verifyRecaptchaToken({
    token: recaptchaToken,
    expectedAction: RECAPTCHA_ACTION,
    remoteIp,
  });

  if (!verification.ok) {
    return NextResponse.json(
      { error: verification.error ?? "Verification failed. Please retry." },
      { status: verification.status }
    );
  }

  const apiKey = process.env.LOOPS_API_KEY;

  if (apiKey) {
    const rawMailingListIds = process.env.LOOPS_MAILING_LIST_ID;
    const mailingListIds = parseMailingListIds(rawMailingListIds);
    const payload: Record<string, unknown> = {
      email,
      source: "thestash-website",
      subscribed: true,
    };
    if (mailingListIds.length > 0) {
      payload.mailingLists = Object.fromEntries(
        mailingListIds.map((id) => [id, true] as const)
      );
    } else if (typeof rawMailingListIds === "string" && rawMailingListIds.trim().length > 0) {
      console.warn("[Subscribe] Ignoring invalid LOOPS_MAILING_LIST_ID format.");
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // Create contact first so Loops "Contact added" trigger fires (welcome email). If contact already exists (409), update instead.
    let res = await fetch(LOOPS_CREATE, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      res = await fetch(LOOPS_UPDATE, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
    }

    const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };

    if (!res.ok) {
      console.error("[Subscribe] Loops error:", res.status, data);
      return NextResponse.json(
        { error: data?.message ?? "Subscription failed. Please try again." },
        { status: 400 }
      );
    }
  } else if (process.env.NODE_ENV === "development") {
    console.log("[Subscribe] Email received (no LOOPS_API_KEY):", email);
  }

  return NextResponse.json({ ok: true, message: "Subscribed successfully" });
}
