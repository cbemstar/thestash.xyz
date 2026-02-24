import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  if (!sql) {
    return NextResponse.json({ count: 0 });
  }

  try {
    // Waline stores path in "url" column; only count approved comments
    const [row] = await sql`
      SELECT COUNT(*)::int AS count
      FROM wl_comment
      WHERE url = ${path}
        AND (status = 'approved' OR status IS NULL OR status = '')
    `;
    const count = Number((row as { count: string } | undefined)?.count ?? 0);
    return NextResponse.json({ count });
  } catch (err) {
    console.error("[comments/count] error:", err);
    return NextResponse.json({ count: 0 });
  }
}
