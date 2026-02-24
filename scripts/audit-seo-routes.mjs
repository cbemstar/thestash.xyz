#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_BASE_URL =
  process.env.SEO_AUDIT_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";
const DEFAULT_MAP_FILE = path.join(process.cwd(), "docs", "seo-keyword-to-url-map.md");

const HELP_TEXT = `
SEO route integrity audit

Usage:
  node scripts/audit-seo-routes.mjs [options]

Options:
  --base-url <url>      Base site URL to audit. Default: ${DEFAULT_BASE_URL}
  --map-file <path>     Keyword map markdown file. Default: ${DEFAULT_MAP_FILE}
  --timeout-ms <ms>     Per-request timeout. Default: 12000
  --output <path>       Write JSON audit report
  --list                Print discovered URLs only (no network requests)
  --help                Show this help text
`;

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    mapFile: DEFAULT_MAP_FILE,
    timeoutMs: 12000,
    outputPath: "",
    listOnly: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--list") {
      args.listOnly = true;
      continue;
    }
    if (arg === "--base-url") {
      args.baseUrl = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg === "--map-file") {
      args.mapFile = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg === "--timeout-ms") {
      const value = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isNaN(value) && value > 0) args.timeoutMs = value;
      i += 1;
      continue;
    }
    if (arg === "--output") {
      args.outputPath = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    console.warn(`Ignoring unknown argument: ${arg}`);
  }

  return args;
}

function normalizePathname(inputPath) {
  if (!inputPath) return "/";
  let value = inputPath.trim();
  if (!value.startsWith("/")) value = `/${value}`;
  if (value.length > 1 && value.endsWith("/")) value = value.slice(0, -1);
  return value;
}

function parseMapUrls(markdown) {
  const tableLineRegex =
    /^\|\s*[^|]+\|\s*`(\/[a-z0-9\-/.]*)`\s*\|/gim;
  const matches = [...markdown.matchAll(tableLineRegex)];
  const urls = matches.map((match) => normalizePathname(match[1]));
  const seedPaths = ["/alternatives", "/compare", "/use-cases", "/reports"];
  return [...new Set([...urls, ...seedPaths])];
}

function parseCanonicalHref(html) {
  const linkMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!linkMatch) return "";
  const hrefMatch = linkMatch[0].match(/href=["']([^"']+)["']/i);
  return hrefMatch?.[1] ?? "";
}

function parseMetaRobots(html) {
  const robotsMatch = html.match(
    /<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i
  );
  return (robotsMatch?.[1] ?? "").toLowerCase();
}

function reverseComparePath(pathname) {
  const normalized = normalizePathname(pathname);
  if (!normalized.startsWith("/compare/")) return "";
  const slug = normalized.replace("/compare/", "");
  const [left, right, extra] = slug.split("-vs-");
  if (!left || !right || extra) return "";
  return `/compare/${right}-vs-${left}`;
}

function toAbsoluteUrl(baseUrl, pathname) {
  const normalizedPath = normalizePathname(pathname);
  const url = new URL(baseUrl);
  url.pathname = normalizedPath;
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function mapWithConcurrency(items, limit, mapper) {
  const maxWorkers = Math.max(1, limit);
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from(
    { length: Math.min(maxWorkers, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHtmlAudit(baseUrl, pathname, timeoutMs) {
  const url = toAbsoluteUrl(baseUrl, pathname);
  const response = await fetchWithTimeout(
    url,
    {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "TheStashSeoRouteAudit/1.0",
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    },
    timeoutMs
  );

  const contentType = response.headers.get("content-type") ?? "";
  const html = contentType.includes("text/html") ? await response.text() : "";

  const finalUrl = response.url || url;
  const canonicalHref = parseCanonicalHref(html);
  const canonicalAbs = canonicalHref ? new URL(canonicalHref, baseUrl).toString() : "";
  const canonicalPath = canonicalAbs ? normalizePathname(new URL(canonicalAbs).pathname) : "";
  const finalPath = normalizePathname(new URL(finalUrl).pathname);
  const metaRobots = html ? parseMetaRobots(html) : "";
  const noindex = metaRobots.includes("noindex");

  return {
    pathname: normalizePathname(pathname),
    requestedUrl: url,
    status: response.status,
    finalUrl,
    finalPath,
    canonicalHref,
    canonicalAbs,
    canonicalPath,
    canonicalMatchesPath: canonicalPath === normalizePathname(pathname),
    noindex,
  };
}

async function fetchManual(url, timeoutMs) {
  const response = await fetchWithTimeout(
    url,
    {
      method: "GET",
      redirect: "manual",
      headers: {
        "user-agent": "TheStashSeoRouteAudit/1.0",
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    },
    timeoutMs
  );
  return response;
}

async function fetchSitemapPaths(baseUrl, timeoutMs) {
  const sitemapUrl = toAbsoluteUrl(baseUrl, "/sitemap.xml");
  try {
    const response = await fetchWithTimeout(
      sitemapUrl,
      {
        method: "GET",
        redirect: "follow",
        headers: {
          "user-agent": "TheStashSeoRouteAudit/1.0",
          accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
        },
      },
      timeoutMs
    );
    if (!response.ok) {
      return { ok: false, status: response.status, paths: [], sitemapUrl, error: "" };
    }
    const xml = await response.text();
    const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
    const paths = locMatches.map((match) => {
      try {
        return normalizePathname(new URL(match[1]).pathname);
      } catch {
        return "";
      }
    });
    return {
      ok: true,
      status: response.status,
      paths: [...new Set(paths.filter(Boolean))],
      sitemapUrl,
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      paths: [],
      sitemapUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function printList(paths) {
  console.log(`Discovered ${paths.length} SEO target URLs:`);
  for (const pathname of paths) {
    console.log(`- ${pathname}`);
  }
}

function summarizeResults(items) {
  const failingStatus = items.filter((item) => item.status !== 200);
  const failingCanonical = items.filter(
    (item) => item.status === 200 && !item.canonicalMatchesPath
  );
  const noCanonical = items.filter((item) => item.status === 200 && !item.canonicalPath);
  const noindexItems = items.filter((item) => item.status === 200 && item.noindex);
  const canonicalIndex = new Map();
  for (const item of items) {
    if (!item.canonicalPath) continue;
    const list = canonicalIndex.get(item.canonicalPath) ?? [];
    list.push(item.pathname);
    canonicalIndex.set(item.canonicalPath, list);
  }
  const duplicateCanonicalGroups = [...canonicalIndex.entries()]
    .filter(([, sources]) => new Set(sources).size > 1)
    .map(([canonicalPath, sources]) => ({ canonicalPath, sources: [...new Set(sources)] }));

  return {
    failingStatus,
    failingCanonical,
    noCanonical,
    noindexItems,
    duplicateCanonicalGroups,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(HELP_TEXT.trim());
    process.exit(0);
  }

  if (!fs.existsSync(args.mapFile)) {
    console.error(`Keyword map file not found: ${args.mapFile}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(args.mapFile, "utf8");
  const targetPaths = parseMapUrls(markdown);

  if (targetPaths.length === 0) {
    console.error("No target URLs discovered from keyword map.");
    process.exit(1);
  }

  if (args.listOnly) {
    printList(targetPaths);
    process.exit(0);
  }

  const auditItems = await mapWithConcurrency(targetPaths, 8, async (pathname) => {
    try {
      return await fetchHtmlAudit(args.baseUrl, pathname, args.timeoutMs);
    } catch (error) {
      return {
        pathname,
        requestedUrl: toAbsoluteUrl(args.baseUrl, pathname),
        status: 0,
        finalUrl: "",
        finalPath: "",
        canonicalHref: "",
        canonicalAbs: "",
        canonicalPath: "",
        canonicalMatchesPath: false,
        noindex: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const reverseTargets = targetPaths
    .map((pathname) => ({ canonicalPath: pathname, reversedPath: reverseComparePath(pathname) }))
    .filter(
      (target) => target.reversedPath && target.reversedPath !== target.canonicalPath
    );
  const reverseCompareChecks = await mapWithConcurrency(reverseTargets, 8, async (target) => {
    const reversedUrl = toAbsoluteUrl(args.baseUrl, target.reversedPath);
    try {
      const response = await fetchManual(reversedUrl, args.timeoutMs);
      const location = response.headers.get("location") ?? "";
      const locationPath = location
        ? normalizePathname(new URL(location, args.baseUrl).pathname)
        : "";
      const redirected =
        response.status === 301 ||
        response.status === 302 ||
        response.status === 307 ||
        response.status === 308;
      const passes = redirected && locationPath === target.canonicalPath;
      return {
        canonicalPath: target.canonicalPath,
        reversedPath: target.reversedPath,
        status: response.status,
        location,
        locationPath,
        pass: passes,
      };
    } catch (error) {
      return {
        canonicalPath: target.canonicalPath,
        reversedPath: target.reversedPath,
        status: 0,
        location: "",
        locationPath: "",
        pass: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const sitemap = await fetchSitemapPaths(args.baseUrl, args.timeoutMs);
  const missingFromSitemap = sitemap.ok
    ? targetPaths.filter((pathname) => !sitemap.paths.includes(pathname))
    : [...targetPaths];

  const summaries = summarizeResults(auditItems);
  const failedReverseRedirects = reverseCompareChecks.filter((check) => !check.pass);

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: args.baseUrl,
    mapFile: args.mapFile,
    totals: {
      audited: targetPaths.length,
      statusFailures: summaries.failingStatus.length,
      canonicalFailures: summaries.failingCanonical.length,
      missingCanonical: summaries.noCanonical.length,
      noindexFailures: summaries.noindexItems.length,
      duplicateCanonicalGroups: summaries.duplicateCanonicalGroups.length,
      reverseRedirectFailures: failedReverseRedirects.length,
      sitemapMissing: missingFromSitemap.length,
    },
    items: auditItems,
    reverseCompareChecks,
    sitemap,
    failures: {
      status: summaries.failingStatus,
      canonical: summaries.failingCanonical,
      missingCanonical: summaries.noCanonical,
      noindex: summaries.noindexItems,
      duplicateCanonicalGroups: summaries.duplicateCanonicalGroups,
      reverseRedirects: failedReverseRedirects,
      missingFromSitemap,
    },
  };

  if (args.outputPath) {
    fs.writeFileSync(args.outputPath, JSON.stringify(report, null, 2));
    console.log(`Wrote audit report: ${args.outputPath}`);
  }

  console.log("SEO route audit summary");
  console.log(`- Base URL: ${args.baseUrl}`);
  console.log(`- Audited URLs: ${report.totals.audited}`);
  console.log(`- Status failures: ${report.totals.statusFailures}`);
  console.log(`- Canonical failures: ${report.totals.canonicalFailures}`);
  console.log(`- Missing canonical: ${report.totals.missingCanonical}`);
  console.log(`- Noindex failures: ${report.totals.noindexFailures}`);
  console.log(`- Duplicate canonical groups: ${report.totals.duplicateCanonicalGroups}`);
  console.log(`- Reverse redirect failures: ${report.totals.reverseRedirectFailures}`);
  console.log(`- Missing from sitemap: ${report.totals.sitemapMissing}`);

  const hasFailures =
    report.totals.statusFailures > 0 ||
    report.totals.canonicalFailures > 0 ||
    report.totals.missingCanonical > 0 ||
    report.totals.noindexFailures > 0 ||
    report.totals.duplicateCanonicalGroups > 0 ||
    report.totals.reverseRedirectFailures > 0 ||
    report.totals.sitemapMissing > 0;

  process.exit(hasFailures ? 1 : 0);
}

main().catch((error) => {
  console.error("SEO route audit crashed:", error);
  process.exit(1);
});
