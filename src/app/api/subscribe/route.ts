import { NextRequest, NextResponse } from "next/server";

const LOOPS_API = "https://app.loops.so/api/v1/contacts/update";

/** Simple email validation. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Newsletter subscription endpoint.
 * Uses Loops.so when LOOPS_API_KEY is set.
 * https://loops.so/docs/api-reference/update-contact
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const apiKey = process.env.LOOPS_API_KEY;

  if (apiKey) {
    const mailingListId = process.env.LOOPS_MAILING_LIST_ID;
    const payload: Record<string, unknown> = {
      email,
      source: "thestash-website",
      subscribed: true,
    };
    if (mailingListId) {
      payload.mailingLists = { [mailingListId]: true };
    }

    const res = await fetch(LOOPS_API, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

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
