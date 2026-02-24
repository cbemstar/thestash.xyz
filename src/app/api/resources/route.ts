import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { randomUUID } from "node:crypto";
import { slugify } from "@/lib/slug";
import { submitIndexNowUrls } from "@/lib/indexnow";
import { BASE_URL } from "@/lib/site-url";
import { detectKeywordCollision } from "@/lib/content-governance";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;
const webhookSecret = process.env.WEBHOOK_SECRET;

const VALID_CATEGORIES = [
  "design-tools",
  "development-tools",
  "ui-ux-resources",
  "inspiration",
  "ai-tools",
  "productivity",
  "learning-resources",
  "webflow",
  "shadcn",
  "coding",
  "github",
  "html",
  "css",
  "javascript",
  "languages",
  "miscellaneous",
] as const;

type Body = {
  url: string;
  title: string;
  description: string;
  category: (typeof VALID_CATEGORIES)[number];
  slug?: string;
  tags?: string[];
  featured?: boolean;
  alternatives?: string[];
  bestFor?: string[];
  notFor?: string[];
};

function normalizeComparableUrl(value: string): string {
  try {
    const parsed = new URL(value.trim());
    parsed.hash = "";
    parsed.search = "";
    let output = parsed.toString().toLowerCase();
    if (output.endsWith("/")) output = output.slice(0, -1);
    return output;
  } catch {
    return value.trim().toLowerCase();
  }
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return s.startsWith("http://") || s.startsWith("https://");
  } catch {
    return false;
  }
}

function sanitizeStringArray(value: unknown, maxItems: number = 10): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

export async function POST(request: NextRequest) {
  if (webhookSecret) {
    const header = request.headers.get("x-webhook-secret");
    if (header !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!projectId || !token) {
    return NextResponse.json(
      { error: "Server not configured for creating resources" },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    url,
    title,
    description,
    category,
    slug,
    tags,
    featured,
    alternatives,
    bestFor,
    notFor,
  } = body;

  if (!url || !isValidUrl(url)) {
    return NextResponse.json(
      { error: "Valid url is required" },
      { status: 400 }
    );
  }
  if (!title || typeof title !== "string" || title.length < 2 || title.length > 120) {
    return NextResponse.json(
      { error: "title is required (2–120 characters)" },
      { status: 400 }
    );
  }
  if (!description || typeof description !== "string" || description.length < 10 || description.length > 260) {
    return NextResponse.json(
      { error: "description is required (10–260 characters)" },
      { status: 400 }
    );
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const sanityClient = createClient({
    projectId,
    dataset,
    apiVersion: "2025-01-01",
    useCdn: false,
    token,
  });

  const resolvedSlug =
    slug && /^[a-z0-9-]+$/.test(slug) ? slug : slugify(title);
  const normalizedIncomingUrl = normalizeComparableUrl(url);

  const existingDuplicate = await sanityClient.fetch<{
    _id: string;
    title: string;
    slug: string;
    url: string;
  } | null>(
    `*[_type == "resource" && (slug == $slug || lower(title) == $title || lower(url) == $url)][0]{
      _id,
      title,
      slug,
      "url": coalesce(url, "")
    }`,
    {
      slug: resolvedSlug,
      title: title.trim().toLowerCase(),
      url: normalizedIncomingUrl,
    }
  );
  if (existingDuplicate) {
    return NextResponse.json(
      {
        error: "Resource collision: title, slug, or URL already exists.",
        conflict: {
          id: existingDuplicate._id,
          title: existingDuplicate.title,
          slug: existingDuplicate.slug,
          url: existingDuplicate.url,
        },
      },
      { status: 409 }
    );
  }

  const keywordCollision = detectKeywordCollision(title.trim(), resolvedSlug);
  if (keywordCollision) {
    return NextResponse.json(
      {
        error:
          "Resource blocked due to canonical keyword collision. Pick a more specific title or align with the mapped canonical URL.",
        collision: keywordCollision,
      },
      { status: 409 }
    );
  }

  const bestForClean = sanitizeStringArray(bestFor, 12);
  const notForClean = sanitizeStringArray(notFor, 12);
  const alternativeSlugs = sanitizeStringArray(alternatives, 20)
    .filter((candidate) => /^[a-z0-9-]+$/.test(candidate))
    .filter((candidate) => candidate !== resolvedSlug);

  let alternativeRefs: Array<{ _type: "reference"; _ref: string }> = [];
  if (alternativeSlugs.length > 0) {
    const existingAlternatives = await sanityClient.fetch<Array<{ _id: string; slug: string }>>(
      `*[_type == "resource" && slug in $slugs]{ _id, slug }`,
      { slugs: alternativeSlugs }
    );
    const idsBySlug = new Map(
      (existingAlternatives ?? []).map((item) => [item.slug, item._id])
    );
    alternativeRefs = alternativeSlugs
      .map((candidate) => idsBySlug.get(candidate))
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ _type: "reference", _ref: id }));
  }

  const doc = {
    _type: "resource",
    title: title.trim(),
    slug: resolvedSlug,
    url: url.trim(),
    description: description.trim(),
    category,
    tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [],
    ...(alternativeRefs.length > 0 ? { alternatives: alternativeRefs } : {}),
    ...(bestForClean.length > 0 ? { bestFor: bestForClean } : {}),
    ...(notForClean.length > 0 ? { notFor: notForClean } : {}),
    contentTier: "tier3",
    refreshCadenceDays: 90,
    factCheckStatus: "needs-review",
    changeLog: [
      {
        _key: randomUUID(),
        summary: "Initial publish via /api/resources.",
        changedAt: new Date().toISOString(),
      },
    ],
    featured: Boolean(featured),
    createdAt: new Date().toISOString(),
  };

  try {
    const created = await sanityClient.create(doc);
    await sanityClient.action([
      {
        actionType: "sanity.action.document.publish",
        publishedId: created._id.replace(/^drafts\./, ""),
        draftId: created._id,
      },
    ]);
    const publishedId = created._id.replace(/^drafts\./, "");
    const publishedUrl = `${BASE_URL}/${resolvedSlug}`;

    const indexNowResult = await submitIndexNowUrls(
      [publishedUrl, `${BASE_URL}/collections`, `${BASE_URL}/category/${category}`],
      { timeoutMs: 6000 }
    );
    if (!indexNowResult.ok) {
      console.warn("IndexNow submit failed:", indexNowResult.message);
    }

    return NextResponse.json({
      ok: true,
      id: publishedId,
      slug: resolvedSlug,
      url: publishedUrl,
      indexNow: {
        ok: indexNowResult.ok,
        status: indexNowResult.status,
        message: indexNowResult.message,
      },
    });
  } catch (err) {
    console.error("Sanity create failed:", err);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
