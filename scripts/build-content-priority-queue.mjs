#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT = path.join(process.cwd(), "scripts", "batch-resources-data.json");
const DEFAULT_OUTPUT_JSON = path.join(
  process.cwd(),
  "automation",
  "content-priority-queue.json"
);
const DEFAULT_OUTPUT_CSV = path.join(
  process.cwd(),
  "automation",
  "content-priority-top200.csv"
);

const CATEGORY_BUSINESS_WEIGHTS = {
  "ai-tools": 25,
  "development-tools": 24,
  "design-tools": 22,
  productivity: 20,
  "ui-ux-resources": 18,
  "learning-resources": 16,
  inspiration: 14,
  webflow: 18,
  shadcn: 19,
  coding: 20,
  github: 20,
  html: 15,
  css: 15,
  javascript: 19,
  languages: 18,
  miscellaneous: 12,
};

const CATEGORY_VOLATILITY_WEIGHTS = {
  "ai-tools": 15,
  "development-tools": 13,
  "design-tools": 11,
  productivity: 9,
  "ui-ux-resources": 8,
  "learning-resources": 7,
  inspiration: 6,
  webflow: 10,
  shadcn: 11,
  coding: 10,
  github: 10,
  html: 6,
  css: 6,
  javascript: 10,
  languages: 9,
  miscellaneous: 5,
};

const DEMAND_TERMS = [
  "best",
  "top",
  "alternatives",
  "vs",
  "compare",
  "comparison",
  "for developers",
  "for designers",
  "guide",
  "tools",
  "software",
  "app",
];

const DECISION_TERMS = [
  "alternative",
  "comparison",
  "pricing",
  "review",
  "workflow",
  "automation",
  "integrations",
  "migration",
  "feature",
];

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(haystack, terms) {
  const text = normalizeText(haystack);
  if (!text) return 0;
  return terms.reduce((count, term) => {
    if (text.includes(term)) return count + 1;
    return count;
  }, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toSlug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toCsvField(value) {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function scoreSearchDemand(item) {
  const titleMatches = countMatches(item.title, DEMAND_TERMS);
  const descMatches = countMatches(item.description, DEMAND_TERMS);
  const tagsMatches = Array.isArray(item.tags)
    ? countMatches(item.tags.join(" "), DEMAND_TERMS)
    : 0;
  const raw = 10 + titleMatches * 8 + descMatches * 4 + tagsMatches * 3;
  return clamp(raw, 0, 40);
}

function scoreBusinessRelevance(item) {
  return CATEGORY_BUSINESS_WEIGHTS[item.category] ?? 10;
}

function scoreDecisionPotential(item) {
  const titleMatches = countMatches(item.title, DECISION_TERMS);
  const descMatches = countMatches(item.description, DECISION_TERMS);
  const tagsMatches = Array.isArray(item.tags)
    ? countMatches(item.tags.join(" "), DECISION_TERMS)
    : 0;
  const raw = 4 + titleMatches * 5 + descMatches * 3 + tagsMatches * 2;
  return clamp(raw, 0, 20);
}

function scoreFreshnessVolatility(item) {
  const base = CATEGORY_VOLATILITY_WEIGHTS[item.category] ?? 5;
  const titleBoost = countMatches(item.title, ["ai", "copilot", "model", "api", "framework"]) > 0 ? 1 : 0;
  return clamp(base + titleBoost, 0, 15);
}

function assignTier(rank) {
  if (rank <= 50) return "tier1";
  if (rank <= 200) return "tier2";
  return "tier3";
}

function main() {
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_INPUT;
  const outputJsonPath = process.argv[3]
    ? path.resolve(process.argv[3])
    : DEFAULT_OUTPUT_JSON;
  const outputCsvPath = process.argv[4]
    ? path.resolve(process.argv[4])
    : DEFAULT_OUTPUT_CSV;

  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("Expected an array of resources in batch input.");
    process.exit(1);
  }

  const scored = raw.map((item) => {
    const searchDemandScore = scoreSearchDemand(item);
    const businessRelevanceScore = scoreBusinessRelevance(item);
    const decisionPotentialScore = scoreDecisionPotential(item);
    const freshnessVolatilityScore = scoreFreshnessVolatility(item);
    const totalScore =
      searchDemandScore +
      businessRelevanceScore +
      decisionPotentialScore +
      freshnessVolatilityScore;

    return {
      title: item.title ?? "",
      slug: toSlug(item.slug || item.title),
      category: item.category ?? "miscellaneous",
      url: item.url ?? "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      searchDemandScore,
      businessRelevanceScore,
      decisionPotentialScore,
      freshnessVolatilityScore,
      totalScore,
    };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore || a.title.localeCompare(b.title));

  const queue = scored.map((item, index) => {
    const rank = index + 1;
    return {
      ...item,
      rank,
      contentTier: assignTier(rank),
    };
  });

  const top200 = queue.slice(0, 200);

  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
  fs.mkdirSync(path.dirname(outputCsvPath), { recursive: true });

  fs.writeFileSync(
    outputJsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        inputPath,
        total: queue.length,
        top200Count: top200.length,
        tierCounts: {
          tier1: queue.filter((entry) => entry.contentTier === "tier1").length,
          tier2: queue.filter((entry) => entry.contentTier === "tier2").length,
          tier3: queue.filter((entry) => entry.contentTier === "tier3").length,
        },
        queue,
      },
      null,
      2
    )
  );

  const csvHeader = [
    "rank",
    "contentTier",
    "title",
    "category",
    "url",
    "totalScore",
    "searchDemandScore",
    "businessRelevanceScore",
    "decisionPotentialScore",
    "freshnessVolatilityScore",
  ];
  const csvRows = [
    csvHeader.join(","),
    ...top200.map((entry) =>
      [
        entry.rank,
        entry.contentTier,
        entry.title,
        entry.category,
        entry.url,
        entry.totalScore,
        entry.searchDemandScore,
        entry.businessRelevanceScore,
        entry.decisionPotentialScore,
        entry.freshnessVolatilityScore,
      ]
        .map(toCsvField)
        .join(",")
    ),
  ];
  fs.writeFileSync(outputCsvPath, `${csvRows.join("\n")}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputJsonPath,
        outputCsvPath,
        totalResources: queue.length,
        top200Count: top200.length,
      },
      null,
      2
    )
  );
}

main();
