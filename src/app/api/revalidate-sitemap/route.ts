import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const webhookSecret = process.env.WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "WEBHOOK_SECRET is not configured.",
      },
      { status: 500 }
    );
  }

  const providedSecret = request.headers.get("x-webhook-secret");
  if (providedSecret !== webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  revalidatePath("/sitemap-index");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({
    ok: true,
    revalidated: ["/sitemap-index", "/sitemap.xml"],
    at: new Date().toISOString(),
  });
}
