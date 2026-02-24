import { NextResponse } from "next/server";
import { getSeoQualityReport } from "@/lib/seo-quality";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await getSeoQualityReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error("SEO quality API failed:", error);
    return NextResponse.json(
      { error: "Failed to build SEO quality report" },
      { status: 500 }
    );
  }
}
