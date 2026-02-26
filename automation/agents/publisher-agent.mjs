/**
 * PUBLISHER AGENT - Publishes approved queue items to Sanity.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/publisher-agent.mjs
 */

import { randomUUID } from 'node:crypto';
import { logEvent } from './event-logger.mjs';
import { assertRunAllowed } from './runtime-control.mjs';
import {
  asArray,
  getSanityClient,
  isDirectRun,
  loadJson,
  normalizeUrl,
  saveJson,
} from './agent-shared.mjs';

const APPROVAL_QUEUE_FILE = './automation/agents/approval-queue.json';
const PUBLISHED_LOG_FILE = './automation/agents/published-log.json';
const VALID_INDUSTRIES = new Set([
  'e-commerce',
  'saas',
  'content',
  'community',
  'developer',
  'marketing',
  'general',
]);
const VALID_RESOURCE_TYPES = new Set([
  'app',
  'website',
  'utility',
  'library',
  'directory',
  'article',
  'tool',
  'component',
  'snippet',
  'course',
  'framework',
  'other',
]);

function sanitizeStringArray(value, limit = 12) {
  return asArray(value)
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeTagArray(value, limit = 16) {
  const seen = new Set();
  const tags = [];
  for (const row of asArray(value)) {
    const normalized = String(row || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9- ]+/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    tags.push(normalized);
    if (tags.length >= limit) break;
  }
  return tags;
}

function sanitizeSources(sources) {
  return asArray(sources)
    .filter((source) => source && source.label && source.url)
    .map((source) => ({
      _key: source._key || randomUUID(),
      label: String(source.label).trim(),
      url: String(source.url).trim(),
    }))
    .slice(0, 12);
}

function sanitizeReference(value) {
  if (!value || typeof value !== 'object') return null;
  const rawRef = typeof value._ref === 'string' ? value._ref : value._id;
  const ref = String(rawRef || '').trim().replace(/^drafts\./, '');
  if (!ref) return null;
  return { _type: 'reference', _ref: ref };
}

function sanitizeReferenceArray(values, limit = 8) {
  const seen = new Set();
  const refs = [];
  for (const value of asArray(values)) {
    const ref = sanitizeReference(value);
    if (!ref || seen.has(ref._ref)) continue;
    seen.add(ref._ref);
    refs.push(ref);
    if (refs.length >= limit) break;
  }
  return refs;
}

function normalizeIndustry(value) {
  const token = String(value || '').trim().toLowerCase();
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

function sanitizeIndustries(values) {
  const seen = new Set();
  const output = [];
  for (const value of asArray(values)) {
    const normalized = normalizeIndustry(value) || String(value || '').trim().toLowerCase();
    if (!normalized || !VALID_INDUSTRIES.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output.slice(0, 6);
}

function normalizeResourceType(value) {
  const token = String(value || '').trim().toLowerCase();
  if (!token) return '';
  if (/(^|\b)app(\b|$)/.test(token)) return 'app';
  if (/(^|\b)website(\b|$)/.test(token)) return 'website';
  if (/(^|\b)utility(\b|$)/.test(token)) return 'utility';
  if (/(^|\b)tool(\b|$)/.test(token)) return 'tool';
  if (/(^|\b)library(\b|$)/.test(token)) return 'library';
  if (/(^|\b)framework(\b|$)/.test(token)) return 'framework';
  if (/(^|\b)component(\b|$)/.test(token)) return 'component';
  if (/(^|\b)directory(\b|$)/.test(token)) return 'directory';
  if (/(^|\b)template(\b|$)/.test(token)) return 'other';
  if (/(^|\b)course(\b|$)/.test(token)) return 'course';
  if (/(^|\b)snippet(\b|$)/.test(token)) return 'snippet';
  if (/(^|\b)article(\b|$)/.test(token)) return 'article';
  if (/(^|\b)video(\b|$)/.test(token)) return 'other';
  if (/(^|\b)blog(\b|$)/.test(token)) return 'article';
  if (/(^|\b)newsletter(\b|$)/.test(token)) return 'other';
  return 'other';
}

function sanitizeResourceType(value) {
  const normalized = normalizeResourceType(value);
  if (!normalized || !VALID_RESOURCE_TYPES.has(normalized)) return null;
  return normalized;
}

async function resolveAlternativeRefs(sanity, alternatives) {
  const slugs = sanitizeStringArray(alternatives, 20)
    .map((slug) => slug.toLowerCase())
    .filter((slug) => /^[a-z0-9-]+$/.test(slug));

  if (slugs.length === 0) return [];

  const rows = await sanity.fetch(`*[_type == "resource" && slug in $slugs]{ _id, slug }`, { slugs });
  const idsBySlug = new Map(rows.map((row) => [row.slug, row._id]));

  return slugs
    .map((slug) => idsBySlug.get(slug))
    .filter(Boolean)
    .map((id) => ({ _type: 'reference', _ref: id }));
}

async function publishResource(sanity, resource) {
  const startTime = Date.now();
  const taskId = `resource-${Date.now()}`;

  await logEvent({
    agentId: 'publisher',
    taskId,
    actionType: 'started',
    target: 'publishResource',
    metadata: { title: resource?.title, url: resource?.url },
    status: 'running',
  });

  const url = normalizeUrl(resource?.url || '');
  const slug = String(resource?.slug || '').toLowerCase();
  if (!url || !slug) {
    return { success: false, error: 'resource missing url or slug' };
  }

  try {
    const existing = await sanity.fetch(
      `*[_type == "resource" && (slug == $slug || lower(url) == $url)][0]{ _id }`,
      { slug, url }
    );

    if (existing?._id) {
      await logEvent({
        agentId: 'publisher',
        taskId,
        actionType: 'db_write',
        target: 'sanity.create:resource',
        metadata: { id: existing._id, skipped: true },
        durationMs: Date.now() - startTime,
        status: 'completed',
      });
      return { success: true, id: existing._id, skipped: true };
    }

    const alternatives = await resolveAlternativeRefs(sanity, resource?.alternatives);

    const sourceTags = sanitizeTagArray(resource.sourceTags, 20);
    const mergedTags = sanitizeTagArray(
      [...asArray(resource.tags), ...sourceTags, resource.sourceCollection],
      14
    );
    const industries = sanitizeIndustries([
      ...asArray(resource.industries),
      ...asArray(resource.sourceIndustries),
    ]);
    const sourceIndustries = sanitizeIndustries(resource.sourceIndustries);
    const resourceType = sanitizeResourceType(resource.resourceType);
    const sourceCollection = String(resource.sourceCollection || '').trim().toLowerCase();
    const source = String(resource.source || '').trim();
    const sourceDomain = String(resource.sourceDomain || '').trim().toLowerCase();

    const doc = {
      _type: 'resource',
      title: String(resource.title || '').trim(),
      slug,
      url,
      description: String(resource.description || '').trim().slice(0, 260),
      category: resource.category,
      ...(resourceType ? { resourceType } : {}),
      tags: mergedTags,
      featured: Boolean(resource.featured),
      ...(industries.length > 0 ? { industries } : {}),
      bestFor: sanitizeStringArray(resource.bestFor, 8),
      notFor: sanitizeStringArray(resource.notFor, 8),
      ...(alternatives.length > 0 ? { alternatives } : {}),
      ...(resource.body ? { body: String(resource.body).trim() } : {}),
      ...(sanitizeSources(resource.sources).length > 0 ? { sources: sanitizeSources(resource.sources) } : {}),
      ...(sourceCollection ? { sourceCollection } : {}),
      ...(sourceTags.length > 0 ? { sourceTags } : {}),
      ...(sourceIndustries.length > 0 ? { sourceIndustries } : {}),
      ...(source ? { source } : {}),
      ...(sourceDomain ? { sourceDomain } : {}),
      contentTier: resource.contentTier || 'tier3',
      refreshCadenceDays: Number.isInteger(resource.refreshCadenceDays) ? resource.refreshCadenceDays : 90,
      factCheckStatus: resource.factCheckStatus || 'needs-review',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      lastReviewedAt: resource.lastReviewedAt || new Date().toISOString(),
    };

    const created = await sanity.create(doc);

    await logEvent({
      agentId: 'publisher',
      taskId,
      actionType: 'db_write',
      target: 'sanity.create:resource',
      metadata: { id: created._id, title: resource.title },
      durationMs: Date.now() - startTime,
      status: 'completed',
    });

    return { success: true, id: created._id };
  } catch (error) {
    await logEvent({
      agentId: 'publisher',
      taskId,
      actionType: 'db_write',
      target: 'sanity.create:resource',
      metadata: { title: resource?.title },
      durationMs: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    return { success: false, error: error.message };
  }
}

async function publishArticle(sanity, article) {
  const startTime = Date.now();
  const taskId = `article-${Date.now()}`;

  await logEvent({
    agentId: 'publisher',
    taskId,
    actionType: 'started',
    target: 'publishArticle',
    metadata: { title: article?.title, slug: article?.slug },
    status: 'running',
  });

  const slug = String(article?.slug || '').toLowerCase();
  if (!slug) return { success: false, error: 'article missing slug' };

  try {
    const existing = await sanity.fetch(
      `*[_type == "article" && slug == $slug][0]{ _id }`,
      { slug }
    );
    if (existing?._id) {
      await logEvent({
        agentId: 'publisher',
        taskId,
        actionType: 'db_write',
        target: 'sanity.create:article',
        metadata: { id: existing._id, skipped: true },
        durationMs: Date.now() - startTime,
        status: 'completed',
      });
      return { success: true, id: existing._id, skipped: true };
    }

    const tags = sanitizeStringArray(article.tags, 20);
    const relatedResources = sanitizeReferenceArray(article.relatedResources, 12);
    const primaryResource = sanitizeReference(article.primaryResource) || relatedResources[0] || null;
    const heroImageRef = String(article?.heroImage?.asset?._ref || '').trim();
    const heroImage = heroImageRef
      ? {
          _type: 'image',
          asset: { _type: 'reference', _ref: heroImageRef.replace(/^drafts\./, '') },
        }
      : null;

    const doc = {
      _type: 'article',
      title: String(article.title || '').trim(),
      slug,
      excerpt: String(article.excerpt || '').trim(),
      primaryKeyword: String(article.primaryKeyword || '').trim(),
      intentStage: article.intentStage || 'decision',
      contentTier: article.contentTier || 'tier3',
      body: asArray(article.body),
      category: article.category,
      ...(tags.length > 0 ? { tags } : {}),
      ...(relatedResources.length > 0 ? { relatedResources } : {}),
      ...(primaryResource ? { primaryResource } : {}),
      ...(heroImage ? { heroImage } : {}),
      ...(sanitizeSources(article.sources).length > 0 ? { sources: sanitizeSources(article.sources) } : {}),
      author: article.author || 'The Stash Editorial Team',
      publishedAt: new Date().toISOString(),
      lastReviewedAt: article.lastReviewedAt || new Date().toISOString(),
      refreshCadenceDays: Number.isInteger(article.refreshCadenceDays) ? article.refreshCadenceDays : 90,
      factCheckStatus: article.factCheckStatus || 'needs-review',
    };

    const created = await sanity.create(doc);

    await logEvent({
      agentId: 'publisher',
      taskId,
      actionType: 'db_write',
      target: 'sanity.create:article',
      metadata: { id: created._id, title: article.title },
      durationMs: Date.now() - startTime,
      status: 'completed',
    });

    return { success: true, id: created._id };
  } catch (error) {
    await logEvent({
      agentId: 'publisher',
      taskId,
      actionType: 'db_write',
      target: 'sanity.create:article',
      metadata: { title: article?.title },
      durationMs: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    return { success: false, error: error.message };
  }
}

function markReviewedAsApproved(queue) {
  let changed = 0;
  for (const item of queue) {
    if (item.status === 'reviewed') {
      item.status = 'approved';
      item.approvedAt = new Date().toISOString();
      changed += 1;
    }
  }
  return changed;
}

export async function runPublisherAgent(approvedItems = null) {
  const taskId = `publisher-${Date.now()}`;
  await assertRunAllowed({
    agentId: 'publisher',
    taskId,
    target: 'publisher.pipeline',
    stage: 'start',
  });

  console.log('PUBLISHER start');

  const sanity = getSanityClient();
  const queue = loadJson(APPROVAL_QUEUE_FILE, []);

  const itemsToPublish = approvedItems || queue.filter((item) => item.status === 'approved');
  if (itemsToPublish.length === 0) {
    console.log('PUBLISHER no approved items');
    return [];
  }

  const results = [];

  for (const item of itemsToPublish) {
    await assertRunAllowed({
      agentId: 'publisher',
      taskId,
      target: 'publisher.publish-item',
      stage: 'item',
    });

    let publishResult;
    if (item.type === 'resource') {
      publishResult = await publishResource(sanity, item.data);
    } else if (item.type === 'blog') {
      publishResult = await publishArticle(sanity, item.data);
    } else {
      publishResult = { success: false, error: `unsupported item type: ${item.type}` };
    }

    results.push({
      queueId: item.queueId || null,
      type: item.type,
      title: item?.data?.title || item?.data?.url || 'untitled',
      ...publishResult,
      publishedAt: new Date().toISOString(),
    });
  }

  if (!approvedItems) {
    const publishedQueueIds = new Set(
      results.filter((result) => result.success && result.queueId).map((result) => result.queueId)
    );
    const publishedLegacyKeys = new Set(
      results
        .filter((result) => result.success)
        .map((result) => String(result.title || '').trim())
        .filter(Boolean)
    );

    const updatedQueue = queue.filter((item) => {
      if (item.status !== 'approved') return true;
      if (item.queueId && publishedQueueIds.has(item.queueId)) return false;
      const legacyKey = String(item?.data?.title || item?.data?.url || '').trim();
      return !publishedLegacyKeys.has(legacyKey);
    });

    saveJson(APPROVAL_QUEUE_FILE, updatedQueue);
  }

  const publishedLog = loadJson(PUBLISHED_LOG_FILE, []);
  saveJson(PUBLISHED_LOG_FILE, [...results, ...publishedLog].slice(0, 200));

  const success = results.filter((row) => row.success).length;
  const failed = results.length - success;
  console.log(`PUBLISHER done total=${results.length} success=${success} failed=${failed}`);

  return results;
}

async function runFromCli() {
  try {
    const args = new Set(process.argv.slice(2));
    const queue = loadJson(APPROVAL_QUEUE_FILE, []);

    if (args.has('--approve-all')) {
      const changed = markReviewedAsApproved(queue);
      saveJson(APPROVAL_QUEUE_FILE, queue);
      console.log(`PUBLISHER approve-all changed=${changed}`);
    }

    const results = await runPublisherAgent();
    console.log(JSON.stringify({ total: results.length }, null, 2));
  } catch (error) {
    console.error(`PUBLISHER failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
