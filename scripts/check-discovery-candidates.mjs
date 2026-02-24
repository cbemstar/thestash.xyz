#!/usr/bin/env node
/**
 * Check discovery-candidates.json against Sanity resources and set alreadyOnApp.
 * Usage: node --env-file=.env.local scripts/check-discovery-candidates.mjs [path-to-discovery-candidates.json]
 *        Default path: automation/discovery-candidates.json (relative to cwd)
 */

import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@sanity/client";

function slugify(text) {
  return (
    String(text)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "resource"
  );
}

function normalizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url);
    let href = u.href;
    if (href.endsWith("/") && href.length > u.origin.length + 1) href = href.slice(0, -1);
    return href.toLowerCase();
  } catch {
    return String(url).toLowerCase();
  }
}

async function main() {
  const path = process.argv[2] || "automation/discovery-candidates.json";
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

  if (!projectId || projectId === "placeholder-project-id") {
    console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID (e.g. --env-file=.env.local)");
    process.exit(1);
  }

  let candidates;
  try {
    candidates = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error("Failed to read", path, e.message);
    process.exit(1);
  }

  if (!Array.isArray(candidates)) {
    console.error("JSON must be an array of candidate objects");
    process.exit(1);
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2025-01-01",
    useCdn: true,
  });

  const resources = await client.fetch(
    `*[_type == "resource"]{ title, "url": coalesce(url,""), "slug": coalesce(slug.current, slug) }`
  );

  const byUrl = new Map();
  const bySlug = new Map();
  for (const r of resources || []) {
    const url = normalizeUrl(r.url);
    if (url) byUrl.set(url, r);
    const slug = r.slug || slugify(r.title);
    if (slug) bySlug.set(slug, r);
  }

  let updated = 0;
  const out = candidates.map((c) => {
    const candidateUrl = normalizeUrl(c.url);
    const candidateSlug = slugify(c.title);
    const matchByUrl = candidateUrl && byUrl.has(candidateUrl);
    const matchBySlug = bySlug.has(candidateSlug);
    const alreadyOnApp = matchByUrl || matchBySlug;
    if (alreadyOnApp) updated++;
    return { ...c, alreadyOnApp };
  });

  writeFileSync(path, JSON.stringify(out, null, 2), "utf8");
  console.log(`Updated ${path}: ${updated} of ${out.length} candidates already on app.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
