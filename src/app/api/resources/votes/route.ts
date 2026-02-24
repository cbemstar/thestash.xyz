import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const VOTER_ID_COOKIE = "thestash_voter_id";

function getVoterId(req: NextRequest): string | null {
  const cookie = req.cookies.get(VOTER_ID_COOKIE)?.value;
  const header = req.headers.get("x-stash-voter-id");
  const id = header || cookie;
  if (id && /^[a-zA-Z0-9-]{20,64}$/.test(id)) return id;
  return null;
}

export async function GET(req: NextRequest) {
  const slugsParam = req.nextUrl.searchParams.get("slugs");
  if (!slugsParam) {
    return NextResponse.json({ error: "Missing slugs" }, { status: 400 });
  }
  const slugs = slugsParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (slugs.length === 0) return NextResponse.json({});
  if (slugs.length > 100) {
    return NextResponse.json({ error: "Max 100 slugs" }, { status: 400 });
  }

  if (!sql) {
    const empty: Record<string, { upvotes: number; downvotes: number; userVote: "up" | "down" | null }> = {};
    slugs.forEach((s) => (empty[s] = { upvotes: 0, downvotes: 0, userVote: null }));
    return NextResponse.json(empty);
  }

  try {
    const voterId = getVoterId(req);

    const bySlug: Record<
      string,
      { upvotes: number; downvotes: number; userVote: "up" | "down" | null }
    > = {};
    for (const s of slugs) {
      bySlug[s] = { upvotes: 0, downvotes: 0, userVote: null };
    }

    const countRows = await sql`
      SELECT slug,
        COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0)::int AS upvotes,
        COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)::int AS downvotes
      FROM resource_vote_records
      WHERE slug = ANY(${slugs})
      GROUP BY slug
    `;

    for (const r of countRows as { slug: string; upvotes: string; downvotes: string }[]) {
      if (bySlug[r.slug]) {
        bySlug[r.slug].upvotes = Number(r.upvotes ?? 0);
        bySlug[r.slug].downvotes = Number(r.downvotes ?? 0);
      }
    }

    if (voterId) {
      const userRows = await sql`
        SELECT slug, vote_type FROM resource_vote_records
        WHERE slug = ANY(${slugs}) AND voter_id = ${voterId}
      `;
      for (const r of userRows as { slug: string; vote_type: string }[]) {
        if (bySlug[r.slug] && (r.vote_type === "up" || r.vote_type === "down")) {
          bySlug[r.slug].userVote = r.vote_type;
        }
      }
    }

    return NextResponse.json(bySlug);
  } catch (err) {
    console.error("[votes batch] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
  }
}
