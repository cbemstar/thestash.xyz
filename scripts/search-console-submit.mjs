#!/usr/bin/env node
/**
 * Submit sitemap (and optional URLs) to Google Search Console via the app API.
 * Usage:
 *   GSC_WEBHOOK_SECRET=xxx NEXT_PUBLIC_SITE_URL=https://www.thestash.xyz node scripts/search-console-submit.mjs
 *   GSC_WEBHOOK_SECRET=xxx BASE_URL=https://www.thestash.xyz node scripts/search-console-submit.mjs [apiBaseUrl]
 *
 * If running against local dev: node scripts/search-console-submit.mjs http://localhost:3000
 */

const secret = process.env.GSC_WEBHOOK_SECRET?.trim();
const baseUrl =
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.thestash.xyz";
const apiBase = process.argv[2]?.replace(/\/$/, "") || baseUrl;
const url = `${apiBase}/api/search-console/submit`;

if (!secret) {
  console.error("Set GSC_WEBHOOK_SECRET in the environment.");
  process.exit(1);
}

async function main() {
  const body = {
    sitemaps: [`${baseUrl.replace(/\/$/, "")}/sitemap.xml`],
    urls: [], // optional: add key URLs for Indexing API (quota 200/day)
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-gsc-secret": secret,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Submit failed:", res.status, data);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
