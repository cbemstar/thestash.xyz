import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { slugify } from "@/lib/slug";

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
};

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return s.startsWith("http://") || s.startsWith("https://");
  } catch {
    return false;
  }
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

  const { url, title, description, category, slug, tags, featured } = body;

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

  const doc = {
    _type: "resource",
    title: title.trim(),
    slug: resolvedSlug,
    url: url.trim(),
    description: description.trim(),
    category,
    tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [],
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
    return NextResponse.json({
      ok: true,
      id: publishedId,
      slug: resolvedSlug,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz"}/${resolvedSlug}`,
    });
  } catch (err) {
    console.error("Sanity create failed:", err);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
