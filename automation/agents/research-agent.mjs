/**
 * RESEARCH AGENT - Validates and enriches queued discovery leads.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/research-agent.mjs
 */

import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { logEvent } from './event-logger.mjs';
import { assertRunAllowed } from './runtime-control.mjs';
import {
  asArray,
  countWords,
  getHostname,
  getSanityClient,
  isDirectRun,
  loadJson,
  normalizeUrl,
  saveJson,
  slugify,
  stripHtml,
} from './agent-shared.mjs';

const LEAD_QUEUE_FILE = './automation/agents/lead-queue.json';
const VALIDATED_FILE = './automation/agents/validated-leads.json';
const APPROVAL_QUEUE_FILE = './automation/agents/approval-queue.json';
const RESEARCH_PLAYBOOK_FILE = './automation/agents/resource-research-playbook.json';
const RESEARCH_REPORT_FILE = './automation/agents/research-report.json';

const DEFAULT_RESEARCH_PLAYBOOK = {
  version: '2026-02-26.2',
  categoryPriority: [
    'ui-ux-resources',
    'coding',
    'html',
    'css',
    'javascript',
    'languages',
    'learning-resources',
    'productivity',
    'webflow',
    'shadcn',
    'ai-tools',
    'development-tools',
    'design-tools',
    'inspiration',
    'github',
    'miscellaneous',
  ],
  marketingSignals: [
    'marketing',
    'growth',
    'seo',
    'email',
    'newsletter',
    'content',
    'social',
    'ads',
    'ppc',
    'campaign',
    'lead-gen',
    'conversion',
  ],
  blockedHosts: ['reddit.com', 'x.com', 'twitter.com', 'facebook.com', 'instagram.com', 'tiktok.com'],
  nonToolHosts: [
    'techcrunch.com',
    'substack.com',
    'medium.com',
    'dev.to',
    'hashnode.com',
    'chrisbrunet.com',
    'rsdoiel.github.io',
    'magicalmushroom.com',
    'hackernoon.com',
    'towardsdatascience.com',
    'thenewstack.io',
    'venturebeat.com',
    'theverge.com',
    'wired.com',
  ],
  allowedResourceTypes: [
    'app',
    'website',
    'utility',
    'tool',
    'library',
    'framework',
    'component',
    'directory',
    'template',
    'course',
    'snippet',
    'other',
  ],
  disallowedResourceTypes: ['article', 'blog', 'video', 'newsletter', 'tip', 'podcast', 'person'],
  sourcePriority: ['NoCodeSupply', 'Futurepedia', 'Product Hunt Feed', 'Hacker News', 'GitHub Search'],
  scoutPolicy: {
    maxGithubShare: 0.15,
  },
};

const BLOCKED_HOST_PATTERNS = [
  /(^|\.)reddit\.com$/,
  /(^|\.)x\.com$/,
  /(^|\.)twitter\.com$/,
  /(^|\.)facebook\.com$/,
  /(^|\.)instagram\.com$/,
  /(^|\.)wikipedia\.org$/,
  /(^|\.)lesswrong\.com$/,
  /(^|\.)discuss\.ai\.google\.dev$/,
  /(^|\.)science\.org$/,
  /(^|\.)spectrum\.ieee\.org$/,
];

const NON_TOOL_HOST_PATTERNS = [
  /(^|\.)techcrunch\.com$/,
  /(^|\.)substack\.com$/,
  /(^|\.)medium\.com$/,
  /(^|\.)dev\.to$/,
  /(^|\.)hashnode\.com$/,
  /(^|\.)chrisbrunet\.com$/,
  /(^|\.)rsdoiel\.github\.io$/,
  /(^|\.)magicalmushroom\.com$/,
];

const NON_TOOL_PATH_PATTERNS = [
  /\/blog\//i,
  /\/news\//i,
  /\/article\//i,
  /\/posts?\//i,
  /\/p\//i,
  /\/20\d{2}\/\d{2}\//i,
  /\/index$/i,
];

const NON_TOOL_TITLE_PATTERNS = [
  /^home page$/i,
  /\|\s*techcrunch/i,
  /journal citation cartel/i,
  /ramblings/i,
];

const LOW_SIGNAL_GITHUB_REPO_PATTERNS = [/^awesome-/i, /bench$/i, /benchmark/i, /usecases?$/i];
const LOW_SIGNAL_GITHUB_PATH_PATTERNS = [
  /\/(issues|pulls|pull|discussions|wiki|blob|tree|commits|actions)(\/|$)/i,
  /\/(topics|orgs|users)(\/|$)/i,
];

const TOOL_SIGNAL_PATTERN =
  /\b(tool|app|platform|software|api|sdk|framework|library|cli|plugin|extension|editor|assistant|automation|open[- ]source|template|component|kit|docs?)\b/i;

const TAG_KEYWORDS = {
  'open-source': /(open source|open-source)/i,
  ai: /(ai|llm|gpt|model|copilot|agent)/i,
  api: /\bapi\b/i,
  cli: /\bcli\b|command line/i,
  saas: /\bsaas\b/i,
  productivity: /(productivity|task|workflow)/i,
  design: /(design|figma|prototype|ui|ux)/i,
  devtools: /(developer|devtool|ide|editor|repository|framework|library)/i,
  'no-code': /(no-code|nocode)/i,
};
const TAG_STOPWORDS = new Set([
  'tool',
  'tools',
  'app',
  'apps',
  'software',
  'platform',
  'official',
  'site',
  'other',
  'directory',
]);
const VALID_INDUSTRIES = new Set([
  'e-commerce',
  'saas',
  'content',
  'community',
  'developer',
  'marketing',
  'general',
]);

function loadResearchPlaybook() {
  const fromDisk = loadJson(RESEARCH_PLAYBOOK_FILE, null);
  if (!fromDisk || typeof fromDisk !== 'object') return DEFAULT_RESEARCH_PLAYBOOK;
  const sourcePriority = asArray(fromDisk?.scoutPolicy?.sourcePriority).length > 0
    ? asArray(fromDisk.scoutPolicy.sourcePriority)
    : asArray(fromDisk.sourcePriority).length > 0
      ? asArray(fromDisk.sourcePriority)
      : DEFAULT_RESEARCH_PLAYBOOK.sourcePriority;

  return {
    ...DEFAULT_RESEARCH_PLAYBOOK,
    ...fromDisk,
    categoryPriority: asArray(fromDisk.categoryPriority).length > 0
      ? asArray(fromDisk.categoryPriority)
      : DEFAULT_RESEARCH_PLAYBOOK.categoryPriority,
    marketingSignals: asArray(fromDisk.marketingSignals).length > 0
      ? asArray(fromDisk.marketingSignals)
      : DEFAULT_RESEARCH_PLAYBOOK.marketingSignals,
    blockedHosts: asArray(fromDisk.blockedHosts).length > 0
      ? asArray(fromDisk.blockedHosts)
      : DEFAULT_RESEARCH_PLAYBOOK.blockedHosts,
    nonToolHosts: asArray(fromDisk.nonToolHosts).length > 0
      ? asArray(fromDisk.nonToolHosts)
      : DEFAULT_RESEARCH_PLAYBOOK.nonToolHosts,
    allowedResourceTypes: asArray(fromDisk.allowedResourceTypes).length > 0
      ? asArray(fromDisk.allowedResourceTypes)
      : DEFAULT_RESEARCH_PLAYBOOK.allowedResourceTypes,
    disallowedResourceTypes: asArray(fromDisk.disallowedResourceTypes).length > 0
      ? asArray(fromDisk.disallowedResourceTypes)
      : DEFAULT_RESEARCH_PLAYBOOK.disallowedResourceTypes,
    sourcePriority,
    scoutPolicy:
      fromDisk.scoutPolicy && typeof fromDisk.scoutPolicy === 'object'
        ? { ...DEFAULT_RESEARCH_PLAYBOOK.scoutPolicy, ...fromDisk.scoutPolicy }
        : DEFAULT_RESEARCH_PLAYBOOK.scoutPolicy,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeText(value, max = 260) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function uniqStrings(value, limit = 24) {
  const out = [];
  const seen = new Set();
  for (const row of asArray(value)) {
    const normalized = sanitizeText(row, 60).toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= limit) break;
  }
  return out;
}

function normalizeResourceType(type) {
  const value = sanitizeText(type, 40).toLowerCase();
  if (!value) return 'other';
  if (/(^|\b)app(\b|$)/.test(value)) return 'app';
  if (/(^|\b)website(\b|$)/.test(value)) return 'website';
  if (/(^|\b)utility(\b|$)/.test(value)) return 'utility';
  if (/(^|\b)tool(\b|$)/.test(value)) return 'tool';
  if (/(^|\b)library(\b|$)/.test(value)) return 'library';
  if (/(^|\b)framework(\b|$)/.test(value)) return 'framework';
  if (/(^|\b)component(\b|$)/.test(value)) return 'component';
  if (/(^|\b)directory(\b|$)/.test(value)) return 'directory';
  if (/(^|\b)template(\b|$)/.test(value)) return 'template';
  if (/(^|\b)course(\b|$)/.test(value)) return 'course';
  if (/(^|\b)snippet(\b|$)/.test(value)) return 'snippet';
  if (/(^|\b)article(\b|$)/.test(value)) return 'article';
  if (/(^|\b)video(\b|$)/.test(value)) return 'video';
  if (/(^|\b)tip(\b|$)/.test(value)) return 'tip';
  if (/(^|\b)blog(\b|$)/.test(value)) return 'blog';
  if (/(^|\b)newsletter(\b|$)/.test(value)) return 'newsletter';
  if (/(^|\b)podcast(\b|$)/.test(value)) return 'podcast';
  if (/(^|\b)person(\b|$)/.test(value)) return 'person';
  return 'other';
}

function isDisallowedResourceType(type, playbook) {
  const normalized = normalizeResourceType(type);
  const disallowed = new Set(uniqStrings(playbook.disallowedResourceTypes, 40));
  const allowed = new Set(uniqStrings(playbook.allowedResourceTypes, 40));
  if (disallowed.has(normalized)) return true;
  if (allowed.size > 0 && !allowed.has(normalized)) return true;
  return false;
}

function classifyCategory({ url, title, description, resourceType, sourceCollection, sourceTags }) {
  const tags = uniqStrings(sourceTags, 30);
  const text = `${url} ${title} ${description} ${tags.join(' ')}`.toLowerCase();
  const type = normalizeResourceType(resourceType);
  const collection = String(sourceCollection || '').toLowerCase();

  if (collection === 'learn' || type === 'course') return 'learning-resources';
  if (collection === 'inspo') return 'inspiration';
  if (collection === 'code' || ['library', 'framework', 'snippet'].includes(type)) return 'coding';
  if (['component', 'template'].includes(type)) return 'ui-ux-resources';

  if (/(marketing|seo|email|social|campaign|copywriting|content-marketing)/.test(text)) {
    return /(ai|llm|gpt|agent|automation)/.test(text) ? 'ai-tools' : 'productivity';
  }
  if (/(ai|llm|gpt|copilot|agent|prompt|model)/.test(text)) return 'ai-tools';
  if (/(figma|design|sketch|adobe|prototype|wireframe|framer)/.test(text)) return 'design-tools';
  if (/(component|ui kit|icon|tailwind|shadcn|radix)/.test(text)) return 'ui-ux-resources';
  if (/(webflow)/.test(text)) return 'webflow';
  if (/(learn|tutorial|course|docs|documentation|guide)/.test(text)) return 'learning-resources';
  if (/(productivity|task|notes|workflow|project management|automation)/.test(text)) {
    return 'productivity';
  }
  if (/(inspiration|showcase|gallery|portfolio|dribbble|awwwards)/.test(text)) return 'inspiration';
  if (/(^|\s)html(\s|$)/.test(text)) return 'html';
  if (/(^|\s)css(\s|$)/.test(text)) return 'css';
  if (/(javascript|typescript|react|vue|svelte|node\.js)/.test(text)) return 'javascript';
  if (/(python|go|rust|kotlin|swift|scala|haskell|clojure|java)/.test(text)) return 'languages';
  if (/(github\.com)/.test(text)) return 'github';
  return 'development-tools';
}

function sanitizeTag(value) {
  const tag = sanitizeText(value, 40)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!tag || tag.length < 2 || tag.length > 32 || TAG_STOPWORDS.has(tag)) return '';
  return tag;
}

function generateTags({ title, description, category, resourceType, sourceTags }) {
  const text = `${title} ${description}`;
  const tags = new Set([sanitizeTag(category), sanitizeTag(resourceType)]);

  for (const [tag, pattern] of Object.entries(TAG_KEYWORDS)) {
    if (pattern.test(text)) tags.add(sanitizeTag(tag));
  }

  for (const tag of uniqStrings(sourceTags, 16)) {
    tags.add(sanitizeTag(tag));
  }

  return [...tags].filter(Boolean).slice(0, 10);
}

function generateBestForNotFor(category) {
  const bestForByCategory = {
    'ai-tools': ['Engineering teams adopting AI-assisted workflows', 'Developers who need faster iteration loops'],
    'design-tools': ['Product designers building interface systems', 'Cross-functional teams collaborating on UI'],
    'development-tools': ['Developers shipping production code', 'Teams standardizing tooling across projects'],
    productivity: ['Teams improving execution speed', 'Operators coordinating cross-functional work'],
    'learning-resources': ['Developers upskilling into new stacks', 'Self-directed learners who prefer structured paths'],
    'ui-ux-resources': ['Design systems teams', 'Frontend developers building reusable UI patterns'],
    inspiration: ['Designers collecting references for exploration', 'Creative teams preparing moodboards'],
    webflow: ['Webflow teams scaling client work', 'Designers shipping marketing pages quickly'],
    coding: ['Developers looking for practical code references', 'Teams aligning on frontend best practices'],
  };

  const notForByCategory = {
    'ai-tools': ['Teams with strict data residency constraints and no approved exception process'],
    'design-tools': ['Users who only need basic image editing'],
    'development-tools': ['Non-technical users with no engineering support'],
    productivity: ['Teams that do not need shared workflows or collaboration structure'],
    'learning-resources': ['Advanced specialists looking only for niche research papers'],
  };

  return {
    bestFor: bestForByCategory[category] || ['Teams evaluating modern tooling options'],
    notFor: notForByCategory[category] || [],
  };
}

function generateAlternatives(title) {
  const map = {
    cursor: ['windsurf', 'github-copilot', 'cline'],
    windsurf: ['cursor', 'github-copilot', 'replit'],
    figma: ['framer', 'penpot', 'sketch'],
    notion: ['clickup', 'obsidian', 'coda'],
    webflow: ['framer', 'wordpress', 'wix'],
  };

  const lower = String(title || '').toLowerCase();
  for (const [needle, options] of Object.entries(map)) {
    if (lower.includes(needle)) return options;
  }
  return [];
}

function inferTitleFromUrl(url, fallbackTitle) {
  const hostname = getHostname(url);
  const fallback = sanitizeText(fallbackTitle || 'Untitled tool', 120);

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);

    if (hostname === 'github.com' && parts.length >= 2) {
      const repo = parts[1].replace(/\\.git$/i, '');
      return sanitizeText(repo, 120);
    }

    if (hostname.endsWith('producthunt.com') && parts.length > 0) {
      const tail = parts[parts.length - 1].replace(/-/g, ' ');
      return sanitizeText(tail, 120);
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function getPathname(url) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function cleanInferredTitle(url, title) {
  let cleaned = sanitizeText(stripHtml(title || ''), 120);
  const hostname = getHostname(url);

  if (/^github\s*-\s*/i.test(cleaned)) {
    const candidate = cleaned.replace(/^github\s*-\s*/i, '').split(':')[0] || '';
    const repoName = candidate.split('/').pop() || '';
    if (repoName) cleaned = repoName;
  }

  cleaned = cleaned
    .replace(/\s*\|\s*techcrunch.*$/i, '')
    .replace(/\s*&mdash;.*$/i, '')
    .trim();

  if (/^home page$/i.test(cleaned)) return '';
  if (hostname === 'cursor.sh' && /cursor/i.test(cleaned)) return 'Cursor';
  if (hostname === 'windsurf.ai' && /(reply logo|windsurf)/i.test(cleaned)) return 'Windsurf';
  return sanitizeText(cleaned, 120);
}

function matchesHostList(hostname, values) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  return asArray(values).some((value) => {
    const normalized = String(value || '').trim().toLowerCase().replace(/^\./, '');
    return normalized && (host === normalized || host.endsWith(`.${normalized}`));
  });
}

function hasStrongToolSignal({ url, title, description, resourceType, sourceTags }) {
  const hostname = getHostname(url);
  const pathname = getPathname(url);
  const type = normalizeResourceType(resourceType);
  const tags = uniqStrings(sourceTags, 12);

  if (['article', 'blog', 'newsletter', 'video', 'tip', 'podcast', 'person'].includes(type)) {
    return false;
  }
  if (
    ['app', 'tool', 'library', 'framework', 'component', 'directory', 'utility', 'course', 'snippet'].includes(
      type
    )
  ) {
    return true;
  }
  if (type === 'website') {
    return TOOL_SIGNAL_PATTERN.test(`${title || ''} ${description || ''} ${tags.join(' ')}`);
  }

  if (hostname === 'github.com') {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 2) return false;
    if (LOW_SIGNAL_GITHUB_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) return false;
    return true;
  }

  const tagText = tags.join(' ');
  return TOOL_SIGNAL_PATTERN.test(`${title || ''} ${description || ''} ${url || ''} ${tagText}`);
}

function detectLowQualityReason(lead, playbook) {
  const url = lead?.url;
  const title = lead?.title;
  const description = lead?.description;
  const resourceType = lead?.resourceType;
  const sourceTags = lead?.sourceTags;
  const sourceCollection = String(lead?.sourceCollection || '').toLowerCase();
  const disallowedCollections = uniqStrings(
    playbook?.scoutPolicy?.disallowedNoCodeSupplyCollections,
    8
  );

  const hostname = getHostname(url);
  const pathname = getPathname(url);
  const titleText = String(title || '');
  const fullText = `${title || ''} ${description || ''} ${asArray(sourceTags).join(' ')}`.toLowerCase();

  if (isDisallowedResourceType(resourceType, playbook)) return 'disallowed_resource_type';
  if (sourceCollection && disallowedCollections.includes(sourceCollection)) {
    return 'disallowed_source_collection';
  }
  if (NON_TOOL_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) return 'non_tool_host';
  if (matchesHostList(hostname, playbook.nonToolHosts)) return 'playbook_non_tool_host';
  if (NON_TOOL_TITLE_PATTERNS.some((pattern) => pattern.test(titleText))) return 'non_tool_title';

  const hasToolSignal = hasStrongToolSignal({ url, title, description, resourceType, sourceTags });
  if (sourceCollection === 'inspo' && normalizeResourceType(resourceType) === 'website' && !hasToolSignal) {
    return 'inspo_non_tool_site';
  }
  if (NON_TOOL_PATH_PATTERNS.some((pattern) => pattern.test(pathname)) && !hasToolSignal) {
    return 'article_like_path';
  }

  if (hostname === 'github.com') {
    const segments = pathname.split('/').filter(Boolean);
    const repoName = segments[1] || '';
    if (LOW_SIGNAL_GITHUB_REPO_PATTERNS.some((pattern) => pattern.test(repoName))) {
      return 'low_signal_repo';
    }
    if (LOW_SIGNAL_GITHUB_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
      return 'low_signal_github_path';
    }
  }

  if (
    !hasToolSignal &&
    /\b(news|opinion|analysis|review|camera|cartel|adopts rust|weblog|ramblings|newsletter|announces?)\b/i.test(
      fullText
    )
  ) {
    return 'not_tool_signal';
  }

  if (!hasToolSignal && countWords(description) < 5) return 'thin_description';
  return '';
}

function isBlockedLead(lead, playbook) {
  const url = typeof lead === 'string' ? lead : lead?.url;
  const hostname = getHostname(url);
  if (!hostname) return true;
  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) return true;
  if (matchesHostList(hostname, playbook.blockedHosts)) return true;
  if (matchesHostList(hostname, playbook.nonToolHosts)) return true;
  if (isDisallowedResourceType(lead?.resourceType, playbook)) return true;
  return false;
}

function isMarketingLead({ title, description, tags }, playbook) {
  const text = `${title || ''} ${description || ''} ${asArray(tags).join(' ')}`.toLowerCase();
  return asArray(playbook.marketingSignals).some((token) =>
    text.includes(String(token || '').toLowerCase())
  );
}

function normalizeIndustry(value) {
  const token = sanitizeText(value, 60).toLowerCase();
  if (!token) return '';
  if (/(marketing|growth|seo|ads|ppc|campaign|email|social|lead-gen|leadgen|copywriting)/.test(token)) {
    return 'marketing';
  }
  if (/(developer|development|engineering|devops|programming|coding|api|sdk)/.test(token)) {
    return 'developer';
  }
  if (/(saas|software-as-a-service)/.test(token)) return 'saas';
  if (/(ecommerce|e-commerce|shopify|store|retail)/.test(token)) return 'e-commerce';
  if (/(community|creator|forum|social network)/.test(token)) return 'community';
  if (/(content|cms|publishing|newsletter|blogging|blog)/.test(token)) return 'content';
  if (/(general|all|other)/.test(token)) return 'general';
  return '';
}

function deriveIndustries({ sourceIndustries, sourceTags, title, description, marketing }) {
  const tokens = uniqStrings([
    ...asArray(sourceIndustries),
    ...asArray(sourceTags),
    title || '',
    description || '',
  ], 30);
  const industries = [];
  const seen = new Set();

  for (const token of tokens) {
    const normalized = normalizeIndustry(token);
    if (!normalized || seen.has(normalized) || !VALID_INDUSTRIES.has(normalized)) continue;
    seen.add(normalized);
    industries.push(normalized);
    if (industries.length >= 4) break;
  }

  if (marketing && !seen.has('marketing')) industries.push('marketing');
  if (industries.length === 0 && marketing) industries.push('marketing');
  return industries.slice(0, 4);
}

async function loadCategoryCounts(sanity) {
  const rows = await sanity.fetch(`*[_type == "resource"]{ category }`);
  const counts = {};
  for (const row of asArray(rows)) {
    const category = String(row?.category || '').trim();
    if (!category) continue;
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

function scoreLeadPriority(lead, categoryCounts, playbook) {
  const category = String(
    lead?.category ||
      classifyCategory({
        url: lead?.url,
        title: lead?.title,
        description: lead?.description,
        resourceType: lead?.resourceType,
        sourceCollection: lead?.sourceCollection,
        sourceTags: lead?.sourceTags,
      })
  );
  const allCounts = Object.values(categoryCounts);
  const maxCount = allCounts.length > 0 ? Math.max(...allCounts) : 0;
  const currentCount = categoryCounts[category] || 0;
  const scarcityBoost = Math.max(maxCount - currentCount, 0);
  const source = String(lead?.source || '').toLowerCase();
  let sourceBoost = 0;
  if (source.includes('nocodesupply')) sourceBoost += 3;
  else if (source.includes('futurepedia')) sourceBoost += 2.5;
  else if (source.includes('product hunt')) sourceBoost += 1.5;
  else if (source.includes('hacker news')) sourceBoost += 1;
  else if (source.includes('github')) sourceBoost -= 1.5;

  if (isDisallowedResourceType(lead?.resourceType, playbook)) sourceBoost -= 10;
  if (NON_TOOL_PATH_PATTERNS.some((pattern) => pattern.test(getPathname(lead?.url)))) sourceBoost -= 3;

  const priorityRank = asArray(playbook.categoryPriority).indexOf(category);
  const rankBoost =
    priorityRank === -1
      ? 0
      : Math.max(asArray(playbook.categoryPriority).length - priorityRank, 1) * 0.2;
  return {
    category,
    score:
      Number(lead?.relevanceScore || 0) +
      scarcityBoost * 0.35 +
      sourceBoost +
      rankBoost +
      (lead?.sourceCollection === 'learn' && category === 'learning-resources' ? 0.8 : 0),
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function validateUrl(url) {
  const result = {
    valid: false,
    status: 0,
    method: 'HEAD->GET',
    validatedAt: new Date().toISOString(),
    error: null,
  };

  try {
    const head = await fetchWithTimeout(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'TheStashResearch' },
    });
    if (head.ok || head.status === 301 || head.status === 302) {
      result.valid = true;
      result.status = head.status;
      result.method = 'HEAD';
      return result;
    }
  } catch {
    // Fallback to GET below.
  }

  try {
    const get = await fetchWithTimeout(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'TheStashResearch' },
    });
    result.valid = get.ok;
    result.status = get.status;
    result.method = 'GET';
    return result;
  } catch (error) {
    result.error = error.message;
    return result;
  }
}

/** When Node fetch says invalid (403/timeout/SSL), retry with Scrapling if script exists. Set USE_SCRAPLING_FALLBACK=0 to disable. */
async function validateUrlWithScraplingFallback(url) {
  const result = await validateUrl(url);
  if (result.valid) return result;

  const scriptPath = path.join(process.cwd(), 'scripts', 'check_url_scrapling.py');
  const fallbackEnabled = process.env.USE_SCRAPLING_FALLBACK !== '0' && fs.existsSync(scriptPath);
  if (!fallbackEnabled) return result;

  return new Promise((resolve) => {
    const proc = spawn('python3', [scriptPath, url, '--stealth'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({
          ...result,
          valid: true,
          status: 200,
          method: 'Scrapling',
          error: null,
        });
      } else {
        resolve(result);
      }
    });
    proc.on('error', () => resolve(result));
  });
}

function extractMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i);
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i);

  return {
    title: sanitizeText(stripHtml(titleMatch ? titleMatch[1] : ''), 120),
    description: sanitizeText(stripHtml(descMatch ? descMatch[1] : ''), 260),
    image: sanitizeText(ogImageMatch ? ogImageMatch[1] : '', 500),
  };
}

async function fetchPageInfo(url) {
  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'TheStashResearch' },
    });
    if (!response.ok) return { title: '', description: '', image: '' };
    const html = await response.text();
    return extractMeta(html);
  } catch {
    return { title: '', description: '', image: '' };
  }
}

function buildBody(title, description, category) {
  const fallback = `${title} is a ${category.replace(/-/g, ' ')} resource worth evaluating for teams that need practical implementation support.`;
  const firstSentence = sanitizeText(description || fallback, 260);
  const secondSentence = `Use this as a starting point, then validate integration constraints, pricing boundaries, and long-term maintenance risk against your current stack.`;
  const thirdSentence = `Before adopting, compare alternatives and confirm documentation quality, onboarding path, and the cadence of product updates.`;
  const body = `${firstSentence} ${secondSentence} ${thirdSentence}`.trim();
  return countWords(body) >= 35 ? body : `${body} Prioritize vendors with transparent roadmaps and clear change logs.`;
}

async function loadExistingResourceIndex(sanity) {
  const resources = await sanity.fetch(`*[_type == "resource"]{ _id, slug, "url": coalesce(url, "") }`);
  const urlSet = new Set();
  const slugSet = new Set();

  for (const row of asArray(resources)) {
    if (row.url) urlSet.add(normalizeUrl(row.url));
    if (row.slug) slugSet.add(String(row.slug).toLowerCase());
  }

  return { urlSet, slugSet };
}

function enqueueValidatedResources(validatedResources) {
  if (validatedResources.length === 0) return;

  const queue = loadJson(APPROVAL_QUEUE_FILE, []);
  const seen = new Set(
    queue.map((item) => normalizeUrl(item?.data?.url || item?.data?.title || '')).filter(Boolean)
  );

  for (const resource of validatedResources) {
    const key = normalizeUrl(resource.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    queue.push({
      queueId: randomUUID(),
      type: 'resource',
      data: resource,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    });
  }

  saveJson(APPROVAL_QUEUE_FILE, queue);
}

export async function runResearchAgent() {
  const startedAt = Date.now();
  const runId = `research-${startedAt}`;
  const playbook = loadResearchPlaybook();
  console.log(`RESEARCH start runId=${runId} playbook=${playbook.version}`);

  await logEvent({
    agentId: 'research',
    taskId: runId,
    actionType: 'started',
    target: 'research.pipeline',
    metadata: { playbookVersion: playbook.version },
    status: 'running',
  });

  await assertRunAllowed({
    agentId: 'research',
    taskId: runId,
    target: 'research.pipeline',
    stage: 'initialization',
  });

  const sanity = getSanityClient();
  const categoryCounts = await loadCategoryCounts(sanity);
  const existingIndex = await loadExistingResourceIndex(sanity);

  const rawQueue = loadJson(LEAD_QUEUE_FILE, []);
  const queue = [];
  const seenQueueUrls = new Set();

  for (const lead of asArray(rawQueue)) {
    const normalized = normalizeUrl(lead?.url || '');
    if (!normalized || seenQueueUrls.has(normalized)) continue;
    seenQueueUrls.add(normalized);
    queue.push({
      ...lead,
      url: normalized,
      resourceType: normalizeResourceType(lead?.resourceType),
      sourceTags: uniqStrings(lead?.sourceTags, 16),
      sourceIndustries: uniqStrings(lead?.sourceIndustries, 16),
      sourceCollection: sanitizeText(lead?.sourceCollection || '', 24).toLowerCase(),
    });
  }

  const prioritizedQueue = queue
    .map((lead) => {
      const priority = scoreLeadPriority(lead, categoryCounts, playbook);
      return {
        ...lead,
        category: lead.category || priority.category,
        _priorityScore: priority.score,
      };
    })
    .sort((a, b) => b._priorityScore - a._priorityScore);

  const validated = [];
  const processedUrls = new Set();
  const skippedReasons = {
    missing: 0,
    blocked: 0,
    duplicate: 0,
    invalid: 0,
    slugConflict: 0,
    lowQuality: 0,
  };
  const validationStatuses = [];

  for (const lead of prioritizedQueue) {
    await assertRunAllowed({
      agentId: 'research',
      taskId: runId,
      target: 'research.pipeline',
      stage: 'validate-lead',
    });

    if (!lead.url || !lead.title) {
      skippedReasons.missing += 1;
      continue;
    }
    if (isBlockedLead(lead, playbook)) {
      skippedReasons.blocked += 1;
      continue;
    }
    if (processedUrls.has(lead.url)) {
      skippedReasons.duplicate += 1;
      continue;
    }
    processedUrls.add(lead.url);

    if (existingIndex.urlSet.has(lead.url)) {
      skippedReasons.duplicate += 1;
      continue;
    }

    const validation = await validateUrlWithScraplingFallback(lead.url);
    validationStatuses.push({
      url: lead.url,
      status: validation.status,
      method: validation.method,
      valid: validation.valid,
      error: validation.error || null,
    });
    if (!validation.valid) {
      skippedReasons.invalid += 1;
      continue;
    }

    const page = await fetchPageInfo(lead.url);
    const inferredTitle = inferTitleFromUrl(lead.url, page.title || lead.title);
    const title = cleanInferredTitle(lead.url, inferredTitle);
    const description = sanitizeText(page.description || lead.description || `${title} tool overview.`, 260);

    const normalizedType = normalizeResourceType(lead.resourceType);
    const sourceTags = uniqStrings(lead.sourceTags, 16);
    const sourceIndustries = uniqStrings(lead.sourceIndustries, 16);
    const sourceCollection = sanitizeText(lead.sourceCollection || '', 24).toLowerCase();

    const lowQualityReason = detectLowQualityReason(
      {
        ...lead,
        url: lead.url,
        title,
        description,
        resourceType: normalizedType,
        sourceTags,
      },
      playbook
    );
    if (!title || lowQualityReason) {
      skippedReasons.lowQuality += 1;
      continue;
    }

    const category = classifyCategory({
      url: lead.url,
      title,
      description,
      resourceType: normalizedType,
      sourceCollection,
      sourceTags,
    });

    const slug = slugify(title);
    if (!slug || existingIndex.slugSet.has(slug)) {
      skippedReasons.slugConflict += 1;
      continue;
    }

    const sourceDomain = getHostname(lead.url);
    const bestNot = generateBestForNotFor(category);
    const generatedTags = generateTags({
      title,
      description,
      category,
      resourceType: normalizedType,
      sourceTags,
    });
    const marketing = isMarketingLead(
      { title, description, tags: [...generatedTags, ...sourceTags] },
      playbook
    );
    const industries = deriveIndustries({
      sourceIndustries,
      sourceTags,
      title,
      description,
      marketing,
    });
    const tags = uniqStrings(
      marketing ? [...generatedTags, ...sourceTags, 'marketing'] : [...generatedTags, ...sourceTags],
      12
    );

    const enriched = {
      url: lead.url,
      title,
      slug,
      description,
      category,
      resourceType: normalizedType,
      tags,
      ...(industries.length > 0 ? { industries } : {}),
      bestFor: bestNot.bestFor,
      notFor: bestNot.notFor,
      alternatives: generateAlternatives(title),
      body: buildBody(title, description, category),
      sources: [
        {
          _key: randomUUID(),
          label: `${title} official site`,
          url: lead.url,
        },
      ],
      source: lead.source || 'unknown',
      sourceDomain,
      sourceCollection,
      sourceTags,
      sourceIndustries,
      image: page.image,
      contentTier: 'tier3',
      refreshCadenceDays: 90,
      factCheckStatus: 'needs-review',
      researchMethod: {
        playbookVersion: playbook.version,
        validationMethod: validation.method,
        validationStatus: validation.status,
        fetchedAt: validation.validatedAt,
        lowQualityReason: null,
      },
      lastReviewedAt: new Date().toISOString(),
      validatedAt: new Date().toISOString(),
    };

    validated.push(enriched);
    existingIndex.urlSet.add(lead.url);
    existingIndex.slugSet.add(slug);

    await sleep(80);
  }

  saveJson(VALIDATED_FILE, validated);
  enqueueValidatedResources(validated);

  const createdByCategory = {};
  const createdBySource = {};
  for (const row of validated) {
    const key = String(row.category || 'unknown');
    createdByCategory[key] = (createdByCategory[key] || 0) + 1;
    const sourceKey = String(row.source || 'unknown');
    createdBySource[sourceKey] = (createdBySource[sourceKey] || 0) + 1;
  }

  const report = {
    runId,
    generatedAt: new Date().toISOString(),
    playbookVersion: playbook.version,
    queued: queue.length,
    prioritized: prioritizedQueue.length,
    validated: validated.length,
    skippedReasons,
    createdByCategory,
    createdBySource,
    validationStatuses: validationStatuses.slice(0, 120),
    durationMs: Date.now() - startedAt,
  };
  saveJson(RESEARCH_REPORT_FILE, report);

  await logEvent({
    agentId: 'research',
    taskId: runId,
    actionType: 'completed',
    target: 'research.pipeline',
    metadata: {
      validated: validated.length,
      queued: queue.length,
      createdByCategory,
      createdBySource,
      playbookVersion: playbook.version,
    },
    durationMs: Date.now() - startedAt,
    status: 'completed',
  });

  console.log(
    `RESEARCH processed=${queue.length} validated=${validated.length} report=${RESEARCH_REPORT_FILE}`
  );
  return validated;
}

async function runFromCli() {
  try {
    const validated = await runResearchAgent();
    console.log('RESEARCH done');
    console.log(JSON.stringify({ validated: validated.length }, null, 2));
  } catch (error) {
    await logEvent({
      agentId: 'research',
      taskId: `research-failed-${Date.now()}`,
      actionType: 'failed',
      target: 'research.pipeline',
      metadata: null,
      status: 'failed',
      error: error.message,
    });
    console.error(`RESEARCH failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
