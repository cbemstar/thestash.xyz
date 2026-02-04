const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@sanity/client');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (!key) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    let s = u.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s.toLowerCase();
  } catch {
    return (url || '').trim().toLowerCase();
  }
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkUrlAlive(url) {
  const headers = {
    'User-Agent': 'TheStashLinkCheck/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const attempt = async (method) => {
    const res = await fetchWithTimeout(url, { method, redirect: 'follow', headers });
    if (res.body && typeof res.body.cancel === 'function') {
      res.body.cancel();
    }
    return res;
  };

  try {
    const headRes = await attempt('HEAD');
    if (headRes.status >= 200 && headRes.status < 400) {
      return { status: 'alive', httpStatus: headRes.status };
    }

    const getRes = await attempt('GET');
    if (getRes.status >= 200 && getRes.status < 400) {
      return { status: 'alive', httpStatus: getRes.status };
    }
    return { status: 'dead', httpStatus: getRes.status };
  } catch (err) {
    return { status: 'dead', error: err && err.name ? err.name : 'fetch-error' };
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

loadEnvFile(path.join(process.cwd(), '.env.local'));

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error('Missing Sanity config. Ensure NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are set.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), 'automation', 'discovery-candidates.json');

const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(
      process.cwd(),
      'automation',
      `discovery-results-${new Date().toISOString().slice(0, 10)}.json`
    );

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const candidates = Array.isArray(raw) ? raw : raw.items || [];

if (!Array.isArray(candidates) || candidates.length === 0) {
  console.error('No candidates found in input JSON.');
  process.exit(1);
}

function validateCandidate(candidate) {
  if (!candidate.title || candidate.title.length < 2 || candidate.title.length > 120) {
    return 'title must be 2–120 characters';
  }
  if (!candidate.url || typeof candidate.url !== 'string') {
    return 'url is required';
  }
  if (!candidate.description || candidate.description.length < 10 || candidate.description.length > 260) {
    return 'description must be 10–260 characters';
  }
  if (!candidate.category) {
    return 'category is required';
  }
  if (!candidate.body || wordCount(candidate.body) < 40) {
    return 'body must be at least 40 words';
  }
  return null;
}

(async () => {
  const existing = await client.fetch('*[_type == "resource"]{title, slug, url}');
  const existingUrls = new Set(existing.map((r) => normalizeUrl(r.url)));
  const existingSlugs = new Set(existing.map((r) => (r.slug || '').toLowerCase()));
  const existingTitles = new Set(existing.map((r) => (r.title || '').toLowerCase()));

  const results = [];
  const counts = {
    total: candidates.length,
    published: 0,
    deadLink: 0,
    duplicate: 0,
    invalid: 0,
    error: 0,
  };

  for (const candidate of candidates) {
    const base = {
      title: candidate.title,
      url: candidate.url,
      category: candidate.category,
      slug: candidate.slug || slugify(candidate.title || ''),
    };

    const validationError = validateCandidate(candidate);
    if (validationError) {
      counts.invalid += 1;
      results.push({
        ...base,
        status: 'invalid',
        reason: validationError,
        linkStatus: 'unverified',
      });
      continue;
    }

    const linkCheck = await checkUrlAlive(candidate.url);
    if (linkCheck.status === 'dead') {
      counts.deadLink += 1;
      results.push({
        ...base,
        status: 'dead-link',
        linkStatus: 'dead',
        linkCheck: {
          checkedAt: new Date().toISOString(),
          httpStatus: linkCheck.httpStatus || null,
          error: linkCheck.error || null,
        },
      });
      continue;
    }

    const normUrl = normalizeUrl(candidate.url);
    const slug = base.slug;
    const titleLower = (candidate.title || '').toLowerCase();

    if (existingUrls.has(normUrl)) {
      counts.duplicate += 1;
      results.push({
        ...base,
        status: 'duplicate',
        reason: 'url exists',
        linkStatus: 'alive',
        linkCheck: {
          checkedAt: new Date().toISOString(),
          httpStatus: linkCheck.httpStatus || null,
          error: linkCheck.error || null,
        },
      });
      continue;
    }
    if (existingSlugs.has(slug.toLowerCase())) {
      counts.duplicate += 1;
      results.push({
        ...base,
        status: 'duplicate',
        reason: 'slug exists',
        linkStatus: 'alive',
        linkCheck: {
          checkedAt: new Date().toISOString(),
          httpStatus: linkCheck.httpStatus || null,
          error: linkCheck.error || null,
        },
      });
      continue;
    }
    if (existingTitles.has(titleLower)) {
      counts.duplicate += 1;
      results.push({
        ...base,
        status: 'duplicate',
        reason: 'title exists',
        linkStatus: 'alive',
        linkCheck: {
          checkedAt: new Date().toISOString(),
          httpStatus: linkCheck.httpStatus || null,
          error: linkCheck.error || null,
        },
      });
      continue;
    }

    const doc = {
      _id: `drafts.${crypto.randomUUID()}`,
      _type: 'resource',
      title: candidate.title.trim(),
      slug,
      url: candidate.url.trim(),
      description: candidate.description.trim(),
      category: candidate.category,
      tags: Array.isArray(candidate.tags) ? candidate.tags.filter((t) => typeof t === 'string') : [],
      featured: Boolean(candidate.featured),
      createdAt: new Date().toISOString(),
      body: candidate.body.trim(),
      sources: Array.isArray(candidate.sources)
        ? candidate.sources
            .filter((s) => s && s.label && s.url)
            .map((s) => ({
              _key: crypto.randomUUID(),
              label: s.label,
              url: s.url,
            }))
        : [],
    };

    try {
      const created = await client.create(doc);
      await client.action([
        {
          actionType: 'sanity.action.document.publish',
          publishedId: created._id.replace(/^drafts\./, ''),
          draftId: created._id,
        },
      ]);

      counts.published += 1;
      existingUrls.add(normUrl);
      existingSlugs.add(slug.toLowerCase());
      existingTitles.add(titleLower);

      results.push({
        ...base,
        status: 'published',
        linkStatus: 'alive',
        linkCheck: {
          checkedAt: new Date().toISOString(),
          httpStatus: linkCheck.httpStatus || null,
          error: linkCheck.error || null,
        },
        sanityId: created._id.replace(/^drafts\./, ''),
      });
    } catch (err) {
      counts.error += 1;
      results.push({
        ...base,
        status: 'error',
        reason: err && err.message ? err.message : 'publish failed',
        linkStatus: 'alive',
        linkCheck: {
          checkedAt: new Date().toISOString(),
          httpStatus: linkCheck.httpStatus || null,
          error: linkCheck.error || null,
        },
      });
    }
  }

  const outputDir = path.dirname(outputPath);
  ensureDir(outputDir);

  const output = {
    generatedAt: new Date().toISOString(),
    inputPath,
    counts,
    items: results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
