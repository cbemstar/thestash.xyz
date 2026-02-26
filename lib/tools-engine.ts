import type { ToolDefinition, ToolInputSource } from "@/lib/tools-catalog";

export type ToolTone = "direct" | "balanced" | "friendly";
export type ToolOutputLength = "short" | "standard" | "detailed";

export type ToolRunPayload = {
  tool: ToolDefinition;
  source: ToolInputSource;
  primaryInput: string;
  secondaryInput: string;
  tone: ToolTone;
  outputLength: ToolOutputLength;
  fileName?: string;
};

export type ToolRunResult = {
  output: string;
  warnings: string[];
};

type RoiAssumptions = {
  interactionsPerMonth: number;
  deflectionRate: number;
  costPerTicket: number;
  monthlyToolSpend: number;
};

const TONE_DESCRIPTION: Record<ToolTone, string> = {
  direct: "direct and concise",
  balanced: "balanced and practical",
  friendly: "friendly and approachable",
};

const TITLE_COUNT_BY_LENGTH: Record<ToolOutputLength, number> = {
  short: 6,
  standard: 10,
  detailed: 14,
};

const FAQ_COUNT_BY_LENGTH: Record<ToolOutputLength, number> = {
  short: 4,
  standard: 6,
  detailed: 8,
};

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
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

function splitParagraphs(input: string): string[] {
  return normalizeWhitespace(input)
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

function clampCount(
  length: ToolOutputLength,
  shortCount: number,
  standardCount: number,
  detailedCount: number
): number {
  if (length === "short") return shortCount;
  if (length === "detailed") return detailedCount;
  return standardCount;
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

function markdownFromHtml(input: string): string {
  const normalized = normalizeWhitespace(input)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  return toMarkdownParagraphs(decodeHtmlEntities(normalized));
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

function markdownFromUrl(url: string, notes: string): string {
  const trimmed = normalizeWhitespace(url);
  const normalizedUrl = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  const noteBlock = notes
    ? `\n## Notes\n${toMarkdownParagraphs(notes)}\n`
    : "";

  return [
    `# Source`,
    `${normalizedUrl}`,
    "",
    "## Extraction checklist",
    "- Confirm the page is publicly accessible.",
    "- Pull visible headings, paragraphs, and list items.",
    "- Remove navigation, cookie banners, and unrelated boilerplate.",
    "- Preserve links and convert to Markdown format.",
    noteBlock.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function deriveHeadline(input: string): string {
  const firstLine = normalizeWhitespace(input)
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return "Generated output";
  return firstLine.length > 64 ? `${firstLine.slice(0, 61)}...` : firstLine;
}

function extractKeyPoints(input: string, count: number): string[] {
  const chunks = splitParagraphs(input)
    .flatMap((paragraph) =>
      paragraph
        .split(/[.!?]\s+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 24)
    )
    .filter((sentence) => sentence.split(" ").length >= 5);

  if (chunks.length === 0) {
    return [normalizeWhitespace(input)].filter(Boolean).slice(0, 1);
  }

  return chunks.slice(0, count);
}

function buildPromptOutput(
  input: string,
  context: string,
  tone: ToolTone,
  outputLength: ToolOutputLength
): string {
  const requested = deriveHeadline(input);
  const detailLevel =
    outputLength === "short"
      ? "concise"
      : outputLength === "detailed"
        ? "expanded"
        : "balanced";

  const contextBlock = context
    ? `\n## Context\n${toMarkdownParagraphs(context)}\n`
    : "";

  return [
    "# Prompt Draft",
    "",
    "## Objective",
    `${requested}`,
    "",
    "## Role",
    `You are an expert assistant writing in a ${TONE_DESCRIPTION[tone]} style.`,
    "",
    "## Required output",
    `Produce a ${detailLevel} response with clear structure, practical examples, and a short action checklist.`,
    "",
    "## Constraints",
    "- Avoid vague language and generic advice.",
    "- Keep sections scannable with short paragraphs and lists.",
    "- Include concrete next steps at the end.",
    contextBlock.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFaqOutput(
  input: string,
  context: string,
  outputLength: ToolOutputLength
): string {
  const faqCount = FAQ_COUNT_BY_LENGTH[outputLength];
  const topic = deriveHeadline(input);
  const contextLine = context ? `\nContext: ${deriveHeadline(context)}.` : "";

  const entries = Array.from({ length: faqCount }).map((_, index) => {
    const number = index + 1;
    return `### Q${number}. ${topic} - key question ${number}\nA${number}. Provide a direct answer, include one concrete detail, and finish with one recommended next action.${contextLine}`;
  });

  return ["# FAQ Draft", "", ...entries].join("\n\n");
}

function buildTitleIdeas(
  input: string,
  context: string,
  outputLength: ToolOutputLength
): string {
  const topic = deriveHeadline(input);
  const contextHint = context ? ` (${deriveHeadline(context)})` : "";
  const count = TITLE_COUNT_BY_LENGTH[outputLength];

  const lines = Array.from({ length: count }).map((_, index) => {
    const number = index + 1;
    const variant =
      index % 3 === 0
        ? "How to"
        : index % 3 === 1
          ? "Best"
          : "Framework";

    return `${number}. ${variant}: ${topic}${contextHint} - angle ${number}`;
  });

  return ["# Title options", "", ...lines].join("\n");
}

function buildNameIdeas(
  title: string,
  input: string,
  context: string,
  outputLength: ToolOutputLength
): string {
  const base = deriveHeadline(input).replace(/[^\w\s-]/g, "");
  const compactBase = base
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  const contextHint = context ? deriveHeadline(context) : "";

  const count = clampCount(outputLength, 8, 12, 16);
  const names = Array.from({ length: count }).map((_, index) => {
    const seed = index + 1;
    const suffix = index % 2 === 0 ? "HQ" : "Labs";
    const stem = compactBase || "Nova";
    return `${seed}. ${stem}${suffix}${seed}`;
  });

  return [
    `# ${title} ideas`,
    "",
    contextHint ? `Context: ${contextHint}` : "",
    ...names,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildReplyDraft(
  title: string,
  input: string,
  context: string,
  tone: ToolTone,
  outputLength: ToolOutputLength
): string {
  const intro =
    outputLength === "short"
      ? "Thanks for your message."
      : "Thanks for reaching out. I reviewed your message and outlined a practical response below.";

  const body = outputLength === "detailed"
    ? "I can help with this. Here is a clear plan with timing, scope, and next steps so we can move quickly without creating rework."
    : "I can help with this and propose a clear next step to keep momentum.";

  const contextBlock = context
    ? `\nContext to include:\n- ${extractKeyPoints(context, 2).join("\n- ")}`
    : "";

  return [
    `# ${title}`,
    "",
    `Tone: ${TONE_DESCRIPTION[tone]}`,
    "",
    "## Suggested response",
    `${intro} ${body}`,
    "",
    "## Source message summary",
    ...extractKeyPoints(input, clampCount(outputLength, 2, 3, 5)).map(
      (point) => `- ${point}`
    ),
    contextBlock.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildChatAnswer(
  title: string,
  input: string,
  context: string,
  source: ToolInputSource,
  outputLength: ToolOutputLength
): string {
  const points = extractKeyPoints(input, clampCount(outputLength, 3, 5, 7));
  const question = normalizeWhitespace(context);

  const answerLine = question
    ? `Question: ${question}`
    : "Question: Summarize the main findings and call out risks.";

  const sourceLine =
    source === "url"
      ? "Source type: URL"
      : source === "file"
        ? "Source type: Uploaded file"
        : "Source type: Pasted content";

  return [
    `# ${title}`,
    "",
    sourceLine,
    answerLine,
    "",
    "## Key findings",
    ...points.map((point) => `- ${point}`),
    "",
    "## Recommended follow-up prompts",
    "- Which section needs deeper validation before publishing?",
    "- What assumptions should be tested with primary data?",
    "- What is the shortest action plan for the next 7 days?",
  ].join("\n");
}

function parseRoiAssumptions(input: string): RoiAssumptions {
  const defaults: RoiAssumptions = {
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

  const ticketsDeflected =
    assumptions.interactionsPerMonth * (assumptions.deflectionRate / 100);
  const monthlySavings = ticketsDeflected * assumptions.costPerTicket;
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
    `- Deflected tickets per month: ${ticketsDeflected.toFixed(0)}`,
    `- Monthly gross savings: $${monthlySavings.toFixed(2)}`,
    `- Monthly net impact: $${monthlyNet.toFixed(2)}`,
    `- Annual net impact: $${annualNet.toFixed(2)}`,
    "",
    "## Notes",
    "- This is a directional model. Validate with real support data.",
    "- Include implementation and QA overhead before final budget decisions.",
  ].join("\n");
}

function parseKeyValueLines(input: string): Map<string, string> {
  const pairs = new Map<string, string>();

  normalizeWhitespace(input)
    .split("\n")
    .forEach((line) => {
      const [rawKey, ...rest] = line.split(":");
      if (!rawKey || rest.length === 0) return;
      const key = rawKey.trim().toLowerCase();
      const value = rest.join(":").trim();
      if (key && value) {
        pairs.set(key, value);
      }
    });

  return pairs;
}

function buildEmailSignature(input: string): string {
  const pairs = parseKeyValueLines(input);
  const name = pairs.get("name") ?? "Your Name";
  const role = pairs.get("role") ?? "Role";
  const company = pairs.get("company") ?? "Company";
  const email = pairs.get("email") ?? "you@example.com";
  const website = pairs.get("website") ?? "https://example.com";
  const phone = pairs.get("phone") ?? "";

  return [
    "# Email signature",
    "",
    `${name}  `,
    `${role} | ${company}  `,
    `Email: ${email}  `,
    `Website: ${website}${phone ? "  " : ""}`,
    phone ? `Phone: ${phone}` : "",
    "",
    "## Plain text",
    `${name} | ${role} | ${company}`,
    `${email} | ${website}${phone ? ` | ${phone}` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSitemapOutput(title: string, input: string, context: string): string {
  const trimmed = normalizeWhitespace(input);
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  const extra = context
    ? `\n## Constraints\n${toMarkdownParagraphs(context)}\n`
    : "";

  if (title.includes("Validator")) {
    return [
      `# ${title}`,
      "",
      `Target: ${url}`,
      "",
      "## Validation checklist",
      "- Confirm XML parses without errors.",
      "- Check `<urlset>` namespaces and required tags.",
      "- Verify canonical host consistency.",
      "- Ensure only indexable URLs are included.",
      "- Spot-check `lastmod`, `priority`, and `changefreq` values.",
      extra.trim(),
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (title.includes("Generator")) {
    return [
      `# ${title}`,
      "",
      `Base URL: ${url}`,
      "",
      "## Recommended next steps",
      "1. Crawl indexable pages and deduplicate normalized URLs.",
      "2. Generate XML in batches of up to 50,000 URLs.",
      "3. Publish `/sitemap.xml` and reference it in `robots.txt`.",
      "4. Submit the sitemap in Search Console and monitor coverage.",
      extra.trim(),
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `# ${title}`,
    "",
    `Target: ${url}`,
    "",
    "## Output",
    "- Locate sitemap references from `robots.txt` and common sitemap paths.",
    "- Extract discovered URLs and group by status (valid, redirected, error).",
    "- Flag orphaned or suspiciously deep URLs for review.",
    extra.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildUtilityOutput(
  tool: ToolDefinition,
  source: ToolInputSource,
  input: string,
  context: string
): string {
  const slug = tool.slug;

  if (slug === "chatbot-roi-calculator") {
    return buildRoiOutput(input);
  }

  if (slug === "email-signature-generator") {
    return buildEmailSignature(input);
  }

  if (
    slug === "sitemap-checker" ||
    slug === "sitemap-validator" ||
    slug === "sitemap-generator" ||
    slug === "sitemap-url-extractor" ||
    slug === "sitemap-urls-comparison" ||
    slug === "sitemap-split-merger" ||
    slug === "sitemap-analytics-insights" ||
    slug === "sitemap-index-generator" ||
    slug === "sitemap-to-robots-txt-generator" ||
    slug === "sitemap-frequency-analyzer" ||
    slug === "website-url-extractor"
  ) {
    return buildSitemapOutput(tool.title, input, context);
  }

  if (slug === "ai-chatbot-conversation-analysis") {
    const points = extractKeyPoints(input, 6);
    return [
      "# Conversation analysis",
      "",
      "## Detected friction patterns",
      ...points.slice(0, 3).map((point) => `- ${point}`),
      "",
      "## Recommended fixes",
      "- Add explicit fallback prompts for unsupported questions.",
      "- Surface pricing and policy links earlier in the flow.",
      "- Route low-confidence answers to a human handoff path.",
      context ? `\n## Analyst notes\n${toMarkdownParagraphs(context)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `# ${tool.title}`,
    "",
    `Source type: ${source}`,
    "",
    "## Input summary",
    ...extractKeyPoints(input, 4).map((point) => `- ${point}`),
    context ? `\n## Notes\n${toMarkdownParagraphs(context)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function runConverter(
  tool: ToolDefinition,
  source: ToolInputSource,
  input: string,
  context: string
): ToolRunResult {
  const warnings: string[] = [];

  const sourceInput = normalizeWhitespace(input);
  const preferences = normalizeWhitespace(context);

  if (!sourceInput) {
    return {
      output: "",
      warnings: ["Add source content before converting."],
    };
  }

  if (tool.slug.includes("webpage") || source === "url") {
    return {
      output: markdownFromUrl(sourceInput, preferences),
      warnings,
    };
  }

  if (tool.slug.includes("json")) {
    return {
      output: markdownFromJson(sourceInput),
      warnings,
    };
  }

  if (tool.slug.includes("csv")) {
    return {
      output: markdownFromCsv(sourceInput),
      warnings,
    };
  }

  if (tool.slug.includes("html")) {
    return {
      output: markdownFromHtml(sourceInput),
      warnings,
    };
  }

  if (tool.slug.includes("xml")) {
    return {
      output: markdownFromXml(sourceInput),
      warnings,
    };
  }

  if (tool.slug.includes("pdf") || tool.slug.includes("docx") || tool.slug.includes("rtf")) {
    warnings.push(
      "Binary file conversion in-browser is best-effort. For highest accuracy, paste extracted text before converting."
    );
  }

  return {
    output: toMarkdownParagraphs(sourceInput),
    warnings,
  };
}

function runGenerator(
  tool: ToolDefinition,
  source: ToolInputSource,
  input: string,
  context: string,
  tone: ToolTone,
  outputLength: ToolOutputLength
): ToolRunResult {
  const normalizedInput = normalizeWhitespace(input);
  if (!normalizedInput) {
    return {
      output: "",
      warnings: ["Describe what you want generated before running this tool."],
    };
  }

  if (tool.slug === "ai-prompt-generator" || tool.slug === "ai-prompt-optimizer") {
    return {
      output: buildPromptOutput(normalizedInput, context, tone, outputLength),
      warnings: [],
    };
  }

  if (
    tool.slug === "ai-faq-generator" ||
    tool.slug === "website-faq-generator" ||
    tool.slug === "pdf-to-faq-generator" ||
    tool.slug === "webpage-to-faq-generator" ||
    tool.slug === "docx-to-faq-generator" ||
    tool.slug === "html-to-faq-generator" ||
    tool.slug === "google-docs-to-faq-generator" ||
    tool.slug === "notion-to-faq-generator"
  ) {
    return {
      output: buildFaqOutput(normalizedInput, context, outputLength),
      warnings: [],
    };
  }

  if (tool.slug === "customer-service-script-generator") {
    return {
      output: buildReplyDraft(tool.title, normalizedInput, context, tone, outputLength),
      warnings: [],
    };
  }

  if (tool.slug === "ai-blog-title-generator") {
    return {
      output: buildTitleIdeas(normalizedInput, context, outputLength),
      warnings: [],
    };
  }

  if (
    tool.slug === "ai-chatbot-name-generator" ||
    tool.slug === "ai-saas-brand-name-generator"
  ) {
    return {
      output: buildNameIdeas(tool.title, normalizedInput, context, outputLength),
      warnings: [],
    };
  }

  if (
    tool.slug === "ai-reply-generator" ||
    tool.slug === "ai-email-response-generator" ||
    tool.slug === "ai-letter-generator" ||
    tool.slug === "ai-answer-generator"
  ) {
    return {
      output: buildReplyDraft(tool.title, normalizedInput, context, tone, outputLength),
      warnings: [],
    };
  }

  return {
    output: buildReplyDraft(tool.title, normalizedInput, context, tone, outputLength),
    warnings: source === "url" ? ["URL input is treated as plain context for this generator."] : [],
  };
}

function runChat(
  tool: ToolDefinition,
  source: ToolInputSource,
  input: string,
  context: string,
  outputLength: ToolOutputLength
): ToolRunResult {
  const normalizedInput = normalizeWhitespace(input);
  if (!normalizedInput) {
    return {
      output: "",
      warnings: ["Add source content before generating answers."],
    };
  }

  return {
    output: buildChatAnswer(tool.title, normalizedInput, context, source, outputLength),
    warnings: [],
  };
}

export function runTool(payload: ToolRunPayload): ToolRunResult {
  const input = normalizeWhitespace(payload.primaryInput);
  const context = normalizeWhitespace(payload.secondaryInput);

  if (!input) {
    return {
      output: "",
      warnings: ["Input is required to run this tool."],
    };
  }

  if (payload.tool.kind === "converter") {
    return runConverter(payload.tool, payload.source, input, context);
  }

  if (payload.tool.kind === "generator") {
    return runGenerator(
      payload.tool,
      payload.source,
      input,
      context,
      payload.tone,
      payload.outputLength
    );
  }

  if (payload.tool.kind === "chat") {
    return runChat(
      payload.tool,
      payload.source,
      input,
      context,
      payload.outputLength
    );
  }

  return {
    output: buildUtilityOutput(payload.tool, payload.source, input, context),
    warnings: [],
  };
}
