#!/usr/bin/env node
/**
 * Fetch index status for URLs from Search Console (URL Inspection API).
 * Calls the app API: GET /api/search-console/index-status?urls=...
 *
 * Usage:
 *   node --env-file=env.gsc.vercel scripts/search-console-index-status.mjs [apiBaseUrl]
 *   node --env-file=env.gsc.vercel scripts/search-console-index-status.mjs http://localhost:3000
 *
 * If no URLs provided via SITEMAP_SAMPLE=N, fetches first N URLs from sitemap (default 20).
 * Or set URLS=url1,url2,url3 to check specific URLs.
 */

const secret = process.env.GSC_WEBHOOK_SECRET?.trim();
const baseUrl =
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.thestash.xyz";
const apiBase = (process.argv[2] || baseUrl).replace(/\/$/, "");
const apiUrl = `${apiBase}/api/search-console/index-status`;
const sampleSize = Math.min(Number(process.env.SITEMAP_SAMPLE) || 20, 50);
const explicitUrls = process.env.URLS?.trim()?.split(",").map((u) => u.trim()).filter(Boolean);

if (!secret) {
  console.error("Set GSC_WEBHOOK_SECRET (e.g. node --env-file=env.gsc.vercel scripts/search-console-index-status.mjs)");
  process.exit(1);
}

async function getUrlsFromSitemap(count) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/sitemap.xml`);
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return locs.slice(0, count);
}

async function main() {
  const urls = explicitUrls?.length
    ? explicitUrls
    : await getUrlsFromSitemap(sampleSize);
  if (urls.length === 0) {
    console.error("No URLs to check.");
    process.exit(1);
  }
  const query = "urls=" + urls.map((u) => encodeURIComponent(u)).join(",");
  const res = await fetch(`${apiUrl}?${query}`, {
    headers: { "x-gsc-secret": secret },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Request failed:", res.status, data);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
