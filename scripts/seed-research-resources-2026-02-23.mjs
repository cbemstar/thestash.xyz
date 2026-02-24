#!/usr/bin/env node
/**
 * Seed researched resources and build/update the marketing collection.
 *
 * Usage:
 *   node scripts/seed-research-resources-2026-02-23.mjs
 *   node scripts/seed-research-resources-2026-02-23.mjs path/to/resources.json
 *
 * Requires: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN in .env.local
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@sanity/client";

const VALID_CATEGORIES = new Set([
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
]);

const RESERVED_SLUGS = new Set(["studio", "api"]);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    let s = u.toString();
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s.toLowerCase();
  } catch {
    return (url || "").trim().toLowerCase().replace(/\/$/, "");
  }
}

function validateRow(row) {
  const errors = [];
  if (!row || typeof row !== "object") {
    errors.push("row must be an object");
    return { ok: false, errors, slug: "resource" };
  }

  if (!row.title || typeof row.title !== "string" || row.title.trim().length < 2 || row.title.trim().length > 120) {
    errors.push("title must be 2-120 characters");
  }

  try {
    const u = new URL(row.url);
    if (!/^https?:/.test(u.protocol)) errors.push("url must use http/https");
  } catch {
    errors.push("url must be valid");
  }

  if (
    !row.description ||
    typeof row.description !== "string" ||
    row.description.trim().length < 10 ||
    row.description.trim().length > 260
  ) {
    errors.push("description must be 10-260 characters");
  }

  if (!row.category || !VALID_CATEGORIES.has(row.category)) {
    errors.push("category must be a valid resource category");
  }

  const slug = slugify(String(row.title || ""));
  if (!slug) errors.push("slug is empty");
  if (RESERVED_SLUGS.has(slug)) errors.push(`slug is reserved: ${slug}`);
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    errors.push("slug must contain lowercase letters, numbers, hyphens only");
  }

  return { ok: errors.length === 0, errors, slug: slug || "resource" };
}

function uniqStrings(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const item of input) {
    if (typeof item !== "string") continue;
    const value = item.trim();
    if (!value) continue;
    if (seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    out.push(value);
  }
  return out;
}

loadEnvFile(path.join(process.cwd(), ".env.local"));

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error(
    "Missing Sanity config. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local"
  );
  process.exit(1);
}

const inputPath =
  process.argv[2] ||
  path.join(process.cwd(), "scripts", "research-resources-2026-02-23.json");

if (!fs.existsSync(inputPath)) {
  console.error("Input file not found:", inputPath);
  process.exit(1);
}

let rows;
try {
  rows = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (err) {
  console.error("Invalid JSON in", inputPath, err.message);
  process.exit(1);
}

if (!Array.isArray(rows) || rows.length === 0) {
  console.error("Input must be a non-empty JSON array.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

const run = async () => {
  const existing = await client.fetch(
    '*[_type == "resource"]{ _id, title, slug, url, tags, industries }'
  );

  const existingBySlug = new Map();
  const existingByUrl = new Map();
  const existingByTitle = new Map();

  for (const doc of existing) {
    const slug = slugify(String(doc.slug || doc.title || ""));
    if (slug) existingBySlug.set(slug, doc);
    const url = normalizeUrl(doc.url || "");
    if (url) existingByUrl.set(url, doc);
    const title = String(doc.title || "").trim().toLowerCase();
    if (title) existingByTitle.set(title, doc);
  }

  const created = [];
  const skipped = [];
  const failed = [];

  for (const row of rows) {
    const { ok, errors, slug } = validateRow(row);
    if (!ok) {
      failed.push({ title: row?.title ?? "(missing)", errors });
      continue;
    }

    const normUrl = normalizeUrl(row.url);
    const titleKey = row.title.trim().toLowerCase();

    if (existingByUrl.has(normUrl)) {
      skipped.push({ title: row.title, reason: "url already exists" });
      continue;
    }
    if (existingBySlug.has(slug)) {
      skipped.push({ title: row.title, reason: "slug already exists" });
      continue;
    }
    if (existingByTitle.has(titleKey)) {
      skipped.push({ title: row.title, reason: "title already exists" });
      continue;
    }

    const publishedId = crypto.randomUUID();
    const draftId = `drafts.${publishedId}`;

    const doc = {
      _type: "resource",
      title: row.title.trim(),
      slug,
      url: row.url.trim(),
      description: row.description.trim(),
      category: row.category,
      tags: uniqStrings(row.tags),
      featured: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await client.action([
        {
          actionType: "sanity.action.document.create",
          publishedId,
          attributes: { _id: draftId, ...doc },
          ifExists: "ignore",
        },
        {
          actionType: "sanity.action.document.publish",
          publishedId,
          draftId,
        },
      ]);

      const createdDoc = {
        _id: publishedId,
        ...doc,
        marketing: Boolean(row.marketing),
      };

      created.push(createdDoc);
      existingBySlug.set(slug, createdDoc);
      existingByUrl.set(normUrl, createdDoc);
      existingByTitle.set(titleKey, createdDoc);
    } catch (err) {
      failed.push({ title: row.title, errors: [err.message] });
    }
  }

  const marketingTitles = rows
    .filter((row) => row.marketing)
    .map((row) => String(row.title).trim().toLowerCase());

  const marketingDocsFromSanity = await client.fetch(
    `*[_type == "resource" && lower(title) in $titles]{ _id, title, tags, industries }`,
    { titles: marketingTitles }
  );

  let marketingPatched = 0;
  for (const doc of marketingDocsFromSanity) {
    const industries = uniqStrings([...(doc.industries || []), "marketing"]);
    const tags = uniqStrings([...(doc.tags || []), "marketing"]);
    await client.patch(doc._id).set({ industries, tags }).commit();
    marketingPatched += 1;
  }

  const allMarketingDocs = await client.fetch(
    `*[_type == "resource" && ("marketing" in coalesce(industries, []) || "marketing" in coalesce(tags, []))]{
      _id,
      title
    }`
  );

  const marketingResourceRefs = allMarketingDocs
    .sort((a, b) => String(a.title).localeCompare(String(b.title)))
    .map((doc) => ({ _type: "reference", _ref: doc._id.replace(/^drafts\./, "") }));

  const collectionSlug = "marketing-growth-tools";
  const collectionTitle = "Marketing & Growth Stack";
  const collectionDescription =
    "Curated marketing and growth resources: social scheduling, lifecycle automation, SEO training, audience research, and AI campaign tools for modern teams.";

  const existingCollection = await client.fetch(
    '*[_type == "collection" && slug == $slug][0]{ _id }',
    { slug: collectionSlug }
  );

  let collectionAction = "updated";
  if (existingCollection?._id) {
    await client
      .patch(existingCollection._id)
      .set({
        title: collectionTitle,
        slug: collectionSlug,
        description: collectionDescription,
        resources: marketingResourceRefs,
        featured: true,
      })
      .commit();
  } else {
    const collectionId = crypto.randomUUID();
    const draftId = `drafts.${collectionId}`;
    await client.action([
      {
        actionType: "sanity.action.document.create",
        publishedId: collectionId,
        attributes: {
          _id: draftId,
          _type: "collection",
          title: collectionTitle,
          slug: collectionSlug,
          description: collectionDescription,
          resources: marketingResourceRefs,
          featured: true,
          createdAt: new Date().toISOString(),
        },
        ifExists: "ignore",
      },
      {
        actionType: "sanity.action.document.publish",
        publishedId: collectionId,
        draftId,
      },
    ]);
    collectionAction = "created";
  }

  const createdByCategory = {};
  for (const row of created) {
    createdByCategory[row.category] = (createdByCategory[row.category] || 0) + 1;
  }

  const result = {
    inputCount: rows.length,
    created: created.length,
    skipped: skipped.length,
    failed: failed.length,
    createdByCategory,
    marketingTaggedDocs: marketingPatched,
    marketingCollection: {
      slug: collectionSlug,
      action: collectionAction,
      resourceCount: marketingResourceRefs.length,
    },
  };

  console.log(JSON.stringify(result, null, 2));

  if (failed.length > 0) {
    console.log("Failed rows:");
    for (const item of failed) {
      console.log(`- ${item.title}: ${item.errors.join("; ")}`);
    }
    process.exit(1);
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
