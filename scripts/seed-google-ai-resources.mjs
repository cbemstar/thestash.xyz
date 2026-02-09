#!/usr/bin/env node
/**
 * Seed resources from google_ai_links_compiled.csv through quality checks.
 * Usage: node scripts/seed-google-ai-resources.mjs [path-to-csv]
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

// Quality-checked rows: title, url, description (10–260 chars), category, slug, tags, body, sources
const ENRICHED = [
  {
    title: "Health AI Developer Foundations",
    url: "https://developers.google.com/health-ai-developer-foundations",
    description:
      "Documentation and guides for building with Google Health AI. For developers integrating ML in healthcare and life sciences.",
    category: "ai-tools",
    tags: ["google", "health-ai", "ml", "documentation"],
    body:
      "Health AI Developer Foundations is Google’s documentation and resource hub for building with Health AI. It covers foundations, libraries, and best practices for developers who integrate machine learning in healthcare and life sciences. Use it to learn how to build responsible, compliant Health AI applications and to explore libraries like LangExtract for structured data extraction in health pipelines.",
    sources: [
      { label: "Health AI Developer Foundations", url: "https://developers.google.com/health-ai-developer-foundations" },
    ],
  },
  {
    title: "LangExtract library",
    url: "https://developers.google.com/health-ai-developer-foundations/libraries/overview",
    description:
      "Library for extracting structured data from text in Health AI pipelines. Part of Google Health AI Developer Foundations.",
    category: "ai-tools",
    tags: ["google", "health-ai", "library", "nlp", "extraction"],
    body:
      "LangExtract is a library in the Health AI Developer Foundations stack for extracting structured data from text. It supports Health AI pipelines where you need to pull entities, relations, or other structured output from unstructured text. The library overview and docs live under Google’s Health AI Developer Foundations, aimed at developers building ML-powered health and life-sciences applications.",
    sources: [
      { label: "LangExtract library overview", url: "https://developers.google.com/health-ai-developer-foundations/libraries/overview" },
      { label: "Health AI Developer Foundations", url: "https://developers.google.com/health-ai-developer-foundations" },
    ],
  },
  {
    title: "Responsible Generative AI Toolkit",
    url: "https://ai.google.dev/responsible",
    description:
      "Google's toolkit for building responsible generative AI: safety, evaluation, and best practices for developers.",
    category: "ai-tools",
    tags: ["google", "responsible-ai", "safety", "evaluation", "gen-ai"],
    body:
      "The Responsible Generative AI Toolkit from Google provides tools, guides, and best practices for building generative AI applications responsibly. It covers safety, evaluation, and safeguards so developers can ship AI products that align with responsible AI principles. The toolkit includes resources like SynthID and ShieldGemma for identification and safety.",
    sources: [
      { label: "Responsible Generative AI", url: "https://ai.google.dev/responsible" },
    ],
  },
  {
    title: "SynthID Text",
    url: "https://ai.google.dev/responsible/docs/safeguards/synthid",
    description:
      "Watermarking and identification for AI-generated text. Part of Google's responsible AI safeguards.",
    category: "ai-tools",
    tags: ["google", "synthid", "watermarking", "responsible-ai", "safeguards"],
    body:
      "SynthID Text is part of Google’s responsible AI safeguards, providing watermarking and identification for AI-generated text. It helps distinguish machine-generated content and supports transparency and accountability when deploying generative AI. The docs sit within the Responsible Generative AI Toolkit and are aimed at developers who need to label or verify AI-generated text.",
    sources: [
      { label: "SynthID Text safeguards", url: "https://ai.google.dev/responsible/docs/safeguards/synthid" },
      { label: "Responsible Generative AI", url: "https://ai.google.dev/responsible" },
    ],
  },
  {
    title: "ShieldGemma",
    url: "https://ai.google.dev/responsible/docs/safeguards/shieldgemma",
    description:
      "Safety and evaluation tools for Gemma models. Part of Google's responsible AI safeguards.",
    category: "ai-tools",
    tags: ["google", "gemma", "safety", "responsible-ai", "safeguards"],
    body:
      "ShieldGemma is a set of safety and evaluation tools for Gemma models, part of Google’s responsible AI safeguards. It helps developers evaluate and harden Gemma-based applications for safety and alignment. The documentation is part of the Responsible Generative AI Toolkit and is useful for anyone deploying or fine-tuning Gemma models in production.",
    sources: [
      { label: "ShieldGemma safeguards", url: "https://ai.google.dev/responsible/docs/safeguards/shieldgemma" },
      { label: "Responsible Generative AI", url: "https://ai.google.dev/responsible" },
    ],
  },
];

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

  for (const row of ENRICHED) {
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
      tags: row.tags || [],
      featured: false,
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
    } catch (err) {
      console.error("Create failed for", row.title, err.message);
      failed.push({ title: row.title, errors: [err.message] });
    }
  }

  console.log(JSON.stringify({ created, skipped, failed }, null, 2));
  if (failed.length > 0) process.exit(1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
