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
const MAX_QUEUE_SIZE = 80;
const MAX_NEW_LEADS = 12;

const BLOCKED_HOST_PATTERNS = [
  /(^|\.)reddit\.com$/,
  /(^|\.)x\.com$/,
  /(^|\.)twitter\.com$/,
  /(^|\.)facebook\.com$/,
  /(^|\.)instagram\.com$/,
  /(^|\.)techcrunch\.com$/,
  /(^|\.)substack\.com$/,
  /(^|\.)medium\.com$/,
  /(^|\.)dev\.to$/,
  /(^|\.)hashnode\.com$/,
  /(^|\.)chrisbrunet\.com$/,
  /(^|\.)rsdoiel\.github\.io$/,
  /(^|\.)magicalmushroom\.com$/,
  /(^|\.)discuss\.ai\.google\.dev$/,
  /(^|\.)lesswrong\.com$/,
  /(^|\.)science\.org$/,
  /(^|\.)spectrum\.ieee\.org$/,
  /(^|\.)wikipedia\.org$/,
];

const BLOCKED_PATH_PATTERNS = [
  /\/age-verification/i,
  /\/content\/article\//i,
  /\/blog\//i,
  /\/news\//i,
  /\/article\//i,
  /\/posts?\//i,
  /\/p\//i,
  /\/20\d{2}\/\d{2}\//i,
  /\/index$/i,
];

const BLOCKED_TITLE_PATTERNS = [
  /^home page$/i,
  /\|\s*techcrunch/i,
  /journal citation cartel/i,
  /ramblings/i,
];

const LOW_SIGNAL_GITHUB_REPO_PATTERNS = [/^awesome-/i, /bench$/i, /benchmark/i, /usecases?$/i];

const POSITIVE_KEYWORDS = [
  'tool',
  'tools',
  'open source',
  'open-source',
  'repository',
  'github',
  'library',
  'framework',
  'component',
  'design system',
  'ui kit',
  'sdk',
  'api',
  'cli',
  'developer',
  'devtool',
  'productivity',
  'automation',
  'agent',
  'plugin',
  'extension',
  'workflow',
  'ide',
  'editor',
  'saas',
  'template',
];

const NEGATIVE_KEYWORDS = [
  'viking',
  'surveillance camera',
  'journal citation cartel',
  'politics',
  'sports',
  'celebrity',
  'crime',
  'war',
  'election',
  'opinion',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeText(value, max = 260) {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
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

function scoreLead(lead) {
  const text = `${lead.title} ${lead.description} ${lead.url}`.toLowerCase();
  let score = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (text.includes(keyword)) score += 1;
  }
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (text.includes(keyword)) score -= 2;
  }

  if (lead.source === 'GitHub Search') score += 2;
  if (lead.source === 'Product Hunt Feed') score += 1;
  if (lead.source === 'Hacker News' && (lead.score || 0) > 120) score += 1;

  const hostname = getHostname(lead.url);
  if (hostname.endsWith('github.com')) score += 1;

  return score;
}

function isBlockedLead(lead) {
  const hostname = getHostname(lead.url);
  if (!hostname) return true;
  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) return true;

  const lowerUrl = String(lead.url || '').toLowerCase();
  if (BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(lowerUrl))) return true;
  if (BLOCKED_TITLE_PATTERNS.some((pattern) => pattern.test(String(lead.title || '')))) return true;

  if (hostname === 'github.com') {
    try {
      const parsed = new URL(lead.url);
      const repo = parsed.pathname.split('/').filter(Boolean)[1] || '';
      if (LOW_SIGNAL_GITHUB_REPO_PATTERNS.some((pattern) => pattern.test(repo))) return true;
    } catch {
      return true;
    }
  }

  return false;
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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

async function fetchGitHubLeads() {
  const leads = [];
  const sinceDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21)
    .toISOString()
    .slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=created:%3E${sinceDate}%20stars:%3E30&sort=stars&order=desc&per_page=30`;

  try {
    const json = await fetchJson(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'TheStashScout',
      },
    });

    for (const repo of asArray(json.items).slice(0, 20)) {
      if (!repo || !repo.html_url) continue;
      const title = sanitizeText(repo.full_name || repo.name || '');
      const description = sanitizeText(repo.description || `${title} repository`);
      leads.push({
        url: repo.html_url,
        title,
        description,
        source: 'GitHub Search',
        stars: repo.stargazers_count || 0,
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
    for (const id of asArray(topIds).slice(0, 50)) {
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

        leads.push({
          url: story.url,
          title: sanitizeText(story.title),
          description: sanitizeText(`${story.title} (${story.score} points on Hacker News)`),
          source: 'Hacker News',
          score: story.score,
        });
      } catch {
        // Ignore individual story parse errors.
      }
      await sleep(40);
    }
  } catch (error) {
    console.log(`WARN hn source failed: ${error.message}`);
  }
  return leads;
}

async function fetchProductHuntFeedLeads() {
  const leads = [];
  try {
    const xml = await fetchText('https://www.producthunt.com/feed', {
      headers: { 'User-Agent': 'TheStashScout' },
    });
    const items = parseRssItems(xml, 20);

    for (const item of items) {
      leads.push({
        url: item.link,
        title: sanitizeText(item.title),
        description: sanitizeText(item.description || `${item.title} on Product Hunt`),
        source: 'Product Hunt Feed',
      });
    }
  } catch (error) {
    console.log(`WARN producthunt source failed: ${error.message}`);
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

export async function runScoutAgent() {
  const taskId = `scout-${Date.now()}`;
  await assertRunAllowed({
    agentId: 'scout',
    taskId,
    target: 'scout.pipeline',
    stage: 'start',
  });

  console.log('SCOUT start');

  const sanity = getSanityClient();
  const existingResourceUrls = await getExistingResourceUrlSet(sanity);
  const existingQueue = loadJson(QUEUE_FILE, []);
  const existingQueueUrls = new Set(existingQueue.map((lead) => normalizeUrl(lead.url)).filter(Boolean));

  const [githubLeads, hackerNewsLeads, productHuntLeads] = await Promise.all([
    fetchGitHubLeads(),
    fetchHackerNewsLeads(taskId),
    fetchProductHuntFeedLeads(),
  ]);

  const rawLeads = [...githubLeads, ...hackerNewsLeads, ...productHuntLeads];
  const dedupedByUrl = new Map();

  for (const lead of rawLeads) {
    await assertRunAllowed({
      agentId: 'scout',
      taskId,
      target: 'scout.filtering',
      stage: 'score-and-filter',
    });

    if (!lead || !lead.url || !lead.title) continue;
    if (isBlockedLead(lead)) continue;

    const normalizedUrl = normalizeUrl(lead.url);
    if (!normalizedUrl) continue;

    const enriched = {
      ...lead,
      url: normalizedUrl,
      description: sanitizeText(lead.description || lead.title, 260),
      category: classifyCategory(lead.url, lead.title, lead.description),
      sourceDomain: getHostname(lead.url),
      discoveredAt: new Date().toISOString(),
    };
    enriched.relevanceScore = scoreLead(enriched);

    if (enriched.relevanceScore < 2) continue;
    if (existingResourceUrls.has(normalizedUrl)) continue;

    const existing = dedupedByUrl.get(normalizedUrl);
    if (!existing || enriched.relevanceScore > existing.relevanceScore) {
      dedupedByUrl.set(normalizedUrl, enriched);
    }
  }

  const newLeads = [...dedupedByUrl.values()]
    .filter((lead) => !existingQueueUrls.has(lead.url))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, MAX_NEW_LEADS);

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

  saveJson(QUEUE_FILE, mergedQueue.slice(0, MAX_QUEUE_SIZE));

  console.log(`SCOUT discovered=${rawLeads.length} shortlisted=${newLeads.length} queue=${Math.min(mergedQueue.length, MAX_QUEUE_SIZE)}`);
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
