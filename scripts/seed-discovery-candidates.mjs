#!/usr/bin/env node
/**
 * Seed resources from automation/discovery-candidates.json (or path).
 * Skips candidates with alreadyOnApp === true if the field exists.
 * Usage: node --env-file=.env.local scripts/seed-discovery-candidates.mjs [path-to-json]
 * Default: automation/discovery-candidates.json
 * Requires: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN in .env.local
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@sanity/client";

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
  return (
    String(input)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/--+/g, "-") || "resource"
  );
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
    return (url || "").trim().toLowerCase();
  }
}

const RESERVED_SLUGS = new Set(["studio", "api"]);
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

function qualityCheck(row) {
  const errors = [];
  if (!row.title || row.title.length < 2 || row.title.length > 120) {
    errors.push("title must be 2–120 characters");
  }
  try {
    const u = new URL(row.url);
    if (!/^https?:/.test(u.protocol)) errors.push("url must be http or https");
  } catch {
    errors.push("url must be valid");
  }
  if (!row.description || row.description.length < 10 || row.description.length > 260) {
    errors.push("description must be 10–260 characters");
  }
  if (!row.category || !VALID_CATEGORIES.has(row.category)) {
    errors.push("category must be one of: " + [...VALID_CATEGORIES].join(", "));
  }
  const slug = slugify(row.title);
  if (RESERVED_SLUGS.has(slug)) errors.push("slug is reserved: " + slug);
  if (slug && !/^[a-z0-9-]+$/.test(slug)) errors.push("slug must be lowercase letters, numbers, hyphens only");
  return { ok: errors.length === 0, errors, slug: slug || "resource" };
}

loadEnvFile(path.join(process.cwd(), ".env.local"));

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error("Missing Sanity config. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local");
  process.exit(1);
}

const dataPath = process.argv[2] || path.join(process.cwd(), "automation", "discovery-candidates.json");
if (!fs.existsSync(dataPath)) {
  console.error("Data file not found:", dataPath);
  process.exit(1);
}

let candidates;
try {
  candidates = JSON.parse(fs.readFileSync(dataPath, "utf8"));
} catch (err) {
  console.error("Invalid JSON in", dataPath, err.message);
  process.exit(1);
}

if (!Array.isArray(candidates) || candidates.length === 0) {
  console.error("Data file must be a non-empty JSON array.");
  process.exit(1);
}

// Only add candidates that are not already on the app (if field present)
const toAdd = candidates.filter((c) => c.alreadyOnApp !== true);
if (toAdd.length === 0) {
  console.log("No new candidates to add (all have alreadyOnApp: true or list empty).");
  process.exit(0);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

(async () => {
  const existing = await client.fetch('*[_type == "resource"]{ title, slug, url }');
  const existingUrls = new Set(existing.map((r) => normalizeUrl(r.url)));
  const existingSlugs = new Set(existing.map((r) => (r.slug || "").toLowerCase()));

  const created = [];
  const skipped = [];
  const failed = [];

  for (const row of toAdd) {
    const { ok, errors, slug } = qualityCheck(row);
    if (!ok) {
      failed.push({ title: row.title, errors });
      continue;
    }
    const normUrl = normalizeUrl(row.url);
    if (existingUrls.has(normUrl)) {
      skipped.push({ title: row.title, reason: "url already exists" });
      continue;
    }
    if (existingSlugs.has(slug)) {
      skipped.push({ title: row.title, reason: "slug already exists" });
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
      tags: Array.isArray(row.tags) ? row.tags : [],
      featured: row.featured === true,
      createdAt: new Date().toISOString(),
      body: (row.body || "").trim() || undefined,
      sources: (row.sources || []).map((s) => ({
        _type: "object",
        _key: crypto.randomUUID(),
        label: s.label,
        url: s.url,
      })),
    };
    const attributes = { _id: draftId, ...doc };

    try {
      await client.action([
        {
          actionType: "sanity.action.document.create",
          publishedId,
          attributes,
          ifExists: "ignore",
        },
        {
          actionType: "sanity.action.document.publish",
          publishedId,
          draftId,
        },
      ]);
      created.push({ title: row.title, slug, url: row.url, id: publishedId });
      existingUrls.add(normUrl);
      existingSlugs.add(slug);
      console.log("Created and published:", row.title);
    } catch (err) {
      console.error("Create failed for", row.title, err.message);
      failed.push({ title: row.title, errors: [err.message] });
    }
  }

  console.log(JSON.stringify({ created: created.length, skipped: skipped.length, failed: failed.length }, null, 2));
  if (created.length > 0) {
    console.log("Created:", created.map((c) => c.title).join(", "));
  }
  if (failed.length > 0) process.exit(1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
