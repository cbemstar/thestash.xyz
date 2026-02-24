/**
 * Seed blog articles from the content plan.
 * Run: node scripts/seed-articles.mjs
 * Requires: .env.local with NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN
 */
import { createClient } from "@sanity/client";
import { randomUUID } from "crypto";

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

function key() {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

function block(text, style = "normal", listItem) {
  const b = {
    _type: "block",
    _key: key(),
    style,
    children: [{ _type: "span", _key: key(), text }],
  };
  if (listItem) b.listItem = listItem;
  return b;
}

function blocksFromMd(md) {
  const out = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("## ")) out.push(block(t.slice(3), "h2"));
    else if (t.startsWith("### ")) out.push(block(t.slice(4), "h3"));
    else if (t.startsWith("- ")) out.push(block(t.slice(2), "normal", "bullet"));
    else out.push(block(t, "normal"));
  }
  return out;
}

const ARTICLES = [
  {
    title: "Mastering CSS Animations: Tips and Best Practices",
    slug: "mastering-css-animations-tips-best-practices-2026",
    excerpt: "A practical guide to CSS animations for developers and designers—covering keyframes, transitions, performance, and how to pair CSS with GSAP and Lottie for modern web experiences.",
    tags: ["CSS", "animations", "GSAP", "web design", "front-end"],
    sources: [
      { label: "Webflow Interactions Feature", url: "https://webflow.com/feature/interactions-animations" },
      { label: "GSAP Documentation", url: "https://greensock.com/docs/" },
      { label: "MDN: CSS Animations", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations" },
    ],
    body: `CSS animations bring interface elements to life—from subtle hover states to page-load reveals and scrolling effects. When used well, they reinforce hierarchy, guide attention, and make interactions feel responsive. This guide covers practical tips and best practices so you can add polish without sacrificing performance.

## Start with transitions, then animate

Use CSS transitions for simple property changes (color, opacity, transform). They are easy to implement and performant. Reserve keyframe animations for multi-step sequences or when you need precise control over timing.

## Prefer transform and opacity

Animating transform and opacity triggers compositing rather than layout or paint, which keeps frames smooth. Avoid animating width, height, or margin when you can use scale, translate, or opacity instead.

## Use will-change sparingly

will-change hints to the browser to optimize for upcoming animations. Apply it only to elements that will actually animate, and remove it when the animation ends to avoid excessive memory use.

## Pair with GSAP and Lottie for complex motion

For scroll-triggered animations, staggered reveals, and design-led motion, tools like GSAP (with ScrollTrigger), Lottie, and Lenis smooth scroll extend what pure CSS can do. Libraries like FlowRadar and FlowFav offer cloneable examples you can learn from.

## Respect reduced motion

Use the prefers-reduced-motion media query to tone down or disable animations for users who prefer less motion. This improves accessibility and aligns with WCAG guidelines.`,
  },
  {
    title: "Best Practices for Building Accessible Web Interfaces",
    slug: "best-practices-accessible-web-interfaces-2026",
    excerpt: "Essential accessibility guidelines for developers and designers—semantic HTML, WCAG compliance, keyboard navigation, and tools like Axe and WAVE.",
    tags: ["accessibility", "WCAG", "web design", "inclusive design"],
    sources: [
      { label: "Webflow Accessibility Hub", url: "https://webflow.com/accessibility" },
      { label: "Webflow Accessibility Checklist", url: "https://webflow.com/accessibility/checklist" },
      { label: "W3C WCAG Guidelines", url: "https://www.w3.org/WAI/WCAG21/quickref/" },
    ],
    body: `Accessible web interfaces ensure everyone—including users with disabilities—can use your product. Building with accessibility in mind from the start is easier than retrofitting later. This guide covers the essentials.

## Semantic HTML structure

Use semantic elements (header, nav, main, article, section, footer) so assistive technologies can understand page structure. Avoid div soup when a more meaningful element exists.

## Alt text and color contrast

Provide meaningful alt text for all images. Aim for at least 4.5:1 contrast between text and background for normal text, and 3:1 for large text. Tools like WebAIM Contrast Checker help verify.

## Keyboard navigation

Ensure every interactive element is reachable and usable via keyboard alone. Avoid trapping focus in modals or menus without a clear escape path.

## Labeled form fields

Always associate labels with form inputs. Use the for/id pattern or wrap the input inside the label. Never rely on placeholder text as the only label.

## Audit tools

Use Axe DevTools, WAVE, and Lighthouse to catch common issues. Test with a screen reader like VoiceOver (Mac/iOS) or NVDA (Windows). The Webflow built-in Audit Panel is also useful for quick checks.`,
  },
  {
    title: "The Future of AI in Developers' Workflow",
    slug: "future-ai-developers-workflow-2026",
    excerpt: "How AI assistants, code generation, and intelligent tooling are reshaping how developers build software—and how to adapt.",
    tags: ["AI", "developer tools", "coding", "productivity"],
    sources: [
      { label: "GitHub Copilot", url: "https://github.com/features/copilot" },
      { label: "Cursor", url: "https://cursor.com" },
      { label: "Anthropic Claude", url: "https://www.anthropic.com" },
    ],
    body: `AI is moving from a novelty to a core part of the developer workflow. Code completion, natural-language commands, and intelligent assistants are changing how we write, review, and debug software.

## AI-assisted coding

Tools like GitHub Copilot and Cursor suggest code as you type, complete functions, and generate boilerplate. They speed up routine tasks while you focus on architecture and edge cases.

## From prompts to production

Natural-language prompts can generate entire features, tests, and docs. The key is iterative refinement: start with a clear request, then refine the output until it fits your codebase and style.

## AI for code review and debugging

AI can spot common bugs, suggest fixes, and explain unfamiliar code. Use it to augment—not replace—your own review process.

## Staying effective

Keep your fundamentals strong: understanding algorithms, architecture, and domain logic matters more than ever. Use AI to accelerate, not to hide gaps in knowledge. The best developers combine AI leverage with deep expertise.`,
  },
  {
    title: "Top Web Design Inspiration Sources for 2026",
    slug: "top-web-design-inspiration-sources-2026",
    excerpt: "Curated galleries and award-winning sites to inspire your next project—from Awwwards to Made in Webflow and beyond.",
    tags: ["web design", "inspiration", "portfolios", "UI/UX"],
    sources: [
      { label: "Awwwards Webflow Collection", url: "https://www.awwwards.com/websites/webflow/" },
      { label: "Made in Webflow", url: "https://webflow.com/made-in-webflow" },
      { label: "Refs.gallery", url: "https://refs.gallery/" },
    ],
    body: `Great design starts with great references. Whether you're building a portfolio, marketing site, or SaaS dashboard, these sources deliver high-quality inspiration without the noise of generic galleries.

## Award-winning galleries

Awwwards and Made in Webflow showcase curated, award-winning sites. Use them to study layout, typography, motion, and interaction patterns that stand out.

## Portfolio inspiration

Browse portfolios to see how designers and developers present their work. Look for clarity, hierarchy, and how case studies tell a story.

## Curated collections

Refs.gallery and similar curation sites prioritise quality over quantity. They're ideal when you want fewer, better examples rather than endless scrolling.

## Apply, don't copy

Use inspiration to understand what works—then adapt it to your own constraints and brand. The best designs solve real problems, not just look good.`,
  },
  {
    title: "How GitHub Enhances Collaboration for Modern Dev Teams",
    slug: "how-github-enhances-collaboration-modern-dev-teams",
    excerpt: "GitHub's collaboration features for code review, project management, and team workflows—and how to use them effectively.",
    tags: ["GitHub", "collaboration", "version control", "dev teams"],
    sources: [
      { label: "GitHub Docs", url: "https://docs.github.com" },
      { label: "GitHub Actions", url: "https://docs.github.com/en/actions" },
      { label: "GitHub Projects", url: "https://docs.github.com/en/issues/planning-and-tracking-with-projects" },
    ],
    body: `GitHub is more than version control—it's a hub for code review, project tracking, CI/CD, and team coordination. Here's how modern dev teams get the most out of it.

## Pull requests and code review

PRs are the backbone of collaborative development. Use clear descriptions, link related issues, and request reviews from the right people. Automate checks with status checks and branch protection rules.

## GitHub Projects and issue tracking

Projects (classic and new) let you organise issues, PRs, and milestones. Use boards, tables, or roadmaps to keep the team aligned without leaving GitHub.

## Actions for automation

GitHub Actions automates tests, builds, deployments, and notifications. Run tests on every PR, deploy on merge to main, and post release summaries to Slack.

## Discussions and wikis

Use Discussions for Q&A and ideas that don't fit into issues. Wikis work for docs that live with the repo. Both keep context close to the code.`,
  },
  {
    title: "Compare the Top 10 No-Code Platforms for Beginners",
    slug: "compare-top-10-nocode-platforms-beginners-2026",
    excerpt: "A practical comparison of no-code builders—Webflow, Framer, Bubble, and more—to help you pick the right one for your first project.",
    tags: ["no-code", "Webflow", "Framer", "low-code", "builders"],
    sources: [
      { label: "Webflow", url: "https://webflow.com" },
      { label: "Framer", url: "https://framer.com" },
      { label: "Bubble", url: "https://bubble.io" },
    ],
    body: `No-code platforms let you build websites and apps without writing code. For beginners, the choice depends on what you want to build and how much control you need. Here's a practical comparison.

## Webflow

Best for marketing sites, portfolios, and content sites. Visual design with clean exportable code. Strong CMS and interactions. Steeper learning curve but professional results.

## Framer

Great for high-fidelity prototypes and marketing pages. Strong animation and design tools. Good if you're coming from Figma or similar.

## Bubble

Best for apps with databases, user accounts, and workflows. More complex but flexible. Ideal when you need real app logic, not just a website.

## Others to consider

Softr, Glide, and Notion-based builders suit internal tools. Airtable and Supabase power backends. Pick based on your use case—don't chase the most popular platform if a simpler one fits.`,
  },
  {
    title: "Best AI Tools for Developers to Accelerate Coding",
    slug: "best-ai-tools-developers-accelerate-coding-2026",
    excerpt: "Top AI coding assistants, code generators, and dev tools to speed up your workflow—from Copilot to Cursor and beyond.",
    tags: ["AI", "Copilot", "Cursor", "coding", "productivity"],
    sources: [
      { label: "GitHub Copilot", url: "https://github.com/features/copilot" },
      { label: "Cursor", url: "https://cursor.com" },
      { label: "Replit", url: "https://replit.com" },
    ],
    body: `AI is reshaping how developers write and understand code. These tools help you ship faster without sacrificing quality.

## In-IDE assistants

GitHub Copilot and Cursor suggest code as you type. Cursor adds deep AI integration—chat, inline edits, and multi-file reasoning. Both reduce boilerplate and speed up exploration.

## Code generation and explanation

Ask AI to generate functions, tests, or docs from natural language. Use it to explain unfamiliar codebases or refactor legacy logic. Always review output; AI can hallucinate or miss edge cases.

## Pair with strong fundamentals

The best results come when you guide AI with clear prompts and domain knowledge. Use AI to accelerate, not to replace understanding.`,
  },
  {
    title: "Top Web Development Services and How to Pick the Right One",
    slug: "top-web-development-services-pick-right-one-2026",
    excerpt: "How to evaluate web dev agencies, freelancers, and in-house teams—and choose the right fit for your project.",
    tags: ["web development", "agencies", "freelancers", "hiring"],
    sources: [
      { label: "Clutch", url: "https://clutch.co" },
      { label: "Upwork", url: "https://www.upwork.com" },
    ],
    body: `Choosing a web development partner—agency, freelancer, or in-house team—depends on your project, budget, and timeline. Here's how to decide.

## Define scope first

Be clear about what you need: a marketing site, a web app, e-commerce, or something else. Scope drives who can deliver and at what cost.

## Agencies vs freelancers

Agencies offer breadth and process; they handle design, dev, and project management. Freelancers are often cheaper and more flexible for smaller or well-defined projects.

## Check portfolios and references

Look for work similar to yours. Ask for references and talk to past clients. Code quality, communication, and reliability matter more than flashy case studies.

## Red flags

Avoid partners who promise everything, refuse to sign contracts, or can't explain their process. The right fit is transparent, communicative, and aligned with your goals.`,
  },
  {
    title: "The Ultimate List of Coding Resources for 2026",
    slug: "ultimate-list-coding-resources-2026",
    excerpt: "Curated learning resources, documentation, and tools for developers—from fundamentals to advanced topics.",
    tags: ["coding", "learning", "resources", "documentation"],
    sources: [
      { label: "MDN Web Docs", url: "https://developer.mozilla.org" },
      { label: "freeCodeCamp", url: "https://www.freecodecamp.org" },
      { label: "The Stash", url: "https://thestash.xyz" },
    ],
    body: `The best coding resources help you learn faster and stay current. Here's a curated list for 2026.

## Documentation first

MDN, official language docs, and framework guides are your primary sources. Bookmark them and refer back. Good docs beat scattered tutorials.

## Learning platforms

freeCodeCamp, Frontend Masters, and OSSU offer structured curricula. Use them for fundamentals and deep dives. Supplement with YouTube and blog posts for specific topics.

## Curated directories

The Stash and similar directories surface vetted tools and resources. Use them to discover what's new without wading through search results.

## Stay practical

Learn by building. Pick a small project, use the resources above, and iterate. The best resource is the one you actually use.`,
  },
  {
    title: "Best Platforms to Launch Your SaaS Product in 2026",
    slug: "best-platforms-launch-saas-product-2026",
    excerpt: "Hosting, deployment, and growth platforms to launch and scale your SaaS—Vercel, Railway, and more.",
    tags: ["SaaS", "hosting", "Vercel", "deployment", "startups"],
    sources: [
      { label: "Vercel", url: "https://vercel.com" },
      { label: "Railway", url: "https://railway.app" },
      { label: "Fly.io", url: "https://fly.io" },
    ],
    body: `Launching a SaaS means choosing where to host, deploy, and grow. Here are the platforms that make it easier in 2026.

## Frontend and edge hosting

Vercel leads for Next.js and static sites. Automatic previews, edge functions, and strong DX. Netlify and Cloudflare Pages are solid alternatives.

## Full-stack and databases

Railway and Render offer simple full-stack deployment with databases. Supabase and Neon provide Postgres as a service. Pair them for a complete backend without managing servers.

## Growth and analytics

Use PostHog or Mixpanel for product analytics. Loops or Resend for email. Stripe for billing. Integrate early so you can measure and iterate.

## Start small, scale when needed

Begin with the simplest stack that works. Add complexity only when you hit real limits. Most early-stage SaaS can run on Vercel + Supabase or similar.`,
  },
  {
    title: "How to Integrate AI APIs into Your Web Projects",
    slug: "how-integrate-ai-apis-web-projects-2026",
    excerpt: "Practical guide to adding AI capabilities to your web app—OpenAI, Anthropic, and open models via API.",
    tags: ["AI", "APIs", "OpenAI", "integrations", "web development"],
    sources: [
      { label: "OpenAI API", url: "https://platform.openai.com/docs" },
      { label: "Anthropic API", url: "https://docs.anthropic.com" },
      { label: "Vercel AI SDK", url: "https://sdk.vercel.ai" },
    ],
    body: `Integrating AI APIs lets you add chat, completions, and embeddings to your web app. Here's how to do it safely and effectively.

## Choose your provider

OpenAI and Anthropic offer powerful models. Open-source options (via Replicate, Together, or self-hosted) give more control. Pick based on cost, latency, and feature needs.

## Use SDKs and abstraction

The Vercel AI SDK and similar tools abstract streaming, tool use, and provider differences. Start there instead of raw HTTP calls.

## Secure your keys

Never expose API keys in client-side code. Call AI APIs from serverless functions or your backend. Use environment variables and restrict key permissions.

## Handle errors and limits

APIs can rate-limit or fail. Implement retries, fallbacks, and clear error messages. Set token limits to control costs.`,
  },
  {
    title: "The Most Recommended Developer Frameworks for 2026",
    slug: "most-recommended-developer-frameworks-2026",
    excerpt: "Top frontend and full-stack frameworks—React, Next.js, Svelte, and more—and when to use each.",
    tags: ["frameworks", "React", "Next.js", "Svelte", "full-stack"],
    sources: [
      { label: "Next.js", url: "https://nextjs.org" },
      { label: "React", url: "https://react.dev" },
      { label: "SvelteKit", url: "https://kit.svelte.dev" },
    ],
    body: `Framework choice shapes your project for years. Here's a practical overview of the most recommended options in 2026.

## Next.js (React)

The default for many teams. Great for marketing sites, dashboards, and full-stack apps. App Router, server components, and Vercel integration make it a strong all-rounder.

## SvelteKit

Lighter and faster. Excellent DX and smaller bundles. Good for content-heavy sites and apps where you want less complexity.

## Remix and others

Remix offers a different model for data loading. Astro excels for content sites. Pick based on your team's experience and project needs.

## Match the tool to the job

No single framework wins everywhere. Use Next.js for broad compatibility, SvelteKit for lean apps, Astro for content. The best framework is the one your team can ship with.`,
  },
  {
    title: "Choosing Between Webflow and Traditional Web Builders",
    slug: "choosing-between-webflow-traditional-web-builders-2026",
    excerpt: "When to use Webflow vs WordPress, Squarespace, or custom code—and how to decide based on your needs.",
    tags: ["Webflow", "web builders", "WordPress", "CMS", "no-code"],
    sources: [
      { label: "Webflow", url: "https://webflow.com" },
      { label: "Webflow vs WordPress", url: "https://webflow.com/blog" },
    ],
    body: `Webflow and traditional builders (WordPress, Squarespace) serve different needs. Here's how to choose.

## Webflow strengths

Visual design with clean HTML/CSS export. Strong interactions and CMS. No plugin sprawl. Best when design control and performance matter, and you're comfortable with a learning curve.

## When WordPress makes sense

Huge ecosystem, many themes, and low cost. Good for blogs, small business sites, and when you need specific plugins. Requires more maintenance and security awareness.

## Squarespace and similar

Easiest for non-technical users. Good templates and support. Less flexibility. Ideal for simple portfolios and small business sites.

## Custom code

When builders can't deliver—custom logic, scale, or unique UX—use a framework like Next.js. Sometimes the right tool is code.`,
  },
  {
    title: "Best Subscription Services for Continuous Learning in Tech",
    slug: "best-subscription-services-continuous-learning-tech-2026",
    excerpt: "Curated learning subscriptions—Frontend Masters, O'Reilly, and more—to level up your skills continuously.",
    tags: ["learning", "subscriptions", "courses", "developer education"],
    sources: [
      { label: "Frontend Masters", url: "https://frontendmasters.com" },
      { label: "O'Reilly", url: "https://www.oreilly.com" },
      { label: "LinkedIn Learning", url: "https://www.linkedin.com/learning" },
    ],
    body: `Continuous learning keeps you relevant. Subscription services offer structured, up-to-date content without the hassle of hunting for quality material.

## Frontend Masters

Deep, practical frontend courses from industry experts. Great for React, TypeScript, performance, and design systems. Updated regularly.

## O'Reilly

Massive library of books, courses, and live training. Covers everything from coding to DevOps to data. Good for breadth and reference.

## Niche and community options

Egghead for concise video courses. Patreon creators for focused topics. Conference talks on YouTube. Pair subscriptions with hands-on practice.

## Make it habitual

Schedule learning time. Build something with what you learn. The best subscription is the one you actually use.`,
  },
  {
    title: "Top 15 Developer Tools to Boost Your Workflow in 2026",
    slug: "top-15-developer-tools-boost-workflow-2026",
    excerpt: "Essential dev tools—editors, CLI, Git, and productivity—to ship faster and stay organized.",
    tags: ["developer tools", "productivity", "CLI", "VS Code", "Git"],
    sources: [
      { label: "VS Code", url: "https://code.visualstudio.com" },
      { label: "Raycast", url: "https://raycast.com" },
      { label: "Linear", url: "https://linear.app" },
    ],
    body: `The right tools reduce friction and keep you in flow. Here are 15 that many developers rely on in 2026.

## Editors and IDEs

VS Code and Cursor lead for most workflows. JetBrains suites remain strong for Java, Python, and deeper IDE features.

## CLI and productivity

Raycast and Alfred speed up launching, searching, and running scripts. oh-my-zsh or Fish improve terminal UX. Use what fits your OS and habits.

## Git and collaboration

GitHub, GitLab, or Bitbucket for hosting. Linear or Jira for issues. The combination that works is the one your team actually uses.

## Don't over-tool

Pick a small set and master it. Adding tools without a clear purpose adds overhead. Optimise for flow, not novelty.`,
  },
  {
    title: "A Beginner's Guide to Modern Web Development Technologies",
    slug: "beginners-guide-modern-web-development-technologies-2026",
    excerpt: "HTML, CSS, JavaScript, and the modern stack—a clear path for newcomers to web development.",
    tags: ["web development", "beginners", "HTML", "CSS", "JavaScript"],
    sources: [
      { label: "MDN Learn Web Development", url: "https://developer.mozilla.org/en-US/docs/Learn" },
      { label: "freeCodeCamp", url: "https://www.freecodecamp.org" },
      { label: "The Odin Project", url: "https://www.theodinproject.com" },
    ],
    body: `Modern web development can feel overwhelming. This guide breaks down the essentials and a sensible learning path.

## Start with the basics

HTML structures content. CSS styles it. JavaScript adds behaviour. Learn these three before frameworks. MDN and freeCodeCamp offer free, excellent tutorials.

## Add responsiveness and tools

Learn CSS Grid, Flexbox, and responsive design. Get comfortable with the browser dev tools. Use Git from day one.

## Choose a framework when ready

After you can build a simple site from scratch, pick React, Vue, or Svelte. Next.js or similar for full-stack. Don't rush—solid fundamentals pay off.

## Build real projects

Tutorials teach syntax; projects teach problem-solving. Build a portfolio, a todo app, or a small tool. Ship it. Iterate.`,
  },
  {
    title: "How to Choose the Right UI Design Tools for Your Projects",
    slug: "how-choose-right-ui-design-tools-projects-2026",
    excerpt: "Figma, Sketch, Adobe XD, and alternatives—how to pick the right design tool for your team and workflow.",
    tags: ["UI design", "Figma", "design tools", "prototyping", "handoff"],
    sources: [
      { label: "Figma", url: "https://figma.com" },
      { label: "Sketch", url: "https://www.sketch.com" },
      { label: "Penpot", url: "https://penpot.app" },
    ],
    body: `UI design tools vary in focus—vector design, prototyping, handoff, or collaboration. Choose based on your team size, workflow, and platform.

## Figma

The default for many teams. Collaborative, browser-based, strong plugins. Excellent for design systems and prototyping. Free tier is generous.

## Sketch

Mac-only, mature, and performant. Popular with product designers. Good for focused desktop workflows and smaller teams.

## Open source and alternatives

Penpot offers a Figma alternative with no vendor lock-in. Canva and similar suit simpler marketing assets. Use the right tool for the job.

## Handoff and dev collaboration

Figma's Dev Mode and similar features streamline handoff. Invest in a shared design system and clear component naming so design and code stay aligned.`,
  },
  {
    title: "List of the Most Popular Programming Languages and Their Uses",
    slug: "most-popular-programming-languages-their-uses-2026",
    excerpt: "JavaScript, Python, TypeScript, and more—what each language excels at and when to use it.",
    tags: ["programming", "languages", "JavaScript", "Python", "TypeScript"],
    sources: [
      { label: "TIOBE Index", url: "https://www.tiobe.com/tiobe-index/" },
      { label: "Stack Overflow Survey", url: "https://survey.stackoverflow.co" },
      { label: "GitHub Octoverse", url: "https://octoverse.github.com" },
    ],
    body: `Language choice depends on your domain, team, and ecosystem. Here's a practical overview of the most popular options.

## JavaScript and TypeScript

JavaScript runs everywhere—browsers, servers, mobile. TypeScript adds types and scales better for large codebases. Essential for web development.

## Python

Dominant in data science, ML, scripting, and automation. Simple syntax, huge ecosystem. Great for backends and tooling.

## Go and Rust

Go for simplicity and concurrency—APIs, CLI tools, cloud services. Rust for performance and safety—systems, WASM, critical paths.

## Others

C# for .NET and game dev. Java for enterprise. Swift and Kotlin for mobile. Pick based on the problem you're solving and who you're building with.`,
  },
  {
    title: "Essential Resources for Learning Front-End Development",
    slug: "essential-resources-learning-frontend-development-2026",
    excerpt: "Curated courses, docs, and tools to master HTML, CSS, JavaScript, and modern frontend frameworks.",
    tags: ["frontend", "learning", "HTML", "CSS", "JavaScript", "React"],
    sources: [
      { label: "MDN", url: "https://developer.mozilla.org" },
      { label: "JavaScript.info", url: "https://javascript.info" },
      { label: "React Docs", url: "https://react.dev" },
    ],
    body: `Front-end development moves fast. These resources keep you current and building effectively.

## Documentation

MDN for web platform fundamentals. JavaScript.info for deep JS. Official framework docs (React, Vue, Svelte) for best practices. Bookmark and revisit.

## Structured learning

freeCodeCamp, Scrimba, and Frontend Masters offer curricula. Use them for foundations and to fill gaps. Supplement with project-based learning.

## Design and UX

Learn basic design principles—typography, layout, colour. Understand accessibility (WCAG). The best front-end devs bridge design and code.

## Build and ship

The best resource is practice. Build projects, contribute to open source, and ship. The Stash curates tools to support your front-end workflow.`,
  },
  {
    title: "Best MCP Tools and Servers for Developer Workflows in 2026",
    slug: "best-mcp-tools-and-servers-developer-workflows-2026",
    excerpt:
      "A practical guide to the Model Context Protocol ecosystem, with real use cases for MCP servers and tools in day-to-day engineering workflows.",
    primaryKeyword: "best mcp tools",
    intentStage: "consideration",
    tags: ["MCP", "developer tools", "AI", "workflow automation"],
    sources: [
      { label: "Model Context Protocol", url: "https://modelcontextprotocol.io/introduction" },
      { label: "MCP GitHub Organization", url: "https://github.com/modelcontextprotocol" },
      { label: "Anthropic", url: "https://www.anthropic.com" },
    ],
    body: `Model Context Protocol (MCP) is becoming a common layer for connecting AI assistants to real tools. Instead of hard-coded integrations, MCP servers expose capabilities such as file access, search, ticketing, and project data in a consistent way.

## What MCP changes in practice

Without MCP, teams often rebuild the same integration logic for every model or assistant. With MCP, you define capabilities once and reuse them across workflows. That lowers integration cost and makes tool access more predictable.

## High-value MCP server categories

- Knowledge servers for docs, wikis, and internal runbooks
- Dev servers for repositories, CI status, and issue trackers
- Ops servers for logs, alerts, and deployment context
- Business servers for CRM, analytics, and reporting pipelines

## How to evaluate an MCP server

Start with reliability and permission model, then check observability and maintenance. A server that is feature-rich but unstable will hurt trust quickly. Prefer servers with clear auth boundaries and active updates.

## Rollout plan for teams

Begin with one narrow workflow, such as “debug failed deploys” or “summarize open PR risk.” Validate speed and output quality, then add more servers only when the first workflow is stable and repeatable.`,
  },
  {
    title: "LLM Observability Stack: Langfuse vs Literal AI vs Helicone",
    slug: "llm-observability-stack-langfuse-literalai-helicone-2026",
    excerpt:
      "Compare three popular LLM observability platforms and build a monitoring stack that improves quality, latency, and cost control.",
    primaryKeyword: "llm observability stack",
    intentStage: "decision",
    tags: ["LLM observability", "Langfuse", "Literal AI", "Helicone", "AI ops"],
    sources: [
      { label: "Langfuse", url: "https://langfuse.com" },
      { label: "Literal AI", url: "https://www.literalai.com" },
      { label: "Helicone", url: "https://www.helicone.ai" },
    ],
    body: `As LLM features move into production, observability becomes mandatory. You need traces, prompt history, cost reporting, and evaluation signals to avoid blind spots.

## Why observability fails in early teams

Many teams only log model responses. That misses latency outliers, token spikes, and prompt drift. A useful stack captures request context, tool calls, and user outcomes in one place.

## Langfuse, Literal AI, and Helicone at a glance

Langfuse is strong for tracing and evaluation workflows. Literal AI focuses on practical product debugging and feedback loops. Helicone is often chosen for gateway-style analytics and request instrumentation.

## Decision criteria that matter

- Time to instrument core flows
- Quality of traces and debugging UX
- Eval workflow maturity
- Cost and retention controls
- Team fit for managed vs self-hosted setups

## Recommended implementation order

Instrument one customer-facing flow first. Add cost + latency dashboards second. Introduce prompt and answer quality evals third. This sequence gives fast feedback while keeping setup overhead under control.`,
  },
  {
    title: "Self-Hosted AI Stack for Teams: Open WebUI, Ollama, and Local Models",
    slug: "self-hosted-ai-stack-open-webui-ollama-2026",
    excerpt:
      "How to set up a practical self-hosted AI stack for privacy-sensitive teams using Open WebUI, Ollama, and local open models.",
    primaryKeyword: "self hosted ai stack",
    intentStage: "implementation",
    tags: ["self-hosted AI", "Open WebUI", "Ollama", "local models", "privacy"],
    sources: [
      { label: "Open WebUI", url: "https://openwebui.com" },
      { label: "Ollama", url: "https://ollama.com" },
      { label: "llama.cpp", url: "https://github.com/ggerganov/llama.cpp" },
    ],
    body: `Self-hosted AI is moving from niche to practical for teams that care about privacy, latency control, or offline reliability. A minimal stack can deliver strong results without heavy platform complexity.

## Baseline architecture

Use Ollama or llama.cpp for model runtime, Open WebUI for team-facing interaction, and a simple logging layer for usage tracking. Keep the first version small and measurable.

## Where self-hosting wins

Teams with sensitive internal documents, regulated workflows, or predictable prompt patterns often benefit first. You reduce data exposure risk and gain direct control over model behavior and uptime.

## Common pitfalls

Model sprawl, weak prompt governance, and missing eval loops quickly reduce quality. Standardize on a small model set per use case and track output quality weekly.

## Production checklist

- Access control and audit logs
- Resource limits and queueing
- Backup model fallback strategy
- Prompt/version change tracking
- Basic red-team safety tests

## Final recommendation

Start with one high-value internal workflow such as support drafting or docs Q&A. Expand only after you can prove response quality and response-time consistency.`,
  },
  {
    title: "How to Build a Webflow App: APIs, Auth, and Deployment",
    slug: "how-build-webflow-app-apis-auth-deployment-2026",
    excerpt:
      "A practical implementation guide for building and shipping a Webflow app with robust auth, API usage, and deployment workflow.",
    primaryKeyword: "how to build a webflow app",
    intentStage: "implementation",
    tags: ["Webflow", "Webflow apps", "APIs", "OAuth", "developer guide"],
    sources: [
      { label: "Webflow Developer Docs", url: "https://developers.webflow.com" },
      { label: "Webflow Data API", url: "https://developers.webflow.com/data/reference" },
      { label: "Webflow Designer API", url: "https://developers.webflow.com/designer/reference" },
    ],
    body: `Webflow app development is now mature enough for production-grade integrations. The biggest wins come from clear scope, stable auth flows, and reliable environment handling from day one.

## Start with a narrow app contract

Define one core job your app should do inside Webflow, such as content sync, SEO audits, or CMS enrichment. Avoid broad feature sets in v1.

## Auth and permission model

Map scopes to real user actions before implementation. Over-scoping creates security and trust problems. Keep secrets server-side and rotate credentials on a fixed schedule.

## API design and safety

Handle API limits with retries and backoff. Normalize error responses so support and debugging stay fast. Add lightweight telemetry to detect failure patterns early.

## Deployment workflow

Use preview deployments for each change and gate releases with integration smoke tests. Keep environment config explicit so staging and production behavior stays predictable.

## Post-launch operations

Monitor failures, track adoption, and review permission usage. The most successful Webflow apps evolve through small, validated releases rather than large rewrites.`,
  },
  {
    title: "AI Code Review Workflow with GitHub, Cursor, and Claude",
    slug: "ai-code-review-workflow-github-cursor-claude-2026",
    excerpt:
      "Build an AI-assisted code review process that improves speed without lowering quality, using GitHub PR checks and structured review prompts.",
    primaryKeyword: "ai code review workflow",
    intentStage: "decision",
    tags: ["code review", "GitHub", "Cursor", "Claude", "engineering workflow"],
    sources: [
      { label: "GitHub Pull Request Docs", url: "https://docs.github.com/pull-requests" },
      { label: "Cursor", url: "https://cursor.com" },
      { label: "Anthropic Claude Docs", url: "https://docs.anthropic.com" },
    ],
    body: `AI can speed up review cycles, but only if the workflow is structured. Unstructured AI review often increases noise and hides important risks.

## Use AI before human review

Run an AI pass to flag potential edge cases, test gaps, and security smells before requesting teammate review. This removes obvious issues early and improves reviewer focus.

## Keep a fixed review prompt format

Define a short prompt template for every PR: behavior change summary, risk areas, missing tests, and rollback considerations. Consistent prompts produce better signal.

## Pair with branch protections

AI comments should not replace checks. Keep CI tests, lint rules, and required approvals in place. AI is an accelerator layer, not a governance replacement.

## Metrics to track weekly

- Time from PR open to merge
- Re-opened PR rate
- Post-merge rollback count
- Test coverage change on modified modules

## Practical outcome

Teams that combine AI pre-review plus disciplined human approval usually reduce review time while maintaining quality standards on production-critical changes.`,
  },
];

async function main() {
  const existing = await client.fetch('*[_type == "article"]{ slug }');
  const existingSlugs = new Set(
    existing
      .map((a) =>
        typeof a.slug === "string"
          ? a.slug
          : a?.slug && typeof a.slug.current === "string"
            ? a.slug.current
            : ""
      )
      .filter(Boolean)
  );

  for (const art of ARTICLES) {
    if (existingSlugs.has(art.slug)) {
      console.log(`Skip (exists): ${art.slug}`);
      continue;
    }
    const nowIso = new Date().toISOString();
    const doc = {
      _type: "article",
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt,
      primaryKeyword: art.primaryKeyword ?? art.title.toLowerCase(),
      intentStage: art.intentStage ?? "consideration",
      contentTier: art.contentTier ?? "tier3",
      lastReviewedAt: art.lastReviewedAt ?? nowIso,
      tags: art.tags,
      sources: art.sources,
      body: blocksFromMd(art.body),
      author: art.author ?? "The Stash Editorial Team",
      publishedAt: art.publishedAt ?? nowIso,
    };
    const created = await client.create(doc);
    console.log(`Created: ${art.slug} (${created._id})`);
    existingSlugs.add(art.slug);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
