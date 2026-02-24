import type {
  Comparison,
  ComparisonFaq,
} from "@/types/comparison";
import type { ResourceCategory, ResourceReference } from "@/types/resource";

type ToolProfile = ResourceReference & {
  slug: string;
  title: string;
  url: string;
  description: string;
  category: ResourceCategory;
  bestFor: string[];
  notFor: string[];
  pricingNotes: string;
  sources: { label: string; url: string }[];
  lastReviewedAt: string;
  setupSpeed: string;
  collaboration: string;
  extensibility: string;
  lockInRisk: string;
};

export type KeywordUrlMapEntry = {
  keyword: string;
  url: string;
  cluster: "core" | "alternatives" | "comparisons" | "support";
};

export type AlternativePageData = {
  slug: string;
  tool: ToolProfile;
  alternatives: ToolProfile[];
  summary: string;
  decisionMatrix: Array<{
    tool: string;
    pricing: string;
    setupSpeed: string;
    collaboration: string;
    extensibility: string;
    lockInRisk: string;
  }>;
  migrationChecklist: string[];
  faq: ComparisonFaq[];
  sources: { label: string; url: string }[];
  lastReviewedAt: string;
};

export type ComparisonPageData = Comparison & {
  slug: string;
  leftSlug: string;
  rightSlug: string;
  compareNext: string[];
};

const TOOL_PROFILES: Record<string, ToolProfile> = {
  cursor: {
    _id: "seo-cursor",
    slug: "cursor",
    title: "Cursor",
    url: "https://cursor.com/",
    description:
      "AI-native code editor with chat, inline edits, and multi-file codebase awareness.",
    category: "ai-tools",
    bestFor: [
      "Engineers shipping quickly in modern TypeScript or full-stack repos",
      "Teams that want AI pair programming inside a desktop IDE",
    ],
    notFor: [
      "Teams that require strict offline development workflows",
      "Users expecting a pure no-AI traditional editor experience",
    ],
    pricingNotes:
      "Freemium entry with paid plans for higher usage and team features.",
    sources: [
      { label: "Cursor", url: "https://cursor.com/" },
      { label: "Cursor docs", url: "https://docs.cursor.com/" },
      { label: "Cursor pricing", url: "https://cursor.com/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Medium",
    extensibility: "High",
    lockInRisk: "Medium",
  },
  "github-copilot": {
    _id: "seo-github-copilot",
    slug: "github-copilot",
    title: "GitHub Copilot",
    url: "https://github.com/features/copilot",
    description:
      "AI coding assistant integrated into IDEs and GitHub workflows for completion, chat, and code generation.",
    category: "ai-tools",
    bestFor: [
      "Teams already deep in GitHub and GitHub Actions",
      "Developers who want broad IDE support with enterprise controls",
    ],
    notFor: [
      "Solo users who only need occasional AI assistance",
      "Teams that avoid GitHub-centric tooling",
    ],
    pricingNotes:
      "Paid per-seat pricing with business and enterprise controls.",
    sources: [
      { label: "GitHub Copilot", url: "https://github.com/features/copilot" },
      { label: "Copilot docs", url: "https://docs.github.com/en/copilot" },
      { label: "Copilot pricing", url: "https://github.com/features/copilot/plans" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "High",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  windsurf: {
    _id: "seo-windsurf",
    slug: "windsurf",
    title: "Windsurf",
    url: "https://windsurf.com/",
    description:
      "AI-assisted development environment focused on rapid code generation and agentic workflows.",
    category: "ai-tools",
    bestFor: [
      "Developers experimenting with agent-style coding workflows",
      "Teams testing AI-first IDE alternatives",
    ],
    notFor: [
      "Organizations requiring deeply mature enterprise governance features",
      "Teams that need conservative long-term vendor stability guarantees",
    ],
    pricingNotes:
      "Freemium to paid tiers with usage limits and premium models.",
    sources: [
      { label: "Windsurf", url: "https://windsurf.com/" },
      { label: "Windsurf docs", url: "https://docs.windsurf.com/" },
      { label: "Windsurf pricing", url: "https://windsurf.com/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Medium",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  "claude-code": {
    _id: "seo-claude-code",
    slug: "claude-code",
    title: "Claude Code",
    url: "https://www.anthropic.com/claude-code",
    description:
      "Terminal-first coding agent workflow powered by Claude models for repo reasoning and edits.",
    category: "ai-tools",
    bestFor: [
      "Senior developers who prefer terminal-driven workflows",
      "Teams adopting AI-assisted scripting and large-repo refactors",
    ],
    notFor: [
      "Users who want fully visual IDE-only workflows",
      "Beginners who need opinionated UI onboarding",
    ],
    pricingNotes:
      "Model consumption pricing with usage-based economics.",
    sources: [
      { label: "Anthropic Claude Code", url: "https://www.anthropic.com/claude-code" },
      { label: "Anthropic docs", url: "https://docs.anthropic.com/" },
      { label: "Anthropic pricing", url: "https://www.anthropic.com/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "Medium",
    extensibility: "High",
    lockInRisk: "Medium",
  },
  bolt: {
    _id: "seo-bolt",
    slug: "bolt",
    title: "Bolt.new",
    url: "https://bolt.new/",
    description:
      "Prompt-to-app builder that generates full-stack projects quickly in-browser.",
    category: "ai-tools",
    bestFor: [
      "Founders validating app ideas with rapid prototyping",
      "Teams shipping MVPs with low setup overhead",
    ],
    notFor: [
      "Complex enterprise apps requiring strict architecture controls",
      "Teams that avoid browser-based development environments",
    ],
    pricingNotes:
      "Usage-based tiers, with paid plans for heavier generation volumes.",
    sources: [
      { label: "Bolt.new", url: "https://bolt.new/" },
      { label: "Bolt docs", url: "https://support.bolt.new/" },
      { label: "Bolt pricing", url: "https://bolt.new/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Very fast",
    collaboration: "Medium",
    extensibility: "Medium",
    lockInRisk: "High",
  },
  lovable: {
    _id: "seo-lovable",
    slug: "lovable",
    title: "Lovable",
    url: "https://lovable.dev/",
    description:
      "AI app builder that turns prompts into production-ready web apps with rapid iteration.",
    category: "ai-tools",
    bestFor: [
      "Teams launching product prototypes quickly",
      "Makers who want no-ops app generation workflows",
    ],
    notFor: [
      "Strictly custom backend architectures from day one",
      "Teams with compliance-heavy platform requirements",
    ],
    pricingNotes:
      "Freemium access with paid plans for team and advanced usage.",
    sources: [
      { label: "Lovable", url: "https://lovable.dev/" },
      { label: "Lovable docs", url: "https://docs.lovable.dev/" },
      { label: "Lovable pricing", url: "https://lovable.dev/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Very fast",
    collaboration: "Medium",
    extensibility: "Medium",
    lockInRisk: "High",
  },
  replit: {
    _id: "seo-replit",
    slug: "replit",
    title: "Replit",
    url: "https://replit.com/",
    description:
      "Cloud development platform for coding, hosting, and collaborating directly in the browser.",
    category: "development-tools",
    bestFor: [
      "Teams teaching, prototyping, or shipping simple web apps quickly",
      "Developers who need instant cloud dev environments",
    ],
    notFor: [
      "Teams demanding fully isolated self-hosted enterprise control",
      "Large monorepos with heavy local-toolchain dependencies",
    ],
    pricingNotes:
      "Free tier with paid plans for private projects and compute scale.",
    sources: [
      { label: "Replit", url: "https://replit.com/" },
      { label: "Replit docs", url: "https://docs.replit.com/" },
      { label: "Replit pricing", url: "https://replit.com/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Very fast",
    collaboration: "High",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  v0: {
    _id: "seo-v0",
    slug: "v0",
    title: "v0",
    url: "https://v0.dev/",
    description:
      "AI UI generation tool for building React and Next.js interfaces from prompts.",
    category: "ai-tools",
    bestFor: [
      "Frontend teams generating UI starting points rapidly",
      "Next.js teams iterating on component scaffolds",
    ],
    notFor: [
      "Teams needing complete backend-heavy app generation",
      "Projects that cannot accept generated-code cleanup work",
    ],
    pricingNotes:
      "Usage-based plans with free exploration tier.",
    sources: [
      { label: "v0", url: "https://v0.dev/" },
      { label: "v0 docs", url: "https://v0.dev/docs" },
      { label: "v0 pricing", url: "https://v0.dev/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Very fast",
    collaboration: "Medium",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  linear: {
    _id: "seo-linear",
    slug: "linear",
    title: "Linear",
    url: "https://linear.app/",
    description:
      "Issue tracking and project planning tool for product and engineering teams.",
    category: "productivity",
    bestFor: [
      "Product-led teams that prefer fast keyboard-first issue workflows",
      "Startups replacing heavier enterprise planning tools",
    ],
    notFor: [
      "Teams requiring deeply customizable workflow hierarchies",
      "Organizations needing built-in legacy enterprise reporting patterns",
    ],
    pricingNotes:
      "Per-user SaaS pricing with free and team plans.",
    sources: [
      { label: "Linear", url: "https://linear.app/" },
      { label: "Linear docs", url: "https://linear.app/docs" },
      { label: "Linear pricing", url: "https://linear.app/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "High",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  raycast: {
    _id: "seo-raycast",
    slug: "raycast",
    title: "Raycast",
    url: "https://raycast.com/",
    description:
      "macOS productivity launcher with extensible commands and integrations for developer workflows.",
    category: "productivity",
    bestFor: [
      "macOS power users replacing multiple utility apps",
      "Developers automating daily workflows with extensions",
    ],
    notFor: [
      "Cross-platform teams requiring identical Windows and Linux behavior",
      "Users preferring fully GUI-driven launchers",
    ],
    pricingNotes:
      "Free core product plus paid pro/team features.",
    sources: [
      { label: "Raycast", url: "https://raycast.com/" },
      { label: "Raycast docs", url: "https://developers.raycast.com/" },
      { label: "Raycast pricing", url: "https://raycast.com/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Medium",
    extensibility: "High",
    lockInRisk: "Low",
  },
  figma: {
    _id: "seo-figma",
    slug: "figma",
    title: "Figma",
    url: "https://www.figma.com/",
    description:
      "Collaborative design platform for interface design, prototyping, and design systems.",
    category: "design-tools",
    bestFor: [
      "Design and product teams collaborating in real time",
      "Teams managing design systems across multiple squads",
    ],
    notFor: [
      "Designers needing completely offline-first workflows",
      "Teams that only need one-off static visual editing",
    ],
    pricingNotes:
      "Freemium with paid editor seats and enterprise controls.",
    sources: [
      { label: "Figma", url: "https://www.figma.com/" },
      { label: "Figma Dev Mode", url: "https://www.figma.com/dev-mode/" },
      { label: "Figma pricing", url: "https://www.figma.com/pricing/" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "High",
    extensibility: "High",
    lockInRisk: "Medium",
  },
  webflow: {
    _id: "seo-webflow",
    slug: "webflow",
    title: "Webflow",
    url: "https://webflow.com/",
    description:
      "Visual web development platform for marketing websites, CMS workflows, and design systems.",
    category: "webflow",
    bestFor: [
      "Marketing teams that need to ship pages without engineering bottlenecks",
      "Design-led teams building CMS-driven websites",
    ],
    notFor: [
      "Teams requiring arbitrary backend compute inside the same platform",
      "Sites with extremely custom server-side architecture requirements",
    ],
    pricingNotes:
      "Workspace and site-plan pricing with CMS and hosting tiers.",
    sources: [
      { label: "Webflow", url: "https://webflow.com/" },
      { label: "Webflow docs", url: "https://webflow.com/university" },
      { label: "Webflow pricing", url: "https://webflow.com/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "High",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  framer: {
    _id: "seo-framer",
    slug: "framer",
    title: "Framer",
    url: "https://www.framer.com/",
    description:
      "Website builder focused on high-fidelity interactions and publishing speed for design teams.",
    category: "design-tools",
    bestFor: [
      "Design teams prioritizing animation-heavy marketing pages",
      "Creators launching polished landing pages quickly",
    ],
    notFor: [
      "Teams needing complex CMS structures at scale",
      "Enterprise teams requiring broad workflow governance features",
    ],
    pricingNotes:
      "Freemium and paid publishing tiers with feature caps by plan.",
    sources: [
      { label: "Framer", url: "https://www.framer.com/" },
      { label: "Framer docs", url: "https://www.framer.com/help/" },
      { label: "Framer pricing", url: "https://www.framer.com/pricing/" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Medium",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  vercel: {
    _id: "seo-vercel",
    slug: "vercel",
    title: "Vercel",
    url: "https://vercel.com/",
    description:
      "Frontend cloud platform for deploying web apps with previews, serverless functions, and edge capabilities.",
    category: "development-tools",
    bestFor: [
      "Next.js and frontend teams shipping quickly with preview deployments",
      "Teams optimizing performance at the edge",
    ],
    notFor: [
      "Teams requiring broad custom infrastructure control on day one",
      "Workloads that are not web-platform centric",
    ],
    pricingNotes:
      "Usage-based platform pricing with free, pro, and enterprise tiers.",
    sources: [
      { label: "Vercel", url: "https://vercel.com/" },
      { label: "Vercel docs", url: "https://vercel.com/docs" },
      { label: "Vercel pricing", url: "https://vercel.com/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "High",
    extensibility: "High",
    lockInRisk: "Medium",
  },
  netlify: {
    _id: "seo-netlify",
    slug: "netlify",
    title: "Netlify",
    url: "https://www.netlify.com/",
    description:
      "Composible web platform for static and modern web apps with CI/CD and edge tooling.",
    category: "development-tools",
    bestFor: [
      "Teams deploying JAMstack or static sites with CI/CD out of the box",
      "Developers who need flexible framework support",
    ],
    notFor: [
      "Teams that only want tightly coupled Next.js-specific workflows",
      "Enterprises requiring fully custom runtime options outside platform limits",
    ],
    pricingNotes:
      "Free plan with paid tiers for build minutes, collaboration, and enterprise controls.",
    sources: [
      { label: "Netlify", url: "https://www.netlify.com/" },
      { label: "Netlify docs", url: "https://docs.netlify.com/" },
      { label: "Netlify pricing", url: "https://www.netlify.com/pricing/" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "High",
    extensibility: "High",
    lockInRisk: "Low",
  },
  "cloudflare-pages": {
    _id: "seo-cloudflare-pages",
    slug: "cloudflare-pages",
    title: "Cloudflare Pages",
    url: "https://pages.cloudflare.com/",
    description:
      "Cloudflare's frontend deployment platform with edge delivery and Workers integration.",
    category: "development-tools",
    bestFor: [
      "Teams building edge-first web apps on Cloudflare's platform",
      "Developers who want tight integration with Workers and Cloudflare services",
    ],
    notFor: [
      "Teams seeking a single platform optimized specifically around Next.js workflows",
      "Organizations requiring platform-specific enterprise controls unavailable in their plan",
    ],
    pricingNotes:
      "Free tier with paid usage for advanced platform and edge workloads.",
    sources: [
      { label: "Cloudflare Pages", url: "https://pages.cloudflare.com/" },
      { label: "Cloudflare Pages docs", url: "https://developers.cloudflare.com/pages/" },
      { label: "Cloudflare pricing", url: "https://www.cloudflare.com/plans/" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Medium",
    extensibility: "High",
    lockInRisk: "Low",
  },
  jira: {
    _id: "seo-jira",
    slug: "jira",
    title: "Jira",
    url: "https://www.atlassian.com/software/jira",
    description:
      "Enterprise project and issue tracking platform with deep workflow customization.",
    category: "productivity",
    bestFor: [
      "Large organizations with complex process requirements",
      "Teams needing detailed reporting and workflow controls",
    ],
    notFor: [
      "Small teams that prioritize speed over process depth",
      "Teams that want minimal setup for day-one usage",
    ],
    pricingNotes:
      "Per-user pricing with multiple enterprise-grade governance options.",
    sources: [
      { label: "Jira", url: "https://www.atlassian.com/software/jira" },
      { label: "Jira docs", url: "https://support.atlassian.com/jira-software-cloud/" },
      { label: "Jira pricing", url: "https://www.atlassian.com/software/jira/pricing" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "High",
    extensibility: "High",
    lockInRisk: "Medium",
  },
  alfred: {
    _id: "seo-alfred",
    slug: "alfred",
    title: "Alfred",
    url: "https://www.alfredapp.com/",
    description:
      "macOS launcher and productivity automation app with workflows and clipboard history.",
    category: "productivity",
    bestFor: [
      "macOS users building local automation workflows",
      "People who prefer keyboard launchers with custom scripting",
    ],
    notFor: [
      "Teams requiring out-of-the-box cross-device collaboration",
      "Users wanting a fully free advanced workflow feature set",
    ],
    pricingNotes:
      "Free basic launcher with paid powerpack for advanced automations.",
    sources: [
      { label: "Alfred", url: "https://www.alfredapp.com/" },
      { label: "Alfred workflows", url: "https://www.alfredapp.com/help/workflows/" },
      { label: "Alfred pricing", url: "https://www.alfredapp.com/shop/" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Low",
    extensibility: "High",
    lockInRisk: "Low",
  },
  wordpress: {
    _id: "seo-wordpress",
    slug: "wordpress",
    title: "WordPress",
    url: "https://wordpress.org/",
    description:
      "Open-source CMS ecosystem powering content-heavy sites with extensible plugins and themes.",
    category: "development-tools",
    bestFor: [
      "Content-heavy sites that need plugin ecosystem flexibility",
      "Teams with WordPress management expertise",
    ],
    notFor: [
      "Teams seeking visual-first no-code design workflows",
      "Projects where plugin maintenance overhead is a blocker",
    ],
    pricingNotes:
      "Open source core with hosting and premium plugin/theme costs.",
    sources: [
      { label: "WordPress.org", url: "https://wordpress.org/" },
      { label: "WordPress docs", url: "https://wordpress.org/documentation/" },
      { label: "WordPress.com pricing", url: "https://wordpress.com/pricing/" },
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "Medium",
    extensibility: "High",
    lockInRisk: "Low",
  },
  codeium: {
    _id: "seo-codeium",
    slug: "codeium",
    title: "Codeium",
    url: "https://codeium.com/",
    description:
      "AI coding assistant for completion and chat across multiple IDE environments.",
    category: "ai-tools",
    bestFor: [
      "Developers comparing AI assistant options beyond GitHub-native stacks",
      "Teams prioritizing broad IDE compatibility",
    ],
    notFor: [
      "Teams that only want deeply GitHub-integrated enterprise governance",
      "Users expecting a terminal-first agent workflow",
    ],
    pricingNotes:
      "Free and paid tiers with team-level features and usage limits.",
    sources: [
      { label: "Codeium", url: "https://codeium.com/" },
      { label: "Codeium pricing", url: "https://codeium.com/pricing" },
      { label: "Codeium docs", url: "https://docs.codeium.com/" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Medium",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  tabnine: {
    _id: "seo-tabnine",
    slug: "tabnine",
    title: "Tabnine",
    url: "https://www.tabnine.com/",
    description:
      "AI code assistant focused on secure completion and enterprise development workflows.",
    category: "ai-tools",
    bestFor: [
      "Teams with strict enterprise policy and secure development requirements",
      "Organizations standardizing assisted coding in multiple IDEs",
    ],
    notFor: [
      "Teams optimizing for newest frontier-model coding behavior",
      "Users seeking browser-native prompt-to-app building flows",
    ],
    pricingNotes:
      "Subscription tiers with enterprise security and policy options.",
    sources: [
      { label: "Tabnine", url: "https://www.tabnine.com/" },
      { label: "Tabnine pricing", url: "https://www.tabnine.com/pricing" },
      { label: "Tabnine docs", url: "https://docs.tabnine.com/" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Medium",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  "sourcegraph-cody": {
    _id: "seo-sourcegraph-cody",
    slug: "sourcegraph-cody",
    title: "Sourcegraph Cody",
    url: "https://sourcegraph.com/cody",
    description:
      "AI coding assistant built around code intelligence and large codebase context.",
    category: "ai-tools",
    bestFor: [
      "Teams navigating large multi-repo codebases",
      "Developers who need stronger code-search context in AI workflows",
    ],
    notFor: [
      "Teams that only need lightweight inline completion",
      "Users looking for no-code app generation",
    ],
    pricingNotes:
      "Free and paid plans with enterprise options for larger teams.",
    sources: [
      { label: "Sourcegraph Cody", url: "https://sourcegraph.com/cody" },
      { label: "Sourcegraph pricing", url: "https://sourcegraph.com/pricing" },
      { label: "Sourcegraph docs", url: "https://sourcegraph.com/docs" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "High",
    extensibility: "High",
    lockInRisk: "Medium",
  },
  "amazon-q-developer": {
    _id: "seo-amazon-q-developer",
    slug: "amazon-q-developer",
    title: "Amazon Q Developer",
    url: "https://aws.amazon.com/q/developer/",
    description:
      "AWS-focused AI coding assistant for application development, debugging, and cloud workflows.",
    category: "ai-tools",
    bestFor: [
      "Teams running AWS-heavy development and operations",
      "Developers who want AI support tightly coupled with AWS services",
    ],
    notFor: [
      "Teams intentionally avoiding cloud-vendor-coupled tooling",
      "Users prioritizing editor-native startup tools outside AWS",
    ],
    pricingNotes:
      "Free tier and paid business tiers aligned to AWS usage and team controls.",
    sources: [
      { label: "Amazon Q Developer", url: "https://aws.amazon.com/q/developer/" },
      { label: "Amazon Q pricing", url: "https://aws.amazon.com/q/developer/pricing/" },
      { label: "Amazon Q docs", url: "https://docs.aws.amazon.com/amazonq/" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "High",
    extensibility: "High",
    lockInRisk: "High",
  },
  "jetbrains-ai-assistant": {
    _id: "seo-jetbrains-ai-assistant",
    slug: "jetbrains-ai-assistant",
    title: "JetBrains AI Assistant",
    url: "https://www.jetbrains.com/ai/",
    description:
      "AI assistant integrated into JetBrains IDEs for completion, chat, and code generation.",
    category: "ai-tools",
    bestFor: [
      "Teams already standardized on JetBrains IDEs",
      "Developers who want AI features within mature IDE tooling",
    ],
    notFor: [
      "Teams using browser-only development environments",
      "Developers who only use lightweight text editors",
    ],
    pricingNotes:
      "Paid add-on and plan structures tied to JetBrains ecosystem licensing.",
    sources: [
      { label: "JetBrains AI", url: "https://www.jetbrains.com/ai/" },
      { label: "JetBrains pricing", url: "https://www.jetbrains.com/ai/pricing/" },
      { label: "JetBrains docs", url: "https://www.jetbrains.com/help/" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "Medium",
    extensibility: "High",
    lockInRisk: "Medium",
  },
  zed: {
    _id: "seo-zed",
    slug: "zed",
    title: "Zed",
    url: "https://zed.dev/",
    description:
      "High-performance collaborative code editor with modern UX and AI integrations.",
    category: "development-tools",
    bestFor: [
      "Teams seeking a fast modern editor with collaborative capabilities",
      "Developers experimenting beyond traditional IDE defaults",
    ],
    notFor: [
      "Teams requiring legacy plugin ecosystems from day one",
      "Organizations locked into specific enterprise IDE vendors",
    ],
    pricingNotes:
      "Free core usage with paid offerings evolving for teams and advanced capabilities.",
    sources: [
      { label: "Zed", url: "https://zed.dev/" },
      { label: "Zed docs", url: "https://zed.dev/docs/" },
      { label: "Zed blog", url: "https://zed.dev/blog/" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "High",
    extensibility: "Medium",
    lockInRisk: "Low",
  },
  vscode: {
    _id: "seo-vscode",
    slug: "vscode",
    title: "Visual Studio Code",
    url: "https://code.visualstudio.com/",
    description:
      "Popular extensible code editor with broad language support and extension ecosystem.",
    category: "development-tools",
    bestFor: [
      "Teams needing broad plugin coverage and language support",
      "Developers who want flexible editor customization",
    ],
    notFor: [
      "Teams seeking tightly opinionated all-in-one IDE workflows",
      "Organizations avoiding extension-management overhead",
    ],
    pricingNotes:
      "Free editor with optional paid add-ons through third-party tooling ecosystems.",
    sources: [
      { label: "VS Code", url: "https://code.visualstudio.com/" },
      { label: "VS Code docs", url: "https://code.visualstudio.com/docs" },
      { label: "VS Code marketplace", url: "https://marketplace.visualstudio.com/vscode" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "Medium",
    extensibility: "High",
    lockInRisk: "Low",
  },
  notion: {
    _id: "seo-notion",
    slug: "notion",
    title: "Notion",
    url: "https://www.notion.so/",
    description:
      "Workspace platform for docs, projects, and knowledge management across teams.",
    category: "productivity",
    bestFor: [
      "Teams combining docs, task planning, and lightweight project workflows",
      "Startups centralizing product and operational documentation",
    ],
    notFor: [
      "Teams requiring strict enterprise issue-workflow controls",
      "Organizations that need deep native agile reporting out of the box",
    ],
    pricingNotes:
      "Free and paid seat-based tiers with enterprise security options.",
    sources: [
      { label: "Notion", url: "https://www.notion.so/" },
      { label: "Notion pricing", url: "https://www.notion.so/pricing" },
      { label: "Notion guides", url: "https://www.notion.so/help" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Fast",
    collaboration: "High",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  clickup: {
    _id: "seo-clickup",
    slug: "clickup",
    title: "ClickUp",
    url: "https://clickup.com/",
    description:
      "All-in-one project management platform for tasks, docs, goals, and team planning.",
    category: "productivity",
    bestFor: [
      "Teams needing configurable project workflows in one platform",
      "Organizations consolidating tasks, docs, and planning systems",
    ],
    notFor: [
      "Small teams that only need minimal lightweight task tracking",
      "Teams prioritizing extremely simple issue flows",
    ],
    pricingNotes:
      "Freemium plus paid tiers by feature depth and automation limits.",
    sources: [
      { label: "ClickUp", url: "https://clickup.com/" },
      { label: "ClickUp pricing", url: "https://clickup.com/pricing" },
      { label: "ClickUp help", url: "https://help.clickup.com/" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "High",
    extensibility: "High",
    lockInRisk: "Medium",
  },
  asana: {
    _id: "seo-asana",
    slug: "asana",
    title: "Asana",
    url: "https://asana.com/",
    description:
      "Project and work management platform for cross-functional team coordination.",
    category: "productivity",
    bestFor: [
      "Cross-functional teams coordinating projects beyond engineering",
      "Organizations that need structured work tracking with broad adoption",
    ],
    notFor: [
      "Engineering-only teams preferring highly technical issue trackers",
      "Teams requiring deeply custom workflow hierarchies",
    ],
    pricingNotes:
      "Seat-based SaaS pricing with business and enterprise feature tiers.",
    sources: [
      { label: "Asana", url: "https://asana.com/" },
      { label: "Asana pricing", url: "https://asana.com/pricing" },
      { label: "Asana guide", url: "https://asana.com/guide" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "High",
    extensibility: "Medium",
    lockInRisk: "Medium",
  },
  monday: {
    _id: "seo-monday",
    slug: "monday",
    title: "monday.com",
    url: "https://monday.com/",
    description:
      "Work operating system for project tracking, workflows, and team collaboration.",
    category: "productivity",
    bestFor: [
      "Teams orchestrating multi-department project workflows",
      "Organizations that need visual workflow dashboards and automation",
    ],
    notFor: [
      "Teams that only need lightweight issue management",
      "Developers who prefer deeply code-centric planning tools",
    ],
    pricingNotes:
      "Per-seat plans with capability tiers for automation and integrations.",
    sources: [
      { label: "monday.com", url: "https://monday.com/" },
      { label: "monday pricing", url: "https://monday.com/pricing" },
      { label: "monday docs", url: "https://support.monday.com/hc/en-us" },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
    setupSpeed: "Medium",
    collaboration: "High",
    extensibility: "High",
    lockInRisk: "Medium",
  },
};

const PHASE_TWO_ALTERNATIVE_SLUG_PRIORITY = [
  "cursor",
  "github-copilot",
  "windsurf",
  "claude-code",
  "bolt",
  "lovable",
  "replit",
  "v0",
  "linear",
  "raycast",
  "figma",
  "webflow",
  "framer",
  "vercel",
  "netlify",
  "cloudflare-pages",
  "jira",
  "alfred",
  "wordpress",
  "codeium",
  "tabnine",
  "sourcegraph-cody",
  "amazon-q-developer",
  "jetbrains-ai-assistant",
  "zed",
  "vscode",
  "notion",
  "clickup",
  "asana",
  "monday",
] as const;

export const PRIMARY_ALTERNATIVE_PAGE_SLUGS =
  PHASE_TWO_ALTERNATIVE_SLUG_PRIORITY.filter((slug) => Boolean(TOOL_PROFILES[slug]));

const PRIMARY_ALTERNATIVE_PAGE_SLUG_SET = new Set<string>(PRIMARY_ALTERNATIVE_PAGE_SLUGS);

const ALTERNATIVE_FALLBACK_BY_CATEGORY: Partial<Record<ResourceCategory, string[]>> = {
  "ai-tools": [
    "cursor",
    "github-copilot",
    "windsurf",
    "claude-code",
    "codeium",
    "tabnine",
    "sourcegraph-cody",
    "amazon-q-developer",
    "jetbrains-ai-assistant",
    "replit",
  ],
  "development-tools": [
    "vscode",
    "zed",
    "replit",
    "vercel",
    "netlify",
    "cloudflare-pages",
    "wordpress",
  ],
  productivity: [
    "linear",
    "jira",
    "notion",
    "clickup",
    "asana",
    "monday",
    "raycast",
    "alfred",
  ],
  "design-tools": ["figma", "framer", "webflow", "v0"],
  webflow: ["webflow", "framer", "wordpress", "v0", "bolt"],
};

const ALTERNATIVES_BY_TOOL: Record<string, string[]> = {
  cursor: ["github-copilot", "windsurf", "claude-code", "replit"],
  "github-copilot": ["cursor", "claude-code", "windsurf", "replit"],
  windsurf: ["cursor", "github-copilot", "claude-code", "replit"],
  "claude-code": ["cursor", "github-copilot", "windsurf", "replit"],
  bolt: ["lovable", "v0", "replit", "webflow"],
  lovable: ["bolt", "v0", "replit", "webflow"],
  replit: ["cursor", "github-copilot", "bolt", "v0"],
  v0: ["bolt", "lovable", "webflow", "framer"],
  linear: ["jira", "github-copilot", "raycast", "replit"],
  raycast: ["alfred", "linear", "replit", "v0"],
  figma: ["framer", "webflow", "v0", "replit"],
  webflow: ["framer", "wordpress", "v0", "bolt"],
  framer: ["webflow", "figma", "v0", "wordpress"],
  vercel: ["netlify", "cloudflare-pages", "replit", "webflow"],
  netlify: ["vercel", "cloudflare-pages", "replit", "webflow"],
  "cloudflare-pages": ["vercel", "netlify", "replit", "wordpress"],
  jira: ["linear", "clickup", "asana", "monday"],
  alfred: ["raycast", "vscode", "notion", "linear"],
  wordpress: ["webflow", "framer", "netlify", "vercel"],
  codeium: ["github-copilot", "cursor", "tabnine", "sourcegraph-cody"],
  tabnine: ["github-copilot", "codeium", "cursor", "jetbrains-ai-assistant"],
  "sourcegraph-cody": ["github-copilot", "cursor", "codeium", "claude-code"],
  "amazon-q-developer": ["github-copilot", "codeium", "jetbrains-ai-assistant", "cursor"],
  "jetbrains-ai-assistant": ["github-copilot", "tabnine", "cursor", "codeium"],
  zed: ["vscode", "cursor", "replit", "jetbrains-ai-assistant"],
  vscode: ["zed", "cursor", "github-copilot", "replit"],
  notion: ["clickup", "asana", "monday", "linear"],
  clickup: ["notion", "asana", "monday", "linear"],
  asana: ["clickup", "monday", "notion", "linear"],
  monday: ["clickup", "asana", "notion", "linear"],
};

function dedupeStringList(values: string[]): string[] {
  return [...new Set(values)];
}

function getAlternativeCandidateSlugs(slug: string): string[] {
  const tool = TOOL_PROFILES[slug];
  if (!tool) return [];

  const explicitCandidates = ALTERNATIVES_BY_TOOL[slug] ?? [];
  const categoryFallbackCandidates = ALTERNATIVE_FALLBACK_BY_CATEGORY[tool.category] ?? [];
  const sameCategoryCandidates = Object.values(TOOL_PROFILES)
    .filter(
      (candidate) =>
        candidate.slug !== slug &&
        candidate.category === tool.category
    )
    .map((candidate) => candidate.slug);

  return dedupeStringList([
    ...explicitCandidates,
    ...categoryFallbackCandidates,
    ...sameCategoryCandidates,
  ]).filter((candidateSlug) => candidateSlug !== slug && Boolean(TOOL_PROFILES[candidateSlug]));
}

const ALTERNATIVES_PAGE_SUMMARY: Record<string, string> = {
  cursor:
    "Use Cursor alternatives when you need tighter GitHub-native controls, lower lock-in, or different IDE workflows.",
  "github-copilot":
    "Use GitHub Copilot alternatives when your team needs deeper codebase context, different model behavior, or better pricing fit.",
  windsurf:
    "Use Windsurf alternatives when you need stronger enterprise controls or a more mature ecosystem.",
  "claude-code":
    "Use Claude Code alternatives when your team prefers visual IDE workflows or broader integration coverage.",
  bolt:
    "Use Bolt.new alternatives when you need different app-builder tradeoffs for control, stack flexibility, and output ownership.",
  lovable:
    "Use Lovable alternatives when you need lower lock-in or stronger code-level customization from day one.",
  replit:
    "Use Replit alternatives when you need local-first workflows, stricter infra control, or lower cloud runtime dependency.",
  v0:
    "Use v0 alternatives when your workflow needs full-stack generation or broader post-generation control.",
  linear:
    "Use Linear alternatives when your org needs heavier process controls or a different issue management style.",
  raycast:
    "Use Raycast alternatives when you want a different launcher philosophy, licensing model, or automation style.",
  figma:
    "Use Figma alternatives when your workflow prioritizes specific publishing, interaction, or offline tradeoffs.",
  webflow:
    "Use Webflow alternatives when your team needs different CMS depth, pricing structure, or design-control boundaries.",
};

const SETUP_SPEED_SCORE: Record<string, number> = {
  "very fast": 4,
  fast: 3,
  medium: 2,
  slow: 1,
};

const LEVEL_SCORE: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const LOCK_IN_SCORE: Record<string, number> = {
  low: 3,
  medium: 2,
  high: 1,
};

type ComparisonBlueprint = {
  leftSlug: string;
  rightSlug: string;
  summary: string;
  winnerByUseCase: Comparison["winnerByUseCase"];
  migrationChecklist?: string[];
  faq?: ComparisonFaq[];
  compareNext?: string[];
  lastReviewedAt?: string;
};

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function scoreMetric(value: string, scoreMap: Record<string, number>): number {
  return scoreMap[normalizeValue(value)] ?? 0;
}

function winnerFromScores(leftScore: number, rightScore: number): "left" | "right" | "tie" {
  if (leftScore === rightScore) return "tie";
  return leftScore > rightScore ? "left" : "right";
}

function getLatestDate(...dateCandidates: Array<string | undefined>): string {
  const validDates = dateCandidates
    .map((dateCandidate) => (dateCandidate ? Date.parse(dateCandidate) : NaN))
    .filter((timestamp) => Number.isFinite(timestamp)) as number[];
  if (validDates.length === 0) return "2026-02-13T00:00:00.000Z";
  const latestTimestamp = Math.max(...validDates);
  return new Date(latestTimestamp).toISOString();
}

function dedupeSourceList(
  sources: Array<{ label: string; url: string }>
): Array<{ label: string; url: string }> {
  const seenUrls = new Set<string>();
  const dedupedSources: Array<{ label: string; url: string }> = [];
  for (const source of sources) {
    if (!source.url || seenUrls.has(source.url)) continue;
    seenUrls.add(source.url);
    dedupedSources.push(source);
  }
  return dedupedSources;
}

function buildCriteriaTable(
  leftTool: ToolProfile,
  rightTool: ToolProfile
): Comparison["criteriaTable"] {
  return [
    {
      criterion: "Pricing model",
      left: leftTool.pricingNotes,
      right: rightTool.pricingNotes,
      winner: "tie",
    },
    {
      criterion: "Setup speed",
      left: leftTool.setupSpeed,
      right: rightTool.setupSpeed,
      winner: winnerFromScores(
        scoreMetric(leftTool.setupSpeed, SETUP_SPEED_SCORE),
        scoreMetric(rightTool.setupSpeed, SETUP_SPEED_SCORE)
      ),
    },
    {
      criterion: "Collaboration",
      left: leftTool.collaboration,
      right: rightTool.collaboration,
      winner: winnerFromScores(
        scoreMetric(leftTool.collaboration, LEVEL_SCORE),
        scoreMetric(rightTool.collaboration, LEVEL_SCORE)
      ),
    },
    {
      criterion: "Extensibility",
      left: leftTool.extensibility,
      right: rightTool.extensibility,
      winner: winnerFromScores(
        scoreMetric(leftTool.extensibility, LEVEL_SCORE),
        scoreMetric(rightTool.extensibility, LEVEL_SCORE)
      ),
    },
    {
      criterion: "Lock-in risk",
      left: leftTool.lockInRisk,
      right: rightTool.lockInRisk,
      winner: winnerFromScores(
        scoreMetric(leftTool.lockInRisk, LOCK_IN_SCORE),
        scoreMetric(rightTool.lockInRisk, LOCK_IN_SCORE)
      ),
    },
  ];
}

function buildGeneratedComparisonPage(
  blueprint: ComparisonBlueprint
): ComparisonPageData | null {
  const leftTool = TOOL_PROFILES[blueprint.leftSlug];
  const rightTool = TOOL_PROFILES[blueprint.rightSlug];
  if (!leftTool || !rightTool) return null;

  const slug = `${leftTool.slug}-vs-${rightTool.slug}`;
  const title = `${leftTool.title} vs ${rightTool.title}`;
  return {
    _id: `seo-compare-${slug}`,
    title,
    slug,
    leftSlug: leftTool.slug,
    rightSlug: rightTool.slug,
    summary: blueprint.summary,
    leftResource: leftTool,
    rightResource: rightTool,
    winnerByUseCase: blueprint.winnerByUseCase,
    criteriaTable: buildCriteriaTable(leftTool, rightTool),
    migrationChecklist: blueprint.migrationChecklist ?? [
      `Define which workflows currently depend on ${leftTool.title} or ${rightTool.title}.`,
      `Run both tools on one real sprint and score quality, speed, and review overhead.`,
      "Choose one default team standard and document exceptions clearly.",
    ],
    faq: blueprint.faq ?? [
      {
        question: `How should teams choose between ${leftTool.title} and ${rightTool.title}?`,
        answer:
          "Pilot both tools on real work, then decide based on quality, adoption friction, governance fit, and total cost.",
      },
    ],
    sources: dedupeSourceList([
      ...leftTool.sources,
      ...rightTool.sources,
    ]).slice(0, 8),
    lastReviewedAt:
      blueprint.lastReviewedAt ??
      getLatestDate(leftTool.lastReviewedAt, rightTool.lastReviewedAt),
    compareNext: blueprint.compareNext ?? [],
    createdAt: "2026-02-13T00:00:00.000Z",
  };
}

const CORE_COMPARISON_PAGE_DATA: ComparisonPageData[] = [
  {
    _id: "seo-compare-cursor-vs-github-copilot",
    title: "Cursor vs GitHub Copilot",
    slug: "cursor-vs-github-copilot",
    leftSlug: "cursor",
    rightSlug: "github-copilot",
    summary:
      "Choose Cursor when you want AI-native editing and deep inline refactoring loops. Choose GitHub Copilot when your org is already standardized on GitHub and needs enterprise-grade policy controls.",
    leftResource: TOOL_PROFILES.cursor,
    rightResource: TOOL_PROFILES["github-copilot"],
    winnerByUseCase: [
      {
        useCase: "Enterprise governance",
        winner: "right",
        reason: "Copilot usually fits GitHub-first governance and policy controls better.",
      },
      {
        useCase: "AI-first coding workflow speed",
        winner: "left",
        reason: "Cursor is optimized around inline AI interactions throughout the editor.",
      },
      {
        useCase: "Multi-repo exploratory coding",
        winner: "tie",
        reason: "Both can support exploration; team workflow preference is the deciding factor.",
      },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Freemium + paid tiers", right: "Per-seat paid tiers", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Fast", winner: "tie" },
      { criterion: "Collaboration", left: "Medium", right: "High", winner: "right" },
      { criterion: "Extensibility", left: "High", right: "Medium", winner: "left" },
      { criterion: "Lock-in risk", left: "Medium", right: "Medium", winner: "tie" },
    ],
    migrationChecklist: [
      "Audit your top 20 repetitive coding workflows.",
      "Run both tools on the same 2-week sprint and compare output quality.",
      "Track acceptance rate of generated code and review friction.",
      "Finalize team standard with explicit prompting conventions.",
    ],
    faq: [
      {
        question: "Which is better for teams already on GitHub Enterprise?",
        answer:
          "GitHub Copilot is usually easier to govern in GitHub-centric enterprise environments.",
      },
      {
        question: "Which one is better for rapid refactoring?",
        answer:
          "Cursor tends to be preferred for heavy iterative refactors because of its AI-first editor flow.",
      },
    ],
    sources: [
      ...TOOL_PROFILES.cursor.sources,
      ...TOOL_PROFILES["github-copilot"].sources,
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["cursor-vs-windsurf", "cursor-vs-claude-code", "github-copilot-vs-claude-code"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-cursor-vs-windsurf",
    title: "Cursor vs Windsurf",
    slug: "cursor-vs-windsurf",
    leftSlug: "cursor",
    rightSlug: "windsurf",
    summary:
      "Choose Cursor for mature AI-IDE workflows and broad ecosystem familiarity. Choose Windsurf when experimenting with newer agentic coding flows is your priority.",
    leftResource: TOOL_PROFILES.cursor,
    rightResource: TOOL_PROFILES.windsurf,
    winnerByUseCase: [
      { useCase: "Workflow maturity", winner: "left", reason: "Cursor has a more established usage pattern across teams." },
      { useCase: "Agentic experimentation", winner: "right", reason: "Windsurf emphasizes agent-like coding experiences." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Freemium + paid", right: "Freemium + paid", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Fast", winner: "tie" },
      { criterion: "Collaboration", left: "Medium", right: "Medium", winner: "tie" },
      { criterion: "Extensibility", left: "High", right: "Medium", winner: "left" },
      { criterion: "Lock-in risk", left: "Medium", right: "Medium", winner: "tie" },
    ],
    migrationChecklist: [
      "Define target repos for side-by-side trials.",
      "Measure bug rates and review overhead over two sprints.",
      "Document prompt patterns that consistently produce useful output.",
    ],
    faq: [
      {
        question: "Is Windsurf better for beginners?",
        answer:
          "It can feel approachable for experimentation, but stable team workflows usually still need clear coding standards.",
      },
    ],
    sources: [...TOOL_PROFILES.cursor.sources, ...TOOL_PROFILES.windsurf.sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["cursor-vs-github-copilot", "cursor-vs-claude-code"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-cursor-vs-claude-code",
    title: "Cursor vs Claude Code",
    slug: "cursor-vs-claude-code",
    leftSlug: "cursor",
    rightSlug: "claude-code",
    summary:
      "Choose Cursor for GUI-first, editor-native AI workflows. Choose Claude Code for terminal-first developers running deeper scripted agent tasks.",
    leftResource: TOOL_PROFILES.cursor,
    rightResource: TOOL_PROFILES["claude-code"],
    winnerByUseCase: [
      { useCase: "IDE-first teams", winner: "left", reason: "Cursor keeps AI and editing in one visual workflow." },
      { useCase: "Terminal-driven automation", winner: "right", reason: "Claude Code fits shell-heavy workflows better." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Subscription tiers", right: "Usage-based", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Medium", winner: "left" },
      { criterion: "Collaboration", left: "Medium", right: "Medium", winner: "tie" },
      { criterion: "Extensibility", left: "High", right: "High", winner: "tie" },
      { criterion: "Lock-in risk", left: "Medium", right: "Medium", winner: "tie" },
    ],
    migrationChecklist: [
      "Define whether your team is IDE-first or terminal-first.",
      "Pilot both approaches on one real feature branch.",
      "Measure turnaround time, defect rates, and review complexity.",
    ],
    faq: [
      {
        question: "Can a team use both tools together?",
        answer:
          "Yes. Many teams standardize one primary workflow and allow a secondary option for specialist tasks.",
      },
    ],
    sources: [...TOOL_PROFILES.cursor.sources, ...TOOL_PROFILES["claude-code"].sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["cursor-vs-github-copilot", "github-copilot-vs-claude-code"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-github-copilot-vs-claude-code",
    title: "GitHub Copilot vs Claude Code",
    slug: "github-copilot-vs-claude-code",
    leftSlug: "github-copilot",
    rightSlug: "claude-code",
    summary:
      "Choose GitHub Copilot for enterprise GitHub-native governance and broad IDE integration. Choose Claude Code for terminal-centric, model-driven coding workflows.",
    leftResource: TOOL_PROFILES["github-copilot"],
    rightResource: TOOL_PROFILES["claude-code"],
    winnerByUseCase: [
      { useCase: "GitHub enterprise governance", winner: "left", reason: "Copilot aligns tightly with GitHub org controls." },
      { useCase: "Terminal-heavy engineering culture", winner: "right", reason: "Claude Code can fit shell-first teams more naturally." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Per-seat", right: "Usage-based", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Medium", winner: "left" },
      { criterion: "Collaboration", left: "High", right: "Medium", winner: "left" },
      { criterion: "Extensibility", left: "Medium", right: "High", winner: "right" },
      { criterion: "Lock-in risk", left: "Medium", right: "Medium", winner: "tie" },
    ],
    migrationChecklist: [
      "Align security and policy requirements first.",
      "Evaluate coding quality on your top 5 real repo tasks.",
      "Lock team prompt conventions and review standards.",
    ],
    faq: [
      {
        question: "Is Copilot always better for teams?",
        answer:
          "Not always. It depends on how much your team relies on GitHub-native processes versus terminal-led workflows.",
      },
    ],
    sources: [
      ...TOOL_PROFILES["github-copilot"].sources,
      ...TOOL_PROFILES["claude-code"].sources,
    ],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["cursor-vs-github-copilot", "cursor-vs-claude-code"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-bolt-vs-lovable",
    title: "Bolt.new vs Lovable",
    slug: "bolt-vs-lovable",
    leftSlug: "bolt",
    rightSlug: "lovable",
    summary:
      "Choose Bolt.new for quick prompt-to-app loops with lightweight setup. Choose Lovable when your workflow emphasizes end-to-end generated app iteration and product polishing.",
    leftResource: TOOL_PROFILES.bolt,
    rightResource: TOOL_PROFILES.lovable,
    winnerByUseCase: [
      { useCase: "Fast prototype generation", winner: "tie", reason: "Both tools are optimized for rapid app scaffolding." },
      { useCase: "Longer iterative product shaping", winner: "right", reason: "Lovable often positions itself toward iterative product building workflows." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Usage-based", right: "Freemium + paid", winner: "tie" },
      { criterion: "Setup speed", left: "Very fast", right: "Very fast", winner: "tie" },
      { criterion: "Collaboration", left: "Medium", right: "Medium", winner: "tie" },
      { criterion: "Extensibility", left: "Medium", right: "Medium", winner: "tie" },
      { criterion: "Lock-in risk", left: "High", right: "High", winner: "tie" },
    ],
    migrationChecklist: [
      "Define app ownership and export requirements first.",
      "Run one test app in both tools and evaluate maintainability.",
      "Decide based on code control and team handoff workflow.",
    ],
    faq: [
      {
        question: "Can these tools replace traditional engineering teams?",
        answer:
          "They accelerate prototyping and early delivery, but complex production systems still need strong engineering oversight.",
      },
    ],
    sources: [...TOOL_PROFILES.bolt.sources, ...TOOL_PROFILES.lovable.sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["v0-vs-bolt"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-v0-vs-bolt",
    title: "v0 vs Bolt.new",
    slug: "v0-vs-bolt",
    leftSlug: "v0",
    rightSlug: "bolt",
    summary:
      "Choose v0 for UI-focused React and Next.js generation. Choose Bolt.new when you need broader prompt-to-app workflows with fast prototyping across full app surfaces.",
    leftResource: TOOL_PROFILES.v0,
    rightResource: TOOL_PROFILES.bolt,
    winnerByUseCase: [
      { useCase: "Frontend UI scaffolding", winner: "left", reason: "v0 is focused on component and interface generation." },
      { useCase: "Prompt-to-MVP speed", winner: "right", reason: "Bolt can be faster for broad full-app prototype starts." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Usage-based", right: "Usage-based", winner: "tie" },
      { criterion: "Setup speed", left: "Very fast", right: "Very fast", winner: "tie" },
      { criterion: "Collaboration", left: "Medium", right: "Medium", winner: "tie" },
      { criterion: "Extensibility", left: "Medium", right: "Medium", winner: "tie" },
      { criterion: "Lock-in risk", left: "Medium", right: "High", winner: "left" },
    ],
    migrationChecklist: [
      "Choose whether you optimize for UI generation or full-app prompting.",
      "Run one landing page and one app prototype test in both tools.",
      "Score both on code cleanliness and handoff friction.",
    ],
    faq: [
      {
        question: "Is v0 only for designers?",
        answer:
          "No. It is useful for developers too, especially when quickly scaffolding interface patterns for React and Next.js.",
      },
    ],
    sources: [...TOOL_PROFILES.v0.sources, ...TOOL_PROFILES.bolt.sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["bolt-vs-lovable", "webflow-vs-framer"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-webflow-vs-framer",
    title: "Webflow vs Framer",
    slug: "webflow-vs-framer",
    leftSlug: "webflow",
    rightSlug: "framer",
    summary:
      "Choose Webflow for CMS-heavy marketing sites and stronger long-term content operations. Choose Framer for rapid motion-first landing pages and design-led publishing speed.",
    leftResource: TOOL_PROFILES.webflow,
    rightResource: TOOL_PROFILES.framer,
    winnerByUseCase: [
      { useCase: "CMS and content operations", winner: "left", reason: "Webflow generally offers stronger structured CMS workflows." },
      { useCase: "Animation-first landing pages", winner: "right", reason: "Framer is often faster for interaction-heavy web experiences." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Workspace + site plans", right: "Freemium + publishing plans", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Fast", winner: "tie" },
      { criterion: "Collaboration", left: "High", right: "Medium", winner: "left" },
      { criterion: "Extensibility", left: "Medium", right: "Medium", winner: "tie" },
      { criterion: "Lock-in risk", left: "Medium", right: "Medium", winner: "tie" },
    ],
    migrationChecklist: [
      "Audit required CMS complexity and editorial workflow first.",
      "Prototype one real landing page in both tools.",
      "Compare handoff requirements with your existing stack.",
    ],
    faq: [
      {
        question: "Which is better for SEO-heavy content sites?",
        answer:
          "Webflow is often preferred when structured CMS workflows and content scale are key priorities.",
      },
    ],
    sources: [...TOOL_PROFILES.webflow.sources, ...TOOL_PROFILES.framer.sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["webflow-vs-wordpress"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-vercel-vs-netlify",
    title: "Vercel vs Netlify",
    slug: "vercel-vs-netlify",
    leftSlug: "vercel",
    rightSlug: "netlify",
    summary:
      "Choose Vercel for a Next.js-first deployment platform with deep preview workflows. Choose Netlify for broad framework flexibility and composable JAMstack-centric deployment pipelines.",
    leftResource: TOOL_PROFILES.vercel,
    rightResource: TOOL_PROFILES.netlify,
    winnerByUseCase: [
      { useCase: "Next.js-centric teams", winner: "left", reason: "Vercel aligns closely with Next.js workflows and capabilities." },
      { useCase: "Framework-agnostic deployment", winner: "right", reason: "Netlify supports a broad composable web stack with flexible workflows." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Usage-based tiers", right: "Usage-based tiers", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Fast", winner: "tie" },
      { criterion: "Collaboration", left: "High", right: "High", winner: "tie" },
      { criterion: "Extensibility", left: "High", right: "High", winner: "tie" },
      { criterion: "Lock-in risk", left: "Medium", right: "Low", winner: "right" },
    ],
    migrationChecklist: [
      "Map hosting requirements and edge/runtime dependencies.",
      "Benchmark build/deploy speeds for your real repo.",
      "Evaluate observability, rollback, and team-permission workflows.",
    ],
    faq: [
      {
        question: "Is Vercel only for Next.js?",
        answer:
          "No, but it is especially optimized for Next.js and frontend-heavy workflows.",
      },
    ],
    sources: [...TOOL_PROFILES.vercel.sources, ...TOOL_PROFILES.netlify.sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["vercel-vs-cloudflare-pages"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-webflow-vs-wordpress",
    title: "Webflow vs WordPress",
    slug: "webflow-vs-wordpress",
    leftSlug: "webflow",
    rightSlug: "wordpress",
    summary:
      "Choose Webflow for visual publishing speed and structured designer-marketer collaboration. Choose WordPress for plugin ecosystem depth and open-source flexibility.",
    leftResource: TOOL_PROFILES.webflow,
    rightResource: TOOL_PROFILES.wordpress,
    winnerByUseCase: [
      { useCase: "Visual-first marketing teams", winner: "left", reason: "Webflow reduces developer dependency for many landing and CMS workflows." },
      { useCase: "Plugin extensibility and ecosystem breadth", winner: "right", reason: "WordPress has one of the broadest plugin ecosystems available." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Workspace + site plans", right: "Open source + hosting/plugins", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Medium", winner: "left" },
      { criterion: "Collaboration", left: "High", right: "Medium", winner: "left" },
      { criterion: "Extensibility", left: "Medium", right: "High", winner: "right" },
      { criterion: "Lock-in risk", left: "Medium", right: "Low", winner: "right" },
    ],
    migrationChecklist: [
      "List required plugins/integrations and map equivalents before migration.",
      "Migrate one representative content section first.",
      "Validate SEO parity (URLs, metadata, schema, redirects) before full cutover.",
    ],
    faq: [
      {
        question: "Is Webflow better for SEO than WordPress?",
        answer:
          "Both can perform well. The better choice depends on execution quality, content ops workflow, and technical constraints.",
      },
    ],
    sources: [...TOOL_PROFILES.webflow.sources, ...TOOL_PROFILES.wordpress.sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["webflow-vs-framer"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-vercel-vs-cloudflare-pages",
    title: "Vercel vs Cloudflare Pages",
    slug: "vercel-vs-cloudflare-pages",
    leftSlug: "vercel",
    rightSlug: "cloudflare-pages",
    summary:
      "Choose Vercel for Next.js-first DX and preview workflow maturity. Choose Cloudflare Pages for edge-native platform integration and Workers-centric architecture.",
    leftResource: TOOL_PROFILES.vercel,
    rightResource: TOOL_PROFILES["cloudflare-pages"],
    winnerByUseCase: [
      { useCase: "Next.js production velocity", winner: "left", reason: "Vercel is tightly optimized for Next.js and preview-led collaboration." },
      { useCase: "Edge platform unification", winner: "right", reason: "Cloudflare Pages integrates naturally with Workers and broader Cloudflare services." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Usage-based tiers", right: "Free + usage tiers", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Fast", winner: "tie" },
      { criterion: "Collaboration", left: "High", right: "Medium", winner: "left" },
      { criterion: "Extensibility", left: "High", right: "High", winner: "tie" },
      { criterion: "Lock-in risk", left: "Medium", right: "Low", winner: "right" },
    ],
    migrationChecklist: [
      "Audit runtime and edge-function dependencies before switching platforms.",
      "Benchmark production performance and build times on both platforms.",
      "Run staged DNS cutover with rollback strategy.",
    ],
    faq: [
      {
        question: "Which is cheaper, Vercel or Cloudflare Pages?",
        answer:
          "It depends on traffic profile, edge execution volume, and collaboration requirements. Validate with real workload estimates.",
      },
    ],
    sources: [...TOOL_PROFILES.vercel.sources, ...TOOL_PROFILES["cloudflare-pages"].sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["vercel-vs-netlify"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-linear-vs-jira",
    title: "Linear vs Jira",
    slug: "linear-vs-jira",
    leftSlug: "linear",
    rightSlug: "jira",
    summary:
      "Choose Linear for speed-focused product teams that want low process overhead. Choose Jira for enterprise-grade workflow customization and reporting depth.",
    leftResource: TOOL_PROFILES.linear,
    rightResource: TOOL_PROFILES.jira,
    winnerByUseCase: [
      { useCase: "Startup execution speed", winner: "left", reason: "Linear emphasizes simplicity and fast day-to-day issue flow." },
      { useCase: "Complex enterprise process management", winner: "right", reason: "Jira offers deep customization and governance capabilities." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Per-user SaaS tiers", right: "Per-user SaaS tiers", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Medium", winner: "left" },
      { criterion: "Collaboration", left: "High", right: "High", winner: "tie" },
      { criterion: "Extensibility", left: "Medium", right: "High", winner: "right" },
      { criterion: "Lock-in risk", left: "Medium", right: "Medium", winner: "tie" },
    ],
    migrationChecklist: [
      "Map your mandatory workflow states and permissions first.",
      "Run one pilot squad for one sprint before full migration.",
      "Verify reporting parity for leadership stakeholders.",
    ],
    faq: [
      {
        question: "Is Linear a full Jira replacement?",
        answer:
          "It can be for many teams, but organizations with heavy custom workflows may still prefer Jira.",
      },
    ],
    sources: [...TOOL_PROFILES.linear.sources, ...TOOL_PROFILES.jira.sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["raycast-vs-alfred"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "seo-compare-raycast-vs-alfred",
    title: "Raycast vs Alfred",
    slug: "raycast-vs-alfred",
    leftSlug: "raycast",
    rightSlug: "alfred",
    summary:
      "Choose Raycast for modern integrated productivity workflows and extension ecosystem momentum. Choose Alfred for lightweight local automation with familiar powerpack workflows.",
    leftResource: TOOL_PROFILES.raycast,
    rightResource: TOOL_PROFILES.alfred,
    winnerByUseCase: [
      { useCase: "Integrated modern developer workflows", winner: "left", reason: "Raycast bundles many app integrations and extension flows in one place." },
      { useCase: "Lean local launcher automation", winner: "right", reason: "Alfred remains strong for local scriptable launcher workflows." },
    ],
    criteriaTable: [
      { criterion: "Pricing model", left: "Free + paid features", right: "Free + powerpack", winner: "tie" },
      { criterion: "Setup speed", left: "Fast", right: "Fast", winner: "tie" },
      { criterion: "Collaboration", left: "Medium", right: "Low", winner: "left" },
      { criterion: "Extensibility", left: "High", right: "High", winner: "tie" },
      { criterion: "Lock-in risk", left: "Low", right: "Low", winner: "tie" },
    ],
    migrationChecklist: [
      "Export/import core snippets and launcher shortcuts first.",
      "Rebuild top 10 daily workflows before switching full-time.",
      "Keep fallback launcher active for one week during transition.",
    ],
    faq: [
      {
        question: "Should macOS power users switch from Alfred to Raycast?",
        answer:
          "Switch only if Raycast's integrated workflows save meaningful daily time for your specific toolchain.",
      },
    ],
    sources: [...TOOL_PROFILES.raycast.sources, ...TOOL_PROFILES.alfred.sources],
    lastReviewedAt: "2026-02-10T00:00:00.000Z",
    compareNext: ["linear-vs-jira"],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
];

const SCALE_COMPARISON_BLUEPRINTS: ComparisonBlueprint[] = [
  {
    leftSlug: "cursor",
    rightSlug: "codeium",
    summary:
      "Choose Cursor for AI-native editing loops and multi-file refactors. Choose Codeium when broad IDE compatibility and straightforward rollout matter most.",
    winnerByUseCase: [
      {
        useCase: "AI-first editor workflow",
        winner: "left",
        reason: "Cursor is oriented around deep editor-native AI interactions.",
      },
      {
        useCase: "Cross-IDE standardization",
        winner: "right",
        reason: "Codeium is often selected for broad multi-IDE coverage.",
      },
    ],
    compareNext: ["cursor-vs-github-copilot", "github-copilot-vs-codeium"],
  },
  {
    leftSlug: "cursor",
    rightSlug: "tabnine",
    summary:
      "Choose Cursor for rapid AI-assisted editing and refactor loops. Choose Tabnine when enterprise policy controls and secure rollout requirements are the priority.",
    winnerByUseCase: [
      {
        useCase: "Rapid AI pair-programming",
        winner: "left",
        reason: "Cursor's UX is optimized around iterative AI coding flows.",
      },
      {
        useCase: "Policy-driven enterprise deployment",
        winner: "right",
        reason: "Tabnine is commonly evaluated for compliance-heavy org requirements.",
      },
    ],
    compareNext: ["cursor-vs-github-copilot", "github-copilot-vs-tabnine"],
  },
  {
    leftSlug: "cursor",
    rightSlug: "sourcegraph-cody",
    summary:
      "Choose Cursor for AI-native editor speed in day-to-day shipping. Choose Sourcegraph Cody for large-repo code intelligence and search-heavy engineering workflows.",
    winnerByUseCase: [
      {
        useCase: "Daily coding iteration speed",
        winner: "left",
        reason: "Cursor is purpose-built for fast inline editor workflows.",
      },
      {
        useCase: "Large codebase context and navigation",
        winner: "right",
        reason: "Cody is designed around code intelligence in complex repositories.",
      },
    ],
    compareNext: ["cursor-vs-github-copilot", "github-copilot-vs-sourcegraph-cody"],
  },
  {
    leftSlug: "github-copilot",
    rightSlug: "codeium",
    summary:
      "Choose GitHub Copilot for teams standardized on GitHub workflows and controls. Choose Codeium for broader IDE reach with a different pricing and rollout profile.",
    winnerByUseCase: [
      {
        useCase: "GitHub-native governance",
        winner: "left",
        reason: "Copilot integrates directly into GitHub policy and enterprise workflows.",
      },
      {
        useCase: "Vendor diversification across editors",
        winner: "right",
        reason: "Codeium can reduce dependence on one ecosystem in mixed IDE teams.",
      },
    ],
    compareNext: ["cursor-vs-github-copilot", "github-copilot-vs-tabnine"],
  },
  {
    leftSlug: "github-copilot",
    rightSlug: "tabnine",
    summary:
      "Choose GitHub Copilot for tighter GitHub platform alignment. Choose Tabnine when secure enterprise deployment and policy controls are weighted more heavily.",
    winnerByUseCase: [
      {
        useCase: "GitHub platform integration",
        winner: "left",
        reason: "Copilot aligns closely with existing GitHub team operations.",
      },
      {
        useCase: "Security-policy-first rollout",
        winner: "right",
        reason: "Tabnine is frequently shortlisted for security-forward deployment needs.",
      },
    ],
    compareNext: ["github-copilot-vs-codeium", "cursor-vs-tabnine"],
  },
  {
    leftSlug: "github-copilot",
    rightSlug: "sourcegraph-cody",
    summary:
      "Choose GitHub Copilot for broad developer adoption in GitHub-centric teams. Choose Sourcegraph Cody when deep code search and large-repo context are the deciding factors.",
    winnerByUseCase: [
      {
        useCase: "Organization-wide assistant rollout",
        winner: "left",
        reason: "Copilot is common in teams with established GitHub governance.",
      },
      {
        useCase: "Large monorepo context depth",
        winner: "right",
        reason: "Cody emphasizes code intelligence for multi-repo and monorepo environments.",
      },
    ],
    compareNext: ["cursor-vs-sourcegraph-cody", "github-copilot-vs-codeium"],
  },
  {
    leftSlug: "github-copilot",
    rightSlug: "amazon-q-developer",
    summary:
      "Choose GitHub Copilot for general-purpose AI coding inside GitHub workflows. Choose Amazon Q Developer when your team is deeply aligned to AWS-first application and operations workflows.",
    winnerByUseCase: [
      {
        useCase: "General GitHub engineering workflows",
        winner: "left",
        reason: "Copilot is optimized for broad IDE plus GitHub workflow adoption.",
      },
      {
        useCase: "AWS-native developer workflow",
        winner: "right",
        reason: "Amazon Q Developer is tightly integrated with AWS platform usage.",
      },
    ],
    compareNext: ["github-copilot-vs-codeium", "github-copilot-vs-jetbrains-ai-assistant"],
  },
  {
    leftSlug: "github-copilot",
    rightSlug: "jetbrains-ai-assistant",
    summary:
      "Choose GitHub Copilot for GitHub-native collaboration and policy controls. Choose JetBrains AI Assistant when your engineering org is standardized on JetBrains IDE workflows.",
    winnerByUseCase: [
      {
        useCase: "GitHub-centered collaboration",
        winner: "left",
        reason: "Copilot fits naturally into GitHub-based review and governance processes.",
      },
      {
        useCase: "JetBrains IDE standardization",
        winner: "right",
        reason: "JetBrains AI Assistant is integrated directly into JetBrains tooling.",
      },
    ],
    compareNext: ["cursor-vs-github-copilot", "github-copilot-vs-amazon-q-developer"],
  },
  {
    leftSlug: "vscode",
    rightSlug: "zed",
    summary:
      "Choose Visual Studio Code for extension ecosystem depth and broad adoption. Choose Zed for speed, modern collaboration UX, and a lighter editor runtime.",
    winnerByUseCase: [
      {
        useCase: "Extension ecosystem breadth",
        winner: "left",
        reason: "VS Code has one of the largest extension ecosystems available.",
      },
      {
        useCase: "Editor performance and modern UX",
        winner: "right",
        reason: "Zed is built for high performance and streamlined collaboration flows.",
      },
    ],
    compareNext: ["cursor-vs-codeium", "cursor-vs-github-copilot"],
  },
  {
    leftSlug: "linear",
    rightSlug: "clickup",
    summary:
      "Choose Linear for fast product-engineering issue flow with lower process overhead. Choose ClickUp for broader customizable project workflows across multiple departments.",
    winnerByUseCase: [
      {
        useCase: "Engineering execution speed",
        winner: "left",
        reason: "Linear prioritizes speed and a focused issue-tracking workflow.",
      },
      {
        useCase: "Cross-functional workflow customization",
        winner: "right",
        reason: "ClickUp supports deep customization for varied team processes.",
      },
    ],
    compareNext: ["linear-vs-jira", "linear-vs-asana", "linear-vs-notion"],
  },
  {
    leftSlug: "linear",
    rightSlug: "asana",
    summary:
      "Choose Linear for product and engineering teams that optimize for speed. Choose Asana when cross-functional planning and organization-wide project visibility are more important.",
    winnerByUseCase: [
      {
        useCase: "Product and engineering issue velocity",
        winner: "left",
        reason: "Linear focuses on fast keyboard-first execution for technical teams.",
      },
      {
        useCase: "Company-wide project coordination",
        winner: "right",
        reason: "Asana is frequently selected for broad cross-team work management.",
      },
    ],
    compareNext: ["linear-vs-jira", "linear-vs-clickup", "linear-vs-notion"],
  },
  {
    leftSlug: "linear",
    rightSlug: "notion",
    summary:
      "Choose Linear for dedicated issue management and sprint execution. Choose Notion when docs, planning, and lightweight task workflows need to live in one workspace.",
    winnerByUseCase: [
      {
        useCase: "Dedicated technical issue tracking",
        winner: "left",
        reason: "Linear is purpose-built for product and engineering execution workflows.",
      },
      {
        useCase: "Unified docs plus planning workspace",
        winner: "right",
        reason: "Notion combines documentation and project planning in one system.",
      },
    ],
    compareNext: ["linear-vs-asana", "linear-vs-clickup", "linear-vs-monday"],
  },
  {
    leftSlug: "linear",
    rightSlug: "monday",
    summary:
      "Choose Linear for focused product-engineering workflow speed. Choose monday.com when visual workflows, automation, and department-wide planning are the priority.",
    winnerByUseCase: [
      {
        useCase: "Focused engineering issue management",
        winner: "left",
        reason: "Linear keeps technical workflows lean and speed-oriented.",
      },
      {
        useCase: "Visual multi-team workflow orchestration",
        winner: "right",
        reason: "monday.com emphasizes visual planning and broad workflow automation.",
      },
    ],
    compareNext: ["linear-vs-notion", "linear-vs-clickup", "linear-vs-asana"],
  },
];

const GENERATED_SCALE_COMPARISON_DATA = SCALE_COMPARISON_BLUEPRINTS
  .map((blueprint) => buildGeneratedComparisonPage(blueprint))
  .filter((comparison): comparison is ComparisonPageData => Boolean(comparison));

const COMPARISON_PAGE_DATA: ComparisonPageData[] = [
  ...CORE_COMPARISON_PAGE_DATA,
  ...GENERATED_SCALE_COMPARISON_DATA,
];

const COMPARISON_BY_SLUG = new Map(
  COMPARISON_PAGE_DATA.map((comparison) => [comparison.slug, comparison])
);

const COMPARISON_CANONICAL_BY_PAIR = new Map<string, string>();

for (const comparison of COMPARISON_PAGE_DATA) {
  COMPARISON_CANONICAL_BY_PAIR.set(
    `${comparison.leftSlug}|${comparison.rightSlug}`,
    comparison.slug
  );
  COMPARISON_CANONICAL_BY_PAIR.set(
    `${comparison.rightSlug}|${comparison.leftSlug}`,
    comparison.slug
  );
}

export const SEO_KEYWORD_TO_URL_MAP: KeywordUrlMapEntry[] = [
  { keyword: "dev and design resources", url: "/", cluster: "core" },
  { keyword: "best ai coding assistant", url: "/use-cases/best-ai-coding-assistants", cluster: "core" },
  { keyword: "best ai tools for developers", url: "/use-cases/best-ai-coding-assistants", cluster: "core" },
  { keyword: "ai code editor", url: "/alternatives/cursor", cluster: "core" },
  { keyword: "ai code review tools", url: "/use-cases/ai-code-review-tools", cluster: "core" },
  { keyword: "open source ai coding assistant", url: "/use-cases/best-open-source-developer-tools", cluster: "core" },
  { keyword: "developer productivity tools", url: "/collections/productivity-tools", cluster: "core" },
  { keyword: "cursor alternatives", url: "/alternatives/cursor", cluster: "alternatives" },
  { keyword: "github copilot alternatives", url: "/alternatives/github-copilot", cluster: "alternatives" },
  { keyword: "windsurf alternatives", url: "/alternatives/windsurf", cluster: "alternatives" },
  { keyword: "claude code alternatives", url: "/alternatives/claude-code", cluster: "alternatives" },
  { keyword: "bolt.new alternatives", url: "/alternatives/bolt", cluster: "alternatives" },
  { keyword: "lovable alternatives", url: "/alternatives/lovable", cluster: "alternatives" },
  { keyword: "replit alternatives", url: "/alternatives/replit", cluster: "alternatives" },
  { keyword: "v0 alternatives", url: "/alternatives/v0", cluster: "alternatives" },
  { keyword: "linear alternatives", url: "/alternatives/linear", cluster: "alternatives" },
  { keyword: "raycast alternatives", url: "/alternatives/raycast", cluster: "alternatives" },
  { keyword: "figma alternatives", url: "/alternatives/figma", cluster: "alternatives" },
  { keyword: "webflow alternatives", url: "/alternatives/webflow", cluster: "alternatives" },
  { keyword: "framer alternatives", url: "/alternatives/framer", cluster: "alternatives" },
  { keyword: "vercel alternatives", url: "/alternatives/vercel", cluster: "alternatives" },
  { keyword: "netlify alternatives", url: "/alternatives/netlify", cluster: "alternatives" },
  { keyword: "cloudflare pages alternatives", url: "/alternatives/cloudflare-pages", cluster: "alternatives" },
  { keyword: "jira alternatives", url: "/alternatives/jira", cluster: "alternatives" },
  { keyword: "alfred alternatives", url: "/alternatives/alfred", cluster: "alternatives" },
  { keyword: "wordpress alternatives", url: "/alternatives/wordpress", cluster: "alternatives" },
  { keyword: "codeium alternatives", url: "/alternatives/codeium", cluster: "alternatives" },
  { keyword: "tabnine alternatives", url: "/alternatives/tabnine", cluster: "alternatives" },
  { keyword: "sourcegraph cody alternatives", url: "/alternatives/sourcegraph-cody", cluster: "alternatives" },
  { keyword: "amazon q developer alternatives", url: "/alternatives/amazon-q-developer", cluster: "alternatives" },
  { keyword: "jetbrains ai assistant alternatives", url: "/alternatives/jetbrains-ai-assistant", cluster: "alternatives" },
  { keyword: "zed alternatives", url: "/alternatives/zed", cluster: "alternatives" },
  { keyword: "visual studio code alternatives", url: "/alternatives/vscode", cluster: "alternatives" },
  { keyword: "notion alternatives", url: "/alternatives/notion", cluster: "alternatives" },
  { keyword: "clickup alternatives", url: "/alternatives/clickup", cluster: "alternatives" },
  { keyword: "asana alternatives", url: "/alternatives/asana", cluster: "alternatives" },
  { keyword: "monday.com alternatives", url: "/alternatives/monday", cluster: "alternatives" },
  { keyword: "cursor vs github copilot", url: "/compare/cursor-vs-github-copilot", cluster: "comparisons" },
  { keyword: "cursor vs windsurf", url: "/compare/cursor-vs-windsurf", cluster: "comparisons" },
  { keyword: "cursor vs claude code", url: "/compare/cursor-vs-claude-code", cluster: "comparisons" },
  { keyword: "github copilot vs claude code", url: "/compare/github-copilot-vs-claude-code", cluster: "comparisons" },
  { keyword: "bolt.new vs lovable", url: "/compare/bolt-vs-lovable", cluster: "comparisons" },
  { keyword: "v0 vs bolt.new", url: "/compare/v0-vs-bolt", cluster: "comparisons" },
  { keyword: "webflow vs framer", url: "/compare/webflow-vs-framer", cluster: "comparisons" },
  { keyword: "webflow vs wordpress", url: "/compare/webflow-vs-wordpress", cluster: "comparisons" },
  { keyword: "vercel vs netlify", url: "/compare/vercel-vs-netlify", cluster: "comparisons" },
  { keyword: "vercel vs cloudflare pages", url: "/compare/vercel-vs-cloudflare-pages", cluster: "comparisons" },
  { keyword: "linear vs jira", url: "/compare/linear-vs-jira", cluster: "comparisons" },
  { keyword: "raycast vs alfred", url: "/compare/raycast-vs-alfred", cluster: "comparisons" },
  { keyword: "cursor vs codeium", url: "/compare/cursor-vs-codeium", cluster: "comparisons" },
  { keyword: "cursor vs tabnine", url: "/compare/cursor-vs-tabnine", cluster: "comparisons" },
  { keyword: "cursor vs sourcegraph cody", url: "/compare/cursor-vs-sourcegraph-cody", cluster: "comparisons" },
  { keyword: "github copilot vs codeium", url: "/compare/github-copilot-vs-codeium", cluster: "comparisons" },
  { keyword: "github copilot vs tabnine", url: "/compare/github-copilot-vs-tabnine", cluster: "comparisons" },
  { keyword: "github copilot vs sourcegraph cody", url: "/compare/github-copilot-vs-sourcegraph-cody", cluster: "comparisons" },
  { keyword: "github copilot vs amazon q developer", url: "/compare/github-copilot-vs-amazon-q-developer", cluster: "comparisons" },
  { keyword: "github copilot vs jetbrains ai assistant", url: "/compare/github-copilot-vs-jetbrains-ai-assistant", cluster: "comparisons" },
  { keyword: "visual studio code vs zed", url: "/compare/vscode-vs-zed", cluster: "comparisons" },
  { keyword: "linear vs clickup", url: "/compare/linear-vs-clickup", cluster: "comparisons" },
  { keyword: "linear vs asana", url: "/compare/linear-vs-asana", cluster: "comparisons" },
  { keyword: "linear vs notion", url: "/compare/linear-vs-notion", cluster: "comparisons" },
  { keyword: "linear vs monday.com", url: "/compare/linear-vs-monday", cluster: "comparisons" },
  { keyword: "copilot vs claude code", url: "/compare/github-copilot-vs-claude-code", cluster: "comparisons" },
  { keyword: "bolt vs lovable", url: "/compare/bolt-vs-lovable", cluster: "comparisons" },
  { keyword: "v0 vs bolt", url: "/compare/v0-vs-bolt", cluster: "comparisons" },
  { keyword: "best code search tools", url: "/use-cases/best-code-search-tools", cluster: "support" },
  { keyword: "best react ui component libraries", url: "/use-cases/best-react-ui-component-libraries", cluster: "support" },
  { keyword: "best shadcn component libraries", url: "/use-cases/best-shadcn-component-libraries", cluster: "support" },
  { keyword: "best open source developer tools", url: "/use-cases/best-open-source-developer-tools", cluster: "support" },
  { keyword: "best web design inspiration websites", url: "/use-cases/best-web-design-inspiration-websites", cluster: "support" },
  { keyword: "tools for nextjs developers", url: "/use-cases/tools-for-nextjs-developers", cluster: "support" },
  { keyword: "ai code generation tools", url: "/use-cases/ai-code-generation-tools", cluster: "support" },
  { keyword: "ai pair programming tools", url: "/use-cases/ai-pair-programming-tools", cluster: "support" },
  { keyword: "ai tools for terminal workflows", url: "/use-cases/ai-tools-for-terminal-workflows", cluster: "support" },
  { keyword: "best developer productivity tools", url: "/use-cases/best-developer-productivity-tools", cluster: "support" },
  { keyword: "best issue tracking tools for developers", url: "/use-cases/best-issue-tracking-tools-for-developers", cluster: "support" },
  { keyword: "best project management tools for software teams", url: "/use-cases/best-project-management-tools-for-software-teams", cluster: "support" },
  { keyword: "best mac productivity tools for developers", url: "/use-cases/best-macos-productivity-tools-for-developers", cluster: "support" },
  { keyword: "best ai app builders", url: "/use-cases/best-ai-app-builders", cluster: "support" },
  { keyword: "best landing page builder tools", url: "/use-cases/best-tools-for-landing-page-builders", cluster: "support" },
  { keyword: "best frontend deployment platforms", url: "/use-cases/best-frontend-deployment-platforms", cluster: "support" },
  { keyword: "best developer documentation tools", url: "/use-cases/best-developer-documentation-tools", cluster: "support" },
  { keyword: "best tools for startup mvp", url: "/use-cases/best-tools-for-startup-mvp-builders", cluster: "support" },
  { keyword: "design to code tools", url: "/use-cases/best-design-to-code-tools", cluster: "support" },
  { keyword: "best tools for product design teams", url: "/use-cases/best-tools-for-product-design-teams", cluster: "support" },
  { keyword: "tools for cross functional planning", url: "/use-cases/best-tools-for-cross-functional-planning", cluster: "support" },
  { keyword: "tools for remote engineering teams", url: "/use-cases/best-tools-for-remote-engineering-teams", cluster: "support" },
  { keyword: "tools for open source maintainers", url: "/use-cases/best-tools-for-open-source-maintainers", cluster: "support" },
  { keyword: "design tools directory", url: "/category/design-tools", cluster: "support" },
  { keyword: "development tools list", url: "/category/development-tools", cluster: "support" },
  { keyword: "ui ux resources", url: "/category/ui-ux-resources", cluster: "support" },
  { keyword: "ai tools directory", url: "/category/ai-tools", cluster: "support" },
  { keyword: "ai tools list", url: "/category/ai-tools", cluster: "support" },
  { keyword: "productivity tools for developers", url: "/collections/productivity-tools", cluster: "support" },
  { keyword: "webflow resources", url: "/ecosystems/webflow", cluster: "support" },
  { keyword: "webflow components", url: "/ecosystems/webflow", cluster: "support" },
  { keyword: "webflow cloneables", url: "/ecosystems/webflow", cluster: "support" },
  { keyword: "best webflow apps", url: "/ecosystems/webflow", cluster: "support" },
  { keyword: "webflow inspiration", url: "/ecosystems/webflow", cluster: "support" },
  { keyword: "shadcn components", url: "/use-cases/best-shadcn-component-libraries", cluster: "support" },
  { keyword: "shadcn ui blocks", url: "/use-cases/best-shadcn-component-libraries", cluster: "support" },
  { keyword: "learning resources for developers", url: "/category/learning-resources", cluster: "support" },
  { keyword: "learning resources for designers", url: "/category/learning-resources", cluster: "support" },
  { keyword: "best design inspiration sites", url: "/use-cases/best-web-design-inspiration-websites", cluster: "support" },
  { keyword: "developer tools directory", url: "/category/development-tools", cluster: "support" },
  { keyword: "top software tools for developers", url: "/category/development-tools", cluster: "support" },
  { keyword: "open source ai note taking tools", url: "/use-cases/open-source-ai-note-taking-tools", cluster: "support" },
  { keyword: "privacy first research platform", url: "/use-cases/open-source-ai-note-taking-tools", cluster: "support" },
  { keyword: "open source ui components", url: "/use-cases/tailwind-react-dashboard-templates", cluster: "support" },
  { keyword: "tailwind templates react dashboards", url: "/use-cases/tailwind-react-dashboard-templates", cluster: "support" },
  { keyword: "github resources list", url: "/category/github", cluster: "support" },
  { keyword: "best github repositories for designers", url: "/category/github", cluster: "support" },
  { keyword: "ai coding tools benchmark", url: "/reports/ai-coding-tools-benchmark", cluster: "support" },
];

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function isOlderThan90Days(dateLike?: string | null): boolean {
  if (!dateLike) return true;
  const ts = Date.parse(dateLike);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > NINETY_DAYS_MS;
}

export function getToolProfile(slug: string): ToolProfile | null {
  return TOOL_PROFILES[slug] ?? null;
}

export function getAlternativePageData(slug: string): AlternativePageData | null {
  if (!PRIMARY_ALTERNATIVE_PAGE_SLUG_SET.has(slug)) {
    return null;
  }
  const tool = TOOL_PROFILES[slug];
  if (!tool) return null;
  const alternatives = getAlternativeCandidateSlugs(slug)
    .map((alternativeSlug) => TOOL_PROFILES[alternativeSlug])
    .filter(Boolean)
    .slice(0, 6);
  if (alternatives.length === 0) return null;

  const decisionMatrix = [tool, ...alternatives.slice(0, 4)].map((entry) => ({
    tool: entry.title,
    pricing: entry.pricingNotes,
    setupSpeed: entry.setupSpeed,
    collaboration: entry.collaboration,
    extensibility: entry.extensibility,
    lockInRisk: entry.lockInRisk,
  }));

  const sources = [
    ...tool.sources,
    ...alternatives.flatMap((alternative) => alternative.sources.slice(0, 1)),
  ].slice(0, 8);

  return {
    slug,
    tool,
    alternatives,
    summary: ALTERNATIVES_PAGE_SUMMARY[slug] ?? `Top alternatives to ${tool.title}.`,
    decisionMatrix,
    migrationChecklist: [
      `List your top 3 jobs you currently rely on ${tool.title} for.`,
      "Shortlist 2 to 3 alternatives and run the same tasks for one week.",
      "Compare quality, speed, collaboration friction, and cost before switching.",
      "Migrate in phases and keep a rollback path for critical workflows.",
    ],
    faq: [
      {
        question: `What is the best ${tool.title} alternative for teams?`,
        answer:
          "The best option depends on your stack, governance needs, and workflow. Use the matrix and test in a short pilot before committing.",
      },
      {
        question: `Should I fully replace ${tool.title} at once?`,
        answer:
          "No. Run a phased migration with one workflow and one squad first, then expand after results are stable.",
      },
    ],
    sources,
    lastReviewedAt: tool.lastReviewedAt,
  };
}

export function getAllAlternativePageSlugs(): string[] {
  return [...PRIMARY_ALTERNATIVE_PAGE_SLUGS];
}

export function getAllAlternativePagesData(): AlternativePageData[] {
  return getAllAlternativePageSlugs()
    .map((slug) => getAlternativePageData(slug))
    .filter((page): page is AlternativePageData => Boolean(page));
}

export function getComparisonPageDataBySlug(slug: string): ComparisonPageData | null {
  return COMPARISON_BY_SLUG.get(slug) ?? null;
}

export function getAllComparisonPageSlugs(): string[] {
  return COMPARISON_PAGE_DATA.map((comparison) => comparison.slug);
}

export function getAllComparisonPagesData(): ComparisonPageData[] {
  return [...COMPARISON_PAGE_DATA];
}

export function getCanonicalComparisonSlug(slug: string): string | null {
  const direct = COMPARISON_BY_SLUG.get(slug);
  if (direct) return direct.slug;
  const [left, right] = slug.split("-vs-");
  if (!left || !right) return null;
  return COMPARISON_CANONICAL_BY_PAIR.get(`${left}|${right}`) ?? null;
}

export function getReversedComparisonSlug(slug: string): string | null {
  const [left, right] = slug.split("-vs-");
  if (!left || !right) return null;
  return `${right}-vs-${left}`;
}

export function getComparisonPagesForTool(slug: string): ComparisonPageData[] {
  return COMPARISON_PAGE_DATA.filter(
    (comparison) => comparison.leftSlug === slug || comparison.rightSlug === slug
  );
}

export function getAlternativePagesByCategory(
  category: ResourceCategory
): AlternativePageData[] {
  return getAllAlternativePagesData().filter(
    (page) => page.tool.category === category
  );
}

export function getComparisonPagesByCategory(
  category: ResourceCategory
): ComparisonPageData[] {
  return COMPARISON_PAGE_DATA.filter((comparison) => {
    const leftCategory = comparison.leftResource?.category;
    const rightCategory = comparison.rightResource?.category;
    return leftCategory === category || rightCategory === category;
  });
}

export function evaluateAlternativesQuality(page: AlternativePageData): {
  pass: boolean;
  stale: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if ((page.sources?.length ?? 0) < 3) reasons.push("Needs at least 3 sources.");
  if ((page.tool.bestFor?.length ?? 0) === 0) reasons.push("Missing best-for bullets.");
  if ((page.tool.notFor?.length ?? 0) === 0) reasons.push("Missing not-for bullets.");
  if ((page.decisionMatrix?.length ?? 0) < 3) reasons.push("Decision matrix must have at least 3 rows.");
  if (!page.lastReviewedAt) reasons.push("Missing last reviewed date.");
  const stale = isOlderThan90Days(page.lastReviewedAt);
  if (stale) reasons.push("Last reviewed date is older than 90 days.");
  return { pass: reasons.length === 0, stale, reasons };
}

export function evaluateComparisonQuality(page: ComparisonPageData): {
  pass: boolean;
  stale: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if ((page.sources?.length ?? 0) < 3) reasons.push("Needs at least 3 sources.");
  if ((page.winnerByUseCase?.length ?? 0) === 0) reasons.push("Winner by use case is missing.");
  if ((page.criteriaTable?.length ?? 0) < 3) reasons.push("Decision matrix must have at least 3 criteria.");
  if (!page.lastReviewedAt) reasons.push("Missing last reviewed date.");
  const stale = isOlderThan90Days(page.lastReviewedAt);
  if (stale) reasons.push("Last reviewed date is older than 90 days.");
  return { pass: reasons.length === 0, stale, reasons };
}

export function inferComparisonTitleFromSlug(slug: string): string {
  const [left, right] = slug.split("-vs-");
  if (!left || !right) return slug;
  return `${left.replace(/-/g, " ")} vs ${right.replace(/-/g, " ")}`;
}
