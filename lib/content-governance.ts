import fs from "node:fs";
import path from "node:path";

export type KeywordCanonicalEntry = {
  keyword: string;
  url: string;
  normalizedKeyword: string;
  keywordTokens: string[];
};

export type KeywordCollision = {
  keyword: string;
  canonicalUrl: string;
  score: number;
};

const KEYWORD_MAP_PATH = path.join(
  process.cwd(),
  "docs",
  "seo-keyword-to-url-map.md"
);

let cachedEntries: KeywordCanonicalEntry[] | null = null;

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function parseKeywordMap(markdown: string): KeywordCanonicalEntry[] {
  const entries: KeywordCanonicalEntry[] = [];
  const lineRegex = /^\|\s*([^|`]+?)\s*\|\s*`?([^|`]+)`?\s*\|$/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(markdown)) !== null) {
    const keyword = match[1]?.trim();
    const url = match[2]?.trim();
    if (!keyword || !url || !url.startsWith("/")) continue;
    if (keyword.toLowerCase() === "keyword" || url.toLowerCase() === "url") {
      continue;
    }
    const keywordTokens = tokenize(keyword);
    if (keywordTokens.length === 0) continue;
    entries.push({
      keyword,
      url,
      normalizedKeyword: normalizeText(keyword),
      keywordTokens,
    });
  }
  return entries;
}

export function loadKeywordCanonicalMap(): KeywordCanonicalEntry[] {
  if (cachedEntries) return cachedEntries;
  if (!fs.existsSync(KEYWORD_MAP_PATH)) {
    cachedEntries = [];
    return cachedEntries;
  }
  const markdown = fs.readFileSync(KEYWORD_MAP_PATH, "utf8");
  cachedEntries = parseKeywordMap(markdown);
  return cachedEntries;
}

function overlapScore(titleTokens: string[], keywordTokens: string[]): number {
  const titleSet = new Set(titleTokens);
  const keywordSet = new Set(keywordTokens);
  let shared = 0;
  for (const token of titleSet) {
    if (keywordSet.has(token)) shared += 1;
  }
  if (shared === 0) return 0;
  const maxSize = Math.max(titleSet.size, keywordSet.size);
  return shared / maxSize;
}

export function detectKeywordCollision(
  title: string,
  proposedSlug: string,
  threshold: number = 0.85
): KeywordCollision | null {
  const entries = loadKeywordCanonicalMap();
  if (entries.length === 0) return null;

  const normalizedTitle = normalizeText(title);
  const titleTokens = tokenize(title);
  const proposedPath = `/${proposedSlug}`;

  if (!normalizedTitle || titleTokens.length === 0) return null;

  let best: KeywordCollision | null = null;
  for (const entry of entries) {
    if (entry.url === proposedPath) continue;

    let score = 0;
    const tokenCountMax = Math.max(titleTokens.length, entry.keywordTokens.length);
    const tokenCountMin = Math.min(titleTokens.length, entry.keywordTokens.length);

    if (normalizedTitle === entry.normalizedKeyword) {
      score = 1;
    } else if (
      tokenCountMin >= 3 &&
      (normalizedTitle.includes(entry.normalizedKeyword) ||
        entry.normalizedKeyword.includes(normalizedTitle))
    ) {
      score = 0.95;
    } else {
      score = overlapScore(titleTokens, entry.keywordTokens);
    }

    if (score < threshold) continue;
    if (tokenCountMax < 3 && score < 1) continue;

    if (!best || score > best.score) {
      best = {
        keyword: entry.keyword,
        canonicalUrl: entry.url,
        score,
      };
    }
  }

  return best;
}
