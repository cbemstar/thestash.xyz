import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const VOTER_ID_HEADER = "x-stash-voter-id";
const VOTER_ID_COOKIE = "thestash_voter_id";

function getVoterId(req: NextRequest): string | null {
  const header = req.headers.get(VOTER_ID_HEADER);
  if (header && /^[a-zA-Z0-9-]{20,64}$/.test(header)) return header;
  const cookie = req.cookies.get(VOTER_ID_COOKIE)?.value;
  if (cookie && /^[a-zA-Z0-9-]{20,64}$/.test(cookie)) return cookie;
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  if (!sql) {
    return NextResponse.json({
      upvotes: 0,
      downvotes: 0,
      userVote: null,
    });
  }

  try {
    const [counts] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0)::int AS upvotes,
        COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)::int AS downvotes
      FROM resource_vote_records
      WHERE slug = ${slug}
    `;

    const upvotes = Number((counts as { upvotes: string })?.upvotes ?? 0);
    const downvotes = Number((counts as { downvotes: string })?.downvotes ?? 0);

    let userVote: "up" | "down" | null = null;
    const voterId = getVoterId(_req);
    if (voterId) {
      const [row] = await sql`
        SELECT vote_type FROM resource_vote_records
        WHERE slug = ${slug} AND voter_id = ${voterId}
      `;
      const voteType = (row as { vote_type: string } | undefined)?.vote_type;
      if (voteType === "up" || voteType === "down") userVote = voteType;
    }

    return NextResponse.json({
      upvotes,
      downvotes,
      userVote,
    });
  } catch (err) {
    console.error("[votes] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  let voterId = getVoterId(req);
  if (!voterId) {
    voterId = crypto.randomUUID();
    // Client should persist this and send via header on future requests
  }

  let body: { vote?: "up" | "down" | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const vote = body.vote;
  if (vote !== null && vote !== "up" && vote !== "down") {
    return NextResponse.json(
      { error: "Body must include vote: 'up' | 'down' | null" },
      { status: 400 }
    );
  }

  if (!sql) {
    const res = NextResponse.json({
      upvotes: 0,
      downvotes: 0,
      userVote: vote ?? null,
    });
    setVoterCookie(res, voterId);
    return res;
  }

  try {
    if (vote === null) {
      await sql`
        DELETE FROM resource_vote_records
        WHERE slug = ${slug} AND voter_id = ${voterId}
      `;
    } else {
      await sql`
        INSERT INTO resource_vote_records (slug, voter_id, vote_type)
        VALUES (${slug}, ${voterId}, ${vote})
        ON CONFLICT (slug, voter_id)
        DO UPDATE SET vote_type = ${vote}
      `;
    }

    const [counts] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0)::int AS upvotes,
        COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)::int AS downvotes
      FROM resource_vote_records
      WHERE slug = ${slug}
    `;

    const upvotes = Number((counts as { upvotes: string })?.upvotes ?? 0);
    const downvotes = Number((counts as { downvotes: string })?.downvotes ?? 0);

    const res = NextResponse.json({
      upvotes,
      downvotes,
      userVote: vote,
    });
    setVoterCookie(res, voterId);
    return res;
  } catch (err) {
    console.error("[votes] POST error:", err);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

function setVoterCookie(res: NextResponse, voterId: string) {
  res.cookies.set(VOTER_ID_COOKIE, voterId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
