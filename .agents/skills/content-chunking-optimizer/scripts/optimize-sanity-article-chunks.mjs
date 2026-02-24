#!/usr/bin/env node

import { createClient } from "@sanity/client";
import { randomUUID } from "node:crypto";

const DEFAULTS = {
  maxParagraphWords: 60,
  maxParagraphSentences: 3,
  maxChunkWords: 42,
  maxChunkSentences: 2,
  maxListItemWords: 24,
  headingLeadMaxWords: 34,
};

function printHelp() {
  console.log(`Optimize Sanity article bodies using content chunking heuristics.

Usage:
  node --env-file=.env.local .agents/skills/content-chunking-optimizer/scripts/optimize-sanity-article-chunks.mjs [options]

Options:
  --apply                         Commit updates to Sanity (default is dry-run)
  --dry-run                       Preview only (default)
  --slug=<slug[,slug2]>           Restrict to one or more slugs
  --limit=<n>                     Restrict number of articles
  --verbose                       Print per-article metrics
  --max-paragraph-words=<n>       Default: ${DEFAULTS.maxParagraphWords}
  --max-paragraph-sentences=<n>   Default: ${DEFAULTS.maxParagraphSentences}
  --max-chunk-words=<n>           Default: ${DEFAULTS.maxChunkWords}
  --max-chunk-sentences=<n>       Default: ${DEFAULTS.maxChunkSentences}
  --max-list-item-words=<n>       Default: ${DEFAULTS.maxListItemWords}
  --heading-lead-max-words=<n>    Default: ${DEFAULTS.headingLeadMaxWords}
  --help                          Show this help
`);
}

function parsePositiveInt(value, flagName) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive integer`);
  }
  return parsed;
}

function parseArgs(argv) {
  const options = {
    apply: false,
    slugs: [],
    limit: 0,
    verbose: false,
    ...DEFAULTS,
  };

  for (const arg of argv) {
    if (arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.apply = false;
      continue;
    }
    if (arg === "--verbose") {
      options.verbose = true;
      continue;
    }
    if (arg.startsWith("--slug=")) {
      const values = arg
        .slice("--slug=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      options.slugs.push(...values);
      continue;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = parsePositiveInt(arg.slice("--limit=".length), "--limit");
      continue;
    }
    if (arg.startsWith("--max-paragraph-words=")) {
      options.maxParagraphWords = parsePositiveInt(
        arg.slice("--max-paragraph-words=".length),
        "--max-paragraph-words"
      );
      continue;
    }
    if (arg.startsWith("--max-paragraph-sentences=")) {
      options.maxParagraphSentences = parsePositiveInt(
        arg.slice("--max-paragraph-sentences=".length),
        "--max-paragraph-sentences"
      );
      continue;
    }
    if (arg.startsWith("--max-chunk-words=")) {
      options.maxChunkWords = parsePositiveInt(arg.slice("--max-chunk-words=".length), "--max-chunk-words");
      continue;
    }
    if (arg.startsWith("--max-chunk-sentences=")) {
      options.maxChunkSentences = parsePositiveInt(
        arg.slice("--max-chunk-sentences=".length),
        "--max-chunk-sentences"
      );
      continue;
    }
    if (arg.startsWith("--max-list-item-words=")) {
      options.maxListItemWords = parsePositiveInt(
        arg.slice("--max-list-item-words=".length),
        "--max-list-item-words"
      );
      continue;
    }
    if (arg.startsWith("--heading-lead-max-words=")) {
      options.headingLeadMaxWords = parsePositiveInt(
        arg.slice("--heading-lead-max-words=".length),
        "--heading-lead-max-words"
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.slugs.length > 0) {
    options.slugs = [...new Set(options.slugs)];
  }

  return options;
}

function makeKey() {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text) {
  const matches = normalizeWhitespace(text).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
  return matches ? matches.length : 0;
}

function splitSentences(text) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'([])/g)
    .map((value) => value.trim())
    .filter(Boolean);

  if (sentences.length > 1) return sentences;

  return normalized
    .split(/;\s+/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function textOfBlock(block) {
  if (!block || !Array.isArray(block.children)) return "";
  return normalizeWhitespace(block.children.map((child) => child?.text || "").join(""));
}

function isHeadingBlock(block) {
  return Boolean(block?._type === "block" && /^h[2-4]$/.test(String(block.style || "")));
}

function isPlainNormalBlock(block) {
  if (!block || block._type !== "block" || block.style !== "normal" || block.listItem) {
    return false;
  }
  if (!Array.isArray(block.children) || block.children.length === 0) {
    return false;
  }
  if (Array.isArray(block.markDefs) && block.markDefs.length > 0) {
    return false;
  }
  return block.children.every((child) => {
    if (!child || child._type !== "span") return false;
    return !Array.isArray(child.marks) || child.marks.length === 0;
  });
}

function plainBlockFromText(templateBlock, text, overrides = {}) {
  const nextText = normalizeWhitespace(text);
  const block = {
    _type: "block",
    _key: overrides._key || templateBlock?._key || makeKey(),
    style: overrides.style || templateBlock?.style || "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: makeKey(),
        text: nextText,
        marks: [],
      },
    ],
  };

  if (overrides.listItem) block.listItem = overrides.listItem;
  if (overrides.level) block.level = overrides.level;

  return block;
}

function bundleSentences(sentences, options) {
  const groups = [];
  let current = [];

  for (const sentence of sentences) {
    if (!sentence) continue;
    if (current.length === 0) {
      current.push(sentence);
      continue;
    }

    const candidate = [...current, sentence];
    const candidateWords = wordCount(candidate.join(" "));

    if (candidate.length > options.maxChunkSentences || candidateWords > options.maxChunkWords) {
      groups.push(current.join(" ").trim());
      current = [sentence];
      continue;
    }

    current.push(sentence);
  }

  if (current.length > 0) {
    groups.push(current.join(" ").trim());
  }

  if (groups.length > 1) {
    const lastIndex = groups.length - 1;
    if (wordCount(groups[lastIndex]) < 8) {
      groups[lastIndex - 1] = `${groups[lastIndex - 1]} ${groups[lastIndex]}`.trim();
      groups.pop();
    }
  }

  return groups.filter(Boolean);
}

function splitLongParagraphBlock(block, options) {
  const originalText = textOfBlock(block);
  if (!originalText) return { blocks: [block], changed: false };

  const sentenceList = splitSentences(originalText);
  const words = wordCount(originalText);
  const needsSplit =
    words > options.maxParagraphWords || sentenceList.length > options.maxParagraphSentences;

  if (!needsSplit || sentenceList.length <= 1) {
    return { blocks: [block], changed: false };
  }

  const chunks = bundleSentences(sentenceList, options);
  if (chunks.length <= 1) {
    return { blocks: [block], changed: false };
  }

  const nextBlocks = chunks.map((chunk, index) =>
    plainBlockFromText(block, chunk, index === 0 ? { _key: block._key } : { _key: makeKey() })
  );

  return { blocks: nextBlocks, changed: true };
}

function forceLeadAnswerAfterHeading(blocks, options) {
  const nextBlocks = [...blocks];
  let changed = false;
  let splitCount = 0;

  for (let i = 0; i < nextBlocks.length - 1; i += 1) {
    const heading = nextBlocks[i];
    const leadBlock = nextBlocks[i + 1];

    if (!isHeadingBlock(heading) || !isPlainNormalBlock(leadBlock)) {
      continue;
    }

    const leadText = textOfBlock(leadBlock);
    const words = wordCount(leadText);
    const sentenceList = splitSentences(leadText);
    if (sentenceList.length < 2 || words <= options.headingLeadMaxWords) {
      continue;
    }

    const firstSentence = normalizeWhitespace(sentenceList[0]);
    const remainder = normalizeWhitespace(sentenceList.slice(1).join(" "));
    if (!firstSentence || !remainder) {
      continue;
    }

    nextBlocks[i + 1] = plainBlockFromText(leadBlock, firstSentence, { _key: leadBlock._key });
    nextBlocks.splice(i + 2, 0, plainBlockFromText(leadBlock, remainder, { _key: makeKey() }));
    changed = true;
    splitCount += 1;
    i += 1;
  }

  return { blocks: nextBlocks, changed, splitCount };
}

function parseOrderedMarker(text) {
  const match = String(text || "").match(/^(\d+)[.)]\s+(.+)$/);
  if (!match) return null;
  return {
    number: Number.parseInt(match[1], 10),
    content: normalizeWhitespace(match[2]),
  };
}

function sanitizeBulletText(text) {
  return normalizeWhitespace(String(text || "").replace(/^[-*•]\s+/, ""));
}

function convertPseudoLists(blocks, options) {
  const nextBlocks = [...blocks];
  let sectionsConverted = 0;
  let itemsConverted = 0;

  for (let i = 0; i < nextBlocks.length - 2; i += 1) {
    const intro = nextBlocks[i];
    if (!isPlainNormalBlock(intro)) continue;

    const introText = textOfBlock(intro);
    if (!introText.endsWith(":")) continue;

    const candidateIndexes = [];
    for (let j = i + 1; j < nextBlocks.length; j += 1) {
      const block = nextBlocks[j];
      if (!isPlainNormalBlock(block)) break;

      const text = textOfBlock(block);
      if (!text || text.endsWith(":")) break;
      if (wordCount(text) > options.maxListItemWords) break;
      if (splitSentences(text).length > 2) break;

      candidateIndexes.push(j);
    }

    if (candidateIndexes.length < 2) {
      continue;
    }

    const orderedCandidates = candidateIndexes.map((index) => parseOrderedMarker(textOfBlock(nextBlocks[index])));
    const isOrdered =
      orderedCandidates.every(Boolean) &&
      orderedCandidates.every((entry, idx) => entry.number === idx + 1);

    for (let idx = 0; idx < candidateIndexes.length; idx += 1) {
      const targetIndex = candidateIndexes[idx];
      const block = nextBlocks[targetIndex];
      const rawText = textOfBlock(block);
      const nextText = isOrdered
        ? orderedCandidates[idx].content
        : sanitizeBulletText(rawText);

      nextBlocks[targetIndex] = plainBlockFromText(block, nextText, {
        _key: block._key || makeKey(),
        listItem: isOrdered ? "number" : "bullet",
        level: 1,
      });
      itemsConverted += 1;
    }

    sectionsConverted += 1;
    i = candidateIndexes[candidateIndexes.length - 1];
  }

  return {
    blocks: nextBlocks,
    changed: sectionsConverted > 0,
    sectionsConverted,
    itemsConverted,
  };
}

function countListStructure(body, options) {
  let structured = 0;
  let pseudo = 0;

  for (let i = 0; i < body.length - 2; i += 1) {
    const intro = body[i];
    if (!(intro?._type === "block" && intro.style === "normal")) continue;
    const introText = textOfBlock(intro);
    if (!introText.endsWith(":")) continue;

    const followers = [];
    for (let j = i + 1; j < body.length; j += 1) {
      const block = body[j];
      if (!(block?._type === "block" && block.style === "normal")) break;

      const text = textOfBlock(block);
      if (!text || text.endsWith(":")) break;
      if (wordCount(text) > options.maxListItemWords) break;
      if (splitSentences(text).length > 2) break;

      followers.push(block);
    }

    if (followers.length < 2) continue;

    if (followers.every((block) => Boolean(block.listItem))) {
      structured += 1;
    } else if (followers.every((block) => !block.listItem)) {
      pseudo += 1;
    }

    i += followers.length;
  }

  return { structured, pseudo };
}

function analyzeBody(body, options) {
  const blocks = Array.isArray(body) ? body : [];
  const normalParagraphs = blocks.filter(
    (block) => block?._type === "block" && block.style === "normal" && !block.listItem
  );

  const longParagraphs = normalParagraphs.filter((block) => wordCount(textOfBlock(block)) > options.maxParagraphWords).length;
  const denseParagraphs = normalParagraphs.filter((block) => splitSentences(textOfBlock(block)).length > 2).length;

  let headingsWithLead = 0;
  let headingLeadMisses = 0;
  for (let i = 0; i < blocks.length - 1; i += 1) {
    if (!isHeadingBlock(blocks[i])) continue;

    const nextBlock = blocks[i + 1];
    if (!(nextBlock?._type === "block" && nextBlock.style === "normal" && !nextBlock.listItem)) {
      continue;
    }

    headingsWithLead += 1;
    const text = textOfBlock(nextBlock);
    if (wordCount(text) > options.headingLeadMaxWords || splitSentences(text).length > 1) {
      headingLeadMisses += 1;
    }
  }

  const listMetrics = countListStructure(blocks, options);
  const paragraphCount = normalParagraphs.length || 1;
  const headingCount = headingsWithLead || 1;
  const listOpportunities = listMetrics.structured + listMetrics.pseudo;

  const shortRatio = 1 - longParagraphs / paragraphCount;
  const densityRatio = 1 - denseParagraphs / paragraphCount;
  const leadRatio = 1 - headingLeadMisses / headingCount;
  const listRatio = listOpportunities ? listMetrics.structured / listOpportunities : 1;

  const score = Math.round(
    100 * (0.35 * shortRatio + 0.3 * leadRatio + 0.2 * densityRatio + 0.15 * listRatio)
  );

  return {
    chunkScore: Math.max(0, Math.min(100, score)),
    paragraphs: normalParagraphs.length,
    longParagraphs,
    denseParagraphs,
    headingsWithLead,
    headingLeadMisses,
    listStructuredSections: listMetrics.structured,
    listPseudoSections: listMetrics.pseudo,
  };
}

function optimizeBody(body, options) {
  if (!Array.isArray(body)) {
    return {
      body,
      changed: false,
      changes: {
        splitParagraphs: 0,
        headingLeadSplits: 0,
        listSectionsConverted: 0,
        listItemsConverted: 0,
      },
    };
  }

  let changed = false;
  const changes = {
    splitParagraphs: 0,
    headingLeadSplits: 0,
    listSectionsConverted: 0,
    listItemsConverted: 0,
  };

  const splitPass = [];
  for (const block of body) {
    if (!isPlainNormalBlock(block)) {
      splitPass.push(block);
      continue;
    }

    const result = splitLongParagraphBlock(block, options);
    splitPass.push(...result.blocks);
    if (result.changed) {
      changed = true;
      changes.splitParagraphs += 1;
    }
  }

  const headingPass = forceLeadAnswerAfterHeading(splitPass, options);
  if (headingPass.changed) {
    changed = true;
    changes.headingLeadSplits += headingPass.splitCount;
  }

  const listPass = convertPseudoLists(headingPass.blocks, options);
  if (listPass.changed) {
    changed = true;
    changes.listSectionsConverted += listPass.sectionsConverted;
    changes.listItemsConverted += listPass.itemsConverted;
  }

  return {
    body: listPass.blocks,
    changed,
    changes,
  };
}

function slugOf(doc) {
  const value = doc?.slug;
  if (typeof value === "string") return value;
  if (value && typeof value.current === "string") return value.current;
  return doc?._id || "unknown";
}

function formatMetrics(metrics) {
  return `score=${metrics.chunkScore}, long=${metrics.longParagraphs}, dense=${metrics.denseParagraphs}, leadMiss=${metrics.headingLeadMisses}, lists=${metrics.listStructuredSections}`;
}

async function fetchArticles(client, options) {
  const filters = ['_type == "article"', '!(_id in path("drafts.**"))'];
  const params = {};
  if (options.slugs.length > 0) {
    filters.push("coalesce(slug.current, slug) in $slugs");
    params.slugs = options.slugs;
  }

  const slice = options.limit > 0 ? `[0...${options.limit}]` : "";
  const query = `*[${filters.join(" && ")}]${slice}{
    _id,
    title,
    slug,
    body
  }`;

  return client.fetch(query, params);
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Argument error: ${error.message}`);
    process.exit(1);
  }

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_API_TOKEN;

  if (!projectId || !token) {
    console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local");
    process.exit(1);
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2025-01-01",
    useCdn: false,
    token,
  });

  const articles = await fetchArticles(client, options);
  if (!Array.isArray(articles) || articles.length === 0) {
    console.log("No matching articles found.");
    process.exit(0);
  }

  console.log(
    `${options.apply ? "Apply" : "Dry-run"} mode on ${articles.length} article(s)` +
      (options.slugs.length ? ` (filtered slugs: ${options.slugs.join(", ")})` : "")
  );

  let candidates = 0;
  let committed = 0;
  let skippedNoChange = 0;
  let skippedNoImprovement = 0;
  const totals = {
    splitParagraphs: 0,
    headingLeadSplits: 0,
    listSectionsConverted: 0,
    listItemsConverted: 0,
  };

  for (const article of articles) {
    const slug = slugOf(article);
    const before = analyzeBody(article.body, options);
    const optimization = optimizeBody(article.body, options);

    if (!optimization.changed) {
      skippedNoChange += 1;
      if (options.verbose) {
        console.log(`[skip:no-change] ${slug} ${formatMetrics(before)}`);
      }
      continue;
    }

    const after = analyzeBody(optimization.body, options);
    const structuralImprovement =
      after.longParagraphs < before.longParagraphs ||
      after.denseParagraphs < before.denseParagraphs ||
      after.headingLeadMisses < before.headingLeadMisses ||
      after.listStructuredSections > before.listStructuredSections;

    const scoreNotLower = after.chunkScore >= before.chunkScore;
    const qualifies = structuralImprovement && scoreNotLower;

    if (!qualifies) {
      skippedNoImprovement += 1;
      if (options.verbose) {
        console.log(`[skip:no-improvement] ${slug} before(${formatMetrics(before)}) after(${formatMetrics(after)})`);
      }
      continue;
    }

    candidates += 1;
    totals.splitParagraphs += optimization.changes.splitParagraphs;
    totals.headingLeadSplits += optimization.changes.headingLeadSplits;
    totals.listSectionsConverted += optimization.changes.listSectionsConverted;
    totals.listItemsConverted += optimization.changes.listItemsConverted;

    if (options.verbose) {
      console.log(
        `[candidate] ${slug} before(${formatMetrics(before)}) after(${formatMetrics(after)}) ` +
          `changes(split=${optimization.changes.splitParagraphs}, lead=${optimization.changes.headingLeadSplits}, listSections=${optimization.changes.listSectionsConverted}, listItems=${optimization.changes.listItemsConverted})`
      );
    }

    if (options.apply) {
      await client.patch(article._id).set({ body: optimization.body }).commit();
      committed += 1;
      console.log(`[updated] ${slug}`);
    }
  }

  console.log("\nSummary");
  console.log(`- Mode: ${options.apply ? "apply" : "dry-run"}`);
  console.log(`- Total fetched: ${articles.length}`);
  console.log(`- Optimization candidates: ${candidates}`);
  console.log(`- Skipped (no change): ${skippedNoChange}`);
  console.log(`- Skipped (no improvement): ${skippedNoImprovement}`);
  console.log(`- Paragraph splits: ${totals.splitParagraphs}`);
  console.log(`- Heading lead splits: ${totals.headingLeadSplits}`);
  console.log(`- List sections converted: ${totals.listSectionsConverted}`);
  console.log(`- List items converted: ${totals.listItemsConverted}`);
  if (options.apply) {
    console.log(`- Committed: ${committed}`);
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
