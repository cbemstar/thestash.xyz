/**
 * SCOUT AGENT - Discovers tool/resource leads from high-signal sources.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/scout-agent.mjs
 */

import {
  asArray,
  getHostname,
  getSanityClient,
  isDirectRun,
  loadJson,
  normalizeUrl,
  saveJson,
} from './agent-shared.mjs';
import { assertRunAllowed } from './runtime-control.mjs';

const QUEUE_FILE = './automation/agents/lead-queue.json';
const PLAYBOOK_FILE = './automation/agents/resource-research-playbook.json';

const DEFAULT_SCOUT_POLICY = {
  sourcePriority: ['NoCodeSupply', 'Futurepedia', 'Product Hunt Feed', 'Hacker News', 'GitHub Search'],
  maxNewLeads: 140,
  maxQueueSize: 1200,
  maxGithubShare: 0.15,
  maxGithubLeads: 16,
  minRelevanceScore: 2,
  noCodeSupplyItemSamples: 80,
  futurepediaToolSamples: 40,
  futurepediaCategories: [
    '/ai-tools/productivity',
    '/ai-tools/marketing',
    '/ai-tools/code',
    '/ai-tools/design',
    '/ai-tools/workflow-automation',
  ],
  disallowedNoCodeSupplyCollections: ['inspo'],
  rejectInspoWebsites: true,
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
  blockedHosts: [
    'reddit.com',
    'x.com',
    'twitter.com',
    'facebook.com',
    'instagram.com',
    'tiktok.com',
    'techcrunch.com',
    'substack.com',
    'medium.com',
    'dev.to',
    'hashnode.com',
    'hackernoon.com',
    'towardsdatascience.com',
    'wikipedia.org',
  ],
};

const MAX_FETCH_CONCURRENCY = 6;

const BLOCKED_PATH_PATTERNS = [
  /\/age-verification/i,
  /\/content\/article\//i,
  /\/blog\//i,
  /\/news\//i,
  /\/article\//i,
  /\/posts?\//i,
  /\/newsletter\//i,
  /\/p\//i,
  /\/20\d{2}\/\d{2}\//i,
  /\/index$/i,
];

const BLOCKED_TITLE_PATTERNS = [
  /^home page$/i,
  /\|\s*techcrunch/i,
  /\bjournal citation cartel\b/i,
  /\bramblings\b/i,
];

const LOW_SIGNAL_GITHUB_REPO_PATTERNS = [/^awesome-/i, /bench$/i, /benchmark/i, /usecases?$/i];

const EXTERNAL_HOST_BLOCKLIST = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  'youtu.be',
  'pinterest.com',
  'tiktok.com',
  'nocodesupply.co',
  'futurepedia.io',
];

const POSITIVE_KEYWORDS = [
  'tool',
  'app',
  'platform',
  'open source',
  'open-source',
  'library',
  'framework',
  'component',
  'design system',
  'ui kit',
  'sdk',
  'api',
  'cli',
  'developer',
  'automation',
  'workflow',
  'editor',
  'saas',
  'template',
  'productivity',
];

const NEGATIVE_KEYWORDS = [
  'politics',
  'sports',
  'celebrity',
  'crime',
  'war',
  'election',
  'opinion',
  'newsletter issue',
];
const STRONG_TOOL_SIGNAL_PATTERN =
  /\b(tool|app|platform|software|api|sdk|framework|library|cli|plugin|extension|editor|assistant|automation|open[- ]source|template|component|kit|builder)\b/i;
const NOISY_NOCODESUPPLY_TAGS = new Set([
  'accessibility',
  'agency',
  'analytics',
  'api',
  'app',
  'authentication',
  'automation',
  'backend',
  'cms',
  'css',
  '3d',
  'aesthetic',
  'animation',
  'assets',
  'audio',
  'brand-guide',
  'landing',
  'scrollytelling',
  'personal',
  'portfolio',
  'gallery',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseShare(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  if (parsed > 1) return Math.min(parsed / 100, 1);
  return parsed;
}

function sanitizeText(value, max = 260) {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function uniqStrings(values, limit = 24) {
  const seen = new Set();
  const output = [];
  for (const value of asArray(values)) {
    const normalized = sanitizeText(value, 80)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
    if (output.length >= limit) break;
  }
  return output;
}

function asHostList(values) {
  return asArray(values)
    .map((value) => String(value || '').trim().toLowerCase().replace(/^\./, ''))
    .filter(Boolean);
}

function loadScoutPolicy() {
  const playbook = loadJson(PLAYBOOK_FILE, {});
  const scout = playbook?.scoutPolicy && typeof playbook.scoutPolicy === 'object'
    ? playbook.scoutPolicy
    : {};
  const playbookBlockedHosts = [
    ...asArray(playbook?.blockedHosts),
    ...asArray(playbook?.nonToolHosts),
  ];

  const policy = {
    ...DEFAULT_SCOUT_POLICY,
    ...scout,
    blockedHosts:
      playbookBlockedHosts.length > 0
        ? uniqStrings(playbookBlockedHosts, 120)
        : DEFAULT_SCOUT_POLICY.blockedHosts,
    allowedResourceTypes:
      asArray(playbook?.allowedResourceTypes).length > 0
        ? uniqStrings(playbook.allowedResourceTypes, 40)
        : DEFAULT_SCOUT_POLICY.allowedResourceTypes,
    disallowedResourceTypes:
      asArray(playbook?.disallowedResourceTypes).length > 0
        ? uniqStrings(playbook.disallowedResourceTypes, 40)
        : DEFAULT_SCOUT_POLICY.disallowedResourceTypes,
  };

  policy.maxNewLeads = parseNonNegativeInt(
    process.env.SCOUT_MAX_NEW_LEADS,
    parseNonNegativeInt(policy.maxNewLeads, DEFAULT_SCOUT_POLICY.maxNewLeads)
  );
  policy.maxQueueSize = parseNonNegativeInt(
    process.env.SCOUT_MAX_QUEUE_SIZE,
    parseNonNegativeInt(policy.maxQueueSize, DEFAULT_SCOUT_POLICY.maxQueueSize)
  );
  policy.maxGithubLeads = parsePositiveInt(
    process.env.SCOUT_MAX_GITHUB_LEADS,
    parsePositiveInt(policy.maxGithubLeads, DEFAULT_SCOUT_POLICY.maxGithubLeads)
  );
  policy.maxGithubShare = parseShare(
    process.env.SCOUT_MAX_GITHUB_SHARE,
    parseShare(policy.maxGithubShare, DEFAULT_SCOUT_POLICY.maxGithubShare)
  );
  policy.minRelevanceScore = parseNonNegativeInt(
    process.env.SCOUT_MIN_RELEVANCE_SCORE,
    parseNonNegativeInt(policy.minRelevanceScore, DEFAULT_SCOUT_POLICY.minRelevanceScore)
  );
  policy.noCodeSupplyItemSamples = parsePositiveInt(
    process.env.SCOUT_NOCODESUPPLY_ITEMS,
    parsePositiveInt(policy.noCodeSupplyItemSamples, DEFAULT_SCOUT_POLICY.noCodeSupplyItemSamples)
  );
  policy.futurepediaToolSamples = parsePositiveInt(
    process.env.SCOUT_FUTUREPEDIA_TOOLS,
    parsePositiveInt(policy.futurepediaToolSamples, DEFAULT_SCOUT_POLICY.futurepediaToolSamples)
  );
  policy.futurepediaCategories =
    asArray(policy.futurepediaCategories).length > 0
      ? asArray(policy.futurepediaCategories).map((value) => String(value || '').trim()).filter(Boolean)
      : DEFAULT_SCOUT_POLICY.futurepediaCategories;
  policy.disallowedNoCodeSupplyCollections =
    asArray(policy.disallowedNoCodeSupplyCollections).length > 0
      ? uniqStrings(policy.disallowedNoCodeSupplyCollections, 8)
      : DEFAULT_SCOUT_POLICY.disallowedNoCodeSupplyCollections;
  policy.rejectInspoWebsites =
    process.env.SCOUT_REJECT_INSPO_WEBSITES == null
      ? Boolean(policy.rejectInspoWebsites)
      : String(process.env.SCOUT_REJECT_INSPO_WEBSITES).trim() !== '0';

  policy.blockedHosts = asHostList(policy.blockedHosts);
  policy.allowedResourceTypes = uniqStrings(policy.allowedResourceTypes, 40);
  policy.disallowedResourceTypes = uniqStrings(policy.disallowedResourceTypes, 40);
  policy.sourcePriority = asArray(policy.sourcePriority).length > 0
    ? asArray(policy.sourcePriority).map((value) => String(value || '').trim()).filter(Boolean)
    : DEFAULT_SCOUT_POLICY.sourcePriority;

  return policy;
}

function shuffle(values) {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sample(values, count) {
  if (!Number.isFinite(count) || count <= 0) return [];
  if (values.length <= count) return [...values];
  return shuffle(values).slice(0, count);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      const value = await mapper(items[current], current);
      if (value !== undefined) results.push(value);
    }
  }

  const workers = [];
  const workerCount = Math.max(1, Math.min(limit, items.length));
  for (let i = 0; i < workerCount; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetchWithTimeout(url, options, 15000);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetchWithTimeout(url, options, 20000);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function parseRssItems(xml, maxItems = 20) {
  const items = [];
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, maxItems);

  const readTag = (block, tag) => {
    const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (!match) return '';
    return sanitizeText(
      match[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
    );
  };

  for (const match of matches) {
    const block = match[1];
    const title = readTag(block, 'title');
    const link = readTag(block, 'link');
    const description = readTag(block, 'description');
    if (!title || !link) continue;
    items.push({ title, link, description });
  }

  return items;
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
  return 'other';
}

function isDisallowedResourceType(type, policy) {
  const normalized = normalizeResourceType(type);
  const disallowed = new Set(policy.disallowedResourceTypes);
  const allowed = new Set(policy.allowedResourceTypes);
  if (disallowed.has(normalized)) return true;
  if (allowed.size > 0 && !allowed.has(normalized)) return true;
  return false;
}

function hasBlogLikePath(url) {
  return BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(String(url || '').toLowerCase()));
}

function hostMatchesList(hostname, values) {
  const host = String(hostname || '').toLowerCase();
  return asArray(values).some((value) => host === value || host.endsWith(`.${value}`));
}

function isExcludedExternalHost(hostname) {
  return hostMatchesList(hostname, EXTERNAL_HOST_BLOCKLIST);
}

function isLikelyPrimaryProductUrl(url) {
  const host = getHostname(url);
  if (!host || isExcludedExternalHost(host)) return false;
  if (hasBlogLikePath(url)) return false;
  return /^https?:\/\//i.test(String(url || ''));
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

  if (text.includes('webflow')) return 'webflow';
  if (text.includes('shadcn')) return 'shadcn';
  if (/(^|\s)html(\s|$)/.test(text)) return 'html';
  if (/(^|\s)css(\s|$)/.test(text)) return 'css';
  if (/(javascript|typescript|node\.js|react|vue|svelte)/.test(text)) return 'javascript';
  if (/(python|go|rust|kotlin|swift|scala|haskell|clojure|java)/.test(text)) return 'languages';
  if (/(ai|llm|gpt|copilot|agent|prompt|model)/.test(text)) return 'ai-tools';
  if (/(figma|design|wireframe|prototype|adobe|framer)/.test(text)) return 'design-tools';
  if (/(component|ui kit|icon|tailwind|radix)/.test(text)) return 'ui-ux-resources';
  if (/(learn|tutorial|course|docs|documentation|guide)/.test(text)) return 'learning-resources';
  if (/(productivity|task|notes|workflow|automation|planning)/.test(text)) return 'productivity';
  if (/(inspiration|showcase|gallery|portfolio|awwwards|dribbble)/.test(text)) return 'inspiration';
  if (/(github\.com)/.test(text)) return 'github';
  return 'development-tools';
}

function scoreLead(lead, categoryCounts, policy) {
  const text = `${lead.title} ${lead.description} ${lead.url} ${asArray(lead.sourceTags).join(' ')}`.toLowerCase();
  let score = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (text.includes(keyword)) score += 1;
  }
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (text.includes(keyword)) score -= 2;
  }

  const source = String(lead.source || '');
  if (source === 'NoCodeSupply') score += 4;
  if (source === 'Futurepedia') score += 3;
  if (source === 'Product Hunt Feed') score += 2;
  if (source === 'Hacker News') score += 1;

  const host = getHostname(lead.url);
  if (host === 'github.com') score -= 1;
  if (hasBlogLikePath(lead.url)) score -= 3;
  if (isDisallowedResourceType(lead.resourceType, policy)) score -= 8;

  const counts = Object.values(categoryCounts);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
  const currentCount = categoryCounts[lead.category] || 0;
  const scarcityBoost = Math.max(maxCount - currentCount, 0) * 0.08;
  score += scarcityBoost;

  return score;
}

function sourceBucket(source) {
  const normalized = String(source || '').toLowerCase();
  if (normalized.includes('github')) return 'github';
  if (normalized.includes('nocodesupply')) return 'nocodesupply';
  if (normalized.includes('futurepedia')) return 'futurepedia';
  if (normalized.includes('product hunt')) return 'producthunt';
  if (normalized.includes('hacker news')) return 'hackernews';
  return 'other';
}

function countBySource(rows) {
  const out = {};
  for (const row of asArray(rows)) {
    const key = String(row?.source || 'unknown');
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function isBlockedLead(lead, policy) {
  const hostname = getHostname(lead.url);
  if (!hostname) return true;
  if (hostMatchesList(hostname, policy.blockedHosts)) return true;

  const lowerUrl = String(lead.url || '').toLowerCase();
  const title = String(lead.title || '');
  if (BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(lowerUrl))) return true;
  if (BLOCKED_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return true;

  const sourceCollection = String(lead?.sourceCollection || '').toLowerCase();
  const type = normalizeResourceType(lead?.resourceType);
  if (
    sourceCollection &&
    asArray(policy.disallowedNoCodeSupplyCollections).includes(sourceCollection)
  ) {
    return true;
  }
  if (policy.rejectInspoWebsites && sourceCollection === 'inspo' && type === 'website') {
    return true;
  }

  if (hostname === 'github.com') {
    try {
      const parsed = new URL(lead.url);
      const repo = parsed.pathname.split('/').filter(Boolean)[1] || '';
      if (LOW_SIGNAL_GITHUB_REPO_PATTERNS.some((pattern) => pattern.test(repo))) return true;
    } catch {
      return true;
    }
  }

  if (isDisallowedResourceType(lead.resourceType, policy)) return true;
  if (
    String(lead?.source || '').toLowerCase().includes('hacker news') &&
    type === 'tool' &&
    !STRONG_TOOL_SIGNAL_PATTERN.test(`${lead?.title || ''} ${lead?.description || ''}`)
  ) {
    return true;
  }
  return false;
}

async function fetchGitHubLeads() {
  const leads = [];
  const sinceDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString().slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=created:%3E${sinceDate}%20stars:%3E80&sort=stars&order=desc&per_page=35`;

  try {
    const json = await fetchJson(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'TheStashScout',
      },
    });

    for (const repo of asArray(json.items).slice(0, 30)) {
      if (!repo || !repo.html_url) continue;
      leads.push({
        url: repo.html_url,
        title: sanitizeText(repo.full_name || repo.name || ''),
        description: sanitizeText(repo.description || `${repo.full_name || repo.name} repository`),
        source: 'GitHub Search',
        stars: repo.stargazers_count || 0,
        resourceType: 'library',
        sourceTags: uniqStrings(repo.topics, 8),
      });
    }
  } catch (error) {
    console.log(`WARN github source failed: ${error.message}`);
  }

  return leads;
}

async function fetchHackerNewsLeads(taskId = 'scout-task') {
  const leads = [];
  try {
    const topIds = await fetchJson('https://hacker-news.firebaseio.com/v0/topstories.json');
    for (const id of asArray(topIds).slice(0, 70)) {
      await assertRunAllowed({
        agentId: 'scout',
        taskId,
        target: 'scout.hackernews',
        stage: `topstory:${id}`,
      });

      try {
        const story = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!story || !story.url || !story.title) continue;
        if ((story.score || 0) < 80) continue;
        const inferredType = inferHackerNewsResourceType(story);
        if (inferredType === 'article') continue;

        leads.push({
          url: story.url,
          title: sanitizeText(story.title),
          description: sanitizeText(`${story.title} (${story.score} points on Hacker News)`),
          source: 'Hacker News',
          score: story.score,
          resourceType: inferredType,
        });
      } catch {
        // Ignore per-item errors.
      }
      await sleep(35);
    }
  } catch (error) {
    console.log(`WARN hn source failed: ${error.message}`);
  }
  return leads;
}

function inferHackerNewsResourceType(story) {
  const title = sanitizeText(story?.title || '', 180);
  const url = String(story?.url || '');
  const host = getHostname(url);
  const lower = title.toLowerCase();

  if (lower.startsWith('show hn:')) return 'tool';
  if (host === 'github.com') return 'library';
  if (/(launch|launched|new app|new tool|open source|open-source|framework|library|sdk|api|editor|builder)/i.test(lower)) {
    return 'tool';
  }
  return 'article';
}

async function fetchProductHuntFeedLeads() {
  const leads = [];
  try {
    const xml = await fetchText('https://www.producthunt.com/feed', {
      headers: { 'User-Agent': 'TheStashScout' },
    });
    const items = parseRssItems(xml, 30);
    for (const item of items) {
      leads.push({
        url: item.link,
        title: sanitizeText(item.title),
        description: sanitizeText(item.description || `${item.title} on Product Hunt`),
        source: 'Product Hunt Feed',
        resourceType: 'app',
      });
    }
  } catch (error) {
    console.log(`WARN producthunt source failed: ${error.message}`);
  }
  return leads;
}

function extractNoCodeSupplyItemUrls(xml) {
  return [...xml.matchAll(/<loc>(https:\/\/www\.nocodesupply\.co\/item\/[^<]+)<\/loc>/gi)]
    .map((match) => String(match[1] || '').trim())
    .filter(Boolean);
}

function extractNoCodeSupplyPrimaryLink(pageHtml) {
  const html = String(pageHtml || '');
  const candidates = [];

  const buttonMatches = [...html.matchAll(/href="(https?:\/\/[^"]+)"\s+target="_blank"\s+class="btn cc-light w-inline-block"/gi)];
  for (const match of buttonMatches) candidates.push(match[1]);

  const scriptRedirect = html.match(/location\.href\s*=\s*"([^"]+)"/i);
  if (scriptRedirect?.[1]) candidates.push(scriptRedirect[1]);

  const refMatches = [...html.matchAll(/href="(https?:\/\/[^"]+\?ref=nocodesupply\.co[^"]*)"/gi)];
  for (const match of refMatches) candidates.push(match[1]);

  for (const candidate of candidates) {
    if (isLikelyPrimaryProductUrl(candidate)) return candidate;
  }
  return '';
}

function extractNoCodeSupplyTitle(pageHtml, fallback = '') {
  const html = String(pageHtml || '');
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match?.[1]) return sanitizeText(h1Match[1], 120);

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    const cleaned = titleMatch[1]
      .replace(/\s*\[[^\]]+\]\s*<>.*/i, '')
      .replace(/\s*<>.*/i, '')
      .trim();
    if (cleaned) return sanitizeText(cleaned, 120);
  }
  return sanitizeText(fallback, 120);
}

function extractNoCodeSupplyDescription(pageHtml, fallback = '') {
  const html = String(pageHtml || '');
  const meta = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
  if (meta?.[1]) return sanitizeText(meta[1], 260);
  return sanitizeText(fallback, 260);
}

function extractNoCodeSupplyType(pageHtml) {
  const html = String(pageHtml || '');
  const titleType = html.match(/<title>[^<]*\s+\[([^\]]+)\]\s*<>/i);
  if (titleType?.[1]) return normalizeResourceType(titleType[1]);
  const typeLink = html.match(/href="\/type\/([^"]+)"/i);
  if (typeLink?.[1]) return normalizeResourceType(typeLink[1]);
  return 'other';
}

function extractNoCodeSupplyTags(pageHtml) {
  const html = String(pageHtml || '');
  const raw = uniqStrings([...html.matchAll(/href="\/tag\/([^"]+)"/gi)].map((match) => match[1]), 24);
  return raw.filter((tag) => !NOISY_NOCODESUPPLY_TAGS.has(tag)).slice(0, 12);
}

function extractNoCodeSupplyIndustries(pageHtml) {
  const html = String(pageHtml || '');
  return uniqStrings([...html.matchAll(/href="\/industry\/([^"]+)"/gi)].map((match) => match[1]), 20);
}

function extractNoCodeSupplyCollection(pageHtml) {
  const html = String(pageHtml || '');
  const match = html.match(/href="\/(tools|code|learn|inspo)".{0,90}class="tag w-inline-block"/i);
  return match?.[1]?.toLowerCase() || '';
}

async function fetchNoCodeSupplyLeads(taskId, policy) {
  const leads = [];
  try {
    const sitemap = await fetchText('https://www.nocodesupply.co/sitemap.xml', {
      headers: { 'User-Agent': 'TheStashScout' },
    });
    const itemUrls = extractNoCodeSupplyItemUrls(sitemap);
    const selectedItems = sample(itemUrls, policy.noCodeSupplyItemSamples);

    const results = await mapWithConcurrency(
      selectedItems,
      MAX_FETCH_CONCURRENCY,
      async (itemUrl, index) => {
        await assertRunAllowed({
          agentId: 'scout',
          taskId,
          target: 'scout.nocodesupply',
          stage: `item:${index + 1}`,
        });

        try {
          const html = await fetchText(itemUrl, { headers: { 'User-Agent': 'TheStashScout' } });
          const outbound = extractNoCodeSupplyPrimaryLink(html);
          if (!outbound) return undefined;

          const resourceType = extractNoCodeSupplyType(html);
          if (isDisallowedResourceType(resourceType, policy)) return undefined;

          const title = extractNoCodeSupplyTitle(html, itemUrl.split('/').pop()?.replace(/-/g, ' '));
          const description = extractNoCodeSupplyDescription(html, `${title} resource`);
          const sourceTags = extractNoCodeSupplyTags(html);
          const sourceIndustries = extractNoCodeSupplyIndustries(html);
          const sourceCollection = extractNoCodeSupplyCollection(html);
          if (
            sourceCollection &&
            asArray(policy.disallowedNoCodeSupplyCollections).includes(sourceCollection)
          ) {
            return undefined;
          }
          if (policy.rejectInspoWebsites && sourceCollection === 'inspo' && resourceType === 'website') {
            return undefined;
          }

          return {
            url: outbound,
            title,
            description,
            source: 'NoCodeSupply',
            resourceType,
            sourceTags,
            sourceIndustries,
            sourceCollection,
          };
        } catch {
          return undefined;
        }
      }
    );

    leads.push(...results.filter(Boolean));
  } catch (error) {
    console.log(`WARN nocodesupply source failed: ${error.message}`);
  }
  return leads;
}

function extractFuturepediaToolSlugs(pageHtml) {
  const html = String(pageHtml || '');
  const escaped = [...html.matchAll(/\\\/tool\\\/([a-z0-9-]+)/gi)].map((match) => match[1]);
  const plain = [...html.matchAll(/\/tool\/([a-z0-9-]+)/gi)].map((match) => match[1]);
  return uniqStrings([...escaped, ...plain], 400);
}

function extractFuturepediaVisitLink(pageHtml) {
  const normalized = String(pageHtml || '')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&');

  const patterns = [
    /"href":"(https?:\/\/[^"]+)"[^]{0,260}data-tool-name/gi,
    /href="(https?:\/\/[^"]+)"[^>]*>\s*Visit Site/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...normalized.matchAll(pattern)];
    for (const match of matches) {
      const url = match?.[1] || '';
      if (!url) continue;
      if (isLikelyPrimaryProductUrl(url)) return url;
    }
  }
  return '';
}

function extractMetaContent(pageHtml, attrName, attrValue) {
  const html = String(pageHtml || '');
  const regex = new RegExp(`<meta[^>]+${attrName}="${attrValue}"[^>]+content="([^"]+)"`, 'i');
  const match = html.match(regex);
  return match?.[1] ? sanitizeText(match[1], 260) : '';
}

function extractFuturepediaTitle(pageHtml, slug) {
  const h1Match = String(pageHtml || '').match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match?.[1]) return sanitizeText(h1Match[1], 120);

  const ogTitle = extractMetaContent(pageHtml, 'property', 'og:title');
  if (ogTitle) {
    const cleaned = ogTitle
      .replace(/\s+reviews?:.*$/i, '')
      .replace(/\s+\|\s*futurepedia.*$/i, '')
      .trim();
    if (cleaned) return sanitizeText(cleaned, 120);
  }
  return sanitizeText(String(slug || '').replace(/-/g, ' '), 120);
}

function extractFuturepediaCategories(pageHtml) {
  const html = String(pageHtml || '').replace(/\\\//g, '/');
  const categories = [...html.matchAll(/href="\/ai-tools\/([a-z0-9-]+)"/gi)].map((match) => match[1]);
  return uniqStrings(categories, 12);
}

async function fetchFuturepediaLeads(taskId, policy) {
  const leads = [];
  try {
    const slugSet = new Set();
    for (const categoryPath of policy.futurepediaCategories) {
      await assertRunAllowed({
        agentId: 'scout',
        taskId,
        target: 'scout.futurepedia',
        stage: `category:${categoryPath}`,
      });
      try {
        const html = await fetchText(`https://www.futurepedia.io${categoryPath}`, {
          headers: { 'User-Agent': 'TheStashScout' },
        });
        for (const slug of extractFuturepediaToolSlugs(html)) {
          slugSet.add(slug);
        }
      } catch {
        // Ignore category failures.
      }
      await sleep(25);
    }

    const selectedSlugs = sample([...slugSet], policy.futurepediaToolSamples);
    const results = await mapWithConcurrency(
      selectedSlugs,
      MAX_FETCH_CONCURRENCY,
      async (slug, index) => {
        await assertRunAllowed({
          agentId: 'scout',
          taskId,
          target: 'scout.futurepedia',
          stage: `tool:${index + 1}`,
        });
        try {
          const pageUrl = `https://www.futurepedia.io/tool/${slug}`;
          const html = await fetchText(pageUrl, { headers: { 'User-Agent': 'TheStashScout' } });
          const visitUrl = extractFuturepediaVisitLink(html);
          if (!visitUrl) return undefined;

          const title = extractFuturepediaTitle(html, slug);
          const description =
            extractMetaContent(html, 'name', 'description') ||
            `${title} AI tool`;
          const categories = extractFuturepediaCategories(html);

          return {
            url: visitUrl,
            title,
            description,
            source: 'Futurepedia',
            resourceType: 'tool',
            sourceTags: categories,
            sourceCollection: 'tools',
          };
        } catch {
          return undefined;
        }
      }
    );

    leads.push(...results.filter(Boolean));
  } catch (error) {
    console.log(`WARN futurepedia source failed: ${error.message}`);
  }
  return leads;
}

async function getExistingResourceUrlSet(sanity) {
  try {
    const resources = await sanity.fetch(`*[_type == "resource"]{ "url": coalesce(url, "") }`);
    return new Set(resources.map((row) => normalizeUrl(row.url)).filter(Boolean));
  } catch (error) {
    console.log(`WARN could not load existing resource URLs: ${error.message}`);
    return new Set();
  }
}

async function loadCategoryCounts(sanity) {
  try {
    const rows = await sanity.fetch(`*[_type == "resource"]{ category }`);
    const counts = {};
    for (const row of asArray(rows)) {
      const category = String(row?.category || '').trim();
      if (!category) continue;
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

function selectDiverseLeads(candidateLeads, policy) {
  const grouped = new Map();
  for (const lead of candidateLeads) {
    const bucket = sourceBucket(lead.source);
    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket).push(lead);
  }

  for (const rows of grouped.values()) {
    rows.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  const selected = [];
  const selectedByBucket = {};
  const orderedBuckets = [
    ...uniqStrings(policy.sourcePriority.map((source) => sourceBucket(source)), 12),
    ...[...grouped.keys()].filter((key) => !policy.sourcePriority.map((source) => sourceBucket(source)).includes(key)),
  ];

  const maxNewLeads = policy.maxNewLeads;
  const githubLimitByShare =
    maxNewLeads > 0 ? Math.max(1, Math.floor(maxNewLeads * policy.maxGithubShare)) : policy.maxGithubLeads;
  const githubLimit = Math.min(policy.maxGithubLeads, githubLimitByShare);

  while (true) {
    let progressed = false;
    for (const bucket of orderedBuckets) {
      const rows = grouped.get(bucket);
      if (!rows || rows.length === 0) continue;

      if (bucket === 'github' && (selectedByBucket.github || 0) >= githubLimit) {
        continue;
      }

      const lead = rows.shift();
      if (!lead) continue;
      selected.push(lead);
      selectedByBucket[bucket] = (selectedByBucket[bucket] || 0) + 1;
      progressed = true;

      if (maxNewLeads > 0 && selected.length >= maxNewLeads) {
        return selected;
      }
    }
    if (!progressed) break;
  }

  return selected;
}

export async function runScoutAgent() {
  const taskId = `scout-${Date.now()}`;
  await assertRunAllowed({
    agentId: 'scout',
    taskId,
    target: 'scout.pipeline',
    stage: 'start',
  });

  const policy = loadScoutPolicy();
  console.log(`SCOUT start policy=${JSON.stringify({
    maxNewLeads: policy.maxNewLeads,
    maxQueueSize: policy.maxQueueSize,
    maxGithubLeads: policy.maxGithubLeads,
    maxGithubShare: policy.maxGithubShare,
    noCodeSupplyItemSamples: policy.noCodeSupplyItemSamples,
    futurepediaToolSamples: policy.futurepediaToolSamples,
  })}`);

  const sanity = getSanityClient();
  const [existingResourceUrls, categoryCounts] = await Promise.all([
    getExistingResourceUrlSet(sanity),
    loadCategoryCounts(sanity),
  ]);

  const existingQueue = loadJson(QUEUE_FILE, []);
  const existingQueueUrls = new Set(existingQueue.map((lead) => normalizeUrl(lead.url)).filter(Boolean));

  const [githubLeads, hackerNewsLeads, productHuntLeads, noCodeSupplyLeads, futurepediaLeads] =
    await Promise.all([
      fetchGitHubLeads(),
      fetchHackerNewsLeads(taskId),
      fetchProductHuntFeedLeads(),
      fetchNoCodeSupplyLeads(taskId, policy),
      fetchFuturepediaLeads(taskId, policy),
    ]);

  const rawLeads = [
    ...githubLeads,
    ...hackerNewsLeads,
    ...productHuntLeads,
    ...noCodeSupplyLeads,
    ...futurepediaLeads,
  ];

  const dedupedByUrl = new Map();
  for (const lead of rawLeads) {
    await assertRunAllowed({
      agentId: 'scout',
      taskId,
      target: 'scout.filtering',
      stage: 'score-and-filter',
    });

    if (!lead || !lead.url || !lead.title) continue;
    const normalizedUrl = normalizeUrl(lead.url);
    if (!normalizedUrl) continue;

    const category = classifyCategory({
      url: normalizedUrl,
      title: lead.title,
      description: lead.description,
      resourceType: lead.resourceType,
      sourceCollection: lead.sourceCollection,
      sourceTags: lead.sourceTags,
    });

    const normalizedLead = {
      ...lead,
      url: normalizedUrl,
      title: sanitizeText(lead.title, 120),
      description: sanitizeText(lead.description || lead.title, 260),
      category,
      sourceDomain: getHostname(normalizedUrl),
      sourceTags: uniqStrings(lead.sourceTags, 16),
      sourceIndustries: uniqStrings(lead.sourceIndustries, 16),
      resourceType: normalizeResourceType(lead.resourceType),
      sourceCollection: sanitizeText(lead.sourceCollection || '', 40).toLowerCase(),
      discoveredAt: new Date().toISOString(),
    };

    if (isBlockedLead(normalizedLead, policy)) continue;
    normalizedLead.relevanceScore = scoreLead(normalizedLead, categoryCounts, policy);
    if (normalizedLead.relevanceScore < policy.minRelevanceScore) continue;
    if (existingResourceUrls.has(normalizedUrl)) continue;

    const existing = dedupedByUrl.get(normalizedUrl);
    if (!existing || normalizedLead.relevanceScore > existing.relevanceScore) {
      dedupedByUrl.set(normalizedUrl, normalizedLead);
    }
  }

  const candidateLeads = [...dedupedByUrl.values()]
    .filter((lead) => !existingQueueUrls.has(lead.url))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const newLeads = selectDiverseLeads(candidateLeads, policy);
  const mergedQueue = [];
  const seen = new Set(existingResourceUrls);

  for (const lead of [...newLeads, ...existingQueue]) {
    await assertRunAllowed({
      agentId: 'scout',
      taskId,
      target: 'scout.queue-merge',
      stage: 'merge',
    });
    const normalizedUrl = normalizeUrl(lead.url);
    if (!normalizedUrl || seen.has(normalizedUrl)) continue;
    seen.add(normalizedUrl);
    mergedQueue.push({ ...lead, url: normalizedUrl });
  }

  const finalQueue =
    policy.maxQueueSize > 0 ? mergedQueue.slice(0, policy.maxQueueSize) : mergedQueue;
  saveJson(QUEUE_FILE, finalQueue);

  const discoveredBySource = countBySource(rawLeads);
  const shortlistedBySource = countBySource(newLeads);
  console.log(
    `SCOUT discovered=${rawLeads.length} shortlisted=${newLeads.length} queue=${finalQueue.length}`
  );
  console.log(`SCOUT discoveredBySource=${JSON.stringify(discoveredBySource)}`);
  console.log(`SCOUT shortlistedBySource=${JSON.stringify(shortlistedBySource)}`);
  return newLeads;
}

async function runFromCli() {
  try {
    const leads = await runScoutAgent();
    console.log('SCOUT done');
    console.log(JSON.stringify({ leads: leads.length }, null, 2));
  } catch (error) {
    console.error(`SCOUT failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
