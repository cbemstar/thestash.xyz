/**
 * Refresh all published blog articles with latest verified benchmarks as of February 15, 2026.
 *
 * What this script does:
 * 1. Fetches all published Sanity `article` documents.
 * 2. Removes legacy infographic blocks (often carrying stale 2024-only stats).
 * 3. Appends a dated "2026 update" section with topic-specific benchmark bullets.
 * 4. Appends one fresh infographic block with current benchmark stats.
 * 5. Merges and de-duplicates authoritative sources.
 *
 * Run:
 *   node --env-file=.env.local scripts/refresh-articles-2026.mjs
 *   node --env-file=.env.local scripts/refresh-articles-2026.mjs --with-media
 *
 * Requires:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   SANITY_API_TOKEN
 */
import { createClient } from "@sanity/client";
import { randomUUID } from "crypto";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;
const withMedia = process.argv.includes("--with-media");

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

const REVIEW_DATE_ISO = "2026-02-15";
const FRESHNESS_SECTION_TITLE = "2026 update: latest verified benchmarks";

const SOURCE_CATALOG = {
  stackoverflow2025: {
    label: "Stack Overflow Developer Survey 2025",
    url: "https://survey.stackoverflow.co/2025",
  },
  stackoverflow2025ai: {
    label: "Stack Overflow Developer Survey 2025 (AI)",
    url: "https://survey.stackoverflow.co/2025/ai",
  },
  stackoverflow2025developers: {
    label: "Stack Overflow Developer Survey 2025 (Developers)",
    url: "https://survey.stackoverflow.co/2025/developers",
  },
  stackoverflow2025methodology: {
    label: "Stack Overflow Developer Survey 2025 (Methodology)",
    url: "https://survey.stackoverflow.co/2025/methodology/",
  },
  githubOctoverse2025: {
    label: "GitHub Octoverse 2025",
    url: "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
  },
  jetbrains2025: {
    label: "JetBrains Developer Ecosystem 2025",
    url: "https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/",
  },
  webaim2025: {
    label: "WebAIM Million 2025",
    url: "https://webaim.org/projects/million/",
  },
  webalmanac2025: {
    label: "HTTP Archive Web Almanac 2025",
    url: "https://almanac.httparchive.org/en/2025/",
  },
  webalmanac2025pageWeight: {
    label: "HTTP Archive Web Almanac 2025 (Page Weight)",
    url: "https://almanac.httparchive.org/en/2025/page-weight",
  },
  w3techs2026wordpress: {
    label: "W3Techs WordPress Usage Stats (February 2026)",
    url: "https://w3techs.com/technologies/comparison/cm-wordpress",
  },
  postman2025: {
    label: "Postman State of the API 2025",
    url: "https://www.postman.com/state-of-api/2025/",
  },
  coursera2025report: {
    label: "Coursera Global Skills Report 2025",
    url: "https://www.coursera.org/skills-reports/global",
  },
  coursera2025blog: {
    label: "Coursera: Presenting the 2025 Global Skills Report",
    url: "https://blog.coursera.org/presenting-courseras-2025-global-skills-report-the-skills-trends-shaping-the-future-of-education-and-employment/",
  },
  uxtools2025design: {
    label: "UX Tools 2025 Survey (Design Standard Award)",
    url: "https://www.uxtools.co/survey/design-tools-awards/design-standard",
  },
  uxtools2025bigPicture: {
    label: "UX Tools 2025 Survey (The Big Picture)",
    url: "https://www.uxtools.co/survey/conclusion/the-big-picture",
  },
};

const UPDATE_PROFILES = {
  ai: {
    bullets: [
      "84% of developers are using or planning to use AI tools in development, and 51% of professional developers report daily usage ([Stack Overflow 2025 AI](https://survey.stackoverflow.co/2025/ai)).",
      "85% of developers regularly use AI tools, and 62% rely on at least one AI coding assistant, editor, or agent ([JetBrains Developer Ecosystem 2025](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)).",
      "GitHub reports 4.3 million AI projects in 2025 and over 180 million developers on the platform ([GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)).",
    ],
    stats: [
      { label: "Developers using or planning AI tools", value: "84%", subtext: "Stack Overflow 2025" },
      { label: "Professional developers using AI daily", value: "51%", subtext: "Stack Overflow 2025" },
      { label: "Projects on GitHub using AI", value: "4.3M", subtext: "Octoverse 2025" },
    ],
    sourceIds: ["stackoverflow2025ai", "jetbrains2025", "githubOctoverse2025"],
  },
  github: {
    bullets: [
      "GitHub surpassed 180 million developers in 2025, with roughly one new developer joining every second ([GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)).",
      "Public and open source activity reached 1.12 billion contributions in 2025, up year over year ([GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)).",
      "TypeScript became the most used language on GitHub in August 2025, signaling a meaningful shift in modern production workflows ([GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)).",
    ],
    stats: [
      { label: "Developers on GitHub", value: "180M+", subtext: "Octoverse 2025" },
      { label: "New developer joins", value: "1/sec", subtext: "Octoverse 2025" },
      { label: "Public contributions", value: "1.12B", subtext: "Octoverse 2025" },
    ],
    sourceIds: ["githubOctoverse2025"],
  },
  api: {
    bullets: [
      "82% of organizations have adopted some level of API-first, and 25% identify as fully API-first ([Postman State of the API 2025](https://www.postman.com/state-of-api/2025/)).",
      "89% of developers report using generative AI daily, but only 24% design APIs for AI agents today ([Postman State of the API 2025](https://www.postman.com/state-of-api/2025/)).",
      "65% of organizations now generate revenue from their API programs, showing API strategy is increasingly tied to business outcomes ([Postman State of the API 2025](https://www.postman.com/state-of-api/2025/)).",
    ],
    stats: [
      { label: "Organizations with API-first adoption", value: "82%", subtext: "Postman 2025" },
      { label: "Developers using GenAI daily", value: "89%", subtext: "Postman 2025" },
      { label: "Organizations generating API revenue", value: "65%", subtext: "Postman 2025" },
    ],
    sourceIds: ["postman2025"],
  },
  accessibility: {
    bullets: [
      "WebAIM detected 50,960,288 accessibility errors across the top one million home pages, averaging 51 errors per page in February 2025 ([WebAIM Million 2025](https://webaim.org/projects/million/)).",
      "Low contrast remains the most common issue (79.1% of home pages), followed by missing alt text (55.5%) and missing form labels (48.2%) ([WebAIM Million 2025](https://webaim.org/projects/million/)).",
      "96% of detected errors fall into six recurring failure categories, making focused fixes highly leveraged ([WebAIM Million 2025](https://webaim.org/projects/million/)).",
    ],
    stats: [
      { label: "Average detectable errors per home page", value: "51", subtext: "WebAIM 2025" },
      { label: "Home pages with low contrast failures", value: "79.1%", subtext: "WebAIM 2025" },
      { label: "Home pages with missing alt text", value: "55.5%", subtext: "WebAIM 2025" },
    ],
    sourceIds: ["webaim2025"],
  },
  web: {
    bullets: [
      "The Web Almanac 2025 is based on 16.2 million websites and 244 TB of data, offering one of the broadest public datasets on the web's technical state ([HTTP Archive Web Almanac 2025](https://almanac.httparchive.org/en/2025/)).",
      "98.1% of pages make at least one JavaScript request, so script weight and execution remain core performance levers ([Web Almanac 2025 Page Weight](https://almanac.httparchive.org/en/2025/page-weight)).",
      "The median mobile home page weight in 2025 is 2,164 KB, reinforcing why optimization and asset budgets matter for user outcomes ([HTTP Archive Web Almanac 2025](https://almanac.httparchive.org/en/2025/)).",
    ],
    stats: [
      { label: "Websites analyzed", value: "16.2M", subtext: "Web Almanac 2025" },
      { label: "Pages requesting JavaScript", value: "98.1%", subtext: "Web Almanac 2025" },
      { label: "Median mobile homepage weight", value: "2,164 KB", subtext: "Web Almanac 2025" },
    ],
    sourceIds: ["webalmanac2025", "webalmanac2025pageWeight"],
  },
  nocode: {
    bullets: [
      "WordPress holds 60.0% CMS market share and is used by 49.7% of top-one-million sites with a known CMS as of February 13, 2026 ([W3Techs](https://w3techs.com/technologies/comparison/cm-wordpress)).",
      "CMS pages remain heavy in practice, with Web Almanac 2025 reporting average page sizes around 2.67 MB desktop and 2.28 MB mobile in CMS analysis ([HTTP Archive Web Almanac 2025 CMS chapter](https://almanac.httparchive.org/en/2025/cms)).",
      "For no-code and visual site builders, performance and governance now matter as much as speed-to-publish in SEO-sensitive use cases.",
    ],
    stats: [
      { label: "WordPress CMS market share", value: "60.0%", subtext: "W3Techs (Feb 2026)" },
      { label: "Top sites using WordPress (known CMS)", value: "49.7%", subtext: "W3Techs (Feb 2026)" },
      { label: "Average CMS mobile page weight", value: "2.28 MB", subtext: "Web Almanac 2025" },
    ],
    sourceIds: ["w3techs2026wordpress", "webalmanac2025"],
  },
  design: {
    bullets: [
      "Figma remains the clear design standard with 82.3% UI design market share in the latest UX Tools survey data ([UX Tools 2025](https://www.uxtools.co/survey/design-tools-awards/design-standard)).",
      "Corporate IC adoption for Figma reached 93.1%, showing deep enterprise standardization ([UX Tools 2025](https://www.uxtools.co/survey/design-tools-awards/design-standard)).",
      "The same survey reports strong ecosystem consolidation, with specialists still outperforming on satisfaction in narrower workflows ([UX Tools 2025 The Big Picture](https://www.uxtools.co/survey/conclusion/the-big-picture)).",
    ],
    stats: [
      { label: "Figma UI design market share", value: "82.3%", subtext: "UX Tools 2025" },
      { label: "Figma corporate IC adoption", value: "93.1%", subtext: "UX Tools 2025" },
      { label: "Figma lead vs nearest competitor", value: "46:1", subtext: "UX Tools 2025" },
    ],
    sourceIds: ["uxtools2025design", "uxtools2025bigPicture"],
  },
  learning: {
    bullets: [
      "Coursera's 2025 Global Skills Report draws on data from 170M+ learners and tracks demand across 100+ countries ([Coursera Global Skills Report 2025](https://www.coursera.org/skills-reports/global)).",
      "GenAI enrollments surpassed 8 million on Coursera and grew 195% year over year in 2025, reflecting continued AI upskilling demand ([Coursera 2025 GSR announcement](https://blog.coursera.org/presenting-courseras-2025-global-skills-report-the-skills-trends-shaping-the-future-of-education-and-employment/)).",
      "Stack Overflow reports 69% of developers learned a new coding skill in the last year, with technical documentation as the top learning format at ~68% ([Stack Overflow 2025 Developers](https://survey.stackoverflow.co/2025/developers)).",
    ],
    stats: [
      { label: "Learners in Coursera 2025 dataset", value: "170M+", subtext: "Coursera GSR 2025" },
      { label: "GenAI enrollments on Coursera", value: "8M+", subtext: "Coursera GSR 2025" },
      { label: "Developers learning new coding skills yearly", value: "69%", subtext: "Stack Overflow 2025" },
    ],
    sourceIds: [
      "coursera2025report",
      "coursera2025blog",
      "stackoverflow2025developers",
      "stackoverflow2025methodology",
    ],
  },
};

const PROFILE_MEDIA = {
  ai: {
    imageUrl:
      "https://survey.stackoverflow.co/2025/charts/stackoverflow-dev-survey-2025-ai-sentiment-and-usage-ai-select-social.png",
    alt: "Stack Overflow 2025 AI usage chart showing daily and planned developer AI adoption.",
    caption: "Stack Overflow Developer Survey 2025 AI usage cadence chart.",
    sourceLabel: "Stack Overflow Developer Survey 2025 (AI)",
    sourceUrl: "https://survey.stackoverflow.co/2025/ai",
    width: 2400,
    height: 1110,
  },
  github: {
    imageUrl:
      "https://github.blog/wp-content/uploads/2025/10/octoverse-2025-open-source-top-metrics.png?resize=1728%2C432",
    alt: "GitHub Octoverse 2025 top metrics graphic with contributions and contributor growth.",
    caption: "GitHub Octoverse 2025 open-source top metrics.",
    sourceLabel: "GitHub Octoverse 2025",
    sourceUrl:
      "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
    width: 1728,
    height: 432,
  },
  api: {
    imageUrl:
      "https://voyager.postman.com/social-preview/state-of-api-2025/postman-state-of-api-2025-social-preview.png",
    alt: "Postman State of the API 2025 report cover image for API-first and AI trends.",
    caption: "Postman State of the API 2025 report creative.",
    sourceLabel: "Postman State of the API 2025",
    sourceUrl: "https://www.postman.com/state-of-api/2025/",
  },
  accessibility: {
    imageUrl: "https://webaim.org/projects/million/media/PercentErrors2025.png",
    alt: "WebAIM Million 2025 chart showing distribution of home page accessibility errors.",
    caption: "WebAIM Million 2025 error distribution chart.",
    sourceLabel: "WebAIM Million 2025",
    sourceUrl: "https://webaim.org/projects/million/",
  },
  web: {
    imageUrl: "https://almanac.httparchive.org/static/images/home-hero-2025.png",
    alt: "HTTP Archive Web Almanac 2025 hero graphic representing large-scale web dataset analysis.",
    caption: "HTTP Archive Web Almanac 2025 visual.",
    sourceLabel: "HTTP Archive Web Almanac 2025",
    sourceUrl: "https://almanac.httparchive.org/en/2025/",
  },
  nocode: {
    imageUrl: "https://w3techs.com/diagram/market_technology/cm-wordpress",
    alt: "W3Techs chart visualizing CMS market share with WordPress as the leading platform.",
    caption: "W3Techs CMS market share chart for WordPress.",
    sourceLabel: "W3Techs WordPress Usage Stats (February 2026)",
    sourceUrl: "https://w3techs.com/technologies/comparison/cm-wordpress",
  },
  design: {
    imageUrl: "https://framerusercontent.com/assets/jnstQ40BDVVzh7dd1ERGGkchto8.jpg",
    alt: "UX Tools 2025 visual from design tools survey results.",
    caption: "UX Tools 2025 design tools survey visual.",
    sourceLabel: "UX Tools 2025 Survey (Design Standard Award)",
    sourceUrl: "https://www.uxtools.co/survey/design-tools-awards/design-standard",
  },
  learning: {
    imageUrl:
      "https://blog.coursera.org/wp-content/uploads/2025/06/BC-4696_GSR2025_BlogHeader.png",
    alt: "Coursera Global Skills Report 2025 header visual used in official announcement.",
    caption: "Coursera 2025 Global Skills Report announcement graphic.",
    sourceLabel: "Coursera: Presenting the 2025 Global Skills Report",
    sourceUrl:
      "https://blog.coursera.org/presenting-courseras-2025-global-skills-report-the-skills-trends-shaping-the-future-of-education-and-employment/",
  },
};

const PROFILE_BY_SLUG = {
  "mastering-css-animations-tips-best-practices-2026": "web",
  "best-practices-accessible-web-interfaces-2026": "accessibility",
  "future-ai-developers-workflow-2026": "ai",
  "top-web-design-inspiration-sources-2026": "design",
  "how-github-enhances-collaboration-modern-dev-teams": "github",
  "compare-top-10-nocode-platforms-beginners-2026": "nocode",
  "best-ai-tools-developers-accelerate-coding-2026": "ai",
  "top-web-development-services-pick-right-one-2026": "web",
  "ultimate-list-coding-resources-2026": "learning",
  "best-platforms-launch-saas-product-2026": "api",
  "how-integrate-ai-apis-web-projects-2026": "api",
  "most-recommended-developer-frameworks-2026": "github",
  "choosing-between-webflow-traditional-web-builders-2026": "nocode",
  "best-subscription-services-continuous-learning-tech-2026": "learning",
  "top-15-developer-tools-boost-workflow-2026": "ai",
  "beginners-guide-modern-web-development-technologies-2026": "learning",
  "how-choose-right-ui-design-tools-projects-2026": "design",
  "most-popular-programming-languages-their-uses-2026": "github",
  "essential-resources-learning-frontend-development-2026": "learning",
  "workflow-automation-tools-designers-devs-2026": "api",
};

function key() {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

function parseInlineLinks(text) {
  const segments = [];
  const re = /\[([^\]]+)\]\((#[a-zA-Z0-9-]+|[^)]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), href: null });
    }
    segments.push({ text: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), href: null });
  }
  return segments.length ? segments : [{ text, href: null }];
}

function block(text, style = "normal", listItem) {
  const segments = parseInlineLinks(text);
  const markDefs = [];
  const children = segments.map((seg) => {
    if (seg.href) {
      const markKey = key();
      markDefs.push({
        _key: markKey,
        _type: "link",
        href: seg.href,
      });
      return {
        _type: "span",
        _key: key(),
        text: seg.text,
        marks: [markKey],
      };
    }
    return {
      _type: "span",
      _key: key(),
      text: seg.text,
    };
  });

  const out = {
    _type: "block",
    _key: key(),
    style,
    children,
    ...(markDefs.length ? { markDefs } : {}),
  };

  if (listItem) out.listItem = listItem;
  return out;
}

function blocksFromMd(markdown) {
  const out = [];
  const lines = String(markdown || "").split("\n");
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

function blockToPlainText(ptBlock) {
  if (!ptBlock || ptBlock._type !== "block" || !Array.isArray(ptBlock.children)) {
    return "";
  }
  return ptBlock.children
    .filter((child) => child && child._type === "span")
    .map((child) => child.text || "")
    .join("");
}

function stripExistingFreshnessSection(bodyBlocks) {
  const idx = bodyBlocks.findIndex((b) => {
    if (!b || b._type !== "block" || b.style !== "h2") return false;
    const text = blockToPlainText(b).toLowerCase();
    return text.includes(FRESHNESS_SECTION_TITLE);
  });
  if (idx === -1) return bodyBlocks;
  return bodyBlocks.slice(0, idx);
}

function normalizeBody(body) {
  if (Array.isArray(body)) return body;
  if (typeof body === "string") return blocksFromMd(body);
  return [];
}

function dedupeSources(sources) {
  const seen = new Set();
  const out = [];
  for (const source of sources || []) {
    if (!source || typeof source.url !== "string") continue;
    const url = source.url.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({
      label: source.label?.trim() || url,
      url,
    });
  }
  return out;
}

function buildFreshnessBlocks(profile) {
  const lines = [
    `## ${FRESHNESS_SECTION_TITLE}`,
    `Reviewed on ${REVIEW_DATE_ISO}. These benchmarks supersede earlier 2024/2025 stats where newer data is now available.`,
    ...profile.bullets.map((line) => `- ${line}`),
    "Use this section as the current baseline for planning and revisit the linked sources quarterly.",
  ];
  return blocksFromMd(lines.join("\n"));
}

function buildFreshnessInfographic(profile) {
  const primarySourceId = profile.sourceIds[0];
  const primarySource = SOURCE_CATALOG[primarySourceId];
  return {
    _type: "infographic",
    _key: key(),
    variant: "grid",
    title: "2026 benchmark snapshot",
    stats: profile.stats,
    sourceLabel: primarySource?.label || "Latest benchmark sources",
    sourceUrl: primarySource?.url || undefined,
  };
}

function parseStatNumber(value) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/,/g, "").trim();
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const next = Number.parseFloat(match[1]);
  return Number.isFinite(next) && next > 0 ? next : null;
}

function buildFreshnessHistogram(profile) {
  const primarySourceId = profile.sourceIds[0];
  const primarySource = SOURCE_CATALOG[primarySourceId];
  const values = profile.stats.map((stat) => parseStatNumber(stat.value));
  if (values.some((value) => value === null)) return null;

  const maxValue = Math.max(...values);
  if (!Number.isFinite(maxValue) || maxValue <= 0) return null;

  const stats = profile.stats.map((stat, index) => {
    const numericValue = values[index];
    const relative = numericValue === null ? null : Math.max(1, Math.round((numericValue / maxValue) * 100));
    return {
      label: stat.label,
      value: `${relative ?? 100}%`,
      subtext: [stat.value, stat.subtext].filter(Boolean).join(" • "),
    };
  });

  return {
    _type: "infographic",
    _key: key(),
    variant: "histogram",
    title: "Relative benchmark distribution",
    stats,
    sourceLabel: primarySource?.label || "Latest benchmark sources",
    sourceUrl: primarySource?.url || undefined,
  };
}

function buildProfileMedia(profileKey) {
  const media = PROFILE_MEDIA[profileKey];
  if (!media) return null;
  return {
    _type: "sourcedImage",
    _key: key(),
    imageUrl: media.imageUrl,
    alt: media.alt,
    caption: media.caption,
    sourceLabel: media.sourceLabel,
    sourceUrl: media.sourceUrl,
    ...(media.width ? { width: media.width } : {}),
    ...(media.height ? { height: media.height } : {}),
  };
}

function resolveProfileKey(slug) {
  return PROFILE_BY_SLUG[slug] || null;
}

function resolveProfile(profileKey) {
  return profileKey ? UPDATE_PROFILES[profileKey] || null : null;
}

function resolveProfileSources(profile) {
  return profile.sourceIds
    .map((sourceId) => SOURCE_CATALOG[sourceId])
    .filter(Boolean);
}

async function main() {
  const articles = await client.fetch(
    '*[_type == "article" && !(_id in path("drafts.**"))]{ _id, title, slug, body, sources }'
  );

  if (!Array.isArray(articles) || articles.length === 0) {
    console.log("No published articles found.");
    return;
  }

  let patched = 0;
  let skipped = 0;

  for (const article of articles) {
    const slug = typeof article.slug === "string" ? article.slug : "";
    if (!slug) {
      console.log(`Skip (missing slug): ${article._id}`);
      skipped += 1;
      continue;
    }

    const profileKey = resolveProfileKey(slug);
    const profile = resolveProfile(profileKey);
    if (!profile) {
      console.log(`Skip (no profile mapping): ${slug}`);
      skipped += 1;
      continue;
    }

    const normalizedBody = normalizeBody(article.body);
    const noLegacyInfographics = normalizedBody.filter(
      (blockItem) => blockItem && blockItem._type !== "infographic"
    );
    const baseBody = stripExistingFreshnessSection(noLegacyInfographics);
    const freshnessBlocks = buildFreshnessBlocks(profile);
    const freshnessInfographic = buildFreshnessInfographic(profile);
    const mediaBlocks = withMedia
      ? [
          buildProfileMedia(profileKey),
          buildFreshnessHistogram(profile),
        ].filter(Boolean)
      : [];
    const nextBody = [...baseBody, ...freshnessBlocks, freshnessInfographic, ...mediaBlocks];

    const mergedSources = dedupeSources([
      ...(Array.isArray(article.sources) ? article.sources : []),
      ...resolveProfileSources(profile),
    ]);

    await client
      .patch(article._id)
      .set({
        body: nextBody,
        sources: mergedSources,
      })
      .commit();

    patched += 1;
    console.log(
      `Patched ${slug} (${mergedSources.length} sources${
        mediaBlocks.length > 0 ? `, media=${mediaBlocks.length}` : ""
      })`
    );
  }

  console.log(`Done. Patched ${patched} articles. Skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
