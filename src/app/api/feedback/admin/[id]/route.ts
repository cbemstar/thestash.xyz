import { NextRequest, NextResponse } from "next/server";
import { getAdminKeyFromRequest, isAdminKey } from "@/lib/feedback-admin";
import { updateFeedback, deleteFeedback } from "@/lib/feedback-store";
import type { FeedbackStatus } from "@/lib/feedback-store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const key = getAdminKeyFromRequest(req);
  if (!isAdminKey(key)) return unauthorized();

  const id = (await params).id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const status =
    typeof body?.status === "string" && ["idea", "planned", "in_progress", "shipped"].includes(body.status)
      ? (body.status as FeedbackStatus)
      : undefined;
  const votes = typeof body?.votes === "number" ? body.votes : undefined;

  if (status === undefined && votes === undefined) {
    return NextResponse.json(
      { error: "Provide status and/or votes to update." },
      { status: 400 }
    );
  }

  const updated = await updateFeedback(id, { status, votes });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const key = getAdminKeyFromRequest(_req);
  if (!isAdminKey(key)) return unauthorized();

  const id = (await params).id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const deleted = await deleteFeedback(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
