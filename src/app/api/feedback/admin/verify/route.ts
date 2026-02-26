import { NextRequest, NextResponse } from "next/server";
import { getAdminKeyFromRequest, isAdminKey } from "@/lib/feedback-admin";

export const dynamic = "force-dynamic";

function checkKey(req: NextRequest): string | null {
  const fromHeader = getAdminKeyFromRequest(req);
  if (fromHeader) return fromHeader;
  const url = new URL(req.url);
  return url.searchParams.get("key");
}

export async function GET(req: NextRequest) {
  const key = checkKey(req);
  if (isAdminKey(key)) return new NextResponse(null, { status: 200 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  let key = getAdminKeyFromRequest(req);
  if (!key) {
    const body = await req.json().catch(() => null);
    key = typeof body?.key === "string" ? body.key : null;
  }
  if (isAdminKey(key)) return new NextResponse(null, { status: 200 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
