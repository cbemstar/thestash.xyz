import { NextRequest, NextResponse } from "next/server";
import { addFeedback, getAllFeedback, voteOnFeedback } from "@/lib/feedback-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getAllFeedback();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 },
    );
  }

  const item = await addFeedback({ title, description });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const delta = body?.delta === -1 ? -1 : 1;

  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const updated = await voteOnFeedback(id, delta);
  if (!updated) {
    return NextResponse.json({ error: "Feedback item not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

