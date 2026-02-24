export type ToolCategorySlug =
  | "convert-to-markdown"
  | "ai-generators"
  | "ai-chat-data"
  | "utility-tools";

export type ToolKind = "converter" | "generator" | "chat" | "utility";

export type ToolInputSource = "text" | "url" | "file";

export type ToolCategoryDefinition = {
  slug: ToolCategorySlug;
  label: string;
  kicker: string;
  description: string;
};

export type ToolDefinition = {
  slug: string;
  title: string;
  category: ToolCategorySlug;
  kind: ToolKind;
  summary: string;
  heroDescription: string;
  actionLabel: string;
  outputLabel: string;
  primaryInputLabel: string;
  primaryPlaceholder: string;
  secondaryInputLabel?: string;
  secondaryInputPlaceholder?: string;
  inputSources: ToolInputSource[];
  fileAccept?: string;
  featured?: boolean;
};

type RawTool = {
  slug: string;
  title: string;
};

export const TOOL_CATEGORIES: ToolCategoryDefinition[] = [
  {
    slug: "convert-to-markdown",
    label: "Convert to Markdown",
    kicker: "Markdown conversion",
    description:
      "Convert files, pasted content, and URLs into copy-ready Markdown for docs and knowledge bases.",
  },
  {
    slug: "ai-generators",
    label: "AI Generators",
    kicker: "Generation workflows",
    description:
      "Generate drafts, naming ideas, and structured copy with adjustable tone and output length.",
  },
  {
    slug: "ai-chat-data",
    label: "AI Chat with Data",
    kicker: "Data exploration",
    description:
      "Turn source documents and pages into concise answers, summaries, and follow-up prompts.",
  },
  {
    slug: "utility-tools",
    label: "Utility Tools",
    kicker: "Workflow utilities",
    description:
      "Run practical utility tools for sitemap checks, URL extraction, ROI framing, and communication tasks.",
  },
];

const RAW_TOOLS_BY_CATEGORY: Record<ToolCategorySlug, RawTool[]> = {
  "convert-to-markdown": [
    {
      slug: "convert-pdf-to-markdown",
      title: "Convert PDF to Markdown",
    },
    {
      slug: "convert-docx-to-markdown",
      title: "Convert DOCX to Markdown",
    },
    {
      slug: "convert-html-to-markdown",
      title: "Convert HTML to Markdown",
    },
    {
      slug: "convert-notion-to-markdown",
      title: "Convert Notion to Markdown",
    },
    {
      slug: "convert-google-docs-to-markdown",
      title: "Convert Google Docs to Markdown",
    },
    {
      slug: "convert-xml-to-markdown",
      title: "Convert XML to Markdown",
    },
    {
      slug: "convert-csv-to-markdown",
      title: "Convert CSV to Markdown",
    },
    {
      slug: "convert-json-to-markdown",
      title: "Convert JSON to Markdown",
    },
    {
      slug: "convert-rtf-to-markdown",
      title: "Convert RTF to Markdown",
    },
    {
      slug: "convert-paste-to-markdown",
      title: "Convert Paste to Markdown",
    },
    {
      slug: "convert-webpage-to-markdown",
      title: "Convert Webpage to Markdown",
    },
  ],
  "ai-generators": [
    {
      slug: "ai-reply-generator",
      title: "AI Reply Generator",
    },
    {
      slug: "ai-prompt-generator",
      title: "AI Prompt Generator",
    },
    {
      slug: "ai-prompt-optimizer",
      title: "AI Prompt Optimizer",
    },
    {
      slug: "ai-faq-generator",
      title: "AI FAQ Generator",
    },
    {
      slug: "ai-answer-generator",
      title: "AI Answer Generator",
    },
    {
      slug: "ai-email-response-generator",
      title: "AI Email Response Generator",
    },
    {
      slug: "ai-letter-generator",
      title: "AI Letter Generator",
    },
    {
      slug: "ai-blog-title-generator",
      title: "AI Blog Title Generator",
    },
    {
      slug: "ai-chatbot-name-generator",
      title: "AI Chatbot Name Generator",
    },
    {
      slug: "ai-saas-brand-name-generator",
      title: "AI SaaS Brand Name Generator",
    },
  ],
  "ai-chat-data": [
    {
      slug: "ai-chat-with-your-text-data",
      title: "AI Chat with Your Text Data",
    },
    {
      slug: "ai-chat-with-your-website-data",
      title: "AI Chat with Your Website Data",
    },
    {
      slug: "ai-chat-with-your-document-data",
      title: "AI Chat with Your Document & Data",
    },
    {
      slug: "ai-chat-with-your-pdf-document-data",
      title: "AI Chat with Your PDF Document & Data",
    },
    {
      slug: "ai-chat-with-your-word-document-data",
      title: "AI Chat with Your Word Document & Data",
    },
  ],
  "utility-tools": [
    {
      slug: "ai-chatbot-conversation-analysis",
      title: "AI Chatbot Conversation Analysis",
    },
    {
      slug: "sitemap-checker",
      title: "Sitemap Finder & Checker",
    },
    {
      slug: "sitemap-validator",
      title: "Sitemap Validator",
    },
    {
      slug: "sitemap-generator",
      title: "XML Sitemap Generator",
    },
    {
      slug: "sitemap-url-extractor",
      title: "Sitemap URL Extractor",
    },
    {
      slug: "website-url-extractor",
      title: "Website URL Extractor",
    },
    {
      slug: "chatbot-roi-calculator",
      title: "Chatbot ROI Calculator",
    },
    {
      slug: "email-signature-generator",
      title: "Email Signature Generator",
    },
  ],
};

const CATEGORY_KIND: Record<ToolCategorySlug, ToolKind> = {
  "convert-to-markdown": "converter",
  "ai-generators": "generator",
  "ai-chat-data": "chat",
  "utility-tools": "utility",
};

const INPUT_SOURCE_OVERRIDES: Partial<Record<string, ToolInputSource[]>> = {
  "convert-pdf-to-markdown": ["text", "file"],
  "convert-docx-to-markdown": ["text", "file"],
  "convert-html-to-markdown": ["text", "file"],
  "convert-xml-to-markdown": ["text", "file"],
  "convert-csv-to-markdown": ["text", "file"],
  "convert-json-to-markdown": ["text", "file"],
  "convert-rtf-to-markdown": ["text", "file"],
  "convert-notion-to-markdown": ["url", "text"],
  "convert-google-docs-to-markdown": ["url", "text"],
  "convert-webpage-to-markdown": ["url", "text"],
  "ai-chat-with-your-website-data": ["url", "text"],
  "ai-chat-with-your-document-data": ["text", "file"],
  "ai-chat-with-your-pdf-document-data": ["text", "file"],
  "ai-chat-with-your-word-document-data": ["text", "file"],
  "ai-chatbot-conversation-analysis": ["text", "file"],
  "sitemap-checker": ["url", "text"],
  "sitemap-validator": ["url", "text"],
  "sitemap-generator": ["url", "text"],
  "sitemap-url-extractor": ["url", "text"],
  "website-url-extractor": ["url", "text"],
};

const FILE_ACCEPT_OVERRIDES: Partial<Record<string, string>> = {
  "convert-pdf-to-markdown": ".pdf,application/pdf",
  "convert-docx-to-markdown":
    ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "convert-html-to-markdown": ".html,.htm,text/html",
  "convert-xml-to-markdown": ".xml,text/xml,application/xml",
  "convert-csv-to-markdown": ".csv,text/csv",
  "convert-json-to-markdown": ".json,application/json,text/json",
  "convert-rtf-to-markdown": ".rtf,application/rtf,text/rtf",
  "ai-chat-with-your-document-data": ".txt,.md,.pdf,.doc,.docx,.csv,.json,.xml",
  "ai-chat-with-your-pdf-document-data": ".pdf,application/pdf",
  "ai-chat-with-your-word-document-data":
    ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "ai-chatbot-conversation-analysis": ".txt,.csv,.json,.md",
};

const PRIMARY_PLACEHOLDER_OVERRIDES: Partial<Record<string, string>> = {
  "convert-pdf-to-markdown":
    "Paste extracted PDF text here, or upload a file to process locally.",
  "convert-docx-to-markdown":
    "Paste document text here, or upload a .docx file to process locally.",
  "convert-html-to-markdown":
    "<h1>Release notes</h1><p>Ship updates in weekly batches.</p><ul><li>Improved onboarding</li><li>Faster builds</li></ul>",
  "convert-notion-to-markdown":
    "Paste Notion page content if direct URL extraction is blocked.",
  "convert-google-docs-to-markdown":
    "Paste Google Docs content if the document is private.",
  "convert-xml-to-markdown":
    "<article><title>Quarterly update</title><summary>Revenue grew 18%</summary></article>",
  "convert-csv-to-markdown": "feature,owner,status\nOnboarding,Product,In progress\nBilling,Engineering,Done",
  "convert-json-to-markdown":
    "{\n  \"project\": \"The Stash\",\n  \"owner\": \"Growth\",\n  \"metrics\": [\"traffic\", \"conversion\"]\n}",
  "convert-rtf-to-markdown": "{\\rtf1\\ansi\\b Release Notes\\b0\\par New layout updates are live.}",
  "convert-paste-to-markdown":
    "Paste plain text notes, transcripts, or rough draft content to normalize into Markdown.",
  "convert-webpage-to-markdown":
    "Paste webpage content if fetching by URL is blocked.",
  "ai-reply-generator":
    "Original message:\nHey team, can we move this launch to Friday?\n\nReply goal:\nAcknowledge timeline risk and propose a safer plan.",
  "ai-prompt-generator":
    "Describe the task, audience, constraints, and desired output format.",
  "ai-prompt-optimizer":
    "Paste your current prompt and include what result you are missing.",
  "ai-faq-generator":
    "Describe your product, use cases, and top customer questions.",
  "ai-answer-generator":
    "Paste the question and key facts the answer must include.",
  "ai-email-response-generator":
    "Paste the incoming email and desired response intent.",
  "ai-letter-generator":
    "Describe the recipient, purpose, and tone for the letter.",
  "ai-blog-title-generator":
    "Describe your article topic, audience, and publishing channel.",
  "ai-chatbot-name-generator":
    "Describe your chatbot's role, audience, and personality.",
  "ai-saas-brand-name-generator":
    "Describe your SaaS product, market, and brand personality.",
  "ai-chat-with-your-text-data":
    "Paste source text, notes, or transcripts to query and summarize.",
  "ai-chat-with-your-website-data":
    "https://www.thestash.xyz",
  "ai-chat-with-your-document-data":
    "Paste key document sections or upload a supported file.",
  "ai-chat-with-your-pdf-document-data":
    "Paste extracted PDF content, or upload a PDF file.",
  "ai-chat-with-your-word-document-data":
    "Paste Word content, or upload a .doc/.docx file.",
  "ai-chatbot-conversation-analysis":
    "Paste chat transcripts to surface friction points, unanswered intents, and handoff risks.",
  "sitemap-checker": "https://www.thestash.xyz",
  "sitemap-validator": "https://www.thestash.xyz/sitemap.xml",
  "sitemap-generator": "https://www.thestash.xyz",
  "sitemap-url-extractor": "https://www.thestash.xyz/sitemap.xml",
  "website-url-extractor": "https://www.thestash.xyz",
  "chatbot-roi-calculator":
    "Agents handled per month: 420\nDeflection rate target: 38\nAverage support cost per ticket: 7\nMonthly AI tooling cost: 950",
  "email-signature-generator":
    "Name: Karan Kumar\nRole: Founder, The Stash\nEmail: karan@example.com\nWebsite: https://www.thestash.xyz",
};

const SECONDARY_PLACEHOLDER_OVERRIDES: Partial<Record<string, string>> = {
  "convert-to-markdown":
    "Optional formatting notes (for example: keep headings, preserve links, normalize bullet style).",
  "ai-generators":
    "Optional context, constraints, and brand voice instructions.",
  "ai-chat-data":
    "Optional question to ask the uploaded content.",
  "utility-tools":
    "Optional constraints (crawl depth, exclusions, ROI assumptions, signature style).",
};

const FEATURED_SLUGS = new Set([
  "convert-pdf-to-markdown",
  "convert-docx-to-markdown",
  "convert-webpage-to-markdown",
  "ai-prompt-optimizer",
  "ai-faq-generator",
  "ai-chat-with-your-document-data",
  "sitemap-checker",
  "chatbot-roi-calculator",
]);

function defaultInputSources(category: ToolCategorySlug): ToolInputSource[] {
  if (category === "convert-to-markdown") return ["text"];
  if (category === "ai-chat-data") return ["text"];
  if (category === "utility-tools") return ["text"];
  return ["text"];
}

function getCategoryBySlug(category: ToolCategorySlug): ToolCategoryDefinition {
  const found = TOOL_CATEGORIES.find((entry) => entry.slug === category);
  if (!found) {
    throw new Error(`Unknown tool category: ${category}`);
  }
  return found;
}

function buildSummary(category: ToolCategorySlug, title: string): string {
  if (category === "convert-to-markdown") {
    return `${title} with copy-ready output tuned for docs, wikis, and reusable notes.`;
  }
  if (category === "ai-generators") {
    return `Generate polished drafts with ${title} and refine the output using your own context.`;
  }
  if (category === "ai-chat-data") {
    return `Use ${title} to analyze source material and return concise, actionable answers.`;
  }
  return `Run ${title} to get practical, execution-ready output for day-to-day workflows.`;
}

function buildHeroDescription(category: ToolCategorySlug, title: string): string {
  if (category === "convert-to-markdown") {
    return `Use ${title} to transform raw source content into clean Markdown blocks that you can publish immediately.`;
  }
  if (category === "ai-generators") {
    return `Use ${title} to create strong first drafts quickly, then adapt the output to your product voice.`;
  }
  if (category === "ai-chat-data") {
    return `Use ${title} to extract insights, summaries, and Q&A from your own content sources.`;
  }
  return `Use ${title} for practical execution tasks with clear, copy-ready output you can apply immediately.`;
}

function buildPrimaryInputLabel(category: ToolCategorySlug): string {
  if (category === "convert-to-markdown") return "Source content";
  if (category === "ai-generators") return "Generation request";
  if (category === "ai-chat-data") return "Source data";
  return "Tool input";
}

function buildPrimaryPlaceholder(category: ToolCategorySlug, slug: string): string {
  const override = PRIMARY_PLACEHOLDER_OVERRIDES[slug];
  if (override) return override;

  if (category === "convert-to-markdown") {
    return "Paste content to convert into Markdown.";
  }
  if (category === "ai-generators") {
    return "Describe what you want to generate.";
  }
  if (category === "ai-chat-data") {
    return "Paste source content or key excerpts to analyze.";
  }

  return "Paste the data or instructions for this tool.";
}

function buildSecondaryInputLabel(category: ToolCategorySlug): string | undefined {
  if (category === "convert-to-markdown") return "Formatting preferences (optional)";
  if (category === "ai-generators") return "Context and constraints (optional)";
  if (category === "ai-chat-data") return "Question for this content (optional)";
  if (category === "utility-tools") return "Execution constraints (optional)";
  return undefined;
}

function buildSecondaryPlaceholder(category: ToolCategorySlug): string | undefined {
  return SECONDARY_PLACEHOLDER_OVERRIDES[category];
}

function buildActionLabel(category: ToolCategorySlug): string {
  if (category === "convert-to-markdown") return "Convert to Markdown";
  if (category === "ai-generators") return "Generate output";
  if (category === "ai-chat-data") return "Generate answer";
  return "Run tool";
}

function buildOutputLabel(category: ToolCategorySlug): string {
  if (category === "convert-to-markdown") return "Markdown output";
  if (category === "ai-generators") return "Generated draft";
  if (category === "ai-chat-data") return "Answer and insights";
  return "Tool output";
}

function toToolDefinition(category: ToolCategorySlug, tool: RawTool): ToolDefinition {
  const inputSources =
    INPUT_SOURCE_OVERRIDES[tool.slug] ?? defaultInputSources(category);

  return {
    slug: tool.slug,
    title: tool.title,
    category,
    kind: CATEGORY_KIND[category],
    summary: buildSummary(category, tool.title),
    heroDescription: buildHeroDescription(category, tool.title),
    actionLabel: buildActionLabel(category),
    outputLabel: buildOutputLabel(category),
    primaryInputLabel: buildPrimaryInputLabel(category),
    primaryPlaceholder: buildPrimaryPlaceholder(category, tool.slug),
    secondaryInputLabel: buildSecondaryInputLabel(category),
    secondaryInputPlaceholder: buildSecondaryPlaceholder(category),
    inputSources,
    fileAccept: FILE_ACCEPT_OVERRIDES[tool.slug],
    featured: FEATURED_SLUGS.has(tool.slug),
  };
}

const ALL_TOOLS: ToolDefinition[] = TOOL_CATEGORIES.flatMap((category) =>
  RAW_TOOLS_BY_CATEGORY[category.slug].map((tool) =>
    toToolDefinition(category.slug, tool)
  )
);

const TOOLS_BY_SLUG = new Map(ALL_TOOLS.map((tool) => [tool.slug, tool]));

export function getAllTools(): ToolDefinition[] {
  return [...ALL_TOOLS];
}

export function getAllToolSlugs(): string[] {
  return ALL_TOOLS.map((tool) => tool.slug);
}

export function getToolBySlug(slug: string): ToolDefinition | null {
  return TOOLS_BY_SLUG.get(slug) ?? null;
}

export function getToolCategory(
  category: ToolCategorySlug
): ToolCategoryDefinition {
  return getCategoryBySlug(category);
}

export function getToolsByCategory(category: ToolCategorySlug): ToolDefinition[] {
  return ALL_TOOLS.filter((tool) => tool.category === category);
}

export function getRelatedTools(slug: string, limit: number = 8): ToolDefinition[] {
  const tool = getToolBySlug(slug);
  if (!tool) return [];

  const sameCategory = ALL_TOOLS.filter(
    (candidate) => candidate.slug !== slug && candidate.category === tool.category
  );

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  const extras = ALL_TOOLS.filter(
    (candidate) => candidate.slug !== slug && candidate.category !== tool.category
  );

  return [...sameCategory, ...extras].slice(0, limit);
}

export function getFeaturedTools(limit: number = 6): ToolDefinition[] {
  const featured = ALL_TOOLS.filter((tool) => tool.featured);
  return featured.slice(0, limit);
}
