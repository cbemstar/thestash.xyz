import type { ResourceCategory } from "@/types/resource";

export type CompanyHubLinkKind =
  | "official"
  | "docs"
  | "api"
  | "pricing"
  | "status"
  | "security"
  | "community"
  | "research"
  | "blog"
  | "careers";

export type CompanyHubLink = {
  label: string;
  url: string;
  kind: CompanyHubLinkKind;
};

export type CompanyHubProduct = {
  name: string;
  url: string;
  summary: string;
  toolSlug?: string;
};

export type CompanyHubFact = {
  label: string;
  value: string;
};

export type CompanyHubDefinition = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  summary: string;
  website: string;
  founded?: string;
  headquarters?: string;
  companyType?: string;
  aliases: string[];
  relatedCategories: ResourceCategory[];
  relatedResourceSlugs: string[];
  relatedToolSlugs: string[];
  reportPaths: string[];
  reportOrganizations: string[];
  highlightFacts: CompanyHubFact[];
  officialLinks: CompanyHubLink[];
  products: CompanyHubProduct[];
};

const COMPANY_HUBS: CompanyHubDefinition[] = [
  {
    slug: "openai",
    name: "OpenAI",
    shortName: "OpenAI",
    tagline: "Research and product company behind ChatGPT and GPT models.",
    summary:
      "OpenAI hub for official product links, developer resources, safety documentation, and related tools tracked in The Stash.",
    website: "https://openai.com/",
    founded: "2015",
    headquarters: "San Francisco, California, USA",
    companyType: "AI research and product company",
    aliases: ["openai", "chatgpt", "gpt", "sora", "dall-e"],
    relatedCategories: ["ai-tools"],
    relatedResourceSlugs: ["openai", "chatgpt", "gpt-4o", "gpt-4", "sora", "dall-e"],
    relatedToolSlugs: [],
    reportPaths: ["/reports/ai-adoption-trust-signals", "/reports/seo-ai-answer-discoverability"],
    reportOrganizations: [],
    highlightFacts: [
      { label: "Focus", value: "General-purpose and developer AI systems" },
      { label: "Flagship", value: "ChatGPT and OpenAI API" },
      { label: "Coverage", value: "Consumer + enterprise + developer workflows" },
    ],
    officialLinks: [
      { label: "OpenAI", url: "https://openai.com/", kind: "official" },
      { label: "ChatGPT", url: "https://chatgpt.com/", kind: "official" },
      { label: "OpenAI Platform docs", url: "https://platform.openai.com/docs", kind: "docs" },
      {
        label: "OpenAI API reference",
        url: "https://platform.openai.com/docs/api-reference",
        kind: "api",
      },
      { label: "API pricing", url: "https://openai.com/api/pricing/", kind: "pricing" },
      { label: "Status", url: "https://status.openai.com/", kind: "status" },
      { label: "Safety", url: "https://openai.com/safety/", kind: "security" },
      { label: "Research", url: "https://openai.com/research/", kind: "research" },
    ],
    products: [
      {
        name: "ChatGPT",
        url: "https://chatgpt.com/",
        summary: "Consumer and team interface for chat, analysis, and multimodal workflows.",
      },
      {
        name: "OpenAI API",
        url: "https://platform.openai.com/docs",
        summary: "Developer platform for integrating GPT models into products and automations.",
      },
      {
        name: "Sora",
        url: "https://openai.com/sora/",
        summary: "Generative video system surfaced through OpenAI product updates.",
      },
    ],
  },
  {
    slug: "gemini",
    name: "Google Gemini",
    shortName: "Gemini",
    tagline: "Google’s model and product family for consumer and developer AI workflows.",
    summary:
      "Gemini hub covering the Gemini app, Gemini API, Google AI Studio, and related Google AI documentation.",
    website: "https://gemini.google.com/",
    founded: "2023 brand launch",
    headquarters: "Mountain View, California, USA",
    companyType: "Google AI product family",
    aliases: ["gemini", "google gemini", "google ai", "ai studio", "vertex ai"],
    relatedCategories: ["ai-tools", "development-tools"],
    relatedResourceSlugs: ["gemini", "google-gemini", "google-ai-studio", "vertex-ai"],
    relatedToolSlugs: [],
    reportPaths: ["/reports/seo-ai-answer-discoverability", "/reports/ai-adoption-trust-signals"],
    reportOrganizations: ["Google Cloud / DORA"],
    highlightFacts: [
      { label: "Platform span", value: "Consumer app + API + cloud deployment" },
      { label: "Developer entry", value: "Google AI Studio and Gemini API" },
      { label: "Enterprise path", value: "Vertex AI on Google Cloud" },
    ],
    officialLinks: [
      { label: "Gemini app", url: "https://gemini.google.com/", kind: "official" },
      { label: "Gemini API docs", url: "https://ai.google.dev/gemini-api/docs", kind: "docs" },
      { label: "Google AI Studio", url: "https://aistudio.google.com/", kind: "official" },
      { label: "Gemini API pricing", url: "https://ai.google.dev/pricing", kind: "pricing" },
      { label: "Vertex AI docs", url: "https://cloud.google.com/vertex-ai/docs", kind: "docs" },
      {
        label: "Google AI announcements",
        url: "https://blog.google/technology/ai/",
        kind: "blog",
      },
    ],
    products: [
      {
        name: "Gemini app",
        url: "https://gemini.google.com/",
        summary: "General assistant experience for search, writing, and multimodal tasks.",
      },
      {
        name: "Gemini API",
        url: "https://ai.google.dev/gemini-api/docs",
        summary: "Developer API for model integration in applications and tooling.",
      },
      {
        name: "Google AI Studio",
        url: "https://aistudio.google.com/",
        summary: "Prompting and model experimentation environment for Gemini workflows.",
      },
      {
        name: "Vertex AI",
        url: "https://cloud.google.com/vertex-ai/docs",
        summary: "Managed cloud stack for production ML and enterprise AI deployments.",
      },
    ],
  },
  {
    slug: "github",
    name: "GitHub",
    shortName: "GitHub",
    tagline: "Source-control and developer platform with a major AI tooling footprint.",
    summary:
      "GitHub hub for Copilot, Actions, Codespaces, enterprise docs, and official market reports like Octoverse.",
    website: "https://github.com/",
    founded: "2008",
    headquarters: "San Francisco, California, USA",
    companyType: "Developer platform",
    aliases: ["github", "copilot", "actions", "codespaces", "octoverse"],
    relatedCategories: ["github", "development-tools", "ai-tools"],
    relatedResourceSlugs: ["github", "github-copilot", "vscode", "codespaces"],
    relatedToolSlugs: ["github-copilot"],
    reportPaths: ["/reports/ai-coding-tools-benchmark", "/reports/ai-adoption-trust-signals"],
    reportOrganizations: ["GitHub"],
    highlightFacts: [
      { label: "Core product", value: "Repository hosting and collaboration" },
      { label: "AI product", value: "GitHub Copilot" },
      { label: "Data source", value: "Octoverse annual ecosystem report" },
    ],
    officialLinks: [
      { label: "GitHub", url: "https://github.com/", kind: "official" },
      { label: "GitHub Copilot", url: "https://github.com/features/copilot", kind: "official" },
      { label: "GitHub Docs", url: "https://docs.github.com/", kind: "docs" },
      { label: "Copilot docs", url: "https://docs.github.com/en/copilot", kind: "docs" },
      { label: "Copilot plans", url: "https://github.com/features/copilot/plans", kind: "pricing" },
      { label: "GitHub Actions", url: "https://github.com/features/actions", kind: "official" },
      { label: "GitHub Codespaces", url: "https://github.com/features/codespaces", kind: "official" },
      { label: "GitHub status", url: "https://www.githubstatus.com/", kind: "status" },
      { label: "GitHub blog", url: "https://github.blog/", kind: "blog" },
    ],
    products: [
      {
        name: "GitHub Copilot",
        url: "https://github.com/features/copilot",
        summary: "AI coding assistant integrated across GitHub and IDE workflows.",
        toolSlug: "github-copilot",
      },
      {
        name: "GitHub Actions",
        url: "https://github.com/features/actions",
        summary: "CI/CD automation directly connected to repository workflows.",
      },
      {
        name: "GitHub Codespaces",
        url: "https://github.com/features/codespaces",
        summary: "Cloud development environments tied to GitHub repositories.",
      },
      {
        name: "Advanced Security",
        url: "https://github.com/security/advanced-security",
        summary: "Security scanning and governance controls for software delivery.",
      },
    ],
  },
  {
    slug: "cursor",
    name: "Cursor",
    shortName: "Cursor",
    tagline: "AI-native desktop coding editor focused on repository-aware workflows.",
    summary:
      "Cursor hub with official docs, pricing, ecosystem links, and internal benchmark/comparison coverage.",
    website: "https://cursor.com/",
    companyType: "AI coding editor",
    aliases: ["cursor", "cursor editor", "anysphere"],
    relatedCategories: ["ai-tools", "development-tools"],
    relatedResourceSlugs: ["cursor"],
    relatedToolSlugs: ["cursor"],
    reportPaths: ["/reports/ai-coding-tools-benchmark", "/reports/ai-adoption-trust-signals"],
    reportOrganizations: [],
    highlightFacts: [
      { label: "Primary workflow", value: "Desktop IDE with integrated AI coding loop" },
      { label: "Positioning", value: "AI-native editor for app repositories" },
      { label: "Coverage", value: "Alternatives and comparison pages in The Stash" },
    ],
    officialLinks: [
      { label: "Cursor", url: "https://cursor.com/", kind: "official" },
      { label: "Cursor docs", url: "https://docs.cursor.com/", kind: "docs" },
      { label: "Cursor pricing", url: "https://cursor.com/pricing", kind: "pricing" },
      { label: "Cursor forum", url: "https://forum.cursor.com/", kind: "community" },
      { label: "Cursor changelog", url: "https://cursor.com/changelog", kind: "blog" },
    ],
    products: [
      {
        name: "Cursor Editor",
        url: "https://cursor.com/",
        summary: "AI-assisted coding environment with repo-aware editing and chat.",
        toolSlug: "cursor",
      },
    ],
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    shortName: "Anthropic",
    tagline: "AI safety and model company behind Claude and Claude Code.",
    summary:
      "Anthropic hub for Claude products, API documentation, pricing links, and tool comparisons related to Claude Code.",
    website: "https://www.anthropic.com/",
    founded: "2021",
    headquarters: "San Francisco, California, USA",
    companyType: "AI research and product company",
    aliases: ["anthropic", "claude", "claude code"],
    relatedCategories: ["ai-tools", "development-tools"],
    relatedResourceSlugs: ["anthropic", "claude", "claude-code"],
    relatedToolSlugs: ["claude-code"],
    reportPaths: ["/reports/ai-coding-tools-benchmark", "/reports/ai-adoption-trust-signals"],
    reportOrganizations: [],
    highlightFacts: [
      { label: "Flagship", value: "Claude model family and assistants" },
      { label: "Developer path", value: "Claude API and Claude Code workflows" },
      { label: "Focus", value: "Safety-first model development" },
    ],
    officialLinks: [
      { label: "Anthropic", url: "https://www.anthropic.com/", kind: "official" },
      { label: "Claude app", url: "https://claude.ai/", kind: "official" },
      { label: "Claude Code", url: "https://www.anthropic.com/claude-code", kind: "official" },
      { label: "Anthropic docs", url: "https://docs.anthropic.com/", kind: "docs" },
      { label: "Anthropic pricing", url: "https://www.anthropic.com/pricing", kind: "pricing" },
      { label: "Status", url: "https://status.anthropic.com/", kind: "status" },
      { label: "Research", url: "https://www.anthropic.com/research", kind: "research" },
    ],
    products: [
      {
        name: "Claude",
        url: "https://claude.ai/",
        summary: "General assistant product for reasoning, analysis, and writing workflows.",
      },
      {
        name: "Claude API",
        url: "https://docs.anthropic.com/",
        summary: "Developer API and docs for integrating Claude models into products.",
      },
      {
        name: "Claude Code",
        url: "https://www.anthropic.com/claude-code",
        summary: "Terminal-first coding workflow built on Claude model capabilities.",
        toolSlug: "claude-code",
      },
    ],
  },
  {
    slug: "replit",
    name: "Replit",
    shortName: "Replit",
    tagline: "Cloud development environment for collaborative coding and rapid deployment.",
    summary:
      "Replit hub for official platform links, docs, pricing, and internal references across benchmark, alternatives, and comparison pages.",
    website: "https://replit.com/",
    founded: "2016",
    headquarters: "San Francisco, California, USA",
    companyType: "Cloud development platform",
    aliases: ["replit", "repl", "replit agent"],
    relatedCategories: ["development-tools", "ai-tools"],
    relatedResourceSlugs: ["replit"],
    relatedToolSlugs: ["replit"],
    reportPaths: ["/reports/ai-coding-tools-benchmark", "/reports/ai-adoption-trust-signals"],
    reportOrganizations: [],
    highlightFacts: [
      { label: "Primary workflow", value: "Browser-based coding and collaboration" },
      { label: "Strength", value: "Fast setup for prototyping and teaching workflows" },
      { label: "Coverage", value: "Benchmark + alternatives + compare routes" },
    ],
    officialLinks: [
      { label: "Replit", url: "https://replit.com/", kind: "official" },
      { label: "Replit docs", url: "https://docs.replit.com/", kind: "docs" },
      { label: "Replit pricing", url: "https://replit.com/pricing", kind: "pricing" },
      { label: "Replit status", url: "https://status.replit.com/", kind: "status" },
      { label: "Replit blog", url: "https://blog.replit.com/", kind: "blog" },
      { label: "Replit careers", url: "https://replit.com/careers", kind: "careers" },
    ],
    products: [
      {
        name: "Replit Workspace",
        url: "https://replit.com/",
        summary: "Collaborative online workspace for coding and deployment.",
        toolSlug: "replit",
      },
      {
        name: "Replit Deployments",
        url: "https://docs.replit.com/category/deployments",
        summary: "Integrated deployment path from workspace to hosted application.",
      },
    ],
  },
  {
    slug: "vercel",
    name: "Vercel",
    shortName: "Vercel",
    tagline: "Frontend cloud and tooling ecosystem behind Next.js and v0.",
    summary:
      "Vercel hub for deployment tooling, Next.js ecosystem resources, and v0 links that connect benchmark rows to platform context.",
    website: "https://vercel.com/",
    founded: "2015",
    headquarters: "San Francisco, California, USA",
    companyType: "Frontend cloud platform",
    aliases: ["vercel", "next.js", "nextjs", "v0"],
    relatedCategories: ["development-tools", "ai-tools"],
    relatedResourceSlugs: ["vercel", "nextjs", "v0"],
    relatedToolSlugs: ["vercel", "v0"],
    reportPaths: ["/reports/ai-coding-tools-benchmark"],
    reportOrganizations: [],
    highlightFacts: [
      { label: "Core platform", value: "Frontend deployment and edge delivery" },
      { label: "Framework ecosystem", value: "Next.js and developer tooling stack" },
      { label: "AI product", value: "v0 prompt-to-UI generation workflow" },
    ],
    officialLinks: [
      { label: "Vercel", url: "https://vercel.com/", kind: "official" },
      { label: "Vercel docs", url: "https://vercel.com/docs", kind: "docs" },
      { label: "Vercel pricing", url: "https://vercel.com/pricing", kind: "pricing" },
      { label: "Vercel status", url: "https://www.vercel-status.com/", kind: "status" },
      { label: "v0", url: "https://v0.dev/", kind: "official" },
      { label: "Next.js", url: "https://nextjs.org/", kind: "official" },
      { label: "Next.js docs", url: "https://nextjs.org/docs", kind: "docs" },
    ],
    products: [
      {
        name: "Vercel Platform",
        url: "https://vercel.com/",
        summary: "Cloud platform for building, previewing, and deploying web applications.",
        toolSlug: "vercel",
      },
      {
        name: "v0",
        url: "https://v0.dev/",
        summary: "Prompt-first UI generation workflow for React and Next.js projects.",
        toolSlug: "v0",
      },
      {
        name: "Next.js",
        url: "https://nextjs.org/",
        summary: "React framework ecosystem led by Vercel for full-stack web applications.",
      },
    ],
  },
];

const TOOL_TO_COMPANY_HUB: Record<string, string> = {
  openai: "openai",
  chatgpt: "openai",
  "openai-api": "openai",
  gemini: "gemini",
  "google-gemini": "gemini",
  "google-ai-studio": "gemini",
  "vertex-ai": "gemini",
  github: "github",
  "github-copilot": "github",
  cursor: "cursor",
  anthropic: "anthropic",
  claude: "anthropic",
  "claude-code": "anthropic",
  replit: "replit",
  vercel: "vercel",
  v0: "vercel",
  nextjs: "vercel",
};

const COMPANY_HUBS_BY_SLUG = new Map(COMPANY_HUBS.map((hub) => [hub.slug, hub]));

export function getAllCompanyHubs(): CompanyHubDefinition[] {
  return COMPANY_HUBS;
}

export function getAllCompanyHubSlugs(): string[] {
  return COMPANY_HUBS.map((hub) => hub.slug);
}

export function getCompanyHubBySlug(slug: string): CompanyHubDefinition | null {
  return COMPANY_HUBS_BY_SLUG.get(slug) ?? null;
}

export function getCompanyHubSlugForToolSlug(toolSlug: string): string | null {
  const normalized = toolSlug.trim().toLowerCase();
  if (!normalized) return null;
  if (TOOL_TO_COMPANY_HUB[normalized]) return TOOL_TO_COMPANY_HUB[normalized];
  if (COMPANY_HUBS_BY_SLUG.has(normalized)) return normalized;
  return null;
}

export function getCompanyHubForToolSlug(toolSlug: string): CompanyHubDefinition | null {
  const slug = getCompanyHubSlugForToolSlug(toolSlug);
  return slug ? getCompanyHubBySlug(slug) : null;
}
