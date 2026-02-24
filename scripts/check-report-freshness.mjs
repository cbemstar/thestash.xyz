#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const MAX_AGE_DAYS = Number.parseInt(process.env.REPORT_FRESHNESS_MAX_DAYS ?? "120", 10);

if (!Number.isFinite(MAX_AGE_DAYS) || MAX_AGE_DAYS <= 0) {
  console.error("[reports:freshness] REPORT_FRESHNESS_MAX_DAYS must be a positive integer.");
  process.exit(1);
}

const checks = [
  {
    label: "AI coding benchmark",
    file: "lib/benchmark-reports.ts",
    regex: /AI_CODING_BENCHMARK_UPDATED_AT\s*=\s*"([^"]+)"/,
  },
  {
    label: "Industry metrics verification",
    file: "lib/industry-metrics.ts",
    regex: /INDUSTRY_METRICS_VERIFIED_AT\s*=\s*"([^"]+)"/,
  },
  {
    label: "AI discoverability verification",
    file: "lib/ai-discoverability-report.ts",
    regex: /AI_DISCOVERABILITY_REPORT_VERIFIED_AT\s*=\s*"([^"]+)"/,
  },
];

function ageInDays(isoDate) {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return Number.NaN;
  const diffMs = Date.now() - timestamp;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function readDateFromFile(file, regex) {
  const absolutePath = path.join(process.cwd(), file);
  const content = await readFile(absolutePath, "utf8");
  const match = content.match(regex);
  return match?.[1] ?? null;
}

async function main() {
  const results = [];
  for (const check of checks) {
    const dateValue = await readDateFromFile(check.file, check.regex);
    if (!dateValue) {
      console.error(`[reports:freshness] Missing date in ${check.file}`);
      process.exit(1);
    }
    const ageDays = ageInDays(dateValue);
    if (Number.isNaN(ageDays)) {
      console.error(`[reports:freshness] Invalid date "${dateValue}" in ${check.file}`);
      process.exit(1);
    }
    results.push({
      label: check.label,
      file: check.file,
      dateValue,
      ageDays,
      stale: ageDays > MAX_AGE_DAYS,
    });
  }

  console.log(`[reports:freshness] max_age_days=${MAX_AGE_DAYS}`);
  for (const result of results) {
    const state = result.stale ? "STALE" : "OK";
    console.log(
      `${state.padEnd(5)} ${String(result.ageDays).padStart(3)}d ${result.label} (${result.dateValue}) [${result.file}]`
    );
  }

  const staleCount = results.filter((result) => result.stale).length;
  if (staleCount > 0) {
    console.error(
      `[reports:freshness] ${staleCount} check(s) exceed ${MAX_AGE_DAYS} days. Refresh report sources.`
    );
    process.exit(1);
  }

  console.log("[reports:freshness] All report verification timestamps are within threshold.");
}

main().catch((error) => {
  console.error("[reports:freshness] Failed:", error);
  process.exit(1);
});
