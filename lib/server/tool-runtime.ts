import "server-only";
import { gunzipSync } from "node:zlib";
import type { ToolDefinition, ToolInputSource } from "@/lib/tools-catalog";
import { runTool, type ToolOutputLength, type ToolTone } from "@/lib/tools-engine";
import { extractUploadedFileText } from "@/lib/server/tool-converter";

type NonConverterRunInput = {
  tool: ToolDefinition;
  source: ToolInputSource;
  primaryInput: string;
  secondaryInput: string;
  tone: ToolTone;
  outputLength: ToolOutputLength;
  file?: File | null;
};

type ToolRunResult = {
  output: string;
  warnings: string[];
};

type FetchedResource = {
  url: URL;
  status: number;
  contentType: string;
  body: Buffer;
};

type CrawlPage = {
  url: string;
  text: string;
};

type SitemapParseResult = {
  kind: "urlset" | "sitemapindex" | "unknown";
  urls: string[];
  childSitemaps: string[];
  issues: string[];
};

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL?.trim().replace(/\/+$/, "") || "http://localhost:11434";
const OLLAMA_MODEL_ENV = process.env.OLLAMA_MODEL?.trim() || "";
const MAX_CONTEXT_CHARS = 120_000;
const MAX_OUTPUT_CHARS = 250_000;
const DEFAULT_FETCH_TIMEOUT_MS = 12_000;

let resolvedOllamaModelPromise: Promise<string | null> | null = null;

function normalizeWhitespace(input: string): string {
  return input.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function looksBinary(text: string): boolean {
  if (!text) return false;
  const sample = text.slice(0, 2000);
  if (!sample) return false;
  const nonPrintable = sample.split("").filter((char) => {
    const code = char.charCodeAt(0);
    return code !== 9 && code !== 10 && code !== 13 && (code < 32 || code > 126);
  }).length;
  return nonPrintable / sample.length > 0.2;
}

function stripHtmlToText(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|section|article|main|header|footer|li|h\d)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  return normalizeWhitespace(
    decodeHtmlEntities(withoutNoise.replace(/<[^>]+>/g, " ").replace(/[ \t]+\n/g, "\n"))
  );
}

function coerceHttpUrl(raw: string): URL | null {
  const trimmed = normalizeWhitespace(raw);
  if (!trimmed) return null;

  try {
    const candidate =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed;
  } catch {
    return null;
  }
}

function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower === "0.0.0.0" ||
    lower === "::1"
  ) {
    return true;
  }

  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [a, b] = ipv4Match.slice(1).map(Number);
    if (a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }

  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) {
    return true;
  }

  return false;
}

function truncateOutput(output: string, warnings: string[]): ToolRunResult {
  if (output.length <= MAX_OUTPUT_CHARS) {
    return { output, warnings };
  }

  return {
    output: `${output.slice(0, MAX_OUTPUT_CHARS)}\n\n...[truncated due to size]`,
    warnings: [
      ...warnings,
      "Output was truncated to keep response size manageable.",
    ],
  };
}

async function fetchResource(url: URL, timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS): Promise<FetchedResource> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "TheStashToolsBot/1.0 (+https://www.thestash.xyz)",
        Accept:
          "text/html,application/xml,text/xml,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    const body = Buffer.from(await response.arrayBuffer());
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    const finalUrl = new URL(response.url);

    return {
      url: finalUrl,
      status: response.status,
      contentType,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function maybeGunzip(resource: FetchedResource): Buffer {
  const isGzip =
    resource.contentType.includes("application/x-gzip") ||
    resource.contentType.includes("application/gzip") ||
    resource.url.pathname.endsWith(".gz");

  if (!isGzip) return resource.body;
  try {
    return gunzipSync(resource.body);
  } catch {
    return resource.body;
  }
}

function normalizeUrlForList(raw: string): string | null {
  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    if (
      parsed.pathname !== "/" &&
      parsed.pathname.endsWith("/")
    ) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractLinksFromHtml(html: string, baseUrl: URL): URL[] {
  const urls: URL[] = [];
  const hrefRegex = /<a\b[^>]*\bhref=["']([^"'#]+)["']/gi;

  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = (match[1] ?? "").trim();
    if (!href) continue;
    if (/^(mailto|tel|javascript):/i.test(href)) continue;

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;
      resolved.hash = "";
      urls.push(resolved);
    } catch {
      // ignore malformed href
    }
  }

  return urls;
}

function isLikelyAsset(url: URL): boolean {
  return /\.(?:jpg|jpeg|png|gif|svg|webp|ico|css|js|mjs|map|woff2?|ttf|eot|mp4|mp3|zip|pdf)$/i.test(
    url.pathname
  );
}

function parseCrawlerOptions(rawNotes: string, defaults: { maxPages: number; maxDepth: number }) {
  const notes = normalizeWhitespace(rawNotes);
  const maxPagesMatch = notes.match(/max\s*pages?\s*[:=]?\s*(\d+)/i);
  const depthMatch = notes.match(/(?:depth|crawl\s*depth)\s*[:=]?\s*(\d+)/i);

  const maxPages = Math.min(
    1000,
    Math.max(10, maxPagesMatch ? Number(maxPagesMatch[1]) : defaults.maxPages)
  );
  const maxDepth = Math.min(
    4,
    Math.max(0, depthMatch ? Number(depthMatch[1]) : defaults.maxDepth)
  );

  return { maxPages, maxDepth };
}

async function crawlWebsite(
  startUrl: URL,
  options: { maxPages: number; maxDepth: number }
): Promise<{ pages: CrawlPage[]; warnings: string[] }> {
  const warnings: string[] = [];
  const sameOrigin = startUrl.origin;
  const visited = new Set<string>();
  const queue: Array<{ url: URL; depth: number }> = [{ url: startUrl, depth: 0 }];
  const pages: CrawlPage[] = [];
  let failed = 0;

  while (queue.length > 0 && visited.size < options.maxPages) {
    const current = queue.shift();
    if (!current) break;

    const normalized = normalizeUrlForList(current.url.toString());
    if (!normalized || visited.has(normalized)) continue;
    visited.add(normalized);

    try {
      const fetched = await fetchResource(current.url);
      const body = maybeGunzip(fetched).toString("utf-8");
      const text = stripHtmlToText(body);
      if (text) {
        pages.push({
          url: fetched.url.toString(),
          text: text.slice(0, 10_000),
        });
      }

      if (
        current.depth < options.maxDepth &&
        fetched.contentType.includes("text/html")
      ) {
        const links = extractLinksFromHtml(body, fetched.url);
        for (const link of links) {
          if (link.origin !== sameOrigin) continue;
          if (isLikelyAsset(link)) continue;
          const next = normalizeUrlForList(link.toString());
          if (!next || visited.has(next)) continue;
          queue.push({ url: new URL(next), depth: current.depth + 1 });
        }
      }
    } catch {
      failed += 1;
    }
  }

  if (failed > 0) {
    warnings.push(`${failed} page fetch request(s) failed during crawl.`);
  }
  if (pages.length === 0) {
    warnings.push("No crawlable HTML pages were discovered.");
  }

  return { pages, warnings };
}

function parseLocValues(xml: string, pattern: RegExp): string[] {
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml)) !== null) {
    const value = decodeHtmlEntities((match[1] ?? "").trim());
    if (value) values.push(value);
  }
  return values;
}

function parseSitemapXml(xml: string): SitemapParseResult {
  const normalized = normalizeWhitespace(xml);
  const lower = normalized.toLowerCase();
  const issues: string[] = [];

  const isIndex = lower.includes("<sitemapindex");
  const isUrlset = lower.includes("<urlset");

  if (!isIndex && !isUrlset) {
    return {
      kind: "unknown",
      urls: [],
      childSitemaps: [],
      issues: ["XML does not contain <urlset> or <sitemapindex> root tags."],
    };
  }

  if (isIndex) {
    const childSitemaps = parseLocValues(
      normalized,
      /<sitemap\b[\s\S]*?<loc>([\s\S]*?)<\/loc>/gi
    );
    if (childSitemaps.length === 0) {
      issues.push("Sitemap index has no <loc> entries.");
    }
    return { kind: "sitemapindex", urls: [], childSitemaps, issues };
  }

  const urls = parseLocValues(normalized, /<url\b[\s\S]*?<loc>([\s\S]*?)<\/loc>/gi);
  if (urls.length === 0) {
    issues.push("URL set has no <loc> entries.");
  }

  return { kind: "urlset", urls, childSitemaps: [], issues };
}

type UrlEntryWithMeta = { loc: string; changefreq?: string; priority?: string };
function parseSitemapUrlsWithMeta(xml: string): UrlEntryWithMeta[] {
  const normalized = normalizeWhitespace(xml);
  const entries: UrlEntryWithMeta[] = [];
  const urlBlockPattern = /<url\b([\s\S]*?)<\/url>/gi;
  let block: RegExpExecArray | null;
  while ((block = urlBlockPattern.exec(normalized)) !== null) {
    const fragment = block[1] ?? "";
    const locMatch = /<loc\s*>([\s\S]*?)<\/loc>/i.exec(fragment);
    const loc = locMatch ? decodeHtmlEntities((locMatch[1] ?? "").trim()) : "";
    if (!loc) continue;
    const changefreqMatch = /<changefreq\s*>([\s\S]*?)<\/changefreq>/i.exec(fragment);
    const priorityMatch = /<priority\s*>([\s\S]*?)<\/priority>/i.exec(fragment);
    entries.push({
      loc,
      changefreq: changefreqMatch ? (changefreqMatch[1] ?? "").trim() : undefined,
      priority: priorityMatch ? (priorityMatch[1] ?? "").trim() : undefined,
    });
  }
  return entries;
}

async function discoverSitemapCandidates(siteUrl: URL): Promise<{ candidates: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const candidates = new Set<string>();
  const base = siteUrl.origin;

  const fallbackPaths = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemap-index.xml",
    "/sitemap/sitemap.xml",
  ];

  for (const path of fallbackPaths) {
    candidates.add(new URL(path, base).toString());
  }

  try {
    const robotsUrl = new URL("/robots.txt", base);
    const robots = await fetchResource(robotsUrl, 8_000);
    const robotsText = maybeGunzip(robots).toString("utf-8");
    const lines = robotsText.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
      if (!match) continue;
      const raw = match[1].trim();
      try {
        const sitemapUrl = new URL(raw, base);
        if (sitemapUrl.protocol === "http:" || sitemapUrl.protocol === "https:") {
          candidates.add(sitemapUrl.toString());
        }
      } catch {
        // ignore malformed sitemap line
      }
    }
  } catch {
    warnings.push("Could not read robots.txt for sitemap discovery.");
  }

  return { candidates: [...candidates], warnings };
}

async function collectSitemapData(startSitemapUrl: URL, maxSitemaps: number = 40) {
  const visited = new Set<string>();
  const queue: string[] = [startSitemapUrl.toString()];
  const foundUrls = new Set<string>();
  const warnings: string[] = [];
  const inspected: Array<{ sitemap: string; kind: string; urls: number; issues: string[] }> = [];

  while (queue.length > 0 && visited.size < maxSitemaps) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    try {
      const fetched = await fetchResource(new URL(current));
      const xml = maybeGunzip(fetched).toString("utf-8");
      const parsed = parseSitemapXml(xml);
      inspected.push({
        sitemap: fetched.url.toString(),
        kind: parsed.kind,
        urls: parsed.urls.length,
        issues: parsed.issues,
      });

      if (parsed.kind === "sitemapindex") {
        for (const child of parsed.childSitemaps) {
          const normalized = normalizeUrlForList(child);
          if (normalized && !visited.has(normalized)) {
            queue.push(normalized);
          }
        }
      }

      for (const loc of parsed.urls) {
        const normalized = normalizeUrlForList(loc);
        if (normalized) foundUrls.add(normalized);
      }

      for (const issue of parsed.issues) {
        warnings.push(`${fetched.url}: ${issue}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sitemap fetch error";
      warnings.push(`${current}: ${message}`);
    }
  }

  if (queue.length > 0) {
    warnings.push("Stopped sitemap traversal at max sitemap limit.");
  }

  return { inspected, urls: [...foundUrls], warnings };
}

async function resolveOllamaModel(): Promise<string | null> {
  if (resolvedOllamaModelPromise) return resolvedOllamaModelPromise;

  resolvedOllamaModelPromise = (async () => {
    if (OLLAMA_MODEL_ENV) return OLLAMA_MODEL_ENV;

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return null;
      const data = (await response.json()) as {
        models?: Array<{ name?: string }>;
      };
      const first = data.models?.find((entry) => typeof entry.name === "string" && entry.name.length > 0);
      return first?.name ?? null;
    } catch {
      return null;
    }
  })();

  return resolvedOllamaModelPromise;
}

function removeThinkingContent(raw: string): string {
  return normalizeWhitespace(
    raw
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^thinking:\s*$/gim, "")
      .replace(/\u001b\[[0-9;]*m/g, "")
  );
}

async function generateWithOllama(params: {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ text: string; model: string | null; warning?: string }> {
  const model = await resolveOllamaModel();
  if (!model) {
    return {
      text: "",
      model: null,
      warning:
        "No Ollama model is available. Start Ollama and pull a model, or set OLLAMA_MODEL.",
    };
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        system: params.system,
        prompt: params.prompt,
        stream: false,
        think: false,
        options: {
          temperature: params.temperature ?? 0.3,
          num_predict: params.maxTokens ?? 900,
        },
      }),
    });

    if (!response.ok) {
      return {
        text: "",
        model,
        warning: `Ollama request failed with status ${response.status}.`,
      };
    }

    const data = (await response.json()) as { response?: string };
    const text = removeThinkingContent(data.response ?? "");
    if (!text) {
      return {
        text: "",
        model,
        warning: "Ollama returned an empty response.",
      };
    }

    return { text, model };
  } catch {
    return {
      text: "",
      model,
      warning: "Could not connect to Ollama API. Ensure Ollama is running.",
    };
  }
}

function lengthInstruction(outputLength: ToolOutputLength): string {
  if (outputLength === "short") return "Keep output concise and focused.";
  if (outputLength === "detailed") return "Provide detailed output with clear structure.";
  return "Provide balanced output with practical detail.";
}

async function runGeneratorTool(input: NonConverterRunInput): Promise<ToolRunResult> {
  const warnings: string[] = [];
  let primary = normalizeWhitespace(input.primaryInput);
  const secondary = normalizeWhitespace(input.secondaryInput);

  if (FAQ_FROM_SOURCE_SLUGS.has(input.tool.slug)) {
    const resolved = await resolveFAQSourceContext(input);
    primary = resolved.primary;
    warnings.push(...resolved.warnings);
  }

  if (!primary) {
    return { output: "", warnings: ["Provide source content or URL(s) before running this tool."] };
  }

  const system = [
    "You are an expert content assistant.",
    "Return Markdown only.",
    `Write in a ${input.tone} tone.`,
    lengthInstruction(input.outputLength),
  ].join(" ");

  const slug = input.tool.slug;

  let taskInstruction = `Tool: ${input.tool.title}.`;
  if (slug === "ai-prompt-generator") {
    taskInstruction =
      "Generate a production-ready prompt template with sections for role, objective, constraints, input context, and output format.";
  } else if (slug === "ai-prompt-optimizer") {
    taskInstruction =
      "Rewrite and optimize the provided prompt for clarity, specificity, and better model performance.";
  } else if (slug === "ai-faq-generator" || FAQ_FROM_SOURCE_SLUGS.has(slug)) {
    taskInstruction =
      "Generate a comprehensive FAQ from the following content. Extract key topics and create relevant Q&A pairs for user experience and SEO. Use clear headings and scannable sections.";
  } else if (slug === "customer-service-script-generator") {
    taskInstruction =
      "Generate a professional customer service script for the given scenario. Include greeting, acknowledgment, policy explanation, options, and closing. Suitable for training and consistent support.";
  } else if (slug === "ai-blog-title-generator") {
    taskInstruction =
      "Generate clickworthy, SEO-friendly blog title options with varied angles and no duplicates.";
  } else if (slug === "ai-chatbot-name-generator" || slug === "ai-saas-brand-name-generator") {
    taskInstruction =
      "Generate brand-safe name ideas with short rationale for each and include domain-style variants where helpful.";
  } else if (
    slug === "ai-reply-generator" ||
    slug === "ai-email-response-generator" ||
    slug === "ai-letter-generator" ||
    slug === "ai-answer-generator"
  ) {
    taskInstruction =
      "Generate a polished final response directly usable by an end user. Include an optional shorter variant at the end.";
  }

  const prompt = [
    taskInstruction,
    "",
    "Primary input:",
    primary,
    secondary ? `\nAdditional context:\n${secondary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const generated = await generateWithOllama({
    system,
    prompt,
    temperature: 0.35,
    maxTokens: input.outputLength === "detailed" ? 1400 : 900,
  });

  if (generated.warning) warnings.push(generated.warning);
  if (generated.model) warnings.push(`Generated with model: ${generated.model}`);

  if (generated.text) {
    return truncateOutput(generated.text, warnings);
  }

  // Fallback to deterministic output to keep tool usable.
  const fallback = runTool({
    tool: input.tool,
    source: input.source,
    primaryInput: primary,
    secondaryInput: secondary,
    tone: input.tone,
    outputLength: input.outputLength,
  });

  return truncateOutput(fallback.output, [...warnings, ...fallback.warnings]);
}

async function resolveChatContext(input: NonConverterRunInput): Promise<{ context: string; warnings: string[] }> {
  const warnings: string[] = [];

  if (input.source === "file" && input.file) {
    const extracted = await extractUploadedFileText(input.file);
    return { context: extracted.text, warnings: extracted.warnings };
  }

  if (input.source === "url") {
    const parsed = coerceHttpUrl(input.primaryInput);
    if (!parsed) {
      return {
        context: "",
        warnings: ["Provide a valid URL before running this tool."],
      };
    }
    if (isPrivateHostname(parsed.hostname)) {
      return {
        context: "",
        warnings: ["Private or local network URLs are blocked for security reasons."],
      };
    }

    if (input.tool.slug === "ai-chat-with-your-website-data") {
      const crawlOptions = parseCrawlerOptions(input.secondaryInput, {
        maxPages: 20,
        maxDepth: 1,
      });
      const crawled = await crawlWebsite(parsed, crawlOptions);
      warnings.push(...crawled.warnings);

      const context = crawled.pages
        .slice(0, crawlOptions.maxPages)
        .map((page) => `URL: ${page.url}\n${page.text}`)
        .join("\n\n---\n\n");
      return { context, warnings };
    }

    try {
      const fetched = await fetchResource(parsed);
      const body = maybeGunzip(fetched).toString("utf-8");
      if (fetched.contentType.includes("html")) {
        return { context: stripHtmlToText(body), warnings };
      }
      const text = normalizeWhitespace(body);
      return {
        context: text,
        warnings: looksBinary(text)
          ? ["URL response appears binary or unreadable for text chat."]
          : warnings,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "URL fetch failed.";
      return { context: "", warnings: [`Could not fetch URL content: ${message}`] };
    }
  }

  return { context: normalizeWhitespace(input.primaryInput), warnings };
}

const FAQ_FROM_SOURCE_SLUGS = new Set([
  "website-faq-generator",
  "webpage-to-faq-generator",
  "pdf-to-faq-generator",
  "docx-to-faq-generator",
  "html-to-faq-generator",
  "google-docs-to-faq-generator",
  "notion-to-faq-generator",
]);

async function resolveFAQSourceContext(input: NonConverterRunInput): Promise<{ primary: string; warnings: string[] }> {
  const warnings: string[] = [];
  const primary = normalizeWhitespace(input.primaryInput);

  if (input.source === "file" && input.file) {
    const extracted = await extractUploadedFileText(input.file);
    return { primary: extracted.text, warnings: extracted.warnings };
  }

  const urlLines = primary.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const urls = urlLines.flatMap((l) => l.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)).filter((s) => /^https?:\/\//i.test(s));
  if (urls.length === 0) {
    return { primary, warnings };
  }

  const maxUrls = input.tool.slug === "website-faq-generator" ? 5 : 1;
  const toFetch = urls.slice(0, maxUrls);
  if (urls.length > maxUrls) {
    warnings.push(`Using first ${maxUrls} URL(s) only.`);
  }

  const parts: string[] = [];
  for (const raw of toFetch) {
    const parsed = coerceHttpUrl(raw);
    if (!parsed || isPrivateHostname(parsed.hostname)) continue;
    try {
      const fetched = await fetchResource(parsed);
      const body = maybeGunzip(fetched).toString("utf-8");
      const text = fetched.contentType.includes("html") ? stripHtmlToText(body) : normalizeWhitespace(body);
      if (text && !looksBinary(text)) parts.push(`URL: ${parsed.toString()}\n${text}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Fetch failed.";
      warnings.push(`${raw}: ${msg}`);
    }
  }

  const resolved = parts.join("\n\n---\n\n");
  return { primary: resolved || primary, warnings };
}

async function runChatTool(input: NonConverterRunInput): Promise<ToolRunResult> {
  const resolved = await resolveChatContext(input);
  const warnings = [...resolved.warnings];
  const question = normalizeWhitespace(input.secondaryInput) || "Summarize key points and answer the most likely user question.";
  const context = normalizeWhitespace(resolved.context);

  if (!context) {
    return { output: "", warnings: [...warnings, "No source content was available for chat."] };
  }

  const prompt = [
    `Tool: ${input.tool.title}`,
    "Use only the provided context.",
    "If the answer is uncertain, say what is missing.",
    "",
    `Question:\n${question}`,
    "",
    `Context:\n${context.slice(0, MAX_CONTEXT_CHARS)}`,
  ].join("\n");

  const generated = await generateWithOllama({
    system:
      "You are a precise analyst. Return Markdown with headings: Answer, Evidence, Follow-up.",
    prompt,
    temperature: 0.2,
    maxTokens: input.outputLength === "detailed" ? 1600 : 1000,
  });

  if (generated.warning) warnings.push(generated.warning);
  if (generated.model) warnings.push(`Generated with model: ${generated.model}`);

  if (generated.text) {
    return truncateOutput(generated.text, warnings);
  }

  const fallback = runTool({
    tool: input.tool,
    source: input.source,
    primaryInput: context,
    secondaryInput: question,
    tone: input.tone,
    outputLength: input.outputLength,
  });

  return truncateOutput(fallback.output, [...warnings, ...fallback.warnings]);
}

function parseKeyValueLines(input: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of normalizeWhitespace(input).split("\n")) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key && value) map.set(key, value);
  }
  return map;
}

function buildEmailSignatureOutput(input: string): string {
  const pairs = parseKeyValueLines(input);
  const name = pairs.get("name") ?? "Your Name";
  const role = pairs.get("role") ?? "Role";
  const company = pairs.get("company") ?? "Company";
  const email = pairs.get("email") ?? "you@example.com";
  const website = pairs.get("website") ?? "https://example.com";
  const phone = pairs.get("phone") ?? "";
  const linkedin = pairs.get("linkedin") ?? "";
  const x = pairs.get("x") ?? pairs.get("twitter") ?? "";

  const htmlLines = [
    `<strong>${name}</strong>`,
    `${role} | ${company}`,
    `Email: <a href="mailto:${email}">${email}</a>`,
    `Website: <a href="${website}">${website}</a>`,
    phone ? `Phone: ${phone}` : "",
    linkedin ? `LinkedIn: <a href="${linkedin}">${linkedin}</a>` : "",
    x ? `X: <a href="${x}">${x}</a>` : "",
  ].filter(Boolean);

  const plain = [
    `${name} | ${role} | ${company}`,
    `${email} | ${website}${phone ? ` | ${phone}` : ""}`,
  ].join("\n");

  return [
    "# Email signature",
    "",
    ...htmlLines,
    "",
    "## HTML snippet",
    "```html",
    `<div>${htmlLines.join("<br />")}</div>`,
    "```",
    "",
    "## Plain text",
    "```text",
    plain,
    "```",
  ].join("\n");
}

function parseRoiAssumptions(input: string) {
  const defaults = {
    interactionsPerMonth: 300,
    deflectionRate: 30,
    costPerTicket: 6,
    monthlyToolSpend: 900,
  };

  const normalized = normalizeWhitespace(input).toLowerCase();
  const numbers = normalized.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length >= 4) {
    return {
      interactionsPerMonth: numbers[0],
      deflectionRate: numbers[1],
      costPerTicket: numbers[2],
      monthlyToolSpend: numbers[3],
    };
  }
  return defaults;
}

function buildRoiOutput(input: string): string {
  const assumptions = parseRoiAssumptions(input);
  const deflected = assumptions.interactionsPerMonth * (assumptions.deflectionRate / 100);
  const monthlySavings = deflected * assumptions.costPerTicket;
  const monthlyNet = monthlySavings - assumptions.monthlyToolSpend;
  const annualNet = monthlyNet * 12;

  return [
    "# Chatbot ROI estimate",
    "",
    "## Inputs",
    `- Monthly interactions: ${Math.round(assumptions.interactionsPerMonth).toLocaleString()}`,
    `- Deflection rate: ${assumptions.deflectionRate.toFixed(1)}%`,
    `- Cost per ticket: $${assumptions.costPerTicket.toFixed(2)}`,
    `- Monthly tooling spend: $${assumptions.monthlyToolSpend.toFixed(2)}`,
    "",
    "## Estimated impact",
    `- Deflected tickets/month: ${deflected.toFixed(0)}`,
    `- Monthly gross savings: $${monthlySavings.toFixed(2)}`,
    `- Monthly net impact: $${monthlyNet.toFixed(2)}`,
    `- Annual net impact: $${annualNet.toFixed(2)}`,
    "",
    "## Notes",
    "- This is a directional estimate. Validate against real support and staffing data.",
  ].join("\n");
}

async function runSitemapChecker(primaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  const parsed = coerceHttpUrl(primaryInput);
  if (!parsed) {
    return { output: "", warnings: ["Provide a valid website URL."] };
  }
  if (isPrivateHostname(parsed.hostname)) {
    return { output: "", warnings: ["Private or local network URLs are blocked for security reasons."] };
  }

  const discovered = await discoverSitemapCandidates(parsed);
  warnings.push(...discovered.warnings);

  const results: Array<{ sitemap: string; ok: boolean; urls: number; issues: string[] }> = [];
  for (const candidate of discovered.candidates) {
    try {
      const data = await collectSitemapData(new URL(candidate), 1);
      const first = data.inspected[0];
      if (!first) continue;
      const isOk = first.kind !== "unknown" && first.issues.length === 0;
      results.push({
        sitemap: first.sitemap,
        ok: isOk,
        urls: first.urls,
        issues: first.issues,
      });
    } catch {
      results.push({
        sitemap: candidate,
        ok: false,
        urls: 0,
        issues: ["Fetch failed."],
      });
    }
  }

  if (results.length === 0) {
    return {
      output: "",
      warnings: [...warnings, "No sitemap candidates could be discovered."],
    };
  }

  const lines = [
    "# Sitemap Finder & Checker",
    "",
    `Target site: ${parsed.origin}`,
    "",
    "| Sitemap URL | Status | URL Count | Notes |",
    "| --- | --- | ---: | --- |",
    ...results.map((entry) => {
      const note = entry.issues.length > 0 ? entry.issues.join("; ") : "OK";
      return `| ${entry.sitemap} | ${entry.ok ? "Valid" : "Needs review"} | ${entry.urls} | ${note} |`;
    }),
  ];

  return truncateOutput(lines.join("\n"), warnings);
}

async function runSitemapValidator(primaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  let sitemapUrl = coerceHttpUrl(primaryInput);
  if (!sitemapUrl) {
    return { output: "", warnings: ["Provide a valid sitemap URL or website URL."] };
  }
  if (isPrivateHostname(sitemapUrl.hostname)) {
    return { output: "", warnings: ["Private or local network URLs are blocked for security reasons."] };
  }

  if (!/sitemap/i.test(sitemapUrl.pathname)) {
    const discovered = await discoverSitemapCandidates(sitemapUrl);
    warnings.push(...discovered.warnings);
    const first = discovered.candidates[0];
    if (!first) {
      return { output: "", warnings: [...warnings, "No sitemap URL found for this site."] };
    }
    sitemapUrl = new URL(first);
  }

  try {
    const fetched = await fetchResource(sitemapUrl);
    const xml = maybeGunzip(fetched).toString("utf-8");
    const parsed = parseSitemapXml(xml);

    const absoluteErrors = parsed.urls.filter((entry) => !coerceHttpUrl(entry)).length;
    const duplicates = parsed.urls.length - new Set(parsed.urls).size;
    const status =
      parsed.kind === "unknown" || parsed.issues.length > 0 || absoluteErrors > 0
        ? "Needs review"
        : "Valid";

    const output = [
      "# Sitemap Validator",
      "",
      `Sitemap: ${fetched.url.toString()}`,
      `Status: ${status}`,
      `Type: ${parsed.kind}`,
      `URL entries: ${parsed.urls.length}`,
      `Nested sitemaps: ${parsed.childSitemaps.length}`,
      "",
      "## Checks",
      `- Root tag present: ${parsed.kind === "unknown" ? "No" : "Yes"}`,
      `- Absolute URL entries: ${absoluteErrors === 0 ? "Yes" : `No (${absoluteErrors} invalid)`}`,
      `- Duplicate URL entries: ${duplicates === 0 ? "None" : duplicates.toString()}`,
      ...(parsed.issues.length > 0 ? ["", "## Issues", ...parsed.issues.map((issue) => `- ${issue}`)] : []),
    ].join("\n");

    return truncateOutput(output, warnings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed.";
    return { output: "", warnings: [...warnings, message] };
  }
}

async function runSitemapUrlExtractor(primaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  let sitemapUrl = coerceHttpUrl(primaryInput);
  if (!sitemapUrl) {
    return { output: "", warnings: ["Provide a valid sitemap URL or website URL."] };
  }
  if (isPrivateHostname(sitemapUrl.hostname)) {
    return { output: "", warnings: ["Private or local network URLs are blocked for security reasons."] };
  }

  if (!/sitemap/i.test(sitemapUrl.pathname)) {
    const discovered = await discoverSitemapCandidates(sitemapUrl);
    warnings.push(...discovered.warnings);
    const first = discovered.candidates[0];
    if (!first) {
      return { output: "", warnings: [...warnings, "No sitemap URL found for this site."] };
    }
    sitemapUrl = new URL(first);
  }

  const collected = await collectSitemapData(sitemapUrl, 40);
  warnings.push(...collected.warnings);

  if (collected.urls.length === 0) {
    return {
      output: "",
      warnings: [...warnings, "No URLs were extracted from the sitemap."],
    };
  }

  const listed = collected.urls.slice(0, 5000);
  if (collected.urls.length > listed.length) {
    warnings.push(`Output limited to ${listed.length.toLocaleString()} URLs.`);
  }

  const output = [
    "# Sitemap URL Extractor",
    "",
    `Sitemap: ${sitemapUrl.toString()}`,
    `Total URLs extracted: ${collected.urls.length.toLocaleString()}`,
    "",
    "## URLs",
    ...listed.map((url) => `- ${url}`),
  ].join("\n");

  return truncateOutput(output, warnings);
}

async function runWebsiteUrlExtractor(
  primaryInput: string,
  secondaryInput: string
): Promise<ToolRunResult> {
  const warnings: string[] = [];
  const parsed = coerceHttpUrl(primaryInput);
  if (!parsed) {
    return { output: "", warnings: ["Provide a valid website URL."] };
  }
  if (isPrivateHostname(parsed.hostname)) {
    return { output: "", warnings: ["Private or local network URLs are blocked for security reasons."] };
  }

  const options = parseCrawlerOptions(secondaryInput, {
    maxPages: 120,
    maxDepth: 2,
  });
  const crawled = await crawlWebsite(parsed, options);
  warnings.push(...crawled.warnings);

  const urls = [...new Set(crawled.pages.map((entry) => normalizeUrlForList(entry.url)).filter(Boolean))] as string[];
  if (urls.length === 0) {
    return { output: "", warnings: [...warnings, "No URLs could be extracted from this website."] };
  }

  const output = [
    "# Website URL Extractor",
    "",
    `Seed URL: ${parsed.toString()}`,
    `Crawled pages: ${urls.length.toLocaleString()}`,
    `Depth: ${options.maxDepth}`,
    `Max pages: ${options.maxPages}`,
    "",
    "## URLs",
    ...urls.map((url) => `- ${url}`),
  ].join("\n");

  return truncateOutput(output, warnings);
}

async function runSitemapGenerator(
  primaryInput: string,
  secondaryInput: string
): Promise<ToolRunResult> {
  const warnings: string[] = [];
  const parsed = coerceHttpUrl(primaryInput);
  if (!parsed) {
    return { output: "", warnings: ["Provide a valid website URL."] };
  }
  if (isPrivateHostname(parsed.hostname)) {
    return { output: "", warnings: ["Private or local network URLs are blocked for security reasons."] };
  }

  const options = parseCrawlerOptions(secondaryInput, {
    maxPages: 300,
    maxDepth: 2,
  });
  const crawled = await crawlWebsite(parsed, options);
  warnings.push(...crawled.warnings);

  const urls = [...new Set(crawled.pages.map((entry) => normalizeUrlForList(entry.url)).filter(Boolean))] as string[];
  if (urls.length === 0) {
    return { output: "", warnings: [...warnings, "Could not discover URLs to build sitemap XML."] };
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (url) =>
        `  <url><loc>${url}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    ),
    "</urlset>",
  ].join("\n");

  const output = [
    "# XML Sitemap Generator",
    "",
    `Generated URLs: ${urls.length.toLocaleString()}`,
    "",
    "## Sitemap XML",
    "```xml",
    xml,
    "```",
  ].join("\n");

  return truncateOutput(output, warnings);
}

async function runSitemapUrlsComparison(primaryInput: string, secondaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  const lines = [...primaryInput.split(/\n/), ...(secondaryInput ? secondaryInput.split(/\n/) : [])]
    .map((l) => l.trim())
    .filter(Boolean);
  const urls = lines.flatMap((l) => l.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean));
  const urlA = coerceHttpUrl(urls[0] ?? "");
  const urlB = coerceHttpUrl(urls[1] ?? "");
  if (!urlA || !urlB) {
    return {
      output: "",
      warnings: ["Provide two valid sitemap URLs (one per line or comma-separated in primary and optional secondary)."],
    };
  }
  if (isPrivateHostname(urlA.hostname) || isPrivateHostname(urlB.hostname)) {
    return { output: "", warnings: ["Private or local network URLs are blocked for security reasons."] };
  }
  try {
    const [dataA, dataB] = await Promise.all([
      collectSitemapData(urlA, 50),
      collectSitemapData(urlB, 50),
    ]);
    warnings.push(...dataA.warnings, ...dataB.warnings);
    const setA = new Set(dataA.urls);
    const setB = new Set(dataB.urls);
    const added = [...setB].filter((u) => !setA.has(u));
    const removed = [...setA].filter((u) => !setB.has(u));
    const unchanged = [...setA].filter((u) => setB.has(u));
    const linesOut = [
      "# Sitemap URLs Comparison",
      "",
      `Sitemap A: ${urlA.toString()}`,
      `Sitemap B: ${urlB.toString()}`,
      "",
      "## Summary",
      `| Metric | Count |`,
      `| --- | ---: |`,
      `| URLs only in A | ${removed.length} |`,
      `| URLs only in B (added) | ${added.length} |`,
      `| URLs in both (unchanged) | ${unchanged.length} |`,
      "",
      "## Added (in B, not in A)",
      ...added.slice(0, 100).map((u) => `- ${u}`),
      ...(added.length > 100 ? [`\n... and ${added.length - 100} more`] : []),
      "",
      "## Removed (in A, not in B)",
      ...removed.slice(0, 100).map((u) => `- ${u}`),
      ...(removed.length > 100 ? [`\n... and ${removed.length - 100} more`] : []),
    ];
    return truncateOutput(linesOut.join("\n"), warnings);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Comparison failed.";
    return { output: "", warnings: [...warnings, msg] };
  }
}

async function runSitemapSplitMerger(primaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  const lines = primaryInput.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const urls = lines.flatMap((l) => l.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)).filter((s) => /^https?:\/\//i.test(s));
  if (urls.length === 0) {
    return { output: "", warnings: ["Provide at least one sitemap URL (one per line or comma-separated)."] };
  }
  const firstUrl = coerceHttpUrl(urls[0]);
  if (!firstUrl || isPrivateHostname(firstUrl.hostname)) {
    return { output: "", warnings: ["Provide a valid public sitemap URL."] };
  }
  if (urls.length === 1) {
    const collected = await collectSitemapData(firstUrl, 50);
    warnings.push(...collected.warnings);
    const total = collected.urls.length;
    const chunkSize = 50_000;
    const chunks = Math.ceil(total / chunkSize) || 1;
    const linesOut = [
      "# Sitemap Split",
      "",
      `Sitemap: ${firstUrl.toString()}`,
      `Total URLs: ${total.toLocaleString()}`,
      `Recommended chunks (max ${chunkSize.toLocaleString()} per sitemap): ${chunks}`,
      "",
      "Use the Sitemap Index Generator with multiple sitemap URLs to produce a split sitemap index.",
    ];
    return truncateOutput(linesOut.join("\n"), warnings);
  }
  const allUrls = new Set<string>();
  for (const raw of urls) {
    const u = coerceHttpUrl(raw);
    if (!u || isPrivateHostname(u.hostname)) continue;
    const data = await collectSitemapData(u, 10);
    warnings.push(...data.warnings);
    data.urls.forEach((url) => allUrls.add(url));
  }
  const merged = [...allUrls];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...merged.slice(0, 50_000).map((url) => `  <url><loc>${url}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`),
    "</urlset>",
  ].join("\n");
  const linesOut = [
    "# Sitemap Merger",
    "",
    `Merged ${urls.length} sitemap(s). Total unique URLs: ${merged.length.toLocaleString()}.`,
    merged.length > 50_000 ? `Output capped at 50,000 URLs.` : "",
    "",
    "## Merged sitemap XML",
    "```xml",
    xml,
    "```",
  ].filter(Boolean).join("\n");
  return truncateOutput(linesOut, warnings);
}

async function runSitemapAnalyticsInsights(primaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  const sitemapUrl = coerceHttpUrl(primaryInput.trim());
  if (!sitemapUrl) {
    return { output: "", warnings: ["Provide a valid sitemap URL or website URL."] };
  }
  if (isPrivateHostname(sitemapUrl.hostname)) {
    return { output: "", warnings: ["Private or local network URLs are blocked for security reasons."] };
  }
  let target = sitemapUrl;
  if (!/sitemap/i.test(sitemapUrl.pathname)) {
    const discovered = await discoverSitemapCandidates(sitemapUrl);
    warnings.push(...discovered.warnings);
    const first = discovered.candidates[0];
    if (!first) return { output: "", warnings: [...warnings, "No sitemap URL found for this site."] };
    target = new URL(first);
  }
  const collected = await collectSitemapData(target, 50);
  warnings.push(...collected.warnings);
  const urls = collected.urls;
  const byExt = new Map<string, number>();
  urls.forEach((url) => {
    try {
      const path = new URL(url).pathname;
      const ext = path.includes(".") ? path.replace(/.*\./, "").toLowerCase().slice(0, 10) : "none";
      byExt.set(ext, (byExt.get(ext) ?? 0) + 1);
    } catch {
      byExt.set("other", (byExt.get("other") ?? 0) + 1);
    }
  });
  const extRows = [...byExt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const recommendations: string[] = [];
  if (urls.length > 50_000) recommendations.push("Consider splitting into multiple sitemaps and using a sitemap index.");
  if (collected.inspected.some((i) => i.kind === "unknown" || i.issues.length > 0)) {
    recommendations.push("Fix invalid or malformed sitemap entries reported in the validator.");
  }
  const linesOut = [
    "# Sitemap Analytics & Insights",
    "",
    `Sitemap: ${target.toString()}`,
    "",
    "## Overview",
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Total URLs | ${urls.length.toLocaleString()} |`,
    `| Sitemaps traversed | ${collected.inspected.length} |`,
    "",
    "## URL distribution by file type (path extension)",
    "| Extension | Count |",
    "| --- | ---: |",
    ...extRows.map(([ext, count]) => `| ${ext} | ${count.toLocaleString()} |`),
    "",
    recommendations.length ? ["## Recommendations", ...recommendations.map((r) => `- ${r}`)].join("\n") : "",
  ].filter(Boolean).join("\n");
  return truncateOutput(linesOut, warnings);
}

async function runSitemapIndexGenerator(primaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  const lines = primaryInput.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const sitemapUrls = lines.flatMap((l) => l.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)).filter((s) => /^https?:\/\//i.test(s));
  const seen = new Set<string>();
  const unique = sitemapUrls.filter((u) => {
    const n = u.replace(/#.*$/, "").trim();
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  if (unique.length === 0) {
    return { output: "", warnings: ["Provide at least one sitemap URL (one per line)."] };
  }
  const now = new Date().toISOString().slice(0, 10);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...unique.map((url) => `  <sitemap><loc>${url}</loc><lastmod>${now}</lastmod></sitemap>`),
    "</sitemapindex>",
  ].join("\n");
  const linesOut = [
    "# Sitemap Index Generator",
    "",
    `Generated index with ${unique.length} sitemap(s).`,
    "",
    "## Sitemap index XML",
    "```xml",
    xml,
    "```",
  ].join("\n");
  return truncateOutput(linesOut, warnings);
}

async function runSitemapToRobotsTxtGenerator(primaryInput: string, secondaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  const lines = primaryInput.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const sitemapUrls = lines.flatMap((l) => l.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)).filter((s) => /^https?:\/\//i.test(s));
  if (sitemapUrls.length === 0) {
    return { output: "", warnings: ["Provide at least one sitemap URL (one per line)."] };
  }
  const customRules = secondaryInput.trim() ? secondaryInput.split(/\n/).map((l) => l.trim()).filter(Boolean) : [];
  const robotsLines = [
    "User-agent: *",
    "Allow: /",
    ...sitemapUrls.map((u) => `Sitemap: ${u}`),
    ...customRules,
  ];
  const linesOut = [
    "# Sitemap to Robots.txt Generator",
    "",
    "## robots.txt",
    "```",
    robotsLines.join("\n"),
    "```",
  ].join("\n");
  return truncateOutput(linesOut, warnings);
}

async function runSitemapFrequencyAnalyzer(primaryInput: string): Promise<ToolRunResult> {
  const warnings: string[] = [];
  let sitemapUrl = coerceHttpUrl(primaryInput.trim());
  if (!sitemapUrl) {
    return { output: "", warnings: ["Provide a valid sitemap URL or website URL."] };
  }
  if (isPrivateHostname(sitemapUrl.hostname)) {
    return { output: "", warnings: ["Private or local network URLs are blocked for security reasons."] };
  }
  if (!/sitemap/i.test(sitemapUrl.pathname)) {
    const discovered = await discoverSitemapCandidates(sitemapUrl);
    warnings.push(...discovered.warnings);
    const first = discovered.candidates[0];
    if (!first) return { output: "", warnings: [...warnings, "No sitemap URL found for this site."] };
    sitemapUrl = new URL(first);
  }
  try {
    const fetched = await fetchResource(sitemapUrl);
    const xml = maybeGunzip(fetched).toString("utf-8");
    const entries = parseSitemapUrlsWithMeta(xml);
    if (entries.length === 0) {
      const parsed = parseSitemapXml(xml);
      if (parsed.kind === "sitemapindex") {
        return truncateOutput(
          "# Sitemap Frequency Analyzer\n\nThis URL is a sitemap index. Point this tool at a URL set sitemap (e.g. a child sitemap) to analyze changefreq and priority.",
          warnings
        );
      }
      return { output: "", warnings: [...warnings, "No URL entries with changefreq/priority found in this sitemap."] };
    }
    const byChangefreq = new Map<string, number>();
    const byPriority = new Map<string, number>();
    entries.forEach((e) => {
      const cf = e.changefreq ?? "not set";
      byChangefreq.set(cf, (byChangefreq.get(cf) ?? 0) + 1);
      const pr = e.priority ?? "not set";
      byPriority.set(pr, (byPriority.get(pr) ?? 0) + 1);
    });
    const cfRows = [...byChangefreq.entries()].sort((a, b) => b[1] - a[1]);
    const prRows = [...byPriority.entries()].sort((a, b) => b[1] - a[1]);
    const linesOut = [
      "# Sitemap Frequency Analyzer",
      "",
      `Sitemap: ${sitemapUrl.toString()}`,
      `URLs analyzed: ${entries.length.toLocaleString()}`,
      "",
      "## Changefreq distribution",
      "| Value | Count |",
      "| --- | ---: |",
      ...cfRows.map(([v, c]) => `| ${v} | ${c.toLocaleString()} |`),
      "",
      "## Priority distribution",
      "| Value | Count |",
      "| --- | ---: |",
      ...prRows.map(([v, c]) => `| ${v} | ${c.toLocaleString()} |`),
    ].join("\n");
    return truncateOutput(linesOut, warnings);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed.";
    return { output: "", warnings: [...warnings, msg] };
  }
}

async function runConversationAnalysisTool(input: NonConverterRunInput): Promise<ToolRunResult> {
  const resolved = await resolveChatContext(input);
  const warnings = [...resolved.warnings];
  const transcript = normalizeWhitespace(resolved.context || input.primaryInput);
  if (!transcript) {
    return { output: "", warnings: [...warnings, "Add conversation transcript content before running analysis."] };
  }

  const prompt = [
    "Analyze the chatbot transcript.",
    "Return Markdown with sections: Summary, Intent Patterns, Failure Modes, Recommended Fixes, Priority Actions.",
    "",
    transcript.slice(0, MAX_CONTEXT_CHARS),
  ].join("\n");

  const generated = await generateWithOllama({
    system: "You are a conversational AI QA analyst focused on practical product improvements.",
    prompt,
    temperature: 0.2,
    maxTokens: 1300,
  });

  if (generated.warning) warnings.push(generated.warning);
  if (generated.model) warnings.push(`Generated with model: ${generated.model}`);

  if (generated.text) {
    return truncateOutput(generated.text, warnings);
  }

  const fallback = runTool({
    tool: input.tool,
    source: input.source,
    primaryInput: transcript,
    secondaryInput: input.secondaryInput,
    tone: input.tone,
    outputLength: input.outputLength,
  });
  return truncateOutput(fallback.output, [...warnings, ...fallback.warnings]);
}

async function runUtilityTool(input: NonConverterRunInput): Promise<ToolRunResult> {
  const slug = input.tool.slug;
  const primary = normalizeWhitespace(input.primaryInput);
  const secondary = normalizeWhitespace(input.secondaryInput);

  if (slug === "sitemap-checker") {
    return runSitemapChecker(primary);
  }
  if (slug === "sitemap-validator") {
    return runSitemapValidator(primary);
  }
  if (slug === "sitemap-generator") {
    return runSitemapGenerator(primary, secondary);
  }
  if (slug === "sitemap-url-extractor") {
    return runSitemapUrlExtractor(primary);
  }
  if (slug === "sitemap-urls-comparison") {
    return runSitemapUrlsComparison(primary, secondary);
  }
  if (slug === "sitemap-split-merger") {
    return runSitemapSplitMerger(primary);
  }
  if (slug === "sitemap-analytics-insights") {
    return runSitemapAnalyticsInsights(primary);
  }
  if (slug === "sitemap-index-generator") {
    return runSitemapIndexGenerator(primary);
  }
  if (slug === "sitemap-to-robots-txt-generator") {
    return runSitemapToRobotsTxtGenerator(primary, secondary);
  }
  if (slug === "sitemap-frequency-analyzer") {
    return runSitemapFrequencyAnalyzer(primary);
  }
  if (slug === "website-url-extractor") {
    return runWebsiteUrlExtractor(primary, secondary);
  }
  if (slug === "chatbot-roi-calculator") {
    return { output: buildRoiOutput(primary), warnings: [] };
  }
  if (slug === "email-signature-generator") {
    return { output: buildEmailSignatureOutput(primary), warnings: [] };
  }
  if (slug === "ai-chatbot-conversation-analysis") {
    return runConversationAnalysisTool(input);
  }

  const fallback = runTool({
    tool: input.tool,
    source: input.source,
    primaryInput: primary,
    secondaryInput: secondary,
    tone: input.tone,
    outputLength: input.outputLength,
    fileName: input.file?.name,
  });
  return truncateOutput(fallback.output, fallback.warnings);
}

export async function runNonConverterTool(input: NonConverterRunInput): Promise<ToolRunResult> {
  if (input.tool.kind === "generator") {
    return runGeneratorTool(input);
  }
  if (input.tool.kind === "chat") {
    return runChatTool(input);
  }
  return runUtilityTool(input);
}

