#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_BASE_URL =
  process.env.SEO_AUDIT_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    outputPath: "",
    timeoutMs: 12000,
    help: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--base-url") {
      args.baseUrl = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg === "--output") {
      args.outputPath = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg === "--timeout-ms") {
      const value = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isNaN(value) && value > 0) args.timeoutMs = value;
      i += 1;
      continue;
    }
    console.warn(`Ignoring unknown argument: ${arg}`);
  }

  return args;
}

function printHelp() {
  console.log(`SEO prune report\n\nUsage:\n  node scripts/seo-prune-report.mjs [options]\n\nOptions:\n  --base-url <url>    Base URL for /api/seo/quality (default: ${DEFAULT_BASE_URL})\n  --output <path>     Write markdown report to file\n  --timeout-ms <ms>   Request timeout (default: 12000)\n  --help              Show this help\n`);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": "TheStashSeoPruneReport/1.0",
        accept: "application/json",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function toMarkdown(report, baseUrl) {
  const failing = report.items.filter((item) => !item.pass);
  const stale = report.items.filter((item) => item.stale);
  const pruneCandidates = failing;

  const lines = [];
  lines.push(`# SEO prune report`);
  lines.push("");
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Source: ${baseUrl}/api/seo/quality`);
  lines.push(`- Total: ${report.summary.total}`);
  lines.push(`- Passing: ${report.summary.passing}`);
  lines.push(`- Failing: ${report.summary.failing}`);
  lines.push(`- Stale: ${report.summary.stale}`);
  lines.push("");

  lines.push(`## Prune or fix candidates (${pruneCandidates.length})`);
  lines.push("");
  if (pruneCandidates.length === 0) {
    lines.push("No prune candidates. All SEO pages pass current quality gate.");
    lines.push("");
  } else {
    for (const item of pruneCandidates) {
      lines.push(`### ${item.title}`);
      lines.push(`- Type: ${item.type}`);
      lines.push(`- Source: ${item.source}`);
      lines.push(`- URL: ${item.url}`);
      lines.push(`- Last reviewed: ${item.lastReviewedAt ?? "missing"}`);
      lines.push(`- Reasons:`);
      for (const reason of item.reasons) {
        lines.push(`  - ${reason}`);
      }
      lines.push("");
    }
  }

  lines.push(`## Freshness queue (${stale.length})`);
  lines.push("");
  if (stale.length === 0) {
    lines.push("No stale pages right now.");
    lines.push("");
  } else {
    for (const item of stale) {
      lines.push(`- ${item.title} (${item.url})`);
    }
    lines.push("");
  }

  lines.push("## Recommended monthly flow");
  lines.push("");
  lines.push("1. Update prune candidates first (fix reasons or keep noindex).\n2. Refresh stale pages (sources, matrix, best-for/not-for, reviewed date).\n3. Re-run route and quality audits before publish.");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const baseUrl = args.baseUrl.replace(/\/$/, "");
  if (!baseUrl) {
    console.error("Missing --base-url value.");
    process.exit(1);
  }

  const qualityUrl = `${baseUrl}/api/seo/quality`;
  let response;
  try {
    response = await fetchWithTimeout(qualityUrl, args.timeoutMs);
  } catch (error) {
    console.error(`Failed to reach quality endpoint: ${qualityUrl}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`Quality endpoint failed: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const report = await response.json();
  if (!report?.summary || !Array.isArray(report?.items)) {
    console.error("Invalid quality report payload.");
    process.exit(1);
  }

  const markdown = toMarkdown(report, baseUrl);
  console.log(markdown);

  if (args.outputPath) {
    const outputPath = path.resolve(process.cwd(), args.outputPath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdown, "utf8");
    console.log(`\nWrote prune report to ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
