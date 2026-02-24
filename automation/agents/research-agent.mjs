/**
 * RESEARCH AGENT - Validates and enriches queued discovery leads.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/research-agent.mjs
 */

import { randomUUID } from 'node:crypto';
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
  version: '2026-02-24.1',
  categoryPriority: [
    'ui-ux-resources',
    'coding',
    'github',
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
    'miscellaneous',
  ],
  marketingSignals: [
    'marketing',
    'growth',
    'seo',
    'newsletter',
    'email',
    'social',
    'ppc',
    'ads',
    'content',
    'campaign',
  ],
  blockedHosts: ['reddit.com', 'x.com', 'twitter.com', 'facebook.com', 'instagram.com'],
  nonToolHosts: [
    'techcrunch.com',
    'substack.com',
    'medium.com',
    'dev.to',
    'hashnode.com',
    'chrisbrunet.com',
    'rsdoiel.github.io',
    'magicalmushroom.com',
  ],
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

function loadResearchPlaybook() {
  const fromDisk = loadJson(RESEARCH_PLAYBOOK_FILE, null);
  if (!fromDisk || typeof fromDisk !== 'object') return DEFAULT_RESEARCH_PLAYBOOK;
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
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeText(value, max = 260) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function classifyCategory(url, title, description) {
  const text = `${url} ${title} ${description}`.toLowerCase();

  if (/(ai|llm|gpt|copilot|agent|prompt|model)/.test(text)) return 'ai-tools';
  if (/(figma|design|sketch|adobe|prototype|wireframe)/.test(text)) return 'design-tools';
  if (/(component|ui kit|icon|tailwind|shadcn|radix)/.test(text)) return 'ui-ux-resources';
  if (/(webflow)/.test(text)) return 'webflow';
  if (/(learn|tutorial|course|docs|documentation|guide)/.test(text)) return 'learning-resources';
  if (/(productivity|task|notes|workflow|project management)/.test(text)) return 'productivity';
  if (/(inspiration|showcase|gallery|portfolio|dribbble|awwwards)/.test(text)) return 'inspiration';
  if (/(html|css|javascript|typescript|react|vue|svelte)/.test(text)) return 'coding';
  return 'development-tools';
}

function generateTags(title, description, category) {
  const text = `${title} ${description}`;
  const tags = new Set([category]);

  for (const [tag, pattern] of Object.entries(TAG_KEYWORDS)) {
    if (pattern.test(text)) tags.add(tag);
  }

  return [...tags].slice(0, 8);
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

function hasStrongToolSignal(url, title, description) {
  const hostname = getHostname(url);
  if (hostname === 'github.com') {
    const parts = getPathname(url).split('/').filter(Boolean);
    return parts.length >= 2;
  }
  return TOOL_SIGNAL_PATTERN.test(`${title || ''} ${description || ''} ${url || ''}`);
}

function detectLowQualityReason(url, title, description, playbook) {
  const hostname = getHostname(url);
  const pathname = getPathname(url);
  const titleText = String(title || '');
  const fullText = `${title || ''} ${description || ''}`.toLowerCase();

  if (NON_TOOL_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) return 'non_tool_host';
  if (matchesHostList(hostname, playbook.nonToolHosts)) return 'playbook_non_tool_host';
  if (NON_TOOL_TITLE_PATTERNS.some((pattern) => pattern.test(titleText))) return 'non_tool_title';

  const hasToolSignal = hasStrongToolSignal(url, title, description);
  if (NON_TOOL_PATH_PATTERNS.some((pattern) => pattern.test(pathname)) && !hasToolSignal) {
    return 'article_like_path';
  }

  if (hostname === 'github.com') {
    const repoName = getPathname(url).split('/').filter(Boolean)[1] || '';
    if (LOW_SIGNAL_GITHUB_REPO_PATTERNS.some((pattern) => pattern.test(repoName))) {
      return 'low_signal_repo';
    }
  }

  if (!hasToolSignal && /\b(news|opinion|camera|cartel|adopts rust|weblog|ramblings)\b/i.test(fullText)) {
    return 'not_tool_signal';
  }

  return '';
}

function isBlockedLead(url, playbook) {
  const hostname = getHostname(url);
  if (!hostname) return true;
  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) return true;
  if (matchesHostList(hostname, playbook.blockedHosts)) return true;
  if (matchesHostList(hostname, playbook.nonToolHosts)) return true;
  return false;
}

function isMarketingLead({ title, description, tags }, playbook) {
  const text = `${title || ''} ${description || ''} ${asArray(tags).join(' ')}`.toLowerCase();
  return asArray(playbook.marketingSignals).some((token) =>
    text.includes(String(token || '').toLowerCase())
  );
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
  const category = String(lead?.category || classifyCategory(lead?.url, lead?.title, lead?.description));
  const allCounts = Object.values(categoryCounts);
  const maxCount = allCounts.length > 0 ? Math.max(...allCounts) : 0;
  const currentCount = categoryCounts[category] || 0;
  const scarcityBoost = Math.max(maxCount - currentCount, 0);
  const sourceBoost = /github search|product hunt/i.test(String(lead?.source || '')) ? 2 : 0;
  const priorityRank = asArray(playbook.categoryPriority).indexOf(category);
  const rankBoost =
    priorityRank === -1
      ? 0
      : Math.max(asArray(playbook.categoryPriority).length - priorityRank, 1) * 0.2;
  return {
    category,
    score: Number(lead?.relevanceScore || 0) + scarcityBoost * 0.35 + sourceBoost + rankBoost,
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
    queue.push({ ...lead, url: normalized });
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

    if (!lead.url || !lead.title) continue;
    if (isBlockedLead(lead.url, playbook)) {
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

    const validation = await validateUrl(lead.url);
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

    const lowQualityReason = detectLowQualityReason(lead.url, title, description, playbook);
    if (!title || lowQualityReason) {
      skippedReasons.lowQuality += 1;
      continue;
    }

    const category = classifyCategory(lead.url, title, description);

    const slug = slugify(title);
    if (!slug || existingIndex.slugSet.has(slug)) {
      skippedReasons.slugConflict += 1;
      continue;
    }

    const sourceDomain = getHostname(lead.url);
    const bestNot = generateBestForNotFor(category);
    const generatedTags = generateTags(title, description, category);
    const marketing = isMarketingLead(
      { title, description, tags: generatedTags },
      playbook
    );

    const enriched = {
      url: lead.url,
      title,
      slug,
      description,
      category,
      tags: marketing ? [...new Set([...generatedTags, 'marketing'])] : generatedTags,
      ...(marketing ? { industries: ['marketing'] } : {}),
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
      image: page.image,
      contentTier: 'tier3',
      refreshCadenceDays: 90,
      factCheckStatus: 'needs-review',
      researchMethod: {
        playbookVersion: playbook.version,
        validationMethod: validation.method,
        validationStatus: validation.status,
        fetchedAt: validation.validatedAt,
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
  for (const row of validated) {
    const key = String(row.category || 'unknown');
    createdByCategory[key] = (createdByCategory[key] || 0) + 1;
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
