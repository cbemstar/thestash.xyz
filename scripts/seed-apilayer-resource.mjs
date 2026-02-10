#!/usr/bin/env node
/**
 * Add apilayer.com as a resource to Sanity.
 * Usage: node scripts/seed-apilayer-resource.mjs
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
    return (url || "").trim().toLowerCase();
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error("Missing Sanity config. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local");
  process.exit(1);
}

const resource = {
  title: "API Layer",
  url: "https://apilayer.com/products/",
  description:
    "API marketplace offering 75+ APIs for geolocation, currency conversion, email validation, and more. Pay-as-you-go with free tiers.",
  category: "development-tools",
  resourceType: "directory",
  tags: ["apis", "marketplace", "developer-tools", "integration"],
  useCases: ["apis"],
  pricing: "freemium",
  sources: [
    { label: "API Layer Products", url: "https://apilayer.com/products/" },
  ],
};

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

(async () => {
  const slug = slugify(resource.title);
  const normUrl = normalizeUrl(resource.url);

  const existing = await client.fetch('*[_type == "resource"]{ slug, url }');
  const existingUrls = new Set(existing.map((r) => normalizeUrl(r.url)));
  const existingSlugs = new Set(existing.map((r) => (r.slug || "").toLowerCase()));

  if (existingUrls.has(normUrl)) {
    console.log("Resource already exists (url match). Skipping.");
    process.exit(0);
  }
  if (existingSlugs.has(slug)) {
    console.log("Resource already exists (slug match). Skipping.");
    process.exit(0);
  }

  const publishedId = `resource-${slug}`;
  const draftId = `drafts.${publishedId}`;
  const doc = {
    _type: "resource",
    title: resource.title,
    slug,
    url: resource.url,
    description: resource.description,
    category: resource.category,
    resourceType: resource.resourceType,
    tags: resource.tags,
    useCases: resource.useCases,
    pricing: resource.pricing,
    featured: false,
    createdAt: new Date().toISOString(),
    sources: (resource.sources || []).map((s) => ({
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
    console.log("Created and published: API Layer → /" + slug);
  } catch (err) {
    console.error("Failed to create resource:", err.message);
    process.exit(1);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
