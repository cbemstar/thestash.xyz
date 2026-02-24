#!/usr/bin/env node
/**
 * Generate batch-resources-data.json with 100 resources per category.
 * Sources: No-Code Supply Co (nocodesupply.co), existing batch, curated lists.
 * Usage: node scripts/generate-100-per-category.mjs
 * Output: scripts/batch-resources-data.json
 */

import fs from "fs";
import path from "path";

const CATEGORIES = [
  "design-tools",
  "development-tools",
  "ui-ux-resources",
  "inspiration",
  "ai-tools",
  "productivity",
  "learning-resources",
  "webflow",
  "shadcn",
  "coding",
  "github",
  "html",
  "css",
  "javascript",
  "languages",
  "miscellaneous",
];

function cleanUrl(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete("ref");
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    u.searchParams.delete("via");
    let s = u.toString().replace(/\?$/, "");
    if (s.endsWith("/") && s.length > 8) s = s.slice(0, -1);
    return s;
  } catch {
    return url;
  }
}

// No-Code Supply Co + curated resources by category. Description 10–260 chars.
const BY_CATEGORY = {
  "ai-tools": [
    { title: "Letta", url: "https://www.letta.com/", description: "AI coding assistant and workflow tool for developers. Integrates with your editor and repos.", tags: ["ai", "coding", "workflow"] },
    { title: "Pencil", url: "https://pencil.dev/", description: "AI-powered design-to-code and custom code for Webflow. Extending and workflow with Cursor.", tags: ["ai", "webflow", "design", "cursor"] },
    { title: "Conductor", url: "https://www.conductor.build/", description: "AI dev tools and workflow automation. Claude-powered builds and deployments.", tags: ["ai", "workflow", "claude"] },
    { title: "Claude", url: "https://claude.ai/", description: "Anthropic's AI assistant for writing, analysis, and coding. API and consumer products.", tags: ["ai", "claude", "anthropic"] },
    { title: "Sanity AI", url: "https://www.sanity.io/", description: "Structured CMS with AI and APIs. Build content backends and websites with real-time collaboration.", tags: ["cms", "ai", "api", "content"] },
    { title: "Miriad", url: "https://miriad.systems/", description: "AI and dev tools workflow. Claude-powered automation for teams.", tags: ["ai", "workflow", "claude"] },
    { title: "in progress works", url: "https://www.inprogress.works/", description: "Community and project management for dev teams. SAAS, AI, workflow.", tags: ["community", "saas", "workflow"] },
    { title: "Context7", url: "https://context7.com/", description: "AI dev tools and docs workflow. Context-aware assistance for developers.", tags: ["ai", "docs", "workflow"] },
    { title: "Flint", url: "https://www.tryflint.com/", description: "AI no-code website builder. Create sites from natural language.", tags: ["ai", "no-code", "website-builder"] },
    { title: "Pablo", url: "https://pablo.design/", description: "AI dev tools, creative website builder, and workflow. Design and ship faster.", tags: ["ai", "creative", "website-builder"] },
    { title: "Raydian", url: "https://raydian.dev/", description: "AI dev tools for creative SAAS and web apps. Workflow automation.", tags: ["ai", "saas", "web-apps"] },
    { title: "Workway", url: "https://workway.co/", description: "AI dev tools, automation, and JavaScript workflow. Speed up development.", tags: ["ai", "automation", "javascript"] },
    { title: "Weavy", url: "https://www.weavy.ai/", description: "AI creative SAAS and assets workflow. Marketing sites with Webflow and GSAP.", tags: ["ai", "creative", "marketing"] },
    { title: "MagicPath", url: "https://www.magicpath.ai/", description: "AI creative dev tools for web and mobile apps. Figma and website builder.", tags: ["ai", "figma", "website-builder"] },
    { title: "Reve", url: "https://app.reve.com/", description: "Creative AI assets and workflow. Midjourney and Visual Electric integration.", tags: ["ai", "creative", "assets"] },
    { title: "Composio", url: "https://composio.dev/", description: "AI dev tools, marketing, and automation. Framer integration.", tags: ["ai", "automation", "framer"] },
    { title: "Goodfire AI", url: "https://www.goodfire.ai/", description: "AI, science, and security marketing site. Webflow.", tags: ["ai", "security", "webflow"] },
    { title: "Solidroad", url: "https://www.solidroad.com/", description: "Customer service SAAS with AI marketing. Framer.", tags: ["ai", "customer-service", "framer"] },
    { title: "Brainfish", url: "https://www.brainfishai.com/", description: "AI customer service SAAS marketing. Webflow.", tags: ["ai", "customer-service", "webflow"] },
    { title: "Superplan", url: "https://www.superplan.ai/", description: "AI financial SAAS marketing. Webflow.", tags: ["ai", "financial", "webflow"] },
    { title: "Open WebUI", url: "https://openwebui.com/", description: "Open-source interface for running local AI models via Ollama. ChatGPT-like workflows locally.", tags: ["ai", "local", "ollama"] },
    { title: "LM Studio", url: "https://lmstudio.ai/", description: "Download and run local LLMs with a simple desktop app. No coding required.", tags: ["ai", "local", "llm"] },
    { title: "GPT4All", url: "https://www.nomic.ai/gpt4all", description: "Run ChatGPT-like AI locally. Privacy-first; supports embeddings and RAG.", tags: ["ai", "local", "privacy"] },
    { title: "Cursor", url: "https://www.cursor.com/", description: "AI-first code editor. Natural language to code, codebase chat, multi-file edits.", tags: ["ide", "coding", "ai"] },
    { title: "GitHub Copilot", url: "https://github.com/features/copilot", description: "AI pair programmer in your editor. Real-time code suggestions and whole functions.", tags: ["coding", "ide", "github"] },
    { title: "v0", url: "https://v0.dev/", description: "Vercel's AI UI generator. Describe interfaces in text; get React and Tailwind code.", tags: ["ui", "react", "vercel", "shadcn"] },
    { title: "Claude Code Skills Hub", url: "https://claudecodeplugins.io/", description: "Directory of Claude code plugins and skills. AI, dev tools, workflow.", tags: ["ai", "claude", "workflow"] },
    { title: "Ralph Wiggum", url: "https://ralph-wiggum.ai/", description: "AI dev tools workflow. MCP and skill library for agents.", tags: ["ai", "workflow", "mcp"] },
    { title: "ConsoleX", url: "https://consolex.ai/", description: "ChatGPT with more control: multi-step workflows, custom output, coding and data analysis.", tags: ["ai", "workflows", "automation"] },
    { title: "Regexer", url: "https://regexer.dev/", description: "Generate regex from natural language. No regex syntax needed.", tags: ["regex", "developer-tools", "ai"] },
    { title: "LlamaIndex", url: "https://www.llamaindex.ai/", description: "Framework for RAG and data apps. Index documents, connect LLMs to your data.", tags: ["rag", "llm", "python"] },
    { title: "LangChain", url: "https://www.langchain.com/", description: "Framework for building LLM apps and agents. Chain prompts, tools, and data.", tags: ["llm", "agents", "python"] },
    { title: "Replicate", url: "https://replicate.com/", description: "Run open-source AI models as APIs. Image, language, and audio models.", tags: ["ai", "api", "models"] },
    { title: "Hugging Face", url: "https://huggingface.co/", description: "Models, datasets, and ML apps. Thousands of open models and spaces.", tags: ["ml", "models", "open-source"] },
    { title: "Ollama", url: "https://ollama.com/", description: "Run Llama, Mistral, and other LLMs locally. One command to pull and chat.", tags: ["llm", "local", "cli"] },
    { title: "Together AI", url: "https://www.together.ai/", description: "Open model APIs and fine-tuning. Run Llama, Mistral, and custom models.", tags: ["llm", "api", "fine-tuning"] },
    { title: "Groq", url: "https://groq.com/", description: "Fast inference for LLMs. Low-latency API for Llama and others.", tags: ["llm", "inference", "api"] },
    { title: "Galileo AI", url: "https://www.usegalileo.ai/", description: "Turn text or images into UI designs. Export to Figma.", tags: ["ai", "design", "ui", "figma"] },
    { title: "Bubble", url: "https://bubble.io/", description: "No-code app builder with AI. Build web apps with drag-and-drop.", tags: ["no-code", "apps", "ai"] },
    { title: "Lovable", url: "https://lovable.dev/", description: "AI app builder from natural language. Full-stack apps in minutes.", tags: ["apps", "ai", "no-code"] },
    { title: "Bolt", url: "https://bolt.new/", description: "AI full-stack app builder in the browser. Describe your app; deploy with Netlify or Cloudflare.", tags: ["full-stack", "browser", "ai"] },
    { title: "Devin", url: "https://devin.ai/", description: "AI software engineer that codes, debugs, and deploys. Full tasks from planning to tests.", tags: ["coding", "agent", "autonomous"] },
    { title: "Aider", url: "https://aider.dev/", description: "AI pair programming in the terminal. Edit code with natural language; integrates with Git.", tags: ["coding", "terminal", "open-source"] },
    { title: "Cody", url: "https://sourcegraph.com/cody", description: "AI coding assistant by Sourcegraph. Codebase-aware completions and chat in VS Code.", tags: ["coding", "sourcegraph", "codebase"] },
    { title: "Sweep", url: "https://sweep.dev/", description: "AI coding assistant that turns issues into PRs. Works in JetBrains and GitHub.", tags: ["coding", "github", "automation"] },
    { title: "Tabnine", url: "https://www.tabnine.com/", description: "AI code completion that learns your codebase. Private, on-device option.", tags: ["coding", "completion", "privacy"] },
    { title: "Windsurf", url: "https://codeium.com/windsurf", description: "AI-powered IDE with Cascade and agents. Real-time suggestions, multi-file edits.", tags: ["ide", "coding", "codeium"] },
    { title: "Cline", url: "https://cline.bot/", description: "Open-source AI coding assistant for VS Code. Plan and act modes, MCP.", tags: ["coding", "vscode", "open-source", "mcp"] },
    { title: "GoCodeo", url: "https://www.gocodeo.com/", description: "AI agent for full-stack apps in minutes. One-click Vercel deploy, Supabase, MCP.", tags: ["coding", "full-stack", "vercel"] },
    { title: "ChatArena", url: "https://chatarena.ai/", description: "Compare outputs from multiple LLMs side by side. Refine prompts and pick the best model.", tags: ["llm", "comparison", "prompts"] },
    { title: "Streamlit", url: "https://streamlit.io/", description: "Turn Python scripts into web apps in minutes. Dashboards, tools, and ML demos.", tags: ["python", "web-apps", "data", "ml"] },
    { title: "Chainlit", url: "https://chainlit.io/", description: "Build conversational AI apps and chatbots. Connect LLMs to your data.", tags: ["llm", "chatbot", "python"] },
    { title: "Vercel AI SDK", url: "https://sdk.vercel.ai/", description: "Build AI apps with React and streaming. Use OpenAI, Anthropic, and others with one API.", tags: ["ai", "react", "vercel", "streaming"] },
    { title: "OpenAI API", url: "https://platform.openai.com/docs", description: "APIs for GPT-4, Whisper, DALL·E, and embeddings. Build apps with language and vision.", tags: ["api", "openai", "gpt"] },
    { title: "Anthropic Claude API", url: "https://docs.anthropic.com/", description: "Anthropic API for Claude. Build apps with long context and tool use.", tags: ["anthropic", "claude", "api"] },
    { title: "Gemini", url: "https://ai.google.dev/", description: "Google's AI for developers. Models and APIs for text, code, and multimodal apps.", tags: ["google", "ai", "api"] },
    { title: "LangFuse", url: "https://langfuse.com/", description: "Observability for LLM apps: trace prompts, monitor performance, debug workflows.", tags: ["llm", "observability", "prompts"] },
    { title: "Literal AI", url: "https://literalai.com/", description: "LLM observability and evaluation for product teams. Prompt playground and A/B tests.", tags: ["llm", "observability", "evaluation"] },
    { title: "Octoparse", url: "https://www.octoparse.com/", description: "No-code web scraping and automation. Extract data from sites; use with AI for analysis.", tags: ["scraping", "no-code", "data", "automation"] },
    { title: "Programming Helper", url: "https://www.programming-helper.com/", description: "AI coding assistant: generate and debug code from plain English. Multi-language.", tags: ["ai", "code-generation", "debugging"] },
    { title: "Google Colab", url: "https://colab.research.google.com/", description: "Free Jupyter notebooks in the cloud. Run Python, train models, use Gemini.", tags: ["python", "notebooks", "google", "free"] },
    { title: "Msty", url: "https://msty.app/", description: "Hybrid AI: combine local open-source models with cloud models and switch per task.", tags: ["ai", "local", "hybrid", "workflow"] },
    { title: "Copilot Workspaces", url: "https://githubnext.com/projects/copilot-workspace", description: "GitHub Copilot Workspace: open issues in an AI workspace; get plans and code.", tags: ["github", "copilot", "coding", "workspace"] },
    { title: "Amazon Q", url: "https://aws.amazon.com/q/", description: "AWS AI assistant for code, docs, and ops. Code completions and AWS-specific guidance.", tags: ["aws", "coding", "ide", "enterprise"] },
    { title: "Replit Agent", url: "https://replit.com/ai", description: "AI-assisted coding inside Replit. Generate, edit, and debug in the browser.", tags: ["coding", "replit", "browser"] },
    { title: "OpenAI Whisper", url: "https://openai.com/research/whisper", description: "Speech-to-text model from OpenAI. Transcribe audio and video; many languages.", tags: ["speech", "transcription", "openai"] },
    { title: "Whisper.cpp", url: "https://github.com/ggerganov/whisper.cpp", description: "Open-source port of OpenAI Whisper. Run speech-to-text locally in C++.", tags: ["whisper", "speech", "local", "open-source"] },
    { title: "Vercel AI SDK RSC", url: "https://sdk.vercel.ai/docs/ai-sdk-ui/overview", description: "React Server Components and streaming for AI. Use AI SDK with Next.js App Router.", tags: ["vercel", "react", "ai", "nextjs"] },
    { title: "Efecto", url: "https://efecto.app/", description: "Creative AI assets and workflow. 3D and video for design and marketing.", tags: ["creative", "ai", "assets", "3d", "video"] },
    { title: "Mocku", url: "https://mocku.co/", description: "Creative AI assets and workflow. 3D mockups for Framer.", tags: ["creative", "ai", "3d", "framer"] },
    { title: "Vizcom", url: "https://www.vizcom.ai/", description: "Creative SAAS with 3D and workflow. Framer.", tags: ["creative", "saas", "3d", "framer"] },
    { title: "You.com", url: "https://you.com/", description: "AI search and chat. Enterprise and API; Webflow, GSAP.", tags: ["ai", "saas", "enterprise", "api"] },
    { title: "SafetyKit", url: "https://www.safetykit.com/", description: "AI security marketing. Webflow, GSAP.", tags: ["ai", "security", "webflow"] },
    { title: "Muse", url: "https://www.musesoftware.ai/", description: "SAAS events marketing and landing. Webflow, GSAP.", tags: ["saas", "events", "webflow"] },
    { title: "Walrus", url: "https://www.walrus.xyz/", description: "Web3 dev tools SAAS database marketing. Webflow, GSAP.", tags: ["web3", "dev-tools", "saas", "webflow"] },
    { title: "Skarlo", url: "https://skarlo.co/", description: "Creative AI agency portfolio. Framer.", tags: ["creative", "ai", "agency", "framer"] },
    { title: "Ledger Brandbook", url: "https://brand.ledger.com/", description: "AI crypto creative brand guide. Webflow, GSAP.", tags: ["ai", "crypto", "brand-guide", "webflow"] },
    { title: "find-skills skill", url: "https://www.nocodesupply.co/item/find-skills-skill", description: "AI dev tools LLM workflow. Agent skills directory.", tags: ["ai", "dev-tools", "llm", "workflow"] },
    { title: "Give Claude Code an external monitor", url: "https://github.com/dvdsgl/claude-canvas", description: "Claude Code with more control: QA and workflow. External canvas for coding.", tags: ["ai", "dev-tools", "workflow", "claude"] },
    { title: "Everything Claude Code Plugin", url: "https://github.com/affaan-m/everything-claude-code", description: "AI dev tools workflow. Skill and MCP for Claude.", tags: ["ai", "dev-tools", "workflow", "mcp"] },
    { title: "The Agent Skills Directory", url: "https://skills.sh/trending", description: "AI dev tools creative workflow. Claude skills directory.", tags: ["ai", "dev-tools", "skill", "claude"] },
    { title: "UI Skills", url: "https://www.ui-skills.com/", description: "AI creative dev tools workflow. Agent skills and Claude Code Skills Hub.", tags: ["ai", "creative", "workflow", "skill"] },
    { title: "rams", url: "https://www.rams.ai/", description: "AI dev tools creative workflow. Skill for agents.", tags: ["ai", "dev-tools", "creative", "workflow"] },
    { title: "textarea.my", url: "https://github.com/antonmedv/textarea", description: "Writing, text, URL workflow. Simple textarea utility.", tags: ["writing", "text", "url", "workflow"] },
    { title: "BlogSync", url: "https://blogsync.io/", description: "SAAS AI CMS workflow. Text, assets, automation for Webflow.", tags: ["saas", "ai", "cms", "webflow"] },
    { title: "Ballpark", url: "https://www.ballpark.ing/", description: "Creative agency pricing and automation. Ballpark for estimates.", tags: ["creative", "agency", "pricing", "automation"] },
  ],
  "design-tools": [
    { title: "Figma", url: "https://www.figma.com/", description: "Collaborative interface design tool. Design, prototype, and hand off with Dev Mode.", tags: ["design", "ui", "prototyping", "collab"] },
    { title: "Sketch", url: "https://www.sketch.com/", description: "Digital design toolkit for Mac. Vector editing, prototyping, and design systems.", tags: ["design", "mac", "ui", "vector"] },
    { title: "Framer", url: "https://www.framer.com/", description: "Design and publish high-fidelity sites. Responsive layouts, CMS, and animations.", tags: ["design", "websites", "cms", "animation"] },
    { title: "Penpot", url: "https://penpot.app/", description: "Open-source design and prototyping tool. Vector and layout; Figma alternative.", tags: ["design", "open-source", "prototyping", "ui"] },
    { title: "UXPin", url: "https://www.uxpin.com/", description: "Design tool with Merge: sync code components into designs. Design systems and dev handoff.", tags: ["design", "merge", "design-systems", "prototyping"] },
    { title: "Proto.io", url: "https://www.proto.io/", description: "Prototyping tool for web and mobile. Interactive prototypes and user testing.", tags: ["prototyping", "ui", "mobile", "testing"] },
    { title: "Adobe XD", url: "https://www.adobe.com/products/xd.html", description: "UI/UX design and prototyping from Adobe. Vector design and shared design specs.", tags: ["design", "adobe", "prototyping", "ui"] },
    { title: "Figma Dev Mode", url: "https://www.figma.com/developers/dev-mode", description: "Developer handoff inside Figma. Inspect specs, copy code, and use tokens.", tags: ["figma", "handoff", "dev", "specs"] },
    { title: "Excalidraw", url: "https://excalidraw.com/", description: "Open-source whiteboard for diagrams and wireframes. Hand-drawn style; collaborate in real time.", tags: ["diagrams", "whiteboard", "open-source", "collab"] },
    { title: "Coolors", url: "https://coolors.co/", description: "Color palette generator and explorer. Create palettes and get inspiration.", tags: ["color", "palette", "design", "tools"] },
    { title: "Balsamiq", url: "https://balsamiq.com/", description: "Rapid wireframing with a hand-drawn look. Sketch UIs fast for early feedback.", tags: ["wireframes", "ui", "sketch", "rapid"] },
    { title: "Miro", url: "https://miro.com/", description: "Online whiteboard for collaboration. Diagrams, workshops, and async teamwork.", tags: ["whiteboard", "collab", "diagrams", "workshops"] },
    { title: "Figma Jam", url: "https://www.figma.com/figjam/", description: "Figma's whiteboard for ideation and workshops. Sticky notes, diagrams, real-time collab.", tags: ["whiteboard", "figma", "ideation", "collab"] },
    { title: "Spline", url: "https://spline.design/", description: "3D design in the browser. Create 3D scenes and interactions; export for web and React.", tags: ["3d", "design", "browser", "interactive"] },
    { title: "LottieFiles", url: "https://lottiefiles.com/", description: "Lottie animation library and editor. Browse, edit, and ship lightweight animations.", tags: ["animation", "lottie", "motion", "design"] },
    { title: "Affinity", url: "https://www.affinity.studio/", description: "Creative assets and design system. Professional design tools.", tags: ["creative", "assets", "design-system"] },
    { title: "Hugeicons Webflow App", url: "https://webflow.com/apps/detail/hugeicons", description: "Creative design system, assets, and components for Webflow.", tags: ["creative", "design-system", "assets", "webflow"] },
    { title: "divs Webflow component library", url: "https://divs.idreezus.com/", description: "No-code dev tools gallery. Webflow component library.", tags: ["no-code", "dev-tools", "gallery", "webflow"] },
    { title: "Mast", url: "https://www.nocodesupply.co/mast", description: "CSS framework for Webflow. Design system, HARA, Rotor, Gantry. No-Code Supply Co.", tags: ["no-code", "css", "webflow", "design-system"] },
    { title: "Canva", url: "https://www.canva.com/", description: "Visual design platform for everyone. Templates, branding, and social content.", tags: ["design", "templates", "branding", "social"] },
    { title: "Figma to Code", url: "https://www.figma.com/developers", description: "Figma developer resources. Plugins and API for design-to-code.", tags: ["figma", "developers", "api", "plugins"] },
    { title: "Haikei", url: "https://haikei.app/", description: "Generate unique SVG blobs, waves, and patterns for design. Export for web.", tags: ["svg", "generator", "design", "blobs"] },
    { title: "Remove.bg", url: "https://www.remove.bg/", description: "Remove image backgrounds automatically. API and batch for designers.", tags: ["design", "images", "background-removal", "api"] },
    { title: "TinyPNG", url: "https://tinypng.com/", description: "Compress PNG and JPEG images. Keep quality, reduce file size.", tags: ["images", "compression", "design", "optimization"] },
    { title: "Figma Plugins", url: "https://www.figma.com/community/plugins", description: "Community plugins for Figma. Icons, automation, and handoff.", tags: ["figma", "plugins", "community", "automation"] },
    { title: "IconScout", url: "https://iconscout.com/", description: "Icons, illustrations, and Lottie. Design assets for UI and marketing.", tags: ["icons", "illustrations", "design", "assets"] },
    { title: "Undraw", url: "https://undraw.co/", description: "Open-source illustrations for every project. Customize color and use in design.", tags: ["illustrations", "open-source", "design", "svg"] },
    { title: "Blush", url: "https://blush.design/", description: "Curated illustrations from artists. Mix and match for unique visuals.", tags: ["illustrations", "design", "artists", "custom"] },
    { title: "Rive", url: "https://rive.app/", description: "Real-time interactive animation tool. Export for web, Flutter, and Unity.", tags: ["animation", "interactive", "real-time", "design"] },
    { title: "Principle", url: "https://principleformac.com/", description: "Animate your designs. Create interactive prototypes for Mac.", tags: ["animation", "prototyping", "mac", "interactive"] },
    { title: "Lunacy", url: "https://icons8.com/lunacy", description: "Free design software. Sketch alternative with icons and photos.", tags: ["design", "free", "sketch", "icons"] },
    { title: "Gravit Designer", url: "https://www.designer.io/", description: "Vector design app for Mac, Windows, and browser. Free tier available.", tags: ["vector", "design", "cross-platform", "free"] },
    { title: "Vectr", url: "https://vectr.com/", description: "Free vector graphics editor. Design in browser or desktop.", tags: ["vector", "design", "free", "browser"] },
    { title: "Photopea", url: "https://www.photopea.com/", description: "Online image editor. Photoshop-like; works in browser, free.", tags: ["image-editor", "photoshop", "browser", "free"] },
    { title: "Figma for Education", url: "https://www.figma.com/education/", description: "Figma free for students and educators. Teach and learn design.", tags: ["figma", "education", "free", "students"] },
    { title: "Design Systems Repo", url: "https://designsystemsrepo.com/", description: "Curated list of design systems and style guides. Inspiration and patterns.", tags: ["design-systems", "style-guides", "inspiration", "curated"] },
    { title: "Zeroheight", url: "https://zeroheight.com/", description: "Document and scale design systems. Single source of truth for design and dev.", tags: ["design-systems", "documentation", "scale", "design"] },
    { title: "Storybook Design", url: "https://storybook.js.org/", description: "Build and document UI components in isolation. Test and showcase components.", tags: ["components", "documentation", "testing", "ui"] },
    { title: "Modulz", url: "https://modulz.app/", description: "Visual code editor for design systems. Build components without writing code.", tags: ["design-systems", "visual-editor", "components", "no-code"] },
    { title: "Supernova", url: "https://supernova.io/", description: "Design system platform. Sync Figma to code and documentation.", tags: ["design-systems", "figma", "code", "documentation"] },
    { title: "Tokens Studio", url: "https://tokens.studio/", description: "Design tokens for design systems. Sync between Figma and code.", tags: ["design-tokens", "design-systems", "figma", "code"] },
    { title: "Relume", url: "https://www.relume.io/", description: "AI-powered site map and wireframe tool. Webflow integration.", tags: ["ai", "wireframes", "sitemap", "webflow"] },
    { title: "Maze", url: "https://maze.co/", description: "User testing and research platform. Test prototypes and gather feedback.", tags: ["user-testing", "research", "prototypes", "feedback"] },
    { title: "Useberry", url: "https://www.useberry.com/", description: "User testing for prototypes. Figma and InVision integration.", tags: ["user-testing", "prototypes", "figma", "ux"] },
    { title: "Hotjar", url: "https://www.hotjar.com/", description: "Heatmaps, recordings, and feedback. Understand how users behave.", tags: ["heatmaps", "recordings", "feedback", "ux"] },
    { title: "Figma Auto Layout", url: "https://www.figma.com/blog/auto-layout/", description: "Auto Layout in Figma. Responsive frames and constraints.", tags: ["figma", "auto-layout", "responsive", "design"] },
    { title: "Figma Variables", url: "https://www.figma.com/blog/variables/", description: "Variables in Figma. Design tokens and theming.", tags: ["figma", "variables", "tokens", "theming"] },
    { title: "Figma AI", url: "https://www.figma.com/ai/", description: "AI features in Figma. Generate UI, summarize, and more.", tags: ["figma", "ai", "generate", "design"] },
    { title: "Scribe", url: "https://scribehow.com/", description: "Auto-generate step-by-step guides from your screen. Documentation and training.", tags: ["documentation", "guides", "automation", "training"] },
    { title: "Miro AI", url: "https://miro.com/ai/", description: "AI in Miro. Summarize, generate ideas, and organize boards.", tags: ["miro", "ai", "whiteboard", "collab"] },
    { title: "Whimsical", url: "https://whimsical.com/", description: "Visual workspace for thinking. Flowcharts, wireframes, docs, and mind maps.", tags: ["flowcharts", "wireframes", "docs", "mind-maps"] },
    { title: "Figma Config", url: "https://config.figma.com/", description: "Figma's annual conference. Keynotes, workshops, and community.", tags: ["figma", "conference", "community", "design"] },
    { title: "Design Better", url: "https://www.designbetter.co/", description: "Design leadership resources. Books, podcasts, and guides by InVision.", tags: ["design", "leadership", "books", "podcasts"] },
    { title: "Laws of UX", url: "https://lawsofux.com/", description: "Principles of design in one place. Psychology and best practices for UX.", tags: ["ux", "psychology", "principles", "design"] },
    { title: "Nielsen Norman Group", url: "https://www.nngroup.com/", description: "UX research and training. Evidence-based guidelines and articles.", tags: ["ux", "research", "usability", "guidelines"] },
    { title: "Refactoring UI", url: "https://www.refactoringui.com/", description: "Book and tips for developers who design. Make interfaces look good.", tags: ["ui", "design", "developers", "book"] },
    { title: "Stark", url: "https://www.getstark.co/", description: "Accessibility toolkit for design. Contrast, focus order, and compliance.", tags: ["accessibility", "design", "contrast", "compliance"] },
    { title: "Colorable", url: "https://colorable.jxnblk.com/", description: "Contrast checker for text and background. WCAG compliance.", tags: ["color", "contrast", "accessibility", "wcag"] },
    { title: "Contrast Ratio", url: "https://contrast-ratio.com/", description: "Check color contrast for accessibility. Lea Verou's tool.", tags: ["contrast", "accessibility", "color", "wcag"] },
    { title: "Figma Accessibility", url: "https://www.figma.com/community/plugin/733159460536249875", description: "Accessibility checker plugin for Figma. WCAG and best practices.", tags: ["figma", "accessibility", "plugin", "wcag"] },
    { title: "A11y Project", url: "https://www.a11yproject.com/", description: "Community-driven accessibility resources. Checklists and patterns.", tags: ["accessibility", "checklist", "patterns", "community"] },
    { title: "WebAIM", url: "https://webaim.org/", description: "Web accessibility in mind. Articles, tools, and training.", tags: ["accessibility", "web", "tools", "training"] },
    { title: "Inclusive Components", url: "https://inclusive-components.design/", description: "Patterns for accessible interfaces. Blog and code examples.", tags: ["accessibility", "components", "patterns", "inclusive"] },
    { title: "Radix Colors", url: "https://www.radix-ui.com/colors", description: "Color system for design and development. Accessibility-first palettes.", tags: ["colors", "design-system", "accessibility", "radix"] },
    { title: "Open Color", url: "https://yeun.github.io/open-color/", description: "Open-source color scheme for UI. Multiple palettes and formats.", tags: ["color", "open-source", "ui", "palettes"] },
    { title: "ColorBox", url: "https://colorbox.io/", description: "Create color palettes with AI. Lyft Design tool.", tags: ["color", "palettes", "ai", "design"] },
    { title: "Realtime Colors", url: "https://realtimecolors.com/", description: "Preview color palettes on real website templates. Live preview.", tags: ["color", "palettes", "preview", "design"] },
    { title: "Huemint", url: "https://huemint.com/", description: "AI color palette generator. Machine learning for color schemes.", tags: ["color", "ai", "palettes", "generator"] },
    { title: "Happy Hues", url: "https://www.happyhues.co/", description: "Color palettes for designers. Curated with examples.", tags: ["color", "palettes", "design", "curated"] },
    { title: "Type Scale", url: "https://typescale.com/", description: "Visual type scale calculator. Typography and responsive sizing.", tags: ["typography", "type-scale", "design", "calculator"] },
    { title: "Font Pair", url: "https://www.fontpair.co/", description: "Google Fonts pairings. Typography inspiration for design.", tags: ["typography", "fonts", "pairings", "google-fonts"] },
    { title: "Fontshare", url: "https://www.fontshare.com/", description: "Free fonts from Indian Type Foundry. Quality type for design.", tags: ["fonts", "free", "typography", "design"] },
    { title: "Google Fonts", url: "https://fonts.google.com/", description: "Free fonts for the web. Thousands of typefaces and pairs.", tags: ["fonts", "free", "web", "typography"] },
    { title: "Font Squirrel", url: "https://www.fontsquirrel.com/", description: "Free commercial fonts. Hand-picked for quality and license.", tags: ["fonts", "free", "commercial", "license"] },
    { title: "Inter", url: "https://rsms.me/inter/", description: "Inter font family. Variable and optimized for screens.", tags: ["font", "variable", "ui", "screens"] },
    { title: "JetBrains Mono", url: "https://www.jetbrains.com/lp/mono/", description: "Monospace font for developers. Ligatures and readability.", tags: ["font", "monospace", "coding", "ligatures"] },
    { title: "Figma Fonts", url: "https://www.figma.com/fonts/", description: "Fonts in Figma. Google Fonts and local sync.", tags: ["figma", "fonts", "google-fonts", "design"] },
    { title: "Iconify", url: "https://iconify.design/", description: "Unified icon framework. Thousands of icons in one API.", tags: ["icons", "framework", "api", "design"] },
    { title: "Heroicons", url: "https://heroicons.com/", description: "Beautiful hand-crafted icons by Tailwind. Outline and solid.", tags: ["icons", "tailwind", "outline", "solid"] },
    { title: "Lucide", url: "https://lucide.dev/", description: "Beautiful and consistent icon set. Fork of Feather; multiple frameworks.", tags: ["icons", "feather", "react", "svg"] },
    { title: "Phosphor Icons", url: "https://phosphoricons.com/", description: "Flexible icon family. Six weights and multiple styles.", tags: ["icons", "weights", "flexible", "design"] },
    { title: "Tabler Icons", url: "https://tabler.io/icons", description: "Over 5000 free MIT icons. Consistent stroke and style.", tags: ["icons", "mit", "free", "stroke"] },
    { title: "Feather Icons", url: "https://feathericons.com/", description: "Simple, open-source icons. Clean and minimal.", tags: ["icons", "open-source", "minimal", "simple"] },
    { title: "Remix Icon", url: "https://remixicon.com/", description: "Open source icon library. Neutral style for design systems.", tags: ["icons", "open-source", "library", "neutral"] },
    { title: "Figma Icons", url: "https://www.figma.com/community/search?resource_type=mixed&sort_by=relevancy&query=icons", description: "Icon sets in Figma Community. Plugins and files.", tags: ["figma", "icons", "community", "plugins"] },
    { title: "Noun Project", url: "https://thenounproject.com/", description: "Icons and photos for every project. Millions of curated assets.", tags: ["icons", "photos", "curated", "assets"] },
    { title: "Flaticon", url: "https://www.flaticon.com/", description: "Millions of free icons. PNG, SVG, and custom color.", tags: ["icons", "free", "png", "svg"] },
    { title: "Icons8", url: "https://icons8.com/", description: "Icons, photos, and music. Multiple styles and formats.", tags: ["icons", "photos", "music", "styles"] },
    { title: "Iconoir", url: "https://iconoir.com/", description: "Simple icon library. Open source and customizable.", tags: ["icons", "open-source", "simple", "customizable"] },
    { title: "CSS.gg", url: "https://css.gg/", description: "Pure CSS icons. 700+ icons in single CSS file.", tags: ["icons", "css", "pure", "lightweight"] },
    { title: "Bootstrap Icons", url: "https://icons.getbootstrap.com/", description: "Open source icon set for Bootstrap. SVG and font.", tags: ["icons", "bootstrap", "open-source", "svg"] },
    { title: "Material Icons", url: "https://fonts.google.com/icons", description: "Material Design icons from Google. Multiple styles and sizes.", tags: ["icons", "material-design", "google", "design"] },
    { title: "SF Symbols", url: "https://developer.apple.com/sf-symbols/", description: "Apple's symbol set for apps. Thousands of configurable symbols.", tags: ["icons", "apple", "sf-symbols", "ios"] },
    { title: "Figma Design", url: "https://www.figma.com/design/", description: "Figma's main design product. UI, prototyping, and collaboration.", tags: ["figma", "design", "ui", "prototyping"] },
    { title: "Figma Organization", url: "https://www.figma.com/organization/", description: "Figma for teams and enterprises. Scale design across org.", tags: ["figma", "organization", "teams", "enterprise"] },
    { title: "Figma Community", url: "https://www.figma.com/community", description: "Templates, plugins, and files from the Figma community.", tags: ["figma", "community", "templates", "plugins"] },
    { title: "Figma for Developers", url: "https://www.figma.com/developers", description: "Figma API and embed. Build tools and integrations.", tags: ["figma", "developers", "api", "integrations"] },
    { title: "Webflow Design", url: "https://webflow.com/design", description: "Visual web design in Webflow. No-code designer and CMS.", tags: ["webflow", "design", "no-code", "cms"] },
    { title: "Framer Design", url: "https://www.framer.com/design/", description: "Design and prototype in Framer. High-fidelity and code.", tags: ["framer", "design", "prototype", "code"] },
    { title: "Spline 3D", url: "https://spline.design/", description: "3D design tool in the browser. Export for web and React.", tags: ["3d", "design", "browser", "react"] },
    { title: "Spline AI", url: "https://spline.design/ai", description: "AI-powered 3D creation in Spline. Generate scenes from text.", tags: ["3d", "ai", "spline", "generation"] },
    { title: "Spline Tutorials", url: "https://spline.design/learn", description: "Learn 3D design with Spline. Tutorials and templates.", tags: ["3d", "spline", "learn", "tutorials"] },
    { title: "Figma Tutorials", url: "https://www.figma.com/resources/learn-design/", description: "Learn design with Figma. Courses and best practices.", tags: ["figma", "learn", "design", "courses"] },
    { title: "Design Lab", url: "https://designlab.com/", description: "Learn UI/UX design with mentorship. 1-on-1 and project-based.", tags: ["learning", "ui", "ux", "mentorship"] },
    { title: "Shift Nudge", url: "https://shiftnudge.com/", description: "Learn visual design. Course on layout, type, and color.", tags: ["learning", "design", "visual", "course"] },
    { title: "Design+Code", url: "https://designcode.io/", description: "Learn design and code. SwiftUI, React, and Figma courses.", tags: ["learning", "design", "code", "courses"] },
    { title: "Sketch Master", url: "https://www.sketch.com/docs/", description: "Sketch documentation and learning. Get started and go deep.", tags: ["sketch", "docs", "learning", "design"] },
  ],
  inspiration: [
    { title: "Farm Minerals", url: "https://www.nocodesupply.co/item/farm-minerals", description: "Agriculture marketing, scrollytelling, animation. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspo", "webflow", "gsap", "animation"] },
    { title: "Mason Wong", url: "https://www.nocodesupply.co/item/mason-wong", description: "Creative personal portfolio. Framer. No-Code Supply Co inspo.", tags: ["inspiration", "portfolio", "framer"] },
    { title: "1820 Productions", url: "https://www.1820productions.com/", description: "Creative film agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "gsap"] },
    { title: "Mel Chiri Consulting", url: "https://www.melchiri.com/", description: "Marketing personal portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "portfolio", "webflow"] },
    { title: "Konpo Studio", url: "https://www.konpo.studio/", description: "Creative agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "gsap"] },
    { title: "Tesoro", url: "https://www.tesoroxp.com/", description: "Entertainment SAAS financial marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "saas", "webflow", "gsap"] },
    { title: "Kudanil Explorer", url: "https://www.kudanil.com/", description: "Travel transportation scrollytelling landing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "travel", "webflow", "scrollytelling"] },
    { title: "Let's Do This", url: "https://www.letsdothis.com/", description: "Sports events marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "sports", "webflow", "gsap"] },
    { title: "Osmo", url: "https://www.osmo.supply/", description: "Creative no-code dev tools animation gallery. Webflow, GSAP, Outseta. No-Code Supply Co.", tags: ["inspiration", "animation", "webflow", "gsap"] },
    { title: "Claimable", url: "https://getclaimable.com/", description: "Medical insurance SAAS marketing. Webflow, Mast. No-Code Supply Co inspo.", tags: ["inspiration", "saas", "webflow"] },
    { title: "Good Friends Agency", url: "https://goodfriendsagency.com/", description: "Religious creative agency portfolio. Framer. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "framer"] },
    { title: "Brainfish", url: "https://www.brainfishai.com/", description: "AI customer service SAAS marketing. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "ai", "webflow"] },
    { title: "Superplan", url: "https://www.superplan.ai/", description: "AI financial SAAS marketing. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "ai", "webflow"] },
    { title: "Reve", url: "https://app.reve.com/", description: "Creative AI assets. Midjourney, Visual Electric. No-Code Supply Co inspo.", tags: ["inspiration", "ai", "creative"] },
    { title: "Oratory", url: "https://www.oratory.co/", description: "Creative no-code agency portfolio. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow"] },
    { title: "Brand Appart", url: "https://www.brandappart.com/", description: "Creative agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "gsap"] },
    { title: "Arc", url: "https://www.arcprojects.build/", description: "Architecture agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "architecture", "webflow", "gsap"] },
    { title: "Lando Norris", url: "https://landonorris.com/", description: "Sports personal marketing. Webflow, GSAP, Three.js. No-Code Supply Co inspo.", tags: ["inspiration", "sports", "webflow", "threejs"] },
    { title: "Amrit Palace", url: "https://amritpalace.com/", description: "Restaurant food and beverage marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "restaurant", "webflow", "gsap"] },
    { title: "Arqui9", url: "https://www.arqui9.com/", description: "Creative architecture agency portfolio. 3D, Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "architecture", "3d", "webflow"] },
    { title: "Fried Egg Golf", url: "https://www.thefriedegg.com/", description: "Sports community marketing. Webflow, Memberstack, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "sports", "webflow", "memberstack"] },
    { title: "N4 Studio", url: "https://www.n4.studio/", description: "Creative agency portfolio enterprise. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow"] },
    { title: "Athlee", url: "https://www.athlee.com/", description: "Sports technology video marketing scrollytelling. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "sports", "webflow", "gsap"] },
    { title: "Weavy", url: "https://www.weavy.ai/", description: "AI creative SAAS assets workflow marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "ai", "webflow", "gsap"] },
    { title: "Pulso Hotel", url: "https://www.pulsohotel.com/", description: "Travel real estate marketing. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "travel", "webflow"] },
    { title: "Get Hyped", url: "https://www.gethyped.nl/", description: "Creative agency portfolio. Webflow, GSAP, Osmo. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "gsap"] },
    { title: "Sunrise Robotics", url: "https://sunriserobotics.co/", description: "Technology marketing landing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "technology", "webflow", "gsap"] },
    { title: "Dria Ventures", url: "https://www.dria.com/", description: "Financial SAAS agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "financial", "webflow", "gsap"] },
    { title: "Mutiny", url: "https://www.mutinybranding.com/", description: "Creative agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "gsap"] },
    { title: "Insider Madeira", url: "https://www.insidermadeira.com/", description: "Travel editorial marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "travel", "webflow", "gsap"] },
    { title: "Human Interest", url: "https://www.humaninterest.co.nz/", description: "Creative content agency portfolio. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow"] },
    { title: "by RAVEN", url: "https://www.byraven.com/", description: "Music creative agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "gsap"] },
    { title: "Gabi Robins", url: "https://www.gabirobins.com/", description: "Creative no-code personal portfolio. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "portfolio", "webflow"] },
    { title: "town.com", url: "https://www.town.com/", description: "Financial marketing. Framer. No-Code Supply Co inspo.", tags: ["inspiration", "financial", "framer"] },
    { title: "Mammoth Murals", url: "https://mammothmurals.com/", description: "Creative advertising agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "gsap"] },
    { title: "Lithosquare", url: "https://www.lithosquare.com/", description: "AI environment landing animation. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "ai", "webflow", "gsap"] },
    { title: "Sasha Birukoff", url: "https://www.sashabirukoff.com/", description: "Creative personal portfolio. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "portfolio", "webflow"] },
    { title: "Streamline Defense", url: "https://www.streamlinedefense.com/", description: "Technology security marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "security", "webflow", "gsap"] },
    { title: "Duracell", url: "https://duracell.com/", description: "Energy technology marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "technology", "webflow", "gsap"] },
    { title: "DONE Prebiotic Protein Drink", url: "https://donedrinks.com/", description: "Food and beverage health landing ecommerce. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "ecommerce", "webflow", "gsap"] },
    { title: "Parable", url: "https://www.parablevc.com/", description: "Financial agency portfolio landing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "financial", "webflow", "gsap"] },
    { title: "Diff", url: "https://www.diffagency.com/", description: "Creative agency portfolio ecommerce. Webflow, Shopify. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "shopify"] },
    { title: "Making UX Decisions", url: "https://uxdecisions.com/", description: "Creative education gallery authentication. Framer, Outseta. No-Code Supply Co inspo.", tags: ["inspiration", "education", "framer", "outseta"] },
    { title: "Awwwards", url: "https://www.awwwards.com/", description: "Awards and gallery for the best web design. Site of the day and UI inspiration.", tags: ["design", "inspiration", "websites", "awards"] },
    { title: "Behance", url: "https://www.behance.net/", description: "Adobe's platform for creative work. UI/UX, branding, and motion projects.", tags: ["design", "portfolio", "ui", "inspiration"] },
    { title: "Dribbble", url: "https://dribbble.com/", description: "Design community and job board. Browse UI, illustration, and branding.", tags: ["design", "community", "ui", "hire"] },
    { title: "Refero", url: "https://refero.design/", description: "UI/UX inspiration library. Real products by page type; Figma plugin.", tags: ["ui", "inspiration", "reference", "figma"] },
    { title: "Mobbin", url: "https://mobbin.com/", description: "Browse mobile and web app designs. Filter by flow, industry, and element.", tags: ["ui", "mobile", "inspiration", "patterns"] },
    { title: "Land-book", url: "https://land-book.com/", description: "Curated gallery of landing pages. Filter by style and industry.", tags: ["landing-pages", "inspiration", "design", "gallery"] },
    { title: "Muzli", url: "https://muz.li/", description: "Design inspiration feed. Curated UI, products, and trends in one place.", tags: ["design", "inspiration", "ui", "curated"] },
    { title: "SiteInspire", url: "https://www.siteinspire.com/", description: "Curated showcase of web design. Filter by type, style, and subject.", tags: ["web-design", "inspiration", "showcase", "curated"] },
    { title: "Lapa Ninja", url: "https://www.lapa.ninja/", description: "Landing page gallery. Browse 2000+ landing pages by industry and style.", tags: ["landing-pages", "inspiration", "gallery", "ui"] },
    { title: "One Page Love", url: "https://onepagelove.com/", description: "Gallery of one-page websites. Inspiration for landing pages and single-page sites.", tags: ["landing-pages", "one-page", "inspiration", "gallery"] },
    { title: "Ripplix", url: "https://www.ripplix.com/", description: "Creative animation gallery. No-Code Supply Co.", tags: ["inspiration", "creative", "animation", "gallery"] },
    { title: "Institute of Health", url: "https://www.nocodesupply.co/item/institute-of-health", description: "Health and wellness medical marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "health", "webflow", "gsap"] },
    { title: "Runlayer", url: "https://www.nocodesupply.co/item/runlayer", description: "AI dev tools security SAAS marketing. Webflow, GSAP, Mast. No-Code Supply Co inspo.", tags: ["inspiration", "ai", "webflow", "gsap"] },
    { title: "TitanGate Equity", url: "https://www.nocodesupply.co/item/titangate-equity", description: "Financial agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "financial", "webflow", "gsap"] },
    { title: "Flim", url: "https://www.nocodesupply.co/item/flim", description: "Creative gallery web apps landing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "creative", "webflow", "gsap"] },
    { title: "Made Light Wheels", url: "https://www.nocodesupply.co/item/made-light-wheels", description: "Transportation creative marketing ecommerce. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "transportation", "webflow", "gsap"] },
    { title: "Frequency Breathwork", url: "https://www.nocodesupply.co/item/frequency-breathwork", description: "Health and wellness marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "health", "webflow", "gsap"] },
    { title: "Gradient Labs", url: "https://www.nocodesupply.co/item/gradient-labs", description: "AI customer service SAAS marketing. Framer. No-Code Supply Co inspo.", tags: ["inspiration", "ai", "framer"] },
    { title: "Weaverbird", url: "https://www.nocodesupply.co/item/weaverbird", description: "Technology marketing. Webflow, GSAP, Mast. No-Code Supply Co inspo.", tags: ["inspiration", "technology", "webflow", "gsap"] },
    { title: "Trust Keith", url: "https://www.nocodesupply.co/item/trust-keith", description: "Security data management SAAS marketing. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "security", "webflow"] },
    { title: "N47", url: "https://www.nocodesupply.co/item/n47", description: "Financial agency portfolio. Webflow, GSAP, Osmo. No-Code Supply Co inspo.", tags: ["inspiration", "financial", "webflow", "gsap"] },
    { title: "Paris by Emily", url: "https://www.nocodesupply.co/item/paris-by-emily", description: "Film travel landing animation. Webflow, GSAP, Osmo. No-Code Supply Co inspo.", tags: ["inspiration", "film", "webflow", "gsap"] },
    { title: "OneTech", url: "https://www.nocodesupply.co/item/onetch", description: "Industrial technology marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "technology", "webflow", "gsap"] },
    { title: "Paper Tiger", url: "https://www.nocodesupply.co/item/paper-tiger", description: "Creative portfolio agency. Webflow. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow"] },
    { title: "Efecto", url: "https://efecto.app/", description: "Creative AI assets workflow. 3D and video. No-Code Supply Co inspo.", tags: ["inspiration", "creative", "ai", "3d"] },
    { title: "Konpo Studio", url: "https://www.konpo.studio/", description: "Creative agency portfolio. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "webflow", "gsap"] },
    { title: "React Email", url: "https://react.email/", description: "Dev tools creative email JavaScript workflow. No-Code Supply Co.", tags: ["inspiration", "email", "react", "workflow"] },
    { title: "Let's Do This", url: "https://www.letsdothis.com/", description: "Sports events marketing. Webflow, GSAP. No-Code Supply Co inspo.", tags: ["inspiration", "sports", "webflow", "gsap"] },
    { title: "Good Friends Agency", url: "https://goodfriendsagency.com/", description: "Religious creative agency portfolio. Framer. No-Code Supply Co inspo.", tags: ["inspiration", "agency", "framer"] },
    { title: "Hubspot", url: "https://www.hubspot.com/", description: "Marketing sales and service platform. CRM and automation.", tags: ["marketing", "crm", "sales", "automation"] },
    { title: "Webflow Showcase", url: "https://webflow.com/made-in-webflow", description: "Sites made in Webflow. Gallery and inspiration.", tags: ["webflow", "showcase", "inspiration", "gallery"] },
    { title: "Framer Templates", url: "https://www.framer.com/templates/", description: "Templates for Framer. Landing pages and portfolios.", tags: ["framer", "templates", "inspiration", "landing"] },
    { title: "Squarespace Gallery", url: "https://www.squarespace.com/templates", description: "Templates and inspiration for Squarespace. Design and layout ideas.", tags: ["squarespace", "templates", "inspiration", "gallery"] },
    { title: "Wix Gallery", url: "https://www.wix.com/website/templates", description: "Website templates on Wix. Browse by industry and style.", tags: ["wix", "templates", "inspiration", "gallery"] },
    { title: "Carrd", url: "https://carrd.co/", description: "Simple one-page sites. Free and paid; minimal and fast.", tags: ["one-page", "simple", "landing", "minimal"] },
    { title: "Notion So", url: "https://www.notion.so/", description: "All-in-one workspace. Docs, wikis, tasks, and databases.", tags: ["productivity", "docs", "wiki", "tasks"] },
    { title: "Figma Community", url: "https://www.figma.com/community", description: "Templates, plugins, and files from the Figma community.", tags: ["figma", "community", "templates", "plugins"] },
    { title: "CodePen", url: "https://codepen.io/", description: "Front-end code playground. HTML, CSS, JavaScript; share and discover.", tags: ["frontend", "playground", "code", "share"] },
    { title: "CodePen Explore", url: "https://codepen.io/explore", description: "Explore pens by topic. CSS, JS, and design inspiration.", tags: ["codepen", "explore", "inspiration", "frontend"] },
    { title: "Brutalist Websites", url: "https://brutalistwebsites.com/", description: "Curated list of brutalist web design. Raw and bold inspiration.", tags: ["brutalist", "design", "inspiration", "curated"] },
    { title: "Httpster", url: "https://httpster.net/", description: "Curated web design inspiration. Filter by style and type.", tags: ["web-design", "inspiration", "curated", "gallery"] },
    { title: "Screen Lane", url: "https://screenlane.com/", description: "Mobile app design inspiration. iOS and Android screens.", tags: ["mobile", "app-design", "inspiration", "screens"] },
    { title: "Collect UI", url: "http://collectui.com/", description: "Daily UI inspiration. Components and patterns from Dribbble.", tags: ["ui", "inspiration", "components", "patterns"] },
    { title: "UI Movement", url: "https://uimovement.com/", description: "UI design inspiration. Animated and interactive patterns.", tags: ["ui", "inspiration", "animation", "patterns"] },
    { title: "Hover States", url: "https://www.hoverstat.es/", description: "Curated web and app design. Interactive and animation focus.", tags: ["design", "inspiration", "interactive", "animation"] },
    { title: "Landingfolio", url: "https://www.landingfolio.com/", description: "Landing page design inspiration. Filter by industry and style.", tags: ["landing-pages", "inspiration", "design", "gallery"] },
    { title: "SaaS Landing Page", url: "https://saaslandingpage.com/", description: "SaaS landing page examples. Inspiration for product pages.", tags: ["saas", "landing-pages", "inspiration", "product"] },
    { title: "Pages.xyz", url: "https://www.pages.xyz/", description: "Curated list of marketing pages. Copy and design inspiration.", tags: ["marketing", "pages", "inspiration", "copy"] },
    { title: "Really Good UX", url: "https://www.reallygoodux.io/", description: "UX examples and teardowns. Learn from real products.", tags: ["ux", "examples", "teardowns", "learning"] },
    { title: "UX Design Weekly", url: "https://uxdesignweekly.com/", description: "Weekly roundup of UX articles and resources. Newsletter and archive.", tags: ["ux", "newsletter", "articles", "roundup"] },
    { title: "Sidebar", url: "https://sidebar.io/", description: "Daily design links. Curated design news and articles.", tags: ["design", "news", "curated", "links"] },
    { title: "Designer News", url: "https://www.designernews.co/", description: "Community for designers. Share and discuss design.", tags: ["design", "community", "news", "discussion"] },
    { title: "Smashing Magazine", url: "https://www.smashingmagazine.com/", description: "Articles and books for web designers and developers. UX and frontend.", tags: ["design", "frontend", "ux", "articles"] },
    { title: "Codrops", url: "https://tympanus.net/codrops/", description: "Creative front-end resources. Tutorials and demos.", tags: ["frontend", "tutorials", "demos", "creative"] },
    { title: "CSS Design Awards", url: "https://www.cssdesignawards.com/", description: "Website design awards. Showcase and inspiration.", tags: ["design", "awards", "showcase", "inspiration"] },
    { title: "The FWA", url: "https://thefwa.com/", description: "Favourite Website Awards. Innovative digital projects.", tags: ["design", "awards", "innovation", "digital"] },
    { title: "Awwwards SOTD", url: "https://www.awwwards.com/websites/site_of_the_day/", description: "Site of the day from Awwwards. Best web design daily.", tags: ["design", "awwwards", "site-of-the-day", "inspiration"] },
    { title: "Godly", url: "https://godly.website/", description: "Curated web design inspiration. Filter by style and type.", tags: ["web-design", "inspiration", "curated", "gallery"] },
    { title: "Niice", url: "https://niice.co/", description: "Mood board and design collaboration. Collect and share inspiration.", tags: ["mood-board", "design", "collaboration", "inspiration"] },
    { title: "Pinterest Design", url: "https://www.pinterest.com/search/pins/?q=web%20design", description: "Web design pins on Pinterest. Visual inspiration and boards.", tags: ["design", "pinterest", "inspiration", "visual"] },
    { title: "Dribbble Shot of the Day", url: "https://dribbble.com/shots", description: "Latest shots on Dribbble. UI and design inspiration.", tags: ["dribbble", "shots", "inspiration", "ui"] },
    { title: "Behance Projects", url: "https://www.behance.net/search/projects", description: "Creative projects on Behance. Filter by field and tools.", tags: ["behance", "projects", "inspiration", "creative"] },
    { title: "Awwwards Collections", url: "https://www.awwwards.com/collections/", description: "Curated collections from Awwwards. Themes and styles.", tags: ["awwwards", "collections", "inspiration", "curated"] },
    { title: "Land-book Collections", url: "https://land-book.com/collections", description: "Curated landing page collections. Themes and industries.", tags: ["landing-pages", "collections", "inspiration", "curated"] },
    { title: "Mobbin Flows", url: "https://mobbin.com/browse/flow", description: "User flow inspiration. Mobile and web app flows.", tags: ["mobbin", "flows", "inspiration", "ux"] },
    { title: "Refero Design", url: "https://refero.design/", description: "UI/UX inspiration library. Real products by page type.", tags: ["refero", "ui", "inspiration", "reference"] },
  ],
  "development-tools": [
    { title: "VS Code", url: "https://code.visualstudio.com/", description: "Free, extensible code editor from Microsoft. Huge extension ecosystem.", tags: ["ide", "editor", "microsoft", "extensions"] },
    { title: "GitHub", url: "https://github.com/", description: "Code hosting, review, and collaboration. Git repos, Actions, Copilot.", tags: ["git", "hosting", "open-source", "ci"] },
    { title: "Vercel", url: "https://vercel.com/", description: "Deploy frontend and fullstack apps. Git integration, serverless, edge.", tags: ["deploy", "nextjs", "serverless", "frontend"] },
    { title: "Netlify", url: "https://www.netlify.com/", description: "Build and deploy static sites and serverless functions. Git-based workflow.", tags: ["deploy", "static", "jamstack", "serverless"] },
    { title: "Supabase", url: "https://supabase.com/", description: "Open-source Firebase alternative. Postgres, auth, storage, and realtime.", tags: ["database", "auth", "open-source", "backend"] },
    { title: "Vite", url: "https://vitejs.dev/", description: "Next-generation frontend tooling. Fast dev server and builds for Vue, React.", tags: ["build", "frontend", "dev-server", "vue"] },
    { title: "Tailwind CSS", url: "https://tailwindcss.com/", description: "Utility-first CSS framework. Design in the markup with responsive tokens.", tags: ["css", "utility", "frontend", "design"] },
    { title: "shadcn/ui", url: "https://ui.shadcn.com/", description: "Re-usable components you own. Copy-paste React components with Radix and Tailwind.", tags: ["react", "components", "ui", "tailwind"] },
    { title: "Linear", url: "https://linear.app/", description: "Issue tracking and product management for modern teams. Fast and minimal.", tags: ["project-management", "issues", "product", "speed"] },
    { title: "Postman", url: "https://www.postman.com/", description: "API platform for building and testing APIs. Collections and mock servers.", tags: ["api", "testing", "rest", "collab"] },
    { title: "npm", url: "https://www.npmjs.com/", description: "Package registry for JavaScript. Install and publish packages.", tags: ["javascript", "packages", "registry", "node"] },
    { title: "Can I use", url: "https://caniuse.com/", description: "Browser support tables for CSS, HTML, and JS. Check feature support.", tags: ["compatibility", "browsers", "css", "frontend"] },
    { title: "TypeScript", url: "https://www.typescriptlang.org/", description: "Typed superset of JavaScript. Better tooling and scale for large codebases.", tags: ["javascript", "types", "language", "microsoft"] },
    { title: "Next.js", url: "https://nextjs.org/", description: "React framework for production. SSR, static export, API routes, App Router.", tags: ["react", "framework", "ssr", "vercel"] },
    { title: "Sentry", url: "https://sentry.io/", description: "Error and performance monitoring for apps. Catch errors and track releases.", tags: ["monitoring", "errors", "performance", "devops"] },
    { title: "Resend", url: "https://resend.com/", description: "Email API for developers. Send transactional email with React Email.", tags: ["email", "api", "transactional", "react"] },
    { title: "Stripe", url: "https://stripe.com/", description: "Payments and financial infrastructure. Accept payments and subscriptions.", tags: ["payments", "api", "subscriptions", "fintech"] },
    { title: "Plausible", url: "https://plausible.io/", description: "Privacy-friendly analytics. Lightweight script; no cookies, GDPR compliant.", tags: ["analytics", "privacy", "gdpr", "lightweight"] },
    { title: "Cloudflare", url: "https://www.cloudflare.com/", description: "CDN, DNS, DDoS protection, and edge compute. Secure and speed up sites.", tags: ["cdn", "dns", "security", "edge"] },
    { title: "Lighthouse", url: "https://developer.chrome.com/docs/lighthouse", description: "Automated audits for performance, accessibility, SEO. Built into Chrome DevTools.", tags: ["performance", "accessibility", "seo", "audit"] },
    { title: "Storybook", url: "https://storybook.js.org/", description: "Build and document UI components in isolation. Test and showcase components.", tags: ["components", "documentation", "testing", "ui"] },
    { title: "CodeSandbox", url: "https://codesandbox.io/", description: "Online dev environment for web. Run React, Vue, Node in the browser.", tags: ["ide", "browser", "react", "sandbox"] },
    { title: "GitLab", url: "https://gitlab.com/", description: "DevOps platform: Git, CI/CD, and security. Host repos and run pipelines.", tags: ["git", "cicd", "devops", "hosting"] },
    { title: "Docker", url: "https://www.docker.com/", description: "Containers for building and shipping apps. Package code and run anywhere.", tags: ["containers", "devops", "deploy", "packaging"] },
    { title: "Prisma", url: "https://www.prisma.io/", description: "Next-generation ORM for Node and TypeScript. Type-safe queries and migrations.", tags: ["database", "orm", "typescript", "node"] },
    { title: "tRPC", url: "https://trpc.io/", description: "End-to-end typesafe APIs with TypeScript. No codegen; share types.", tags: ["api", "typescript", "typesafe", "rpc"] },
    { title: "Httpie", url: "https://httpie.io/", description: "Friendly HTTP client for API testing. CLI and desktop; simple syntax.", tags: ["api", "http", "cli", "testing"] },
    { title: "Insomnia", url: "https://insomnia.rest/", description: "API client for REST and GraphQL. Design, debug, and test APIs.", tags: ["api", "rest", "graphql", "testing"] },
    { title: "Jest", url: "https://jestjs.io/", description: "JavaScript testing framework. Unit tests, snapshots, and coverage.", tags: ["testing", "javascript", "react", "unit"] },
    { title: "Playwright", url: "https://playwright.dev/", description: "End-to-end testing for web apps. Cross-browser and reliable automation.", tags: ["testing", "e2e", "automation", "browser"] },
    { title: "ESLint", url: "https://eslint.org/", description: "Lint JavaScript and TypeScript. Find problems and enforce style.", tags: ["linting", "javascript", "typescript", "code-quality"] },
    { title: "Prettier", url: "https://prettier.io/", description: "Opinionated code formatter. JavaScript, CSS, HTML, Markdown.", tags: ["formatting", "javascript", "code-style", "formatter"] },
    { title: "Fly", url: "https://fly.io/", description: "Dev tools and hosting. Run apps close to users with global regions.", tags: ["dev-tools", "hosting", "edge"] },
    { title: "React Email", url: "https://react.email/", description: "Dev tools, creative email, and JavaScript workflow. Build emails with React.", tags: ["dev-tools", "creative", "email", "javascript"] },
    { title: "CookieFlow", url: "https://www.reform.digital/tools/cookieflow", description: "Dev tools, security, and extending for Webflow. Cookie consent component.", tags: ["dev-tools", "security", "webflow", "cookie"] },
    { title: "Puck", url: "https://puckeditor.com/", description: "AI dev tools, creative no-code. JavaScript website builder by Onlook.", tags: ["ai", "dev-tools", "creative", "javascript"] },
    { title: "Codrops Creative Hub", url: "https://tympanus.net/codrops/hub/", description: "Creative dev tools, custom code. JavaScript, CSS, interactions, animation, 3D, GSAP.", tags: ["creative", "dev-tools", "javascript", "css"] },
    { title: "Note API Connector", url: "https://noteapiconnector.com/", description: "No-code dev tools, API, database, workflow. Notion integration.", tags: ["no-code", "dev-tools", "api", "notion"] },
    { title: "Finsweet Extension Webflow App", url: "https://webflow.com/apps/detail/finsweet-extension", description: "No-code dev tools, extending, custom code, CSS for Webflow. Finsweet.", tags: ["no-code", "dev-tools", "webflow", "finsweet"] },
    { title: "Hubspot Webflow App", url: "https://webflow.com/apps/detail/hubspot", description: "No-code dev tools, forms, workflow for Webflow. HubSpot integration.", tags: ["no-code", "dev-tools", "forms", "webflow"] },
    { title: "Vercel Analytics", url: "https://vercel.com/analytics", description: "Analytics for Vercel deployments. Web vitals, traffic, and speed insights.", tags: ["analytics", "vercel", "performance", "web-vitals"] },
    { title: "Turbo", url: "https://turbo.build/", description: "Incremental bundler and build system. Monorepos and caching.", tags: ["build", "monorepo", "caching", "incremental"] },
    { title: "pnpm", url: "https://pnpm.io/", description: "Fast, disk space efficient package manager. Monorepos and strict mode.", tags: ["packages", "monorepo", "fast", "node"] },
    { title: "Yarn", url: "https://yarnpkg.com/", description: "Package manager for JavaScript. Fast, reliable, and secure.", tags: ["packages", "javascript", "node", "manager"] },
    { title: "Bun", url: "https://bun.sh/", description: "All-in-one JavaScript runtime. Fast bundler, transpiler, and package manager.", tags: ["runtime", "javascript", "bundler", "fast"] },
    { title: "Deno", url: "https://deno.com/", description: "Secure JavaScript and TypeScript runtime. Built-in tools and TypeScript.", tags: ["runtime", "javascript", "typescript", "secure"] },
    { title: "Vitest", url: "https://vitest.dev/", description: "Unit test framework. Vite-native, fast, and TypeScript.", tags: ["testing", "vite", "unit", "typescript"] },
    { title: "Cypress", url: "https://www.cypress.io/", description: "End-to-end testing for the web. Reliable and debuggable.", tags: ["testing", "e2e", "browser", "debugging"] },
    { title: "Testing Library", url: "https://testing-library.com/", description: "Simple and complete testing utilities. Encourage better practices.", tags: ["testing", "react", "dom", "accessibility"] },
    { title: "MSW", url: "https://mswjs.io/", description: "Mock Service Worker. API mocking for browser and Node.", tags: ["testing", "mocking", "api", "service-worker"] },
    { title: "TanStack Query", url: "https://tanstack.com/query/latest", description: "Powerful async state for React. Fetch, cache, and update server state.", tags: ["react", "data-fetching", "cache", "server-state"] },
    { title: "Zod", url: "https://zod.dev/", description: "TypeScript-first schema validation. Parse and validate with type inference.", tags: ["validation", "typescript", "schema", "parse"] },
    { title: "React Hook Form", url: "https://react-hook-form.com/", description: "Performant forms with easy validation. Minimal re-renders.", tags: ["forms", "react", "validation", "performance"] },
    { title: "TanStack Router", url: "https://tanstack.com/router/latest", description: "Type-safe routing for React. Full type safety and search params.", tags: ["routing", "react", "typescript", "type-safe"] },
    { title: "Remix", url: "https://remix.run/", description: "Full stack web framework. Nested routing, loaders, and mutations.", tags: ["framework", "react", "full-stack", "routing"] },
    { title: "Astro", url: "https://astro.build/", description: "Content-focused web framework. Islands, Markdown, and zero JS by default.", tags: ["framework", "content", "islands", "markdown"] },
    { title: "SvelteKit", url: "https://kit.svelte.dev/", description: "Full stack framework for Svelte. SSR, routing, and adapters.", tags: ["framework", "svelte", "ssr", "full-stack"] },
    { title: "Nuxt", url: "https://nuxt.com/", description: "Full stack framework for Vue. SSR, static, and server routes.", tags: ["framework", "vue", "ssr", "full-stack"] },
    { title: "SolidStart", url: "https://start.solidjs.com/", description: "Full stack framework for Solid. SSR, routing, and API routes.", tags: ["framework", "solid", "ssr", "full-stack"] },
    { title: "Qwik", url: "https://qwik.builder.io/", description: "Resumable framework for edge. No hydration, instant interactivity.", tags: ["framework", "resumable", "edge", "performance"] },
    { title: "Redwood", url: "https://redwoodjs.com/", description: "Full stack JavaScript framework. GraphQL, Prisma, and React.", tags: ["framework", "graphql", "prisma", "react"] },
    { title: "Blitz", url: "https://blitzjs.com/", description: "Full stack React framework. Zero-API data layer and auth.", tags: ["framework", "react", "full-stack", "auth"] },
    { title: "Wasp", url: "https://wasp-lang.dev/", description: "React-based full stack framework. Auth, database, and deployment.", tags: ["framework", "react", "full-stack", "auth"] },
    { title: "Payload CMS", url: "https://payloadcms.com/", description: "Headless CMS and application framework. TypeScript, React, and GraphQL.", tags: ["cms", "headless", "typescript", "react"] },
    { title: "Directus", url: "https://directus.io/", description: "Open-source data platform. Turn any SQL database into an API and app.", tags: ["cms", "open-source", "api", "database"] },
    { title: "Strapi", url: "https://strapi.io/", description: "Open-source headless CMS. REST and GraphQL API; self-host or cloud.", tags: ["cms", "headless", "open-source", "api"] },
    { title: "Contentful", url: "https://www.contentful.com/", description: "Headless CMS for digital teams. Content platform and API.", tags: ["cms", "headless", "api", "content"] },
    { title: "Hygraph", url: "https://hygraph.com/", description: "GraphQL-native headless CMS. Content federation and workflows.", tags: ["cms", "graphql", "headless", "content"] },
    { title: "Builder.io", url: "https://www.builder.io/", description: "Visual headless CMS and page builder. Drag-and-drop and code.", tags: ["cms", "visual", "headless", "builder"] },
    { title: "PlanetScale", url: "https://planetscale.com/", description: "MySQL-compatible serverless database. Branching and deploy requests.", tags: ["database", "mysql", "serverless", "branching"] },
    { title: "Neon", url: "https://neon.tech/", description: "Serverless Postgres. Branching, autoscaling, and serverless driver.", tags: ["database", "postgres", "serverless", "branching"] },
    { title: "Turso", url: "https://turso.tech/", description: "SQLite for the edge. LibSQL, replication, and embedded replicas.", tags: ["database", "sqlite", "edge", "libsql"] },
    { title: "Upstash", url: "https://upstash.com/", description: "Serverless Redis and Kafka. Pay per request; global edge.", tags: ["database", "redis", "kafka", "serverless"] },
    { title: "Vercel KV", url: "https://vercel.com/docs/storage/vercel-kv", description: "Serverless Redis by Vercel. Edge and serverless compatible.", tags: ["database", "redis", "vercel", "serverless"] },
    { title: "Vercel Postgres", url: "https://vercel.com/docs/storage/vercel-postgres", description: "Serverless Postgres by Vercel. Neon-powered, serverless driver.", tags: ["database", "postgres", "vercel", "serverless"] },
    { title: "Vercel Blob", url: "https://vercel.com/docs/storage/vercel-blob", description: "Serverless blob storage by Vercel. Upload and serve files.", tags: ["storage", "blob", "vercel", "serverless"] },
    { title: "Uploadthing", url: "https://uploadthing.com/", description: "File upload for Next.js and the web. Simple API and dashboard.", tags: ["storage", "upload", "nextjs", "files"] },
    { title: "Cloudinary", url: "https://cloudinary.com/", description: "Image and video management. Transform, optimize, and deliver media.", tags: ["media", "images", "video", "cdn"] },
    { title: "Imgix", url: "https://imgix.com/", description: "Real-time image processing and CDN. Resize, optimize, and deliver.", tags: ["images", "cdn", "processing", "optimization"] },
    { title: "LogRocket", url: "https://logrocket.com/", description: "Session replay and product analytics. See what users do and why errors happen.", tags: ["monitoring", "session-replay", "analytics", "errors"] },
    { title: "Datadog", url: "https://www.datadoghq.com/", description: "Monitoring and security platform. APM, logs, and infrastructure.", tags: ["monitoring", "apm", "logs", "infrastructure"] },
    { title: "Better Stack", url: "https://betterstack.com/", description: "Logging, uptime, and incident management. One platform for reliability.", tags: ["monitoring", "logging", "uptime", "incidents"] },
    { title: "Axiom", url: "https://axiom.co/", description: "Serverless log management. Ingest, query, and analyze at scale.", tags: ["logging", "serverless", "query", "analytics"] },
    { title: "Vercel Speed Insights", url: "https://vercel.com/docs/speed-insights", description: "Real user metrics for Vercel. Core Web Vitals and performance.", tags: ["performance", "vercel", "web-vitals", "metrics"] },
    { title: "Web Vitals", url: "https://web.dev/vitals/", description: "Essential metrics for a healthy site. LCP, FID, CLS, and more.", tags: ["performance", "metrics", "web-vitals", "google"] },
    { title: "Bundlephobia", url: "https://bundlephobia.com/", description: "Find the cost of adding an npm package. Bundle size and impact.", tags: ["bundling", "npm", "size", "analysis"] },
    { title: "Lighthouse CI", url: "https://github.com/GoogleChrome/lighthouse-ci", description: "Automate Lighthouse in CI. Performance, accessibility, and best practices.", tags: ["lighthouse", "ci", "performance", "automation"] },
    { title: "Cal.com", url: "https://cal.com/", description: "Open-source scheduling and meetings. Embeddable booking; self-host or cloud.", tags: ["scheduling", "open-source", "meetings", "booking"] },
    { title: "Trigger.dev", url: "https://trigger.dev/", description: "Background jobs for TypeScript. Open source and self-hostable.", tags: ["jobs", "typescript", "background", "open-source"] },
    { title: "Inngest", url: "https://www.inngest.com/", description: "Event-driven background functions. TypeScript and durable execution.", tags: ["events", "background", "typescript", "durable"] },
    { title: "QStash", url: "https://upstash.com/qstash", description: "Message queue and scheduling for serverless. HTTP-based and simple.", tags: ["queue", "scheduling", "serverless", "upstash"] },
    { title: "Temporal", url: "https://temporal.io/", description: "Durable execution for applications. Workflows that never lose state.", tags: ["workflows", "durable", "orchestration", "reliability"] },
    { title: "Puppeteer", url: "https://pptr.dev/", description: "Headless Chrome for automation. Scrape, test, and generate PDFs.", tags: ["automation", "browser", "scraping", "testing"] },
    { title: "Playwright", url: "https://playwright.dev/", description: "End-to-end testing for web apps. Cross-browser and reliable.", tags: ["testing", "e2e", "browser", "automation"] },
    { title: "K6", url: "https://k6.io/", description: "Load testing for developers. Script in JavaScript; run locally or in cloud.", tags: ["load-testing", "performance", "javascript", "grafana"] },
    { title: "Artillery", url: "https://www.artillery.io/", description: "Load testing and functional testing. YAML config and plugins.", tags: ["load-testing", "yaml", "performance", "testing"] },
    { title: "Turborepo", url: "https://turbo.build/repo", description: "Build system for JavaScript monorepos. Incremental builds and caching.", tags: ["monorepo", "build", "caching", "javascript"] },
    { title: "Nx", url: "https://nx.dev/", description: "Monorepo build system. Caching, affected commands, and plugins.", tags: ["monorepo", "build", "caching", "affected"] },
    { title: "Lerna", url: "https://lerna.js.org/", description: "Tool for managing JavaScript monorepos. Version and publish packages.", tags: ["monorepo", "packages", "versioning", "publish"] },
    { title: "Changesets", url: "https://github.com/changesets/changesets", description: "Manage versioning and changelogs in monorepos. Simple and explicit.", tags: ["monorepo", "versioning", "changelog", "packages"] },
    { title: "Knip", url: "https://knip.dev/", description: "Find unused files and dependencies. Keep the codebase clean.", tags: ["tooling", "unused", "dependencies", "cleanup"] },
    { title: "Depcheck", url: "https://github.com/depcheck/depcheck", description: "Check for unused dependencies. npm and yarn support.", tags: ["dependencies", "unused", "npm", "yarn"] },
    { title: "Syncpack", url: "https://github.com/JamieMason/syncpack", description: "Manage multiple package.json files. Consistent versions across monorepo.", tags: ["monorepo", "packages", "versions", "sync"] },
    { title: "GraphQL Code Generator", url: "https://the-guild.dev/graphql/codegen", description: "Generate types and code from GraphQL. TypeScript, React, and more.", tags: ["graphql", "codegen", "typescript", "types"] },
    { title: "tRPC", url: "https://trpc.io/", description: "End-to-end typesafe APIs. No codegen; share types between client and server.", tags: ["api", "typescript", "typesafe", "rpc"] },
    { title: "OpenAPI Generator", url: "https://openapi-generator.tech/", description: "Generate clients and servers from OpenAPI. Many languages and frameworks.", tags: ["openapi", "codegen", "api", "clients"] },
    { title: "Hono", url: "https://hono.dev/", description: "Ultrafast web framework for the edge. Works everywhere: Node, Deno, Bun, Cloudflare.", tags: ["framework", "edge", "fast", "web"] },
    { title: "Elysia", url: "https://elysiajs.com/", description: "Fast Bun web framework. TypeScript-first and end-to-end type safety.", tags: ["framework", "bun", "typescript", "fast"] },
    { title: "Fastify", url: "https://www.fastify.io/", description: "Fast and low overhead web framework for Node.js. Plugin architecture.", tags: ["framework", "node", "fast", "plugins"] },
    { title: "H3", url: "https://h3.unjs.io/", description: "Minimal HTTP server for JavaScript. UnJS ecosystem; works everywhere.", tags: ["http", "server", "unjs", "minimal"] },
    { title: "Wrangler", url: "https://developers.cloudflare.com/workers/wrangler/", description: "CLI for Cloudflare Workers. Develop and deploy edge functions.", tags: ["cloudflare", "workers", "edge", "cli"] },
    { title: "Serverless Framework", url: "https://www.serverless.com/", description: "Build and deploy serverless apps. AWS, Azure, and more.", tags: ["serverless", "deploy", "aws", "framework"] },
    { title: "SST", url: "https://sst.dev/", description: "Build full-stack apps on AWS. TypeScript, React, and serverless.", tags: ["serverless", "aws", "typescript", "full-stack"] },
    { title: "Pulumi", url: "https://www.pulumi.com/", description: "Infrastructure as code. Use real languages; deploy to any cloud.", tags: ["iac", "infrastructure", "cloud", "typescript"] },
    { title: "Terraform", url: "https://www.terraform.io/", description: "Infrastructure as code. Provision and manage cloud resources.", tags: ["iac", "infrastructure", "cloud", "hashicorp"] },
    { title: "Kubernetes", url: "https://kubernetes.io/", description: "Container orchestration. Deploy, scale, and manage containerized apps.", tags: ["containers", "orchestration", "devops", "cloud"] },
    { title: "Helm", url: "https://helm.sh/", description: "Package manager for Kubernetes. Charts and templating for K8s.", tags: ["kubernetes", "packages", "charts", "devops"] },
    { title: "GitHub Actions", url: "https://github.com/features/actions", description: "Automate workflows with GitHub. CI/CD, triggers, and marketplace actions.", tags: ["ci", "cd", "github", "automation"] },
    { title: "CircleCI", url: "https://circleci.com/", description: "CI/CD platform. Fast builds and orbs for common tools.", tags: ["ci", "cd", "automation", "builds"] },
    { title: "GitLab CI", url: "https://docs.gitlab.com/ee/ci/", description: "CI/CD built into GitLab. Pipelines, jobs, and Docker.", tags: ["ci", "cd", "gitlab", "pipelines"] },
    { title: "Buildkite", url: "https://buildkite.com/", description: "CI/CD that runs on your infra. Pipelines and plugins.", tags: ["ci", "cd", "pipelines", "self-hosted"] },
    { title: "Vercel Build", url: "https://vercel.com/docs/concepts/build-step", description: "Build and deploy on Vercel. Git integration and previews.", tags: ["vercel", "build", "deploy", "git"] },
    { title: "Netlify Build", url: "https://docs.netlify.com/configure-builds/", description: "Build and deploy on Netlify. Plugins and environment.", tags: ["netlify", "build", "deploy", "plugins"] },
  ],
  webflow: [
    { title: "Webflow", url: "https://webflow.com/", description: "Visual CMS and site builder. Design responsive sites, add CMS and ecommerce; host on Webflow.", tags: ["design", "cms", "websites", "no-code"] },
    { title: "Whalesync", url: "https://www.whalesync.com/", description: "CMS database extending automation. Notion, Webflow, Airtable, Bubble. No-Code Supply Co partner.", tags: ["cms", "database", "automation", "webflow"] },
    { title: "Jetboost", url: "https://www.jetboost.io/", description: "No-code CMS search and extending. Webflow list update. No-Code Supply Co partner.", tags: ["no-code", "cms", "search", "webflow"] },
    { title: "Audienceful", url: "https://www.audienceful.com/", description: "SAAS no-code email CMS marketing automation. Webflow. No-Code Supply Co partner.", tags: ["saas", "email", "cms", "webflow"] },
    { title: "Outseta", url: "https://www.outseta.com/", description: "No-code SAAS authentication memberships extending ecommerce. Webflow.", tags: ["no-code", "saas", "authentication", "webflow"] },
    { title: "Memberstack", url: "https://www.memberstack.io/", description: "No-code SAAS authentication memberships extending backend. Webflow.", tags: ["no-code", "saas", "authentication", "webflow"] },
    { title: "Slater", url: "https://slater.app/", description: "AI custom code extending workflow. Webflow. Edgar Allan.", tags: ["ai", "custom-code", "webflow", "workflow"] },
    { title: "CookieFlow", url: "https://www.reform.digital/tools/cookieflow", description: "Dev tools security extending. Webflow cookie consent component.", tags: ["dev-tools", "security", "webflow", "cookie"] },
    { title: "Finsweet Extension", url: "https://webflow.com/apps/detail/finsweet-extension", description: "No-code dev tools extending custom code CSS. Webflow. Finsweet.", tags: ["no-code", "dev-tools", "webflow", "finsweet"] },
    { title: "Hubspot Webflow App", url: "https://webflow.com/apps/detail/hubspot", description: "No-code dev tools forms workflow. Webflow HubSpot integration.", tags: ["no-code", "dev-tools", "forms", "webflow"] },
    { title: "Mast", url: "https://www.nocodesupply.co/mast", description: "CSS framework for Webflow. Design system, HARA, Rotor, Gantry.", tags: ["no-code", "css", "webflow", "design-system"] },
    { title: "divs Webflow component library", url: "https://divs.idreezus.com/", description: "No-code dev tools gallery. Webflow component library.", tags: ["no-code", "dev-tools", "webflow", "components"] },
    { title: "Hugeicons Webflow App", url: "https://webflow.com/apps/detail/hugeicons", description: "Creative design system assets components. Webflow.", tags: ["creative", "design-system", "webflow", "components"] },
    { title: "BlogSync", url: "https://blogsync.io/", description: "SAAS AI CMS workflow. Text, assets, automation for Webflow.", tags: ["saas", "ai", "cms", "webflow"] },
    { title: "CartGenie", url: "https://cartgenie.com/", description: "No-code dev tools ecommerce extending authentication. Webflow.", tags: ["no-code", "ecommerce", "webflow", "authentication"] },
    { title: "Relume", url: "https://www.relume.io/", description: "AI-powered site map and wireframe tool. Webflow integration.", tags: ["ai", "wireframes", "sitemap", "webflow"] },
    { title: "Webflow Designer API", url: "https://developers.webflow.com/designer/reference/", description: "Official Webflow Designer APIs for extensions, apps, and in-designer automation workflows.", tags: ["webflow", "api", "designer", "automation"] },
    { title: "Webflow Data API", url: "https://developers.webflow.com/data/reference/", description: "Official Data API reference for CMS items, collections, and Webflow site data operations.", tags: ["webflow", "api", "cms", "data"] },
    { title: "Webflow App UI Kit 2.0", url: "https://developers.webflow.com/code-sdks/ui-kit", description: "Build production-ready Webflow apps quickly with official UI kit components and patterns.", tags: ["webflow", "ui-kit", "apps", "components"] },
    { title: "Webflow App Monorepo", url: "https://github.com/Webflow-Examples/webflow-app-monorepo", description: "Official example monorepo showing modern architecture patterns for building Webflow apps.", tags: ["webflow", "github", "examples", "monorepo"] },
    { title: "Webflow Create App", url: "https://github.com/Webflow-Examples/webflow-create-app", description: "Starter CLI and scaffolding toolkit for bootstrapping custom Webflow app projects.", tags: ["webflow", "starter", "cli", "apps"] },
    { title: "Webflow VS Code Extension", url: "https://github.com/Webflow-Examples/webflow-vscode-extension", description: "Example VS Code extension project focused on integrating workflows with Webflow platform APIs.", tags: ["webflow", "vscode", "extension", "developer-tools"] },
    { title: "Webflow AI Translator App", url: "https://github.com/Webflow-Examples/webflow-ai-translator-app", description: "Sample Webflow app that automates multilingual translation workflows using AI services.", tags: ["webflow", "ai", "translation", "automation"] },
    { title: "Webflow Calendar App", url: "https://github.com/Webflow-Examples/webflow-calendar-app", description: "Reference Webflow app for event and calendar style integrations using official app tooling.", tags: ["webflow", "events", "integration", "apps"] },
    { title: "Webflow Sync to Airtable App", url: "https://github.com/Webflow-Examples/webflow-sync-to-airtable-app", description: "Example integration that syncs Webflow data with Airtable for no-code operations and reporting.", tags: ["webflow", "airtable", "sync", "integration"] },
    { title: "Webflow Radix Tailwind UI Library", url: "https://github.com/Webflow-Examples/webflow-radix-tailwind-ui-library", description: "Component library example combining Radix and Tailwind patterns for Webflow app interfaces.", tags: ["webflow", "radix", "tailwind", "components"] },
    { title: "webflow-app-hot-reload", url: "https://www.npmjs.com/package/@xatom/wf-app-hot-reload", description: "NPM utility to speed up Webflow app development with hot reload during local iteration.", tags: ["webflow", "npm", "developer-tools", "hot-reload"] },
    { title: "webflow-sdk-react", url: "https://www.npmjs.com/package/@xatom/webflow-sdk-react", description: "React helpers for building Webflow app experiences faster with reusable SDK abstractions.", tags: ["webflow", "react", "sdk", "npm"] },
    { title: "js-webflow-api", url: "https://www.npmjs.com/package/js-webflow-api", description: "JavaScript client for Webflow APIs to automate CMS workflows and data operations.", tags: ["webflow", "javascript", "api", "cms"] },
    { title: "webflow-cms-ts", url: "https://www.npmjs.com/package/webflow-cms-ts", description: "TypeScript package for Webflow CMS interactions with typed helpers and automation support.", tags: ["webflow", "typescript", "cms", "api"] },
    { title: "webflow-python", url: "https://pypi.org/project/webflow-python/", description: "Python SDK for Webflow API usage in scripts, ETL pipelines, and backend integrations.", tags: ["webflow", "python", "sdk", "api"] },
    { title: "webflow-laravel-sdk", url: "https://packagist.org/packages/storipress/webflow-laravel-sdk", description: "Laravel SDK package for integrating Webflow CMS and API workflows into PHP applications.", tags: ["webflow", "laravel", "php", "sdk"] },
    { title: "Awesome Webflow", url: "https://github.com/Webflow-Examples/awesome-webflow", description: "Curated list of Webflow resources, tooling, SDKs, templates, and community references.", tags: ["webflow", "awesome-list", "resources", "community"] },
  ],
  "learning-resources": [
    { title: "MDN Web Docs", url: "https://developer.mozilla.org/", description: "Authoritative docs for HTML, CSS, JavaScript, and web APIs. Mozilla and community.", tags: ["docs", "javascript", "html", "css"] },
    { title: "freeCodeCamp", url: "https://www.freecodecamp.org/", description: "Free self-paced coding curriculum. Certifications in responsive design, JS, data viz.", tags: ["learning", "free", "certification", "coding"] },
    { title: "Codecademy", url: "https://www.codecademy.com/", description: "Interactive coding courses. Learn Python, JavaScript, web dev, data science, and AI.", tags: ["learning", "courses", "interactive", "coding"] },
    { title: "Frontend Masters", url: "https://frontendmasters.com/", description: "Deep-dive courses for frontend and fullstack. React, Node, TypeScript from engineers.", tags: ["learning", "frontend", "courses", "react"] },
    { title: "Scrimba", url: "https://scrimba.com/", description: "Interactive coding tutorials with pause-and-edit. Frontend path with HTML, CSS, JavaScript, React.", tags: ["learning", "frontend", "interactive", "react"] },
    { title: "The Odin Project", url: "https://www.theodinproject.com/", description: "Free open curriculum for full-stack web development. From basics to Rails or Node.", tags: ["learning", "full-stack", "free", "open-source"] },
    { title: "JavaScript.info", url: "https://javascript.info/", description: "Modern JavaScript tutorial from basics to advanced. In-depth with exercises.", tags: ["javascript", "learning", "tutorial", "modern-js"] },
    { title: "React docs", url: "https://react.dev/", description: "Official React documentation. Learn components, hooks, and patterns.", tags: ["react", "docs", "learning", "official"] },
    { title: "Stack Overflow", url: "https://stackoverflow.com/", description: "Q&A for programmers. Search answers, ask questions; largest dev community.", tags: ["qna", "coding", "community", "help"] },
    { title: "CSS-Tricks", url: "https://css-tricks.com/", description: "Tips, guides, and snippets for CSS and frontend. Almanac and newsletters.", tags: ["css", "frontend", "guides", "almanac"] },
    { title: "Smashing Magazine", url: "https://www.smashingmagazine.com/", description: "Articles and books for web designers and developers. UX, accessibility, frontend.", tags: ["design", "frontend", "ux", "articles"] },
    { title: "W3Schools", url: "https://www.w3schools.com/", description: "Tutorials and references for web tech. HTML, CSS, JavaScript; examples and try-it.", tags: ["tutorials", "html", "css", "javascript"] },
    { title: "Khan Academy Computing", url: "https://www.khanacademy.org/computing", description: "Free courses in computing and programming. Intro to JS, HTML/CSS, algorithms.", tags: ["learning", "free", "programming", "courses"] },
    { title: "edX", url: "https://www.edx.org/", description: "Online courses from universities. CS, data science, web dev from MIT, Harvard, and more.", tags: ["courses", "university", "online", "learning"] },
    { title: "Coursera", url: "https://www.coursera.org/", description: "Online degrees and courses. Programming, data science, ML from top universities.", tags: ["courses", "degrees", "online", "learning"] },
  ],
  productivity: [
    { title: "Raycast", url: "https://www.raycast.com/", description: "Launcher and productivity for Mac. Extensions, AI, and quick actions from the keyboard.", tags: ["mac", "launcher", "productivity", "extensions"] },
    { title: "Notion", url: "https://www.notion.so/", description: "All-in-one workspace: docs, wikis, tasks, and databases. Collaborate and ship in one place.", tags: ["docs", "wiki", "tasks", "collab"] },
    { title: "Slack", url: "https://slack.com/", description: "Team messaging and channels. Integrate tools, search, and workflows for async and real-time work.", tags: ["chat", "teams", "integrations", "workflow"] },
    { title: "Obsidian", url: "https://obsidian.md/", description: "Note-taking and knowledge base with local Markdown files. Graph view, plugins, and linking.", tags: ["notes", "markdown", "knowledge", "local"] },
    { title: "Cal.com", url: "https://cal.com/", description: "Open-source scheduling and meetings. Embeddable booking; self-host or use Cal.com cloud.", tags: ["scheduling", "open-source", "meetings", "booking"] },
  ],
  "ui-ux-resources": [
    { title: "Refero", url: "https://refero.design/", description: "UI/UX inspiration library. Real products by page type, patterns, and elements; Figma plugin.", tags: ["ui", "inspiration", "reference", "figma"] },
    { title: "Mobbin", url: "https://mobbin.com/", description: "Browse mobile and web app designs. Filter by flow, industry, and element; copy patterns.", tags: ["ui", "mobile", "inspiration", "patterns"] },
    { title: "Laws of UX", url: "https://lawsofux.com/", description: "Principles of design in one place. Psychology and best practices for UX.", tags: ["ux", "psychology", "principles", "design"] },
    { title: "Nielsen Norman Group", url: "https://www.nngroup.com/", description: "UX research and training. Evidence-based guidelines and articles.", tags: ["ux", "research", "usability", "guidelines"] },
    { title: "Refactoring UI", url: "https://www.refactoringui.com/", description: "Book and tips for developers who design. Make interfaces look good.", tags: ["ui", "design", "developers", "book"] },
  ],
  shadcn: [
    { title: "shadcn/ui", url: "https://ui.shadcn.com/", description: "Re-usable components you own. Copy-paste React components built with Radix and Tailwind.", tags: ["react", "components", "ui", "tailwind"] },
    { title: "v0", url: "https://v0.dev/", description: "Vercel's AI UI generator. Describe interfaces in text; get React and Tailwind code. Shadcn-style.", tags: ["ui", "react", "vercel", "shadcn"] },
    { title: "Radix UI", url: "https://www.radix-ui.com/", description: "Unstyled, accessible components for React. Primitives that power shadcn/ui.", tags: ["react", "components", "accessibility", "primitives"] },
    { title: "Tailwind CSS", url: "https://tailwindcss.com/", description: "Utility-first CSS framework. Design in the markup; used by shadcn/ui.", tags: ["css", "utility", "frontend", "design"] },
    { title: "shadcn/ui Blocks", url: "https://ui.shadcn.com/blocks", description: "Pre-built sections and pages. Copy-paste blocks for landing and dashboards.", tags: ["shadcn", "blocks", "react", "tailwind"] },
    { title: "Awesome Shadcn UI", url: "https://awesome-shadcn-ui.com/", description: "Curated directory of shadcn/ui templates, blocks, starters, and ecosystem tooling.", tags: ["shadcn", "awesome-list", "templates", "blocks"] },
    { title: "Shadcn Registry", url: "https://ui.shadcn.com/docs/registry", description: "Official registry docs for packaging and sharing shadcn/ui components and patterns.", tags: ["shadcn", "registry", "components", "docs"] },
    { title: "Shadcn Theming", url: "https://ui.shadcn.com/docs/theming", description: "Official guidance for design tokens, color systems, and theming in shadcn/ui.", tags: ["shadcn", "theming", "design-tokens", "docs"] },
    { title: "Shadcn CLI", url: "https://ui.shadcn.com/docs/cli", description: "Install and manage shadcn/ui components with the official command line tooling.", tags: ["shadcn", "cli", "components", "developer-tools"] },
    { title: "Shadcn Components", url: "https://ui.shadcn.com/docs/components/accordion", description: "Official component docs entrypoint for reusable shadcn/ui building blocks.", tags: ["shadcn", "components", "accordion", "docs"] },
    { title: "21st.dev", url: "https://21st.dev/", description: "Community marketplace for modern React and shadcn-style UI blocks and interactions.", tags: ["shadcn", "react", "components", "marketplace"] },
    { title: "Shadcnblocks", url: "https://www.shadcnblocks.com/", description: "Prebuilt website sections and app UI blocks designed around shadcn and Tailwind.", tags: ["shadcn", "blocks", "tailwind", "ui"] },
    { title: "Shadcn.io", url: "https://www.shadcn.io/", description: "Catalog of shadcn/ui components, templates, and implementation resources for builders.", tags: ["shadcn", "components", "templates", "resources"] },
    { title: "Aceternity UI", url: "https://ui.aceternity.com/", description: "Animated React and Tailwind components often combined with shadcn-based product stacks.", tags: ["shadcn", "react", "tailwind", "animation"] },
    { title: "Magic UI", url: "https://magicui.design/", description: "Beautiful, composable UI elements for React and Tailwind that pair well with shadcn/ui.", tags: ["shadcn", "react", "tailwind", "ui-library"] },
    { title: "Origin UI", url: "https://originui.com/", description: "Production-ready UI patterns and sections built with Tailwind and shadcn conventions.", tags: ["shadcn", "tailwind", "patterns", "components"] },
    { title: "Kibo UI", url: "https://www.kibo-ui.com/", description: "Open-source React components and blocks with design patterns compatible with shadcn setups.", tags: ["shadcn", "react", "components", "open-source"] },
    { title: "Cruip Templates", url: "https://cruip.com/templates/", description: "Tailwind templates and product marketing UIs that are commonly adapted to shadcn stacks.", tags: ["shadcn", "templates", "tailwind", "saas"] },
    { title: "Tremor", url: "https://www.tremor.so/", description: "React components for dashboards and analytics, frequently used alongside shadcn/ui.", tags: ["shadcn", "react", "dashboard", "components"] },
    { title: "React Bits", url: "https://www.reactbits.dev/", description: "Collection of reusable React UI snippets and effects that integrate into shadcn projects.", tags: ["shadcn", "react", "snippets", "ui"] },
    { title: "Animate UI", url: "https://animate-ui.com/", description: "Motion-focused React UI components compatible with Tailwind and shadcn implementation styles.", tags: ["shadcn", "react", "motion", "components"] },
  ],
  coding: [
    { title: "GitHub", url: "https://github.com/", description: "Code hosting, review, and collaboration. Git repos, Actions, Copilot, and open source.", tags: ["git", "hosting", "open-source", "ci"] },
    { title: "VS Code", url: "https://code.visualstudio.com/", description: "Free extensible code editor from Microsoft. Huge extension ecosystem.", tags: ["ide", "editor", "microsoft", "extensions"] },
    { title: "Cursor", url: "https://www.cursor.com/", description: "AI-first code editor. Natural language to code, codebase chat, multi-file edits.", tags: ["ide", "coding", "ai", "cursor"] },
    { title: "GitHub Copilot", url: "https://github.com/features/copilot", description: "AI pair programmer in your editor. Real-time code suggestions and whole functions.", tags: ["coding", "ide", "github", "openai"] },
    { title: "Stack Overflow", url: "https://stackoverflow.com/", description: "Q&A for programmers. Search answers, ask questions, and vote.", tags: ["qna", "coding", "community", "help"] },
  ],
  github: [
    { title: "GitHub", url: "https://github.com/", description: "Code hosting, review, and collaboration. Git repos, Actions, Copilot.", tags: ["git", "hosting", "open-source", "ci"] },
    { title: "GitHub Actions", url: "https://github.com/features/actions", description: "Automate workflows with GitHub. CI/CD, triggers, and marketplace actions.", tags: ["ci", "cd", "github", "automation"] },
    { title: "GitHub Copilot", url: "https://github.com/features/copilot", description: "AI pair programmer. Real-time code suggestions in your editor.", tags: ["github", "copilot", "ai", "coding"] },
    { title: "GitHub Docs", url: "https://docs.github.com/", description: "Official GitHub documentation. Actions, API, and best practices.", tags: ["github", "docs", "api", "actions"] },
    { title: "GitHub Explore", url: "https://github.com/explore", description: "Discover repositories, topics, and collections. Find projects to contribute to.", tags: ["github", "explore", "repositories", "open-source"] },
  ],
  html: [
    { title: "MDN HTML", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", description: "HTML reference and guides. Elements, attributes, and best practices.", tags: ["html", "docs", "mdn", "reference"] },
    { title: "HTML Standard", url: "https://html.spec.whatwg.org/", description: "Living Standard for HTML. Authoritative specification.", tags: ["html", "spec", "standard", "whatwg"] },
    { title: "W3Schools HTML", url: "https://www.w3schools.com/html/", description: "HTML tutorials and references. Examples and try-it editor.", tags: ["html", "tutorials", "w3schools", "learning"] },
    { title: "Can I use", url: "https://caniuse.com/", description: "Browser support for HTML, CSS, and JS. Check feature support.", tags: ["html", "compatibility", "browsers", "caniuse"] },
    { title: "HTML Validator", url: "https://validator.w3.org/", description: "W3C Markup Validation Service. Check HTML for errors.", tags: ["html", "validation", "w3c", "validator"] },
  ],
  css: [
    { title: "MDN CSS", url: "https://developer.mozilla.org/en-US/docs/Web/CSS", description: "CSS reference and guides. Properties, selectors, and layout.", tags: ["css", "docs", "mdn", "reference"] },
    { title: "CSS-Tricks", url: "https://css-tricks.com/", description: "Tips, guides, and snippets for CSS and frontend. Almanac and community.", tags: ["css", "frontend", "guides", "almanac"] },
    { title: "Tailwind CSS", url: "https://tailwindcss.com/", description: "Utility-first CSS framework. Design in the markup with responsive tokens.", tags: ["css", "utility", "frontend", "design"] },
    { title: "Can I use", url: "https://caniuse.com/", description: "Browser support for CSS features. Check compatibility.", tags: ["css", "compatibility", "browsers", "caniuse"] },
    { title: "CSS Grid Generator", url: "https://cssgrid-generator.netlify.app/", description: "Visual CSS Grid generator. Draw and get code.", tags: ["css", "grid", "generator", "layout"] },
  ],
  javascript: [
    { title: "MDN JavaScript", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", description: "JavaScript reference and guides. Language and web APIs.", tags: ["javascript", "docs", "mdn", "reference"] },
    { title: "JavaScript.info", url: "https://javascript.info/", description: "Modern JavaScript tutorial. Basics to advanced with exercises.", tags: ["javascript", "learning", "tutorial", "modern-js"] },
    { title: "npm", url: "https://www.npmjs.com/", description: "Package registry for JavaScript. Install and publish packages.", tags: ["javascript", "packages", "registry", "node"] },
    { title: "TypeScript", url: "https://www.typescriptlang.org/", description: "Typed superset of JavaScript. Better tooling and scale.", tags: ["javascript", "types", "language", "microsoft"] },
    { title: "ESLint", url: "https://eslint.org/", description: "Lint JavaScript and TypeScript. Find problems and enforce style.", tags: ["javascript", "linting", "typescript", "code-quality"] },
  ],
  languages: [
    { title: "TypeScript", url: "https://www.typescriptlang.org/", description: "Typed superset of JavaScript. Better tooling and scale for large codebases.", tags: ["javascript", "types", "language", "microsoft"] },
    { title: "Python", url: "https://www.python.org/", description: "Programming language for web, data, and automation. Readable and versatile.", tags: ["python", "language", "programming", "versatile"] },
    { title: "Rust", url: "https://www.rust-lang.org/", description: "Systems programming language. Memory safety and performance.", tags: ["rust", "language", "systems", "performance"] },
    { title: "Go", url: "https://go.dev/", description: "Simple, fast, and reliable language. Concurrency and tooling.", tags: ["go", "language", "concurrency", "google"] },
    { title: "MDN Web Docs", url: "https://developer.mozilla.org/", description: "Docs for HTML, CSS, JavaScript, and web APIs. Multiple languages.", tags: ["docs", "javascript", "html", "css"] },
  ],
  miscellaneous: [
    { title: "No-Code Supply Co", url: "https://www.nocodesupply.co/", description: "Hand-picked digital inspiration and resources. Inspo, Code, Learn, Tools.", tags: ["no-code", "inspiration", "tools", "curated"] },
    { title: "Product Hunt", url: "https://www.producthunt.com/", description: "Discover new products. Tech, tools, and startups from the community.", tags: ["products", "tech", "startups", "discovery"] },
    { title: "Hacker News", url: "https://news.ycombinator.com/", description: "Tech and startup news. Community discussions and links.", tags: ["news", "tech", "startups", "community"] },
    { title: "Dev.to", url: "https://dev.to/", description: "Community of developers. Articles, discussions, and tutorials.", tags: ["community", "developers", "articles", "tutorials"] },
    { title: "Hashnode", url: "https://hashnode.com/", description: "Developer blog platform. Write and share with the dev community.", tags: ["blog", "developers", "writing", "community"] },
  ],
};

// Ensure 10–260 char descriptions
function ensureDesc(r) {
  let d = (r.description || "").trim();
  if (d.length < 10) d = (r.title + ": " + d).slice(0, 260);
  if (d.length > 260) d = d.slice(0, 257) + "...";
  return { ...r, description: d };
}

const RELATED_CATEGORY_FALLBACKS = {
  "design-tools": ["ui-ux-resources", "inspiration", "webflow", "shadcn"],
  "development-tools": ["coding", "github", "javascript", "css", "html", "ai-tools"],
  "ui-ux-resources": ["design-tools", "inspiration", "webflow", "shadcn"],
  inspiration: ["design-tools", "ui-ux-resources", "webflow"],
  "ai-tools": ["development-tools", "coding", "productivity"],
  productivity: ["development-tools", "ai-tools", "learning-resources"],
  "learning-resources": ["coding", "javascript", "html", "css", "languages", "development-tools"],
  webflow: ["design-tools", "inspiration", "development-tools"],
  shadcn: ["development-tools", "ui-ux-resources", "javascript", "css", "coding"],
  coding: ["development-tools", "github", "javascript", "ai-tools"],
  github: ["coding", "development-tools", "javascript"],
  html: ["css", "javascript", "development-tools", "learning-resources"],
  css: ["html", "javascript", "design-tools", "ui-ux-resources"],
  javascript: ["development-tools", "coding", "github", "learning-resources"],
  languages: ["learning-resources", "coding", "javascript", "development-tools"],
  miscellaneous: [
    "design-tools",
    "development-tools",
    "ui-ux-resources",
    "inspiration",
    "ai-tools",
    "productivity",
    "learning-resources",
  ],
};

function addUniqueByUrl(list, urlSet, entry, categoryOverride) {
  if (!entry || typeof entry !== "object") return false;
  const rawUrl = typeof entry.url === "string" ? entry.url : "";
  const cleaned = cleanUrl(rawUrl);
  if (!cleaned || urlSet.has(cleaned)) return false;
  urlSet.add(cleaned);
  list.push(
    ensureDesc({
      ...entry,
      category: categoryOverride ?? entry.category,
      url: cleaned,
    })
  );
  return true;
}

// Supplement seeds from existing batch file when available.
const existingPath = path.join(process.cwd(), "scripts", "batch-resources-data.json");
let existing = [];
if (fs.existsSync(existingPath)) {
  try {
    existing = JSON.parse(fs.readFileSync(existingPath, "utf8"));
    if (!Array.isArray(existing)) existing = [];
  } catch (_) {}
}

const seedByCategory = Object.fromEntries(CATEGORIES.map((c) => [c, []]));
const seedUrlSets = Object.fromEntries(CATEGORIES.map((c) => [c, new Set()]));

for (const cat of CATEGORIES) {
  const list = BY_CATEGORY[cat] || [];
  for (const r of list) {
    addUniqueByUrl(seedByCategory[cat], seedUrlSets[cat], { ...r, category: cat }, cat);
  }
}

for (const r of existing) {
  const cat = r?.category;
  if (!CATEGORIES.includes(cat)) continue;
  addUniqueByUrl(seedByCategory[cat], seedUrlSets[cat], r, cat);
}

// Global high-signal pool used only as final fallback to guarantee 100/category.
const globalPool = [];
const globalSeen = new Set();
for (const cat of CATEGORIES) {
  for (const r of seedByCategory[cat]) {
    const url = cleanUrl(r.url);
    if (globalSeen.has(url)) continue;
    globalSeen.add(url);
    globalPool.push(r);
  }
}

const byCat = {};
for (const cat of CATEGORIES) {
  const outList = [];
  const outUrlSet = new Set();
  const appendPool = (pool) => {
    for (const item of pool) {
      if (outList.length >= 100) break;
      addUniqueByUrl(outList, outUrlSet, item, cat);
    }
  };

  appendPool(seedByCategory[cat] || []);
  const related = RELATED_CATEGORY_FALLBACKS[cat] || [];
  for (const relatedCat of related) {
    if (outList.length >= 100) break;
    appendPool(seedByCategory[relatedCat] || []);
  }
  if (outList.length < 100) appendPool(globalPool);

  byCat[cat] = outList.slice(0, 100);
}

const out = [];
for (const cat of CATEGORIES) {
  const list = byCat[cat] || [];
  for (let i = 0; i < 100 && i < list.length; i++) out.push(list[i]);
}

const outPath = path.join(process.cwd(), "scripts", "batch-resources-data.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log("Wrote", outPath, "with", out.length, "resources.");
const counts = {};
for (const r of out) {
  counts[r.category] = (counts[r.category] || 0) + 1;
}
console.log("Per category:", counts);
