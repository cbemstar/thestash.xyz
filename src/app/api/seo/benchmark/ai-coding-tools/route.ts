import { NextResponse } from "next/server";
import {
  getAiCodingBenchmarkRows,
  getAiCodingBenchmarkSummary,
} from "@/lib/benchmark-reports";

function csvEscape(value: string | number): string {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildCsv() {
  const rows = getAiCodingBenchmarkRows();
  const header = [
    "slug",
    "tool",
    "category",
    "score",
    "setupSpeedScore",
    "collaborationScore",
    "extensibilityScore",
    "pricingPredictabilityScore",
    "lockInRiskScore",
    "pricingModel",
    "bestFor",
    "officialUrl",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.slug,
        row.tool,
        row.category,
        row.score,
        row.setupSpeedScore,
        row.collaborationScore,
        row.extensibilityScore,
        row.pricingPredictabilityScore,
        row.lockInRiskScore,
        row.pricingModel,
        row.bestFor,
        row.officialUrl,
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return `${lines.join("\n")}\n`;
}

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format")?.toLowerCase();

  if (format === "csv") {
    const csv = buildCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="ai-coding-tools-benchmark-q1-2026.csv"',
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      summary: getAiCodingBenchmarkSummary(),
      rows: getAiCodingBenchmarkRows(),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
