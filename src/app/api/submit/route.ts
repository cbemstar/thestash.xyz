import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { slugify } from "@/lib/slug";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;

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
};

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return s.startsWith("http://") || s.startsWith("https://");
  } catch {
    return false;
  }
}

/**
 * Public submission endpoint. Creates a draft resource only — no publish.
 * Submissions appear in Sanity Studio for review (quality, link safety, etc.) before publishing.
 */
export async function POST(request: NextRequest) {
  if (!projectId || !token) {
    return NextResponse.json(
      { error: "Submissions are temporarily unavailable" },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { url, title, description, category, slug, tags } = body;

  if (!url || !isValidUrl(url)) {
    return NextResponse.json(
      { error: "A valid URL is required (e.g. https://example.com)" },
      { status: 400 }
    );
  }
  if (!title || typeof title !== "string" || title.length < 2 || title.length > 120) {
    return NextResponse.json(
      { error: "Title is required (2–120 characters)" },
      { status: 400 }
    );
  }
  if (!description || typeof description !== "string" || description.length < 10 || description.length > 260) {
    return NextResponse.json(
      { error: "Description is required (10–260 characters)" },
      { status: 400 }
    );
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` },
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

  const doc = {
    _type: "resource",
    title: title.trim(),
    slug: resolvedSlug,
    url: url.trim(),
    description: description.trim(),
    category,
    tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string").slice(0, 20) : [],
    featured: false,
    createdAt: new Date().toISOString(),
  };

  try {
    const created = await sanityClient.create(doc);
    return NextResponse.json({
      ok: true,
      id: created._id,
      slug: resolvedSlug,
      message: "Thanks! Your submission is under review. We’ll check quality and safety before publishing.",
    });
  } catch (err) {
    console.error("Submit (draft create) failed:", err);
    return NextResponse.json(
      { error: "We couldn’t save your submission. Please try again." },
      { status: 500 }
    );
  }
}
