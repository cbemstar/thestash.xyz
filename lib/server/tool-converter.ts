import "server-only";
import type { ToolDefinition, ToolInputSource } from "@/lib/tools-catalog";

type ConverterRunInput = {
  tool: ToolDefinition;
  source: ToolInputSource;
  primaryInput: string;
  secondaryInput: string;
  file?: File | null;
};

type ConverterRunResult = {
  output: string;
  warnings: string[];
};

type ExtractedFileResult = {
  text: string;
  warnings: string[];
};

const MAX_OUTPUT_CHARS = 250_000;

let turndownServicePromise: Promise<{
  turndown: (input: string) => string;
}> | null = null;

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").trim();
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

function toMarkdownParagraphs(input: string): string {
  const lines = normalizeWhitespace(input)
    .split("\n")
    .map((line) => line.trim());

  const converted = lines.map((line) => {
    if (!line) return "";

    if (/^\d+[\).]\s+/.test(line)) {
      return line.replace(/^(\d+)[\).]\s+/, "$1. ");
    }

    if (/^[\-*•]\s+/.test(line)) {
      return `- ${line.replace(/^[\-*•]\s+/, "")}`;
    }

    return line;
  });

  return converted.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function parseCsvRow(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];

    if (character === '"') {
      const next = row[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function markdownFromCsv(input: string): string {
  const rows = normalizeWhitespace(input)
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map(parseCsvRow);

  if (rows.length === 0) return "";

  const headers = rows[0];
  const body = rows.slice(1);
  const headerRow = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;

  const bodyRows = body.map((row) => {
    const padded = [...row];
    while (padded.length < headers.length) {
      padded.push("");
    }
    return `| ${padded.slice(0, headers.length).join(" | ")} |`;
  });

  return [headerRow, separator, ...bodyRows].join("\n");
}

function markdownFromJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    const pretty = JSON.stringify(parsed, null, 2);
    return `\`\`\`json\n${pretty}\n\`\`\``;
  } catch {
    return `\`\`\`json\n${normalizeWhitespace(input)}\n\`\`\``;
  }
}

function markdownFromXml(input: string): string {
  return `\`\`\`xml\n${normalizeWhitespace(input)}\n\`\`\``;
}

function rtfToText(input: string): string {
  return input
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\'[0-9a-fA-F]{2}/g, "")
    .replace(/\\[a-zA-Z]+-?\d*\s?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function trimOutput(output: string, warnings: string[]): ConverterRunResult {
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

function looksBinary(text: string): boolean {
  if (!text) return false;
  const sample = text.slice(0, 2000);
  const nonPrintable = sample.split("").filter((char) => {
    const code = char.charCodeAt(0);
    return code !== 9 && code !== 10 && code !== 13 && (code < 32 || code > 126);
  }).length;

  return nonPrintable / sample.length > 0.2;
}

function coerceHttpUrl(raw: string): URL | null {
  const trimmed = normalizeWhitespace(raw);
  if (!trimmed) return null;

  try {
    const candidate = trimmed.startsWith("http://") || trimmed.startsWith("https://")
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

async function getTurndownService() {
  if (!turndownServicePromise) {
    turndownServicePromise = import("turndown").then((module) => {
      const TurndownService = module.default;
      const service = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        bulletListMarker: "-",
      });

      service.addRule("removeScriptAndStyle", {
        filter: ["script", "style", "noscript"],
        replacement: () => "",
      });

      return service;
    });
  }

  return turndownServicePromise;
}

async function markdownFromHtml(input: string): Promise<string> {
  const service = await getTurndownService();
  const cleaned = input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  const markdown = service.turndown(cleaned);
  return decodeHtmlEntities(markdown).trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdfjs-dist expects a DOMMatrix global in some environments. In Node,
  // define a minimal stub so text extraction can run without errors.
  if (typeof (globalThis as any).DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      // Minimal no-op stub; pdf.js uses DOMMatrix primarily for layout transforms.
      constructor(_init?: unknown) {}
      multiplySelf(): this {
        return this;
      }
      translateSelf(): this {
        return this;
      }
      scaleSelf(): this {
        return this;
      }
      rotateSelf(): this {
        return this;
      }
      invertSelf(): this {
        return this;
      }
    };
  }

  let document: any | null = null;

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { join } = await import("node:path");
    const { pathToFileURL } = await import("node:url");
    const workerPath = join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "legacy",
      "build",
      "pdf.worker.mjs"
    );

    // In some serverless environments the worker file path may not exist or be loadable.
    // Configure workerSrc for environments that support it, and prefer disabling workers
    // entirely when the API is available so parsing runs on the main thread.
    (pdfjs as any).GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();
    if ("disableWorker" in (pdfjs as any)) {
      (pdfjs as any).disableWorker = true;
    }

    const loadingTask = (pdfjs as any).getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      useWorkerFetch: false,
      verbosity: 0,
    });

    document = await loadingTask.promise;

    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(pageText);
      page.cleanup();
    }

    return normalizeWhitespace(pages.join("\n\n"));
  } catch {
    // Let callers add a user-facing warning when no text could be extracted.
    return "";
  } finally {
    if (document && typeof document.destroy === "function") {
      await document.destroy();
    }
  }
}

async function extractDocxMarkdown(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const converted = await mammoth.convertToHtml({ buffer });
  return markdownFromHtml(converted.value);
}

async function readFileAsText(file: File): Promise<string> {
  const text = await file.text();
  return normalizeWhitespace(text);
}

function inferFileKind(file: File):
  | "pdf"
  | "docx"
  | "doc"
  | "html"
  | "xml"
  | "csv"
  | "json"
  | "rtf"
  | "text"
  | "unknown" {
  const type = (file.type ?? "").toLowerCase();
  const name = (file.name ?? "").toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (
    type.includes("officedocument.wordprocessingml.document") ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  if (type.includes("msword") || name.endsWith(".doc")) return "doc";
  if (type.includes("text/html") || name.endsWith(".html") || name.endsWith(".htm")) {
    return "html";
  }
  if (type.includes("xml") || name.endsWith(".xml")) return "xml";
  if (type.includes("csv") || name.endsWith(".csv")) return "csv";
  if (type.includes("json") || name.endsWith(".json")) return "json";
  if (type.includes("rtf") || name.endsWith(".rtf")) return "rtf";
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return "text";
  }

  return "unknown";
}

export async function extractUploadedFileText(file: File): Promise<ExtractedFileResult> {
  const warnings: string[] = [];
  const kind = inferFileKind(file);

  if (kind === "doc") {
    return {
      text: "",
      warnings: [
        "Legacy .doc files are not supported for parsing. Use .docx or paste text content.",
      ],
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (kind === "pdf") {
    let text = "";
    try {
      text = await extractPdfText(buffer);
    } catch (error) {
      warnings.push(
        `Could not extract text from this PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      text = "";
    }
    if (!text) {
      warnings.push("Could not extract readable text from this PDF.");
    }
    return { text, warnings };
  }

  if (kind === "docx") {
    let text = "";
    try {
      text = await extractDocxMarkdown(buffer);
    } catch (error) {
      warnings.push(
        `Could not extract text from this DOCX file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      text = "";
    }
    if (!text) {
      warnings.push("Could not extract readable text from this DOCX file.");
    }
    return { text, warnings };
  }

  const rawText = normalizeWhitespace(buffer.toString("utf-8"));

  if (!rawText || looksBinary(rawText)) {
    return {
      text: "",
      warnings: [
        "Uploaded file appears to be binary or unreadable. Paste extracted text and try again.",
      ],
    };
  }

  if (kind === "html") {
    return { text: await markdownFromHtml(rawText), warnings };
  }
  if (kind === "xml") {
    return { text: markdownFromXml(rawText), warnings };
  }
  if (kind === "csv") {
    return { text: markdownFromCsv(rawText), warnings };
  }
  if (kind === "json") {
    return { text: markdownFromJson(rawText), warnings };
  }
  if (kind === "rtf") {
    return { text: toMarkdownParagraphs(rtfToText(rawText)), warnings };
  }

  return { text: rawText, warnings };
}

async function fetchSource(url: URL): Promise<{
  body: Buffer;
  contentType: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "TheStashToolsBot/1.0 (+https://www.thestash.xyz)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const arrayBuffer = await response.arrayBuffer();
    return {
      body: Buffer.from(arrayBuffer),
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function tryGoogleDocExport(url: URL): URL {
  if (url.hostname !== "docs.google.com") return url;
  const match = url.pathname.match(/\/document\/d\/([^/]+)/);
  if (!match) return url;

  return new URL(`https://docs.google.com/document/d/${match[1]}/export?format=txt`);
}

function convertTextBySlug(slug: string, input: string): Promise<string> | string {
  if (slug.includes("json")) return markdownFromJson(input);
  if (slug.includes("csv")) return markdownFromCsv(input);
  if (slug.includes("xml")) return markdownFromXml(input);
  if (slug.includes("rtf")) return toMarkdownParagraphs(rtfToText(input));
  if (slug.includes("html") || slug.includes("webpage") || slug.includes("notion")) {
    return markdownFromHtml(input);
  }

  return toMarkdownParagraphs(input);
}

export async function runConverterTool({
  tool,
  source,
  primaryInput,
  secondaryInput,
  file,
}: ConverterRunInput): Promise<ConverterRunResult> {
  const warnings: string[] = [];
  const slug = tool.slug;
  const primary = normalizeWhitespace(primaryInput);
  const secondary = normalizeWhitespace(secondaryInput);

  let output = "";

  try {
    if (source === "file" && file) {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (slug.includes("pdf")) {
        try {
          output = await extractPdfText(buffer);
        } catch (error) {
          warnings.push(
            `PDF extraction failed for uploaded file: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          output = "";
        }
        if (!output) {
          warnings.push("Could not extract readable text from this PDF.");
        }
      } else if (slug.includes("docx")) {
        try {
          output = await extractDocxMarkdown(buffer);
        } catch (error) {
          warnings.push(
            `DOCX extraction failed for uploaded file: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          output = "";
        }
      } else if (
        slug.includes("html") ||
        slug.includes("xml") ||
        slug.includes("csv") ||
        slug.includes("json") ||
        slug.includes("rtf")
      ) {
        const text = await readFileAsText(file);
        output = await convertTextBySlug(slug, text);
      } else {
        const text = await readFileAsText(file);
        output = toMarkdownParagraphs(text);
      }
    } else if (source === "url") {
      const parsedUrl = coerceHttpUrl(primary);
      if (!parsedUrl) {
        return {
          output: "",
          warnings: ["Provide a valid URL before running conversion."],
        };
      }

      if (isPrivateHostname(parsedUrl.hostname)) {
        return {
          output: "",
          warnings: ["Private or local network URLs are blocked for security reasons."],
        };
      }

      const resolvedUrl = slug.includes("google-docs")
        ? tryGoogleDocExport(parsedUrl)
        : parsedUrl;
      const fetched = await fetchSource(resolvedUrl);
      const contentType = fetched.contentType.toLowerCase();

      if (
        slug.includes("pdf") ||
        contentType.includes("application/pdf") ||
        resolvedUrl.pathname.endsWith(".pdf")
      ) {
        try {
          output = await extractPdfText(fetched.body);
        } catch (error) {
          warnings.push(
            `PDF extraction failed for URL: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          output = "";
        }
      } else if (
        slug.includes("docx") ||
        contentType.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) ||
        resolvedUrl.pathname.endsWith(".docx")
      ) {
        try {
          output = await extractDocxMarkdown(fetched.body);
        } catch (error) {
          warnings.push(
            `DOCX extraction failed for URL: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          output = "";
        }
      } else {
        const text = fetched.body.toString("utf-8");
        if (
          contentType.includes("text/html") ||
          slug.includes("webpage") ||
          slug.includes("notion") ||
          slug.includes("html")
        ) {
          output = await markdownFromHtml(text);
        } else {
          output = await convertTextBySlug(slug, text);
        }
      }
    } else {
      if (!primary) {
        return {
          output: "",
          warnings: ["Add source content before converting."],
        };
      }
      output = await convertTextBySlug(slug, primary);
    }
  } catch (error) {
    warnings.push(
      `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    output = "";
  }

  if (!output) {
    warnings.push("No readable output was produced. Try providing cleaner source content.");
  }

  if (looksBinary(output) || output.startsWith("%PDF-")) {
    warnings.push(
      "Output still looks binary. Try copying plain text from the source document and convert that text directly."
    );
  }

  const withNotes = secondary
    ? `${output}\n\n## Conversion notes\n${toMarkdownParagraphs(secondary)}`
    : output;

  return trimOutput(withNotes, warnings);
}
