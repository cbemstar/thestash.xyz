#!/usr/bin/env node
/**
 * Refresh resource icons in Sanity using high-resolution site icons.
 *
 * Usage:
 *   node --env-file=.env.local scripts/refresh-resource-icons.mjs
 *   node --env-file=.env.local scripts/refresh-resource-icons.mjs --force --concurrency=8 --min-size=96
 *   node --env-file=.env.local scripts/refresh-resource-icons.mjs --limit=25
 */

import fs from "fs";
import path from "path";
import { createClient } from "@sanity/client";

const DEFAULT_CONCURRENCY = 6;
const DEFAULT_MIN_SIZE = 96;
const DEFAULT_TIMEOUT_MS = 12000;
const MAX_ICON_BYTES = 5 * 1024 * 1024;
const SUPPORTED_UPLOAD_FORMATS = new Set(["png", "jpg", "webp"]);
const REPORT_DIR = path.join(process.cwd(), "reports");
const REPORT_FILE = path.join(REPORT_DIR, "resource-icon-refresh-report.json");
const USER_AGENT =
  "Mozilla/5.0 (compatible; TheStashIconRefresher/1.0; +https://www.thestash.xyz)";

function parseArgs(argv) {
  const args = {
    concurrency: DEFAULT_CONCURRENCY,
    minSize: DEFAULT_MIN_SIZE,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    limit: 0,
    force: false,
  };

  for (const raw of argv) {
    if (raw === "--force") {
      args.force = true;
      continue;
    }
    if (raw.startsWith("--concurrency=")) {
      args.concurrency = Math.max(1, Number(raw.split("=")[1]) || DEFAULT_CONCURRENCY);
      continue;
    }
    if (raw.startsWith("--min-size=")) {
      args.minSize = Math.max(16, Number(raw.split("=")[1]) || DEFAULT_MIN_SIZE);
      continue;
    }
    if (raw.startsWith("--timeout-ms=")) {
      args.timeoutMs = Math.max(3000, Number(raw.split("=")[1]) || DEFAULT_TIMEOUT_MS);
      continue;
    }
    if (raw.startsWith("--limit=")) {
      args.limit = Math.max(0, Number(raw.split("=")[1]) || 0);
      continue;
    }
  }

  return args;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeUrl(input) {
  try {
    const url = new URL(input);
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeOrigin(input) {
  try {
    const url = new URL(input);
    return url.origin;
  } catch {
    return null;
  }
}

function resolveUrl(baseUrl, maybeRelative) {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

function parseAttributes(tag) {
  const attrs = {};
  const regex = /([:@\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match;
  while ((match = regex.exec(tag))) {
    const key = (match[1] || "").toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    attrs[key] = value;
  }
  return attrs;
}

function parseSizeHint(rawSizes) {
  if (!rawSizes) return 0;
  const sizes = String(rawSizes).trim().toLowerCase();
  if (!sizes) return 0;
  if (sizes.includes("any")) return 2048;
  let max = 0;
  for (const token of sizes.split(/\s+/)) {
    const m = token.match(/^(\d+)[xX](\d+)$/);
    if (!m) continue;
    const w = Number(m[1]) || 0;
    const h = Number(m[2]) || 0;
    max = Math.max(max, Math.max(w, h));
  }
  return max;
}

function linkRelWeight(rel) {
  const value = (rel || "").toLowerCase();
  if (value.includes("apple-touch-icon")) return 120;
  if (value.includes("mask-icon")) return 80;
  if (value.includes("shortcut icon")) return 70;
  if (value.includes("icon")) return 60;
  return 10;
}

function sourceWeight(source) {
  if (source === "manifest") return 60;
  if (source === "html") return 40;
  if (source === "meta") return 12;
  if (source === "fallback") return 15;
  if (source === "google-s2") return 5;
  return 0;
}

function extFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    const name = pathname.split("/").pop() || "";
    const dot = name.lastIndexOf(".");
    if (dot === -1) return "";
    return name.slice(dot + 1).toLowerCase();
  } catch {
    return "";
  }
}

function formatFromContentType(contentType, url) {
  const type = (contentType || "").toLowerCase();
  if (type.includes("image/png")) return "png";
  if (type.includes("image/jpeg")) return "jpg";
  if (type.includes("image/webp")) return "webp";
  if (type.includes("image/gif")) return "gif";
  if (type.includes("image/x-icon") || type.includes("image/vnd.microsoft.icon")) return "ico";
  if (type.includes("image/avif")) return "avif";
  if (type.includes("image/svg")) return "svg";
  const ext = extFromUrl(url);
  if (ext === "png") return "png";
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "webp") return "webp";
  if (ext === "gif") return "gif";
  if (ext === "ico") return "ico";
  if (ext === "avif") return "avif";
  if (ext === "svg") return "svg";
  return "";
}

function isSupportedUploadFormat(format) {
  return SUPPORTED_UPLOAD_FORMATS.has(format);
}

function parseIcoDimensions(buffer) {
  if (buffer.length < 6) return null;
  const reserved = buffer.readUInt16LE(0);
  const type = buffer.readUInt16LE(2);
  const count = buffer.readUInt16LE(4);
  if (reserved !== 0 || type !== 1 || count <= 0) return null;
  let maxW = 0;
  let maxH = 0;
  for (let i = 0; i < count; i += 1) {
    const offset = 6 + i * 16;
    if (buffer.length < offset + 16) break;
    const w = buffer[offset] === 0 ? 256 : buffer[offset];
    const h = buffer[offset + 1] === 0 ? 256 : buffer[offset + 1];
    maxW = Math.max(maxW, w);
    maxH = Math.max(maxH, h);
  }
  if (maxW === 0 || maxH === 0) return null;
  return { width: maxW, height: maxH };
}

function parsePngDimensions(buffer) {
  if (buffer.length < 24) return null;
  const sig = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== sig) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function parseGifDimensions(buffer) {
  if (buffer.length < 10) return null;
  const header = buffer.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function parseJpegDimensions(buffer) {
  if (buffer.length < 4) return null;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const len = buffer.readUInt16BE(offset + 2);
    if (len < 2) break;
    const isSOF =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;
    if (isSOF && offset + 8 < buffer.length) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + len;
  }
  return null;
}

function parseWebpDimensions(buffer) {
  if (buffer.length < 30) return null;
  if (
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return null;
  }
  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X" && buffer.length >= 30) {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }
  return null;
}

function probeImage(buffer, format) {
  if (!buffer || buffer.length === 0) return null;
  if (format === "png") return parsePngDimensions(buffer);
  if (format === "jpg") return parseJpegDimensions(buffer);
  if (format === "gif") return parseGifDimensions(buffer);
  if (format === "webp") return parseWebpDimensions(buffer);
  if (format === "ico") return parseIcoDimensions(buffer);
  return null;
}

function candidatePriority(candidate, pageOrigin) {
  const sameOrigin = pageOrigin && candidate.url.startsWith(pageOrigin) ? 25 : 0;
  const ext = extFromUrl(candidate.url);
  const extBonus = ext === "png" ? 20 : ext === "webp" ? 18 : ext === "ico" ? 8 : 0;
  return (
    (candidate.sizeHint || 0) +
    linkRelWeight(candidate.rel) +
    sourceWeight(candidate.source) +
    sameOrigin +
    extBonus
  );
}

function sanitizeFilename(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function fetchWithTimeout(url, { timeoutMs, headers = {}, responseType = "text" }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers,
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, status: res.status, url: res.url };
    if (responseType === "arrayBuffer") {
      const arr = await res.arrayBuffer();
      return { ok: true, status: res.status, url: res.url, headers: res.headers, data: Buffer.from(arr) };
    }
    const text = await res.text();
    return { ok: true, status: res.status, url: res.url, headers: res.headers, data: text };
  } catch (error) {
    return { ok: false, error: String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

function extractCandidatesFromHtml(html, pageUrl) {
  const iconCandidates = [];
  const manifestUrls = [];
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];

  for (const tag of linkTags) {
    const attrs = parseAttributes(tag);
    const rel = (attrs.rel || "").toLowerCase();
    const href = attrs.href || "";
    if (!href) continue;
    const abs = resolveUrl(pageUrl, href);
    if (!abs) continue;

    if (rel.includes("manifest")) {
      manifestUrls.push(abs);
    }

    if (
      rel.includes("icon") ||
      rel.includes("apple-touch-icon") ||
      rel.includes("mask-icon")
    ) {
      iconCandidates.push({
        url: abs,
        rel,
        type: (attrs.type || "").toLowerCase(),
        sizeHint: parseSizeHint(attrs.sizes),
        source: "html",
      });
    }
  }

  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const attrs = parseAttributes(tag);
    const property = (attrs.property || attrs.name || "").toLowerCase();
    const content = attrs.content || "";
    if (!content) continue;
    if (
      property === "og:image" ||
      property === "og:image:url" ||
      property === "og:image:secure_url" ||
      property === "twitter:image" ||
      property === "twitter:image:src" ||
      property === "msapplication-tileimage"
    ) {
      const abs = resolveUrl(pageUrl, content);
      if (!abs) continue;
      iconCandidates.push({
        url: abs,
        rel: `meta:${property}`,
        type: "",
        sizeHint: 256,
        source: "meta",
      });
    }
  }

  return { iconCandidates, manifestUrls };
}

async function extractCandidatesFromManifest(manifestUrl, timeoutMs) {
  const res = await fetchWithTimeout(manifestUrl, {
    timeoutMs,
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok || !res.data) return [];
  let parsed;
  try {
    parsed = JSON.parse(res.data);
  } catch {
    return [];
  }
  if (!parsed || !Array.isArray(parsed.icons)) return [];
  return parsed.icons
    .map((icon) => {
      const src = resolveUrl(manifestUrl, icon?.src);
      if (!src) return null;
      return {
        url: src,
        rel: "manifest-icon",
        type: (icon?.type || "").toLowerCase(),
        sizeHint: parseSizeHint(icon?.sizes),
        source: "manifest",
      };
    })
    .filter(Boolean);
}

function defaultOriginCandidates(origin) {
  if (!origin) return [];
  return [
    { url: `${origin}/apple-touch-icon.png`, rel: "apple-touch-icon", type: "image/png", sizeHint: 180, source: "fallback" },
    { url: `${origin}/android-chrome-512x512.png`, rel: "icon", type: "image/png", sizeHint: 512, source: "fallback" },
    { url: `${origin}/android-chrome-192x192.png`, rel: "icon", type: "image/png", sizeHint: 192, source: "fallback" },
    { url: `${origin}/favicon-512x512.png`, rel: "icon", type: "image/png", sizeHint: 512, source: "fallback" },
    { url: `${origin}/favicon-192x192.png`, rel: "icon", type: "image/png", sizeHint: 192, source: "fallback" },
    { url: `${origin}/favicon-96x96.png`, rel: "icon", type: "image/png", sizeHint: 96, source: "fallback" },
    { url: `${origin}/favicon-32x32.png`, rel: "icon", type: "image/png", sizeHint: 32, source: "fallback" },
    { url: `${origin}/favicon.png`, rel: "icon", type: "image/png", sizeHint: 64, source: "fallback" },
    { url: `${origin}/favicon.ico`, rel: "icon", type: "image/x-icon", sizeHint: 64, source: "fallback" },
  ];
}

async function fetchIconCandidate(candidate, timeoutMs) {
  const res = await fetchWithTimeout(candidate.url, {
    timeoutMs,
    responseType: "arrayBuffer",
    headers: {
      Accept: "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
      "User-Agent": USER_AGENT,
      Referer: candidate.referrer || undefined,
    },
  });
  if (!res.ok || !res.data) {
    return { ok: false, reason: `fetch-failed:${res.status || "error"}` };
  }

  if (res.data.length === 0) return { ok: false, reason: "empty" };
  if (res.data.length > MAX_ICON_BYTES) return { ok: false, reason: "too-large" };

  const contentType = (res.headers?.get("content-type") || "").toLowerCase();
  const format = formatFromContentType(contentType, candidate.url);
  if (format === "svg") return { ok: false, reason: "svg-skipped" };
  if (!format) return { ok: false, reason: "unknown-format" };
  if (!isSupportedUploadFormat(format)) return { ok: false, reason: `unsupported-format:${format}` };

  const dims = probeImage(res.data, format);
  if (!dims) return { ok: false, reason: "unreadable-dimensions", format };

  return {
    ok: true,
    url: res.url || candidate.url,
    contentType: contentType || `image/${format === "jpg" ? "jpeg" : format}`,
    format,
    width: dims.width,
    height: dims.height,
    bytes: res.data,
    source: candidate.source,
    rel: candidate.rel,
  };
}

function rankIcons(validIcons) {
  const score = (icon) => {
    const minEdge = Math.min(icon.width, icon.height);
    const boundedMinEdge = Math.min(minEdge, 256);
    const ratio = icon.width / icon.height;
    const aspectPenalty = Math.min(Math.abs(Math.log2(ratio)) / 2, 0.75);
    const aspectMultiplier = 1 - aspectPenalty;
    const formatBoost =
      icon.format === "png" ? 1.08 : icon.format === "webp" ? 1.04 : 1.0;
    return boundedMinEdge * aspectMultiplier * formatBoost;
  };

  return [...validIcons].sort((a, b) => {
    const scoreDiff = score(b) - score(a);
    if (scoreDiff !== 0) return scoreDiff;
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA;
  });
}

async function discoverBestIcon(resourceUrl, { minSize, timeoutMs }) {
  const normalized = normalizeUrl(resourceUrl);
  if (!normalized) return { ok: false, reason: "invalid-url" };

  const origin = normalizeOrigin(normalized);
  const pageRes = await fetchWithTimeout(normalized, {
    timeoutMs,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": USER_AGENT,
    },
  });

  let allCandidates = [];
  let pageUrl = normalized;

  if (pageRes.ok && typeof pageRes.data === "string") {
    pageUrl = pageRes.url || normalized;
    const { iconCandidates, manifestUrls } = extractCandidatesFromHtml(pageRes.data, pageUrl);
    allCandidates.push(...iconCandidates);

    for (const manifestUrl of manifestUrls.slice(0, 3)) {
      const manifestCandidates = await extractCandidatesFromManifest(manifestUrl, timeoutMs);
      allCandidates.push(...manifestCandidates);
    }
  }

  allCandidates.push(...defaultOriginCandidates(origin));

  const seen = new Set();
  const deduped = [];
  for (const candidate of allCandidates) {
    if (!candidate?.url) continue;
    if (seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    deduped.push(candidate);
  }

  deduped.sort((a, b) => candidatePriority(b, origin) - candidatePriority(a, origin));

  const valid = [];
  for (const candidate of deduped.slice(0, 25)) {
    const icon = await fetchIconCandidate(candidate, timeoutMs);
    if (!icon.ok) continue;
    const ratio = icon.width / icon.height;
    if (!Number.isFinite(ratio) || ratio > 3 || ratio < 1 / 3) continue;
    const minEdge = Math.min(icon.width, icon.height);
    if (minEdge < minSize) continue;
    valid.push(icon);
    if (Math.min(icon.width, icon.height) >= 256 && (icon.format === "png" || icon.format === "webp")) {
      break;
    }
  }

  if (origin) {
    const host = new URL(origin).hostname;
    const s2Candidates = [
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=512`,
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=512`,
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=256`,
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=256`,
    ];
    for (const s2Url of s2Candidates) {
      const fallback = await fetchIconCandidate(
        { url: s2Url, source: "google-s2", rel: "google-s2" },
        timeoutMs
      );
      if (fallback.ok && Math.min(fallback.width, fallback.height) >= minSize) {
        valid.push(fallback);
      }
    }
  }

  const ranked = rankIcons(valid);
  if (ranked.length === 0) return { ok: false, reason: "no-valid-icon" };
  return { ok: true, icons: ranked };
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  const results = new Array(items.length);

  async function loop() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => loop()));
  return results;
}

function buildClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_API_TOKEN;

  if (!projectId || !token) {
    throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN.");
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: "2025-01-01",
    useCdn: false,
    token,
  });
}

function iconFilename(resource, icon) {
  const base = sanitizeFilename(resource.slug || resource.title || resource._id || "resource");
  const ext = icon.format === "jpg" ? "jpg" : icon.format;
  return `${base}-icon.${ext}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(REPORT_DIR);

  const client = buildClient();
  const resources = await client.fetch(`*[_type=="resource"]|order(_createdAt asc){
    _id,
    title,
    slug,
    url,
    "hasIcon": defined(icon.asset)
  }`);

  const target = resources
    .filter((resource) => args.force || !resource.hasIcon)
    .slice(0, args.limit > 0 ? args.limit : resources.length);

  console.log(
    JSON.stringify(
      {
        totalResources: resources.length,
        targetResources: target.length,
        force: args.force,
        minSize: args.minSize,
        concurrency: args.concurrency,
        timeoutMs: args.timeoutMs,
      },
      null,
      2
    )
  );

  const startedAt = new Date().toISOString();
  const report = {
    startedAt,
    endedAt: null,
    args,
    totals: {
      totalResources: resources.length,
      targetResources: target.length,
      updated: 0,
      skipped: 0,
      failed: 0,
    },
    results: [],
  };

  let completed = 0;
  const results = await runPool(target, args.concurrency, async (resource) => {
    const prefix = `[${completed + 1}/${target.length}]`;
    try {
      const discovered = await discoverBestIcon(resource.url, {
        minSize: args.minSize,
        timeoutMs: args.timeoutMs,
      });

      if (!discovered.ok) {
        completed += 1;
        console.log(`${prefix} SKIP ${resource.title} (${discovered.reason})`);
        return {
          _id: resource._id,
          title: resource.title,
          url: resource.url,
          status: "skipped",
          reason: discovered.reason,
        };
      }

      let patched = null;
      let icon = null;
      let lastUploadError = null;

      for (const candidate of discovered.icons) {
        try {
          const filename = iconFilename(resource, candidate);
          const asset = await client.assets.upload("image", candidate.bytes, {
            filename,
            contentType: candidate.contentType,
          });
          await client
            .patch(resource._id)
            .set({
              icon: {
                _type: "image",
                asset: { _type: "reference", _ref: asset._id },
              },
            })
            .commit();
          icon = candidate;
          patched = asset;
          break;
        } catch (uploadError) {
          lastUploadError = String(uploadError);
        }
      }

      if (!patched || !icon) {
        throw new Error(lastUploadError || "upload-failed");
      }

      completed += 1;
      console.log(
        `${prefix} OK   ${resource.title} -> ${icon.width}x${icon.height} (${icon.format}, ${icon.source})`
      );

      return {
        _id: resource._id,
        title: resource.title,
        url: resource.url,
        status: "updated",
        width: icon.width,
        height: icon.height,
        format: icon.format,
        source: icon.source,
        assetId: patched._id,
      };
    } catch (error) {
      completed += 1;
      const reason = String(error);
      console.log(`${prefix} FAIL ${resource.title} (${reason})`);
      return {
        _id: resource._id,
        title: resource.title,
        url: resource.url,
        status: "failed",
        reason,
      };
    }
  });

  report.results = results;
  report.totals.updated = results.filter((r) => r.status === "updated").length;
  report.totals.skipped = results.filter((r) => r.status === "skipped").length;
  report.totals.failed = results.filter((r) => r.status === "failed").length;
  report.endedAt = new Date().toISOString();

  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        updated: report.totals.updated,
        skipped: report.totals.skipped,
        failed: report.totals.failed,
        reportFile: REPORT_FILE,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
