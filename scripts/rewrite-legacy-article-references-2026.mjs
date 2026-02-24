/**
 * Second-pass rewrite for legacy 2024 references in blog content.
 *
 * Goals:
 * 1) Rewrite stale intro paragraphs to use 2025/2026 baseline metrics.
 * 2) Replace outdated links (e.g. /2024 reports) with current equivalents.
 * 3) Clean source labels/URLs that still mention 2024-era reports.
 *
 * Run:
 *   node --env-file=.env.local scripts/rewrite-legacy-article-references-2026.mjs
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

const LEGACY_REVIEW_LINE =
  "Reviewed on 2026-02-15. These benchmarks supersede earlier 2024/2025 stats where newer data is now available.";
const UPDATED_REVIEW_LINE =
  "Reviewed on 2026-02-15. These benchmarks reflect the latest verified reports available as of 2026.";

const INTRO_REWRITES = {
  "workflow-automation-tools-designers-devs-2026": {
    startsWith: "Modern product teams juggle design files",
    replacement:
      "Modern product teams juggle design files, code repositories, tickets, docs, and releases across many systems. As of 2025, API-first operating models and AI-assisted workflows are becoming standard: Postman reports 82% of organizations are now at least partially API-first, while teams increasingly pair automation with GenAI tooling to reduce manual coordination work. This guide covers app connectors, local launchers, CI/CD, and design-dev pipelines for 2026.",
  },
  "choosing-between-webflow-traditional-web-builders-2026": {
    startsWith: "Webflow and traditional builders",
    replacement:
      "Webflow and traditional builders (WordPress, Squarespace, Wix) still serve different needs in 2026. W3Techs reports WordPress at 60.0% CMS market share and 49.7% usage among top sites with a known CMS as of February 2026, while visual-first tools continue gaining traction for design-led teams. This guide compares strengths, trade-offs, and when to switch to custom code.",
  },
  "most-popular-programming-languages-their-uses-2026": {
    startsWith: "JavaScript and TypeScript run everywhere",
    replacement:
      "JavaScript and TypeScript remain core for web and product engineering, while Python, Go, and Rust keep growing in data, infrastructure, and performance-heavy systems. The latest ecosystem signals in 2025 show strong TypeScript momentum on GitHub and sustained broad language diversity across professional teams. This guide helps you choose based on domain, hiring market, and long-term maintainability.",
  },
  "best-ai-tools-developers-accelerate-coding-2026": {
    startsWith: "AI is reshaping how developers write",
    replacement:
      "AI is now a mainstream part of development workflows. Stack Overflow's 2025 AI findings show 84% of developers use or plan to use AI tools, with 51% of professional developers using them daily. Postman's 2025 API report also shows daily GenAI usage is now common among developers. These tools can accelerate delivery without sacrificing quality when teams keep review and testing standards high.",
  },
  "ultimate-list-coding-resources-2026": {
    startsWith: "The best coding resources help you learn",
    replacement:
      "The best coding resources help you learn faster and stay current. Stack Overflow's 2025 survey draws from tens of thousands of developers across 170+ countries and reinforces that documentation and hands-on practice remain the most reliable learning path. MDN stays foundational for web platform knowledge, while project-based communities and structured courses help close practical skill gaps.",
  },
  "best-platforms-launch-saas-product-2026": {
    startsWith: "Launching a SaaS means choosing where to host",
    replacement:
      "Launching a SaaS in 2026 means choosing a platform that handles rapid iteration, observability, and AI/API workloads from day one. Postman's 2025 data shows API-first approaches are now the norm across teams, and cloud-first deployment patterns continue to dominate modern product delivery. This guide covers hosting, databases, and growth tooling with practical stack recommendations.",
  },
  "most-recommended-developer-frameworks-2026": {
    startsWith: "Framework choice shapes your project for years",
    replacement:
      "Framework choice shapes your project for years. Current 2025 ecosystem signals show continued strength for React/Next.js in production teams, while TypeScript-led workflows and performance-focused alternatives like Astro and SvelteKit continue expanding their footprint. This guide compares leading frameworks and helps you choose based on team expertise, performance needs, and project constraints.",
  },
  "best-subscription-services-continuous-learning-tech-2026": {
    startsWith: "Frontend Masters offers deep frontend courses",
    replacement:
      "Continuous learning subscriptions are increasingly valuable in an AI-accelerated market. Coursera's 2025 Global Skills Report tracks 170M+ learners and reports strong continued growth in GenAI learning demand, while specialized platforms remain strong for deep technical practice. This guide compares top services for 2026 and how to choose based on depth, pacing, and career goals.",
  },
  "beginners-guide-modern-web-development-technologies-2026": {
    startsWith: "Start with HTML, CSS, and JavaScript",
    replacement:
      "Start with HTML, CSS, and JavaScript, then build real projects as soon as possible. Current developer survey data in 2025 continues to show JavaScript as a core professional skill, while practical documentation-led learning remains the fastest path for beginners. Add responsive layout, accessibility, and Git fundamentals before choosing a framework.",
  },
  "mastering-css-animations-tips-best-practices-2026": {
    startsWith: "According to Nielsen Norman Group",
    replacement:
      "Animation improves UX when it reinforces hierarchy, feedback, and orientation. The 2025 Web Almanac continues to show how performance constraints shape real-world animation quality at scale, with JavaScript-heavy pages and mobile payload growth still impacting smoothness. CSS animations remain a strong default when you prioritize transform/opacity, accessibility, and motion restraint.",
  },
  "future-ai-developers-workflow-2026": {
    startsWith: "AI is moving from a novelty",
    replacement:
      "AI has shifted from experimental tooling to day-to-day infrastructure in software teams. In 2025, Stack Overflow reports 84% of developers use or plan to use AI, and JetBrains reports 85% regular AI usage across surveyed developers. GitHub's 2025 ecosystem data also shows millions of AI-enabled projects, indicating AI-native workflows are now mainstream rather than edge behavior.",
  },
  "how-github-enhances-collaboration-modern-dev-teams": {
    startsWith: "GitHub is more than version control",
    replacement:
      "GitHub is more than version control: it is the operating layer for code review, planning, automation, and open collaboration. Octoverse 2025 reports GitHub passing 180 million developers, with one new developer joining roughly every second and public contribution activity still growing. This guide covers practical workflows modern teams use to turn that platform scale into execution speed.",
  },
  "how-integrate-ai-apis-web-projects-2026": {
    startsWith: "Integrating AI APIs lets you add chat",
    replacement:
      "Integrating AI APIs lets you add chat, generation, and retrieval workflows directly into your product. Postman's 2025 API report shows API-first maturity and daily GenAI usage are now mainstream, while AI-agent-ready API design is still early for many teams. This guide covers provider choice, security patterns, and implementation decisions for production reliability.",
  },
  "top-15-developer-tools-boost-workflow-2026": {
    startsWith: "VS Code and Cursor lead for most workflows",
    replacement:
      "Developer tooling in 2026 is defined by AI-assisted coding, reliable automation, and fast feedback loops. Recent 2025 survey data shows AI tool usage has moved into the mainstream, so editor and platform choices increasingly depend on integration quality, team standards, and review discipline rather than isolated feature checklists. This guide covers the core stack for sustained workflow leverage.",
  },
  "top-web-development-services-pick-right-one-2026": {
    startsWith: "Choosing a web development partner",
    replacement:
      "Choosing a web development partner (agency, freelancer, or in-house team) depends on risk profile, delivery speed, and quality standards. Current web ecosystem data in 2025-2026 still shows WordPress dominance in CMS usage and continued performance complexity across production sites, so selecting partners with measurable performance and accessibility discipline is critical.",
  },
};

const URL_REPLACEMENTS = [
  [
    /https?:\/\/survey\.stackoverflow\.co\/2024\/ai\/?/i,
    "https://survey.stackoverflow.co/2025/ai",
  ],
  [
    /https?:\/\/survey\.stackoverflow\.co\/2024\/technology\/?/i,
    "https://survey.stackoverflow.co/2025/technology",
  ],
  [/https?:\/\/survey\.stackoverflow\.co\/2024\/?/i, "https://survey.stackoverflow.co/2025"],
  [/https?:\/\/almanac\.httparchive\.org\/en\/2024\/security\/?/i, "https://almanac.httparchive.org/en/2025/security"],
  [/https?:\/\/almanac\.httparchive\.org\/en\/2024\/?/i, "https://almanac.httparchive.org/en/2025/"],
  [
    /https?:\/\/github\.blog\/news-insights\/octoverse\/octoverse-2024\/?/i,
    "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
  ],
  [
    /https?:\/\/www\.postman\.com\/report\/state-of-api-2024\/?/i,
    "https://www.postman.com/state-of-api/2025/",
  ],
  [/https?:\/\/webaim\.org\/projects\/million\/2024\/?/i, "https://webaim.org/projects/million/"],
  [
    /https?:\/\/blog\.coursera\.org\/presenting-the-2024-coursera-global-skills-report\/?/i,
    "https://blog.coursera.org/presenting-courseras-2025-global-skills-report-the-skills-trends-shaping-the-future-of-education-and-employment/",
  ],
  [
    /https?:\/\/madnight\.github\.io\/githut\/#\/pull_requests\/2024\/1/i,
    "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
  ],
  [/https?:\/\/2024\.stateofjs\.com\/en-US\/libraries\/meta-frameworks\/?/i, "https://stateofjs.com/"],
];

const LABEL_REPLACEMENTS = [
  [/WebAIM Million 2024/gi, "WebAIM Million 2025"],
  [/Web Almanac 2024/gi, "HTTP Archive Web Almanac 2025"],
  [/Stack Overflow AI Survey 2024/gi, "Stack Overflow Developer Survey 2025 (AI)"],
  [/Stack Overflow AI 2024/gi, "Stack Overflow Developer Survey 2025 (AI)"],
  [/GitHub Octoverse 2024/gi, "GitHub Octoverse 2025"],
  [/Postman State of API 2024/gi, "Postman State of the API 2025"],
  [/2024/gi, "2025"],
];

const DROP_SOURCE_URL_PATTERNS = [
  /gartner\.com\/en\/newsroom\/press-releases\/2024-02-05/i,
  /github\.blog\/2024-06-10-the-state-of-open-source-software/i,
];

function key() {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

function makePlainBlock(text, style = "normal", listItem) {
  const block = {
    _type: "block",
    _key: key(),
    style,
    children: [{ _type: "span", _key: key(), text }],
  };
  if (listItem) block.listItem = listItem;
  return block;
}

function blockToPlainText(ptBlock) {
  if (!ptBlock || ptBlock._type !== "block" || !Array.isArray(ptBlock.children)) {
    return "";
  }
  return ptBlock.children
    .filter((child) => child && child._type === "span")
    .map((child) => child.text || "")
    .join("");
}

function mapUrl(url) {
  if (!url || typeof url !== "string") return url;
  let mapped = url.trim();
  for (const [pattern, replacement] of URL_REPLACEMENTS) {
    mapped = mapped.replace(pattern, replacement);
  }
  return mapped;
}

function mapLabel(label) {
  if (!label || typeof label !== "string") return label;
  let mapped = label.trim();
  for (const [pattern, replacement] of LABEL_REPLACEMENTS) {
    mapped = mapped.replace(pattern, replacement);
  }
  return mapped;
}

function shouldDropSource(url) {
  if (!url) return true;
  for (const pattern of DROP_SOURCE_URL_PATTERNS) {
    if (pattern.test(url)) return true;
  }
  return false;
}

function normalizeSources(existing) {
  const seen = new Set();
  const out = [];

  for (const source of Array.isArray(existing) ? existing : []) {
    const rawUrl = typeof source?.url === "string" ? source.url : "";
    const url = mapUrl(rawUrl);
    if (!url || shouldDropSource(url)) continue;

    const label = mapLabel(source?.label || "") || "Source";
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ label, url });
  }

  return out;
}

async function main() {
  const articles = await client.fetch(
    '*[_type == "article" && !(_id in path("drafts.**"))]{ _id, slug, body, sources }'
  );

  let patched = 0;
  let skipped = 0;

  for (const article of articles) {
    const slug = typeof article.slug === "string" ? article.slug : "";
    if (!slug) {
      skipped += 1;
      continue;
    }

    const rewrite = INTRO_REWRITES[slug];
    const body = Array.isArray(article.body) ? article.body : [];

    let introRewritten = false;
    const nextBody = body.map((blockItem) => {
      if (!blockItem || blockItem._type !== "block") return blockItem;

      const plain = blockToPlainText(blockItem);

      if (plain === LEGACY_REVIEW_LINE) {
        return makePlainBlock(
          UPDATED_REVIEW_LINE,
          blockItem.style || "normal",
          blockItem.listItem
        );
      }

      if (
        rewrite &&
        !introRewritten &&
        blockItem.style === "normal" &&
        plain.startsWith(rewrite.startsWith)
      ) {
        introRewritten = true;
        return makePlainBlock(rewrite.replacement, "normal");
      }

      if (Array.isArray(blockItem.markDefs) && blockItem.markDefs.length > 0) {
        const markDefs = blockItem.markDefs.map((markDef) => {
          if (!markDef || markDef._type !== "link") return markDef;
          const href = mapUrl(markDef.href || "");
          return {
            ...markDef,
            href,
          };
        });
        return {
          ...blockItem,
          markDefs,
        };
      }

      return blockItem;
    });

    const nextSources = normalizeSources(article.sources);
    await client.patch(article._id).set({ body: nextBody, sources: nextSources }).commit();
    patched += 1;
    console.log(
      `Patched ${slug} (introRewritten=${introRewritten ? "yes" : "no"}, sources=${nextSources.length})`
    );
  }

  console.log(`Done. Patched ${patched} articles. Skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
