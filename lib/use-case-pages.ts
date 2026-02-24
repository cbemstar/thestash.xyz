import type { ResourceCategory } from "@/types/resource";
import { getUseCaseEditorialSections } from "@/lib/use-case-editorial-content";

export type UseCasePage = {
  slug: string;
  title: string;
  description: string;
  answerFirst: string;
  keywords: string[];
  categories: ResourceCategory[];
  toolSlugs: string[];
  alternativeSlugs: string[];
  comparisonSlugs: string[];
  checklist: string[];
  faq: Array<{ question: string; answer: string }>;
  lastReviewedAt: string;
};

const USE_CASE_PAGES: UseCasePage[] = [
  {
    slug: "best-ai-coding-assistants",
    title: "Best AI coding assistants",
    description:
      "Compare top AI coding assistants for speed, collaboration, code quality, and long-term maintainability.",
    answerFirst:
      "Use this page to shortlist AI coding assistants by workflow fit, not hype. Start with your current stack and review process constraints.",
    keywords: ["best ai coding assistant", "best ai tools for developers"],
    categories: ["ai-tools", "development-tools"],
    toolSlugs: ["cursor", "github-copilot", "windsurf", "claude-code", "replit"],
    alternativeSlugs: ["cursor", "github-copilot", "windsurf", "claude-code", "replit"],
    comparisonSlugs: [
      "cursor-vs-github-copilot",
      "cursor-vs-windsurf",
      "cursor-vs-claude-code",
      "github-copilot-vs-claude-code",
      "cursor-vs-codeium",
      "github-copilot-vs-codeium",
    ],
    checklist: [
      "Pick 2 to 3 candidate tools based on your primary language and repo size.",
      "Test each tool on one real feature and one bug-fix task.",
      "Measure review edits required before merge and compare net time savings.",
      "Standardize prompts and guardrails before team-wide rollout.",
    ],
    faq: [
      {
        question: "Which AI coding assistant should a startup choose first?",
        answer:
          "Pick the tool with the lowest adoption friction for your existing stack and review process, then validate with a short real sprint.",
      },
      {
        question: "Do teams need one standard AI assistant?",
        answer:
          "Most teams benefit from one primary standard with limited exceptions to keep collaboration and reviews consistent.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "ai-code-review-tools",
    title: "AI code review tools",
    description:
      "Head-to-head guides for AI-assisted code review quality, governance, and workflow speed.",
    answerFirst:
      "The best AI code review setup balances speed and trust. Use comparisons to pick the right workflow for your team’s risk tolerance.",
    keywords: ["ai code review tools"],
    categories: ["ai-tools", "development-tools", "github"],
    toolSlugs: ["github-copilot", "cursor", "claude-code", "codeium"],
    alternativeSlugs: ["github-copilot", "cursor", "claude-code", "codeium"],
    comparisonSlugs: [
      "cursor-vs-github-copilot",
      "github-copilot-vs-claude-code",
      "cursor-vs-claude-code",
      "github-copilot-vs-codeium",
    ],
    checklist: [
      "Define what AI can and cannot auto-suggest in PR review.",
      "Run AI review in shadow mode before enabling team-wide usage.",
      "Track false positives and missed issues weekly.",
      "Set escalation rules for security-sensitive diffs.",
    ],
    faq: [
      {
        question: "Can AI replace human code reviews?",
        answer:
          "No. AI should accelerate and augment review, but humans still need final judgment on architecture, security, and product impact.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-code-search-tools",
    title: "Best code search tools",
    description:
      "Find the best tools for searching large codebases with speed, relevance, and collaboration in mind.",
    answerFirst:
      "Choose code search tools based on repository scale, query quality, and integration with your existing engineering workflow.",
    keywords: ["best code search tools"],
    categories: ["development-tools", "github"],
    toolSlugs: ["sourcegraph-cody", "github-copilot", "cursor", "vscode"],
    alternativeSlugs: ["github-copilot", "cursor", "sourcegraph-cody", "vscode"],
    comparisonSlugs: ["cursor-vs-sourcegraph-cody", "github-copilot-vs-sourcegraph-cody"],
    checklist: [
      "Benchmark query speed on your largest repositories.",
      "Validate search relevance on common team debugging tasks.",
      "Confirm onboarding and access control requirements.",
    ],
    faq: [
      {
        question: "What matters most in a code search tool?",
        answer:
          "Search relevance and integration with your daily development workflow are usually more important than feature count alone.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-react-ui-component-libraries",
    title: "Best React UI component libraries",
    description:
      "Curated libraries and component systems for shipping React interfaces faster with maintainable design consistency.",
    answerFirst:
      "Choose React UI libraries by accessibility defaults, extensibility, and how well they fit your design system workflow.",
    keywords: ["best react ui component libraries"],
    categories: ["ui-ux-resources", "development-tools", "shadcn"],
    toolSlugs: ["v0", "figma", "webflow", "framer"],
    alternativeSlugs: ["v0", "figma", "framer"],
    comparisonSlugs: ["webflow-vs-framer", "v0-vs-bolt"],
    checklist: [
      "Validate accessibility defaults before adoption.",
      "Check customization depth against your brand system.",
      "Pilot in one production component before broad migration.",
    ],
    faq: [
      {
        question: "Should teams build or buy a component library?",
        answer:
          "Most teams should start with a mature base library and progressively customize rather than building from scratch on day one.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-shadcn-component-libraries",
    title: "Best shadcn component libraries",
    description:
      "Resources and alternatives for teams building with shadcn-style components and design-system workflows.",
    answerFirst:
      "Evaluate shadcn component libraries by composability, design-system alignment, and maintenance overhead.",
    keywords: ["best shadcn component libraries"],
    categories: ["shadcn", "ui-ux-resources", "development-tools"],
    toolSlugs: ["v0", "cursor", "figma", "webflow"],
    alternativeSlugs: ["v0", "figma", "cursor"],
    comparisonSlugs: ["v0-vs-bolt", "cursor-vs-codeium"],
    checklist: [
      "Check component coverage against your product UI footprint.",
      "Assess upgrade and maintenance process before adoption.",
      "Standardize tokens and naming conventions early.",
    ],
    faq: [
      {
        question: "Are shadcn-style libraries good for startups?",
        answer:
          "Yes, if your team can maintain consistency and avoids over-customization that slows velocity.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-open-source-developer-tools",
    title: "Best open source developer tools",
    description:
      "Open-source options across coding, deployment, and productivity workflows for developer teams.",
    answerFirst:
      "Open-source tools can reduce lock-in and cost, but should be selected with maintenance and team support requirements in mind.",
    keywords: ["best open source developer tools"],
    categories: ["development-tools", "github", "coding"],
    toolSlugs: ["wordpress", "replit", "vscode", "netlify"],
    alternativeSlugs: ["replit", "vscode", "wordpress", "netlify"],
    comparisonSlugs: ["vscode-vs-zed", "vercel-vs-netlify", "webflow-vs-wordpress"],
    checklist: [
      "Evaluate contributor health and release cadence before committing.",
      "Define internal ownership for upgrades and incident response.",
      "Document migration paths if maintainership stalls.",
    ],
    faq: [
      {
        question: "Are open-source tools always cheaper?",
        answer:
          "Not always. Licensing can be free while operational and maintenance costs still add up.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-web-design-inspiration-websites",
    title: "Best web design inspiration websites",
    description:
      "Curated inspiration sources to improve layout, typography, and interaction decisions for design teams.",
    answerFirst:
      "Use inspiration sites strategically: collect patterns, then adapt to your product constraints and audience expectations.",
    keywords: ["best web design inspiration websites"],
    categories: ["inspiration", "design-tools", "ui-ux-resources"],
    toolSlugs: ["figma", "webflow", "framer"],
    alternativeSlugs: ["figma", "webflow", "framer"],
    comparisonSlugs: ["webflow-vs-framer", "webflow-vs-wordpress"],
    checklist: [
      "Collect 10 references with notes on why they work.",
      "Extract reusable layout and motion patterns.",
      "Prototype quickly, then test with real users before finalizing.",
    ],
    faq: [
      {
        question: "How should teams use design inspiration without copying?",
        answer:
          "Extract principles and interaction patterns, then rebuild for your own content model and brand constraints.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "tools-for-nextjs-developers",
    title: "Tools for Next.js developers",
    description:
      "Deployment, AI coding, productivity, and UI workflow tools for Next.js-focused teams.",
    answerFirst:
      "Choose Next.js tooling based on deployment reliability, frontend velocity, and team collaboration overhead.",
    keywords: ["tools for nextjs developers"],
    categories: ["development-tools", "ai-tools", "productivity"],
    toolSlugs: ["vercel", "netlify", "cloudflare-pages", "cursor", "github-copilot"],
    alternativeSlugs: ["cursor", "github-copilot", "vercel", "netlify"],
    comparisonSlugs: [
      "vercel-vs-netlify",
      "vercel-vs-cloudflare-pages",
      "cursor-vs-github-copilot",
      "github-copilot-vs-codeium",
    ],
    checklist: [
      "Choose hosting strategy first (preview, production, rollback model).",
      "Standardize AI coding workflow and review conventions.",
      "Set performance and observability baselines before scaling.",
    ],
    faq: [
      {
        question: "What is the default stack for most Next.js teams?",
        answer:
          "Many teams start with Vercel plus managed data services and one AI assistant, then expand only after real constraints emerge.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "ai-code-generation-tools",
    title: "AI code generation tools",
    description:
      "Choose AI code generation tools by output quality, governance, and fit for real production workflows.",
    answerFirst:
      "Use this page when your goal is shipping quality code faster, not just generating more code. Validate generated output against your team review standards.",
    keywords: ["ai code generation tools"],
    categories: ["ai-tools", "development-tools"],
    toolSlugs: ["cursor", "github-copilot", "codeium", "tabnine", "sourcegraph-cody"],
    alternativeSlugs: ["cursor", "github-copilot", "codeium", "tabnine", "sourcegraph-cody"],
    comparisonSlugs: [
      "cursor-vs-codeium",
      "cursor-vs-tabnine",
      "github-copilot-vs-codeium",
      "github-copilot-vs-tabnine",
    ],
    checklist: [
      "Define success metrics: accepted suggestions, review cycles, and defect rate.",
      "Test tools on one bug fix and one net-new feature.",
      "Lock team prompts and acceptance criteria before full rollout.",
    ],
    faq: [
      {
        question: "How should teams evaluate AI code generation tools?",
        answer:
          "Benchmark output quality and review friction on real tasks, then choose the tool that improves throughput without increasing risk.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "ai-pair-programming-tools",
    title: "AI pair programming tools",
    description:
      "Find AI pair programming tools that match your coding workflow, review process, and compliance constraints.",
    answerFirst:
      "The best AI pair programming stack reduces cycle time and review overhead at the same time. Optimize for team adoption, not novelty.",
    keywords: ["ai pair programming tools"],
    categories: ["ai-tools", "development-tools"],
    toolSlugs: ["cursor", "github-copilot", "windsurf", "claude-code", "codeium"],
    alternativeSlugs: ["cursor", "github-copilot", "windsurf", "claude-code", "codeium"],
    comparisonSlugs: [
      "cursor-vs-github-copilot",
      "cursor-vs-windsurf",
      "cursor-vs-claude-code",
      "cursor-vs-codeium",
    ],
    checklist: [
      "Start with one squad and one two-week sprint.",
      "Track merge velocity, escaped defects, and reviewer edits.",
      "Promote only workflows that improve both speed and reliability.",
    ],
    faq: [
      {
        question: "Is AI pair programming only useful for junior developers?",
        answer:
          "No. Senior teams use it for faster exploration, refactors, and repetitive implementation tasks when guardrails are clear.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "ai-tools-for-terminal-workflows",
    title: "AI tools for terminal workflows",
    description:
      "Terminal-first AI tooling for engineering teams that automate coding, debugging, and repo operations.",
    answerFirst:
      "If your team lives in terminal workflows, choose AI tools with strong scripting compatibility and clear auditability.",
    keywords: ["ai tools for terminal workflows"],
    categories: ["ai-tools", "development-tools", "coding"],
    toolSlugs: ["claude-code", "cursor", "github-copilot", "sourcegraph-cody"],
    alternativeSlugs: ["claude-code", "cursor", "github-copilot", "sourcegraph-cody"],
    comparisonSlugs: [
      "cursor-vs-claude-code",
      "github-copilot-vs-claude-code",
      "cursor-vs-sourcegraph-cody",
    ],
    checklist: [
      "Define shell-command safety rules and permission boundaries.",
      "Run AI in read-only mode during the initial evaluation week.",
      "Require diff review for all generated edits before merge.",
    ],
    faq: [
      {
        question: "What makes terminal AI workflows production-ready?",
        answer:
          "Deterministic prompts, explicit safety boundaries, and mandatory review checkpoints are what make terminal-first AI workflows reliable.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-developer-productivity-tools",
    title: "Best developer productivity tools",
    description:
      "The highest-leverage productivity tools for developers across coding, planning, and daily execution.",
    answerFirst:
      "Focus on tools that remove bottlenecks in planning, coding, and context switching. Productivity gains come from workflow alignment, not feature count.",
    keywords: ["best developer productivity tools"],
    categories: ["productivity", "development-tools"],
    toolSlugs: ["linear", "raycast", "notion", "vscode", "cursor"],
    alternativeSlugs: ["linear", "raycast", "notion", "vscode", "cursor"],
    comparisonSlugs: ["linear-vs-notion", "raycast-vs-alfred", "vscode-vs-zed"],
    checklist: [
      "Identify top 5 repetitive tasks consuming weekly engineering time.",
      "Adopt one planning tool and one execution acceleration tool first.",
      "Review impact monthly and cut tools with low measurable ROI.",
    ],
    faq: [
      {
        question: "How many productivity tools should a dev team use?",
        answer:
          "Keep the stack small and intentional. Fewer integrated tools typically outperform a fragmented stack with overlap.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-issue-tracking-tools-for-developers",
    title: "Best issue tracking tools for developers",
    description:
      "Choose issue tracking systems for engineering teams by workflow speed, reporting depth, and collaboration overhead.",
    answerFirst:
      "Pick issue tracking tools based on how your team ships code, not generic templates. Technical workflow fit beats feature volume.",
    keywords: ["best issue tracking tools for developers"],
    categories: ["productivity", "development-tools"],
    toolSlugs: ["linear", "jira", "clickup", "asana", "monday"],
    alternativeSlugs: ["linear", "jira", "clickup", "asana", "monday"],
    comparisonSlugs: ["linear-vs-jira", "linear-vs-clickup", "linear-vs-asana", "linear-vs-monday"],
    checklist: [
      "Document required states, permissions, and reporting needs.",
      "Pilot with one squad for one sprint before organization-wide migration.",
      "Lock taxonomy and workflow conventions before scaling.",
    ],
    faq: [
      {
        question: "Should startups use Jira or lighter tools first?",
        answer:
          "Most startups start with lighter workflows, then move to heavier process tooling only when coordination complexity increases.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-project-management-tools-for-software-teams",
    title: "Best project management tools for software teams",
    description:
      "Project management tools for software organizations balancing engineering velocity with cross-functional visibility.",
    answerFirst:
      "The right PM stack should keep engineering fast while making roadmap and delivery status clear to non-engineering stakeholders.",
    keywords: ["best project management tools for software teams"],
    categories: ["productivity", "development-tools"],
    toolSlugs: ["linear", "notion", "clickup", "asana", "monday"],
    alternativeSlugs: ["linear", "notion", "clickup", "asana", "monday"],
    comparisonSlugs: ["linear-vs-clickup", "linear-vs-asana", "linear-vs-notion", "linear-vs-monday"],
    checklist: [
      "Align on one source of truth for scope, owners, and status.",
      "Choose reporting views for both engineering and leadership needs.",
      "Audit process overhead after 30 days and simplify aggressively.",
    ],
    faq: [
      {
        question: "Can one PM tool serve engineering and non-engineering teams?",
        answer:
          "Yes, if workflow boundaries are clear and teams agree on shared status conventions and ownership rules.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-macos-productivity-tools-for-developers",
    title: "Best macOS productivity tools for developers",
    description:
      "macOS productivity stack recommendations for developers who optimize for keyboard-driven speed and automation.",
    answerFirst:
      "For macOS-focused engineering workflows, prioritize launchers and automation tools that reduce context-switching and repetitive clicks.",
    keywords: ["best mac productivity tools for developers"],
    categories: ["productivity", "development-tools"],
    toolSlugs: ["raycast", "alfred", "vscode", "zed"],
    alternativeSlugs: ["raycast", "alfred", "vscode", "zed"],
    comparisonSlugs: ["raycast-vs-alfred", "vscode-vs-zed"],
    checklist: [
      "Map your top daily actions and keyboard shortcuts first.",
      "Migrate automation workflows one-by-one to avoid disruption.",
      "Keep a fallback launcher active during transition week.",
    ],
    faq: [
      {
        question: "Is Raycast always better than Alfred for developers?",
        answer:
          "Not always. Raycast often wins on integrated workflows, while Alfred remains strong for lightweight local automation.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-ai-app-builders",
    title: "Best AI app builders",
    description:
      "AI app builders for founders and product teams launching MVPs quickly with pragmatic tradeoffs.",
    answerFirst:
      "Use AI app builders when speed-to-validation matters most, and pair them with clear migration plans for long-term maintainability.",
    keywords: ["best ai app builders"],
    categories: ["ai-tools", "development-tools"],
    toolSlugs: ["bolt", "lovable", "v0", "replit"],
    alternativeSlugs: ["bolt", "lovable", "v0", "replit"],
    comparisonSlugs: ["bolt-vs-lovable", "v0-vs-bolt"],
    checklist: [
      "Define what must be production-ready versus prototype-only.",
      "Compare export quality and long-term code ownership before committing.",
      "Establish handoff standards from AI-generated code to engineering.",
    ],
    faq: [
      {
        question: "Can AI app builders replace traditional full-stack teams?",
        answer:
          "They accelerate prototyping and early delivery, but mature products still require experienced engineering ownership.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-tools-for-landing-page-builders",
    title: "Best tools for landing page builders",
    description:
      "Top tools for building and publishing high-converting landing pages with speed and design control.",
    answerFirst:
      "Choose landing page tools by iteration speed, CMS needs, and design flexibility under your team’s publishing workflow.",
    keywords: ["best landing page builder tools"],
    categories: ["design-tools", "webflow", "development-tools"],
    toolSlugs: ["webflow", "framer", "v0", "bolt"],
    alternativeSlugs: ["webflow", "framer", "v0", "bolt"],
    comparisonSlugs: ["webflow-vs-framer", "v0-vs-bolt"],
    checklist: [
      "Test one real landing page in each candidate tool.",
      "Measure publish velocity and edit handoff between design and marketing.",
      "Validate SEO controls before selecting the final platform.",
    ],
    faq: [
      {
        question: "Which tool is best for design-heavy landing pages?",
        answer:
          "Framer is often favored for animation-heavy pages, while Webflow is preferred for deeper CMS and publishing operations.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-frontend-deployment-platforms",
    title: "Best frontend deployment platforms",
    description:
      "Deployment platform comparisons for modern frontend teams focused on speed, reliability, and edge performance.",
    answerFirst:
      "Pick frontend deployment platforms based on runtime needs, preview workflows, and team-level governance requirements.",
    keywords: ["best frontend deployment platforms"],
    categories: ["development-tools", "coding"],
    toolSlugs: ["vercel", "netlify", "cloudflare-pages"],
    alternativeSlugs: ["vercel", "netlify", "cloudflare-pages"],
    comparisonSlugs: ["vercel-vs-netlify", "vercel-vs-cloudflare-pages"],
    checklist: [
      "Benchmark build times and runtime performance on real apps.",
      "Compare preview and rollback workflows with your release process.",
      "Validate team permissions, audit trails, and cost guardrails.",
    ],
    faq: [
      {
        question: "Should Next.js teams default to Vercel?",
        answer:
          "Many do, but final choice should be based on workload profile, cost curve, and operational requirements.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-developer-documentation-tools",
    title: "Best developer documentation tools",
    description:
      "Documentation tools and workflow recommendations for engineering teams that need discoverable, maintainable knowledge.",
    answerFirst:
      "Choose documentation tools by searchability, collaboration fit, and how tightly docs stay linked to code and delivery workflows.",
    keywords: ["best developer documentation tools"],
    categories: ["productivity", "development-tools", "github"],
    toolSlugs: ["notion", "linear", "github-copilot", "sourcegraph-cody"],
    alternativeSlugs: ["notion", "linear", "sourcegraph-cody"],
    comparisonSlugs: ["linear-vs-notion", "github-copilot-vs-sourcegraph-cody"],
    checklist: [
      "Define ownership for architecture docs and runbooks.",
      "Create review cadence tied to release and incident workflows.",
      "Enforce templates for decision records and onboarding docs.",
    ],
    faq: [
      {
        question: "How can teams prevent documentation from going stale?",
        answer:
          "Attach docs updates to delivery and incident workflows, and enforce periodic review ownership per domain.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-tools-for-startup-mvp-builders",
    title: "Best tools for startup MVP builders",
    description:
      "Practical tools for founders and startup teams shipping MVPs quickly with maintainability in mind.",
    answerFirst:
      "For MVP speed, choose tools that shorten feedback cycles and keep a clean migration path toward production architecture.",
    keywords: ["best tools for startup mvp"],
    categories: ["ai-tools", "development-tools", "productivity"],
    toolSlugs: ["bolt", "lovable", "v0", "replit", "vercel"],
    alternativeSlugs: ["bolt", "lovable", "v0", "replit", "vercel"],
    comparisonSlugs: ["bolt-vs-lovable", "v0-vs-bolt", "vercel-vs-netlify"],
    checklist: [
      "Define MVP success criteria before choosing the stack.",
      "Build one end-to-end workflow including auth, data, and analytics.",
      "Document migration triggers to avoid long-term platform lock-in.",
    ],
    faq: [
      {
        question: "What is the biggest MVP tooling mistake?",
        answer:
          "Choosing based on demos alone without validating maintainability, ownership, and migration risk on real product scope.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-design-to-code-tools",
    title: "Best design-to-code tools",
    description:
      "Design-to-code tooling for teams turning UI concepts into production-ready components faster.",
    answerFirst:
      "Design-to-code tools are best when they reduce handoff friction while preserving code quality standards in your frontend stack.",
    keywords: ["design to code tools"],
    categories: ["design-tools", "development-tools", "ui-ux-resources"],
    toolSlugs: ["v0", "figma", "webflow", "framer", "cursor"],
    alternativeSlugs: ["v0", "figma", "webflow", "framer"],
    comparisonSlugs: ["v0-vs-bolt", "webflow-vs-framer", "webflow-vs-wordpress"],
    checklist: [
      "Define coding conventions before introducing generated UI output.",
      "Measure cleanup time after code generation across two sprints.",
      "Adopt only workflows that improve handoff and maintainability.",
    ],
    faq: [
      {
        question: "Do design-to-code tools eliminate frontend engineering work?",
        answer:
          "No. They speed up scaffolding and iteration, but production quality still depends on frontend engineering discipline.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-tools-for-product-design-teams",
    title: "Best tools for product design teams",
    description:
      "Tooling decisions for product design teams balancing ideation, prototyping, handoff, and delivery.",
    answerFirst:
      "The right product design stack should make design decisions faster while preserving clarity in handoff to engineering and marketing.",
    keywords: ["best tools for product design teams"],
    categories: ["design-tools", "ui-ux-resources", "productivity"],
    toolSlugs: ["figma", "framer", "webflow", "notion"],
    alternativeSlugs: ["figma", "framer", "webflow", "notion"],
    comparisonSlugs: ["webflow-vs-framer", "webflow-vs-wordpress", "linear-vs-notion"],
    checklist: [
      "Map workflows from discovery to handoff before selecting tools.",
      "Set naming, component, and documentation standards early.",
      "Review tool overlap quarterly and simplify the stack.",
    ],
    faq: [
      {
        question: "Should design and engineering share tool ownership?",
        answer:
          "Yes. Shared ownership of handoff workflows prevents tool silos and reduces delivery friction.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-tools-for-cross-functional-planning",
    title: "Best tools for cross-functional planning",
    description:
      "Planning tools for engineering, product, and operations teams that need one shared execution rhythm.",
    answerFirst:
      "Cross-functional planning works best when one system tracks priorities, owners, and status without adding process drag.",
    keywords: ["tools for cross functional planning"],
    categories: ["productivity", "development-tools"],
    toolSlugs: ["notion", "linear", "clickup", "asana", "monday"],
    alternativeSlugs: ["notion", "linear", "clickup", "asana", "monday"],
    comparisonSlugs: ["linear-vs-notion", "linear-vs-clickup", "linear-vs-asana", "linear-vs-monday"],
    checklist: [
      "Define one planning taxonomy for goals, initiatives, and tasks.",
      "Assign explicit owners for roadmap updates and status accuracy.",
      "Audit planning overhead monthly and remove unused workflows.",
    ],
    faq: [
      {
        question: "What causes cross-functional planning tools to fail?",
        answer:
          "Ambiguous ownership and inconsistent status updates usually fail planning systems faster than missing features.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-tools-for-remote-engineering-teams",
    title: "Best tools for remote engineering teams",
    description:
      "Remote engineering stack recommendations for async collaboration, code quality, and execution visibility.",
    answerFirst:
      "Remote teams need tools that preserve context and accountability across time zones. Optimize for async clarity first.",
    keywords: ["tools for remote engineering teams"],
    categories: ["development-tools", "productivity", "github"],
    toolSlugs: ["github-copilot", "linear", "notion", "vercel", "replit"],
    alternativeSlugs: ["github-copilot", "linear", "notion", "vercel", "replit"],
    comparisonSlugs: ["linear-vs-notion", "vercel-vs-netlify", "github-copilot-vs-codeium"],
    checklist: [
      "Standardize async updates for planning, delivery, and incident communication.",
      "Track review cycle time and handoff delays across time zones.",
      "Prioritize tools that reduce synchronous meeting dependency.",
    ],
    faq: [
      {
        question: "How do remote teams avoid context loss?",
        answer:
          "Use consistent written updates, linked decisions, and searchable knowledge systems tied to delivery workflows.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "best-tools-for-open-source-maintainers",
    title: "Best tools for open-source maintainers",
    description:
      "Tooling choices for open-source maintainers balancing contributor experience, code quality, and project sustainability.",
    answerFirst:
      "Open-source maintainers should prioritize contribution clarity, review scalability, and low operational overhead.",
    keywords: ["tools for open source maintainers"],
    categories: ["github", "development-tools", "coding"],
    toolSlugs: ["github-copilot", "sourcegraph-cody", "vscode", "linear"],
    alternativeSlugs: ["github-copilot", "sourcegraph-cody", "vscode", "linear"],
    comparisonSlugs: ["github-copilot-vs-sourcegraph-cody", "vscode-vs-zed", "linear-vs-jira"],
    checklist: [
      "Document contribution and review standards in one canonical location.",
      "Automate repetitive maintainer tasks where possible.",
      "Track maintainer workload and enforce sustainable response windows.",
    ],
    faq: [
      {
        question: "What is the most important tool capability for maintainers?",
        answer:
          "Clear collaboration workflows and scalable review processes usually matter more than any single feature.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "open-source-ai-note-taking-tools",
    title: "Open-source AI note-taking tools",
    description:
      "Privacy-first AI note-taking tooling for research capture, code context, and team knowledge workflows.",
    answerFirst:
      "When privacy and long-term control matter, choose AI note-taking tools by data ownership, export portability, and workflow fit before raw model novelty.",
    keywords: ["open source ai note taking tools", "privacy first research platform"],
    categories: ["ai-tools", "productivity", "development-tools"],
    toolSlugs: ["notion", "claude-code", "replit", "github-copilot"],
    alternativeSlugs: ["notion", "claude-code", "replit", "github-copilot"],
    comparisonSlugs: ["github-copilot-vs-claude-code", "cursor-vs-claude-code"],
    checklist: [
      "Validate data retention, residency, and export defaults before pilot.",
      "Test one real research and one real implementation note workflow.",
      "Confirm retrieval quality for historical notes and shared team context.",
      "Roll out in phases with explicit access control and redaction rules.",
    ],
    faq: [
      {
        question: "What makes an AI note-taking tool privacy-first?",
        answer:
          "Data ownership controls, transparent retention policies, and reliable exports are usually more important than extra AI features.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
  {
    slug: "tailwind-react-dashboard-templates",
    title: "Tailwind templates and React dashboards",
    description:
      "Choose Tailwind dashboard templates and React UI blocks by implementation speed, accessibility defaults, and production fit.",
    answerFirst:
      "Template speed is valuable only when code quality, accessibility, and design-system consistency survive the jump from demo to production.",
    keywords: ["tailwind templates react dashboards", "open source ui components"],
    categories: ["shadcn", "ui-ux-resources", "development-tools"],
    toolSlugs: ["v0", "figma", "webflow", "framer"],
    alternativeSlugs: ["v0", "bolt", "figma", "webflow"],
    comparisonSlugs: ["v0-vs-bolt", "webflow-vs-framer", "webflow-vs-wordpress"],
    checklist: [
      "Confirm licensing and update cadence for each template source.",
      "Audit accessibility and responsive behavior before team adoption.",
      "Map design tokens early so generated blocks stay system-consistent.",
      "Ship one production pilot and compare velocity against your baseline.",
    ],
    faq: [
      {
        question: "Are React dashboard templates enough for production SaaS?",
        answer:
          "They accelerate scaffolding, but teams still need domain-specific UX, accessibility QA, and design-system hardening before scale.",
      },
    ],
    lastReviewedAt: "2026-02-13T00:00:00.000Z",
  },
];

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

const EDITORIAL_REQUIRED_USE_CASE_SLUGS = new Set([
  "ai-code-generation-tools",
  "ai-pair-programming-tools",
  "ai-tools-for-terminal-workflows",
  "best-developer-productivity-tools",
  "best-issue-tracking-tools-for-developers",
  "best-project-management-tools-for-software-teams",
  "best-macos-productivity-tools-for-developers",
  "best-ai-app-builders",
  "best-tools-for-landing-page-builders",
  "best-frontend-deployment-platforms",
  "best-developer-documentation-tools",
  "best-tools-for-startup-mvp-builders",
  "best-design-to-code-tools",
  "best-tools-for-product-design-teams",
  "best-tools-for-cross-functional-planning",
  "best-tools-for-remote-engineering-teams",
  "best-tools-for-open-source-maintainers",
]);

export function isUseCaseOlderThan90Days(dateLike?: string | null): boolean {
  if (!dateLike) return true;
  const timestamp = Date.parse(dateLike);
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > NINETY_DAYS_MS;
}

export function evaluateUseCaseQuality(page: UseCasePage): {
  pass: boolean;
  stale: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (!page.answerFirst || page.answerFirst.trim().length < 80) {
    reasons.push("Answer-first summary is too thin.");
  }
  if ((page.toolSlugs?.length ?? 0) < 3) {
    reasons.push("Needs at least 3 recommended tools.");
  }
  if ((page.checklist?.length ?? 0) < 3) {
    reasons.push("Implementation checklist must have at least 3 steps.");
  }
  if ((page.faq?.length ?? 0) < 1) {
    reasons.push("Needs at least one FAQ.");
  }
  const supportingRoutesCount =
    (page.alternativeSlugs?.length ?? 0) + (page.comparisonSlugs?.length ?? 0);
  if (supportingRoutesCount < 2) {
    reasons.push("Needs at least 2 supporting alternative/comparison links.");
  }
  if (EDITORIAL_REQUIRED_USE_CASE_SLUGS.has(page.slug)) {
    const sections = getUseCaseEditorialSections(page.slug);
    if (sections.length < 3) {
      reasons.push("Needs at least 3 in-depth editorial sections.");
    }
    const sectionsWithThinBody = sections.filter(
      (section) => (section.paragraphs?.length ?? 0) < 2
    );
    if (sectionsWithThinBody.length > 0) {
      reasons.push("Each in-depth editorial section needs at least 2 paragraphs.");
    }
  }
  if (!page.lastReviewedAt) {
    reasons.push("Missing last reviewed date.");
  }

  const stale = isUseCaseOlderThan90Days(page.lastReviewedAt);
  if (stale) reasons.push("Last reviewed date is older than 90 days.");

  return {
    pass: reasons.length === 0,
    stale,
    reasons,
  };
}

export function getAllUseCasePages(): UseCasePage[] {
  return [...USE_CASE_PAGES];
}

export function getAllUseCaseSlugs(): string[] {
  return USE_CASE_PAGES.map((page) => page.slug);
}

export function getUseCasePageBySlug(slug: string): UseCasePage | null {
  return USE_CASE_PAGES.find((page) => page.slug === slug) ?? null;
}

export function getUseCasePagesForTool(slug: string): UseCasePage[] {
  return USE_CASE_PAGES.filter((page) => page.toolSlugs.includes(slug));
}

export function getUseCasePagesForComparison(slug: string): UseCasePage[] {
  return USE_CASE_PAGES.filter((page) => page.comparisonSlugs.includes(slug));
}

export function getUseCasePagesForCategory(
  category: ResourceCategory
): UseCasePage[] {
  return USE_CASE_PAGES.filter((page) => page.categories.includes(category));
}
