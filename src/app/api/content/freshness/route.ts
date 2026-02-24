import { NextResponse } from "next/server";
import { getContentFreshnessReport } from "@/lib/content-freshness";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await getContentFreshnessReport();
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Content freshness API failed:", error);
    return NextResponse.json(
      { error: "Failed to build content freshness report" },
      { status: 500 }
    );
  }
}
