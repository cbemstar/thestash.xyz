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

const resources = [
  {
    title: 'Quant-UX',
    url: 'https://quant-ux.com/',
    description:
      'Open-source UX research and prototyping tool to test designs quickly and get data-driven insights.',
    category: 'design-tools',
    tags: ['prototyping', 'user-testing', 'ux-research', 'analytics', 'open-source'],
    body:
      'Quant-UX is an open-source UX research and prototyping hub. Create interactive prototypes quickly, connect screens, and add animations and logic with a visual editor. Build reusable design systems with tokens and components, then share a link to run user tests. It supports structured tasks, screen recordings, A/B testing, and mobile-friendly access via QR codes. After tests, the analytics canvas surfaces insights like heatmaps, success rates, drop-offs, and survey feedback, helping teams validate ideas with data instead of guesswork. It’s a strong fit for research-led product teams and educators who need rapid prototyping plus quantitative usability feedback.',
    sources: [
      { label: 'Quant-UX', url: 'https://quant-ux.com/' },
      { label: 'Quant-UX Open Source', url: 'https://www.quant-ux.com/opensource/' },
    ],
  },
  {
    title: 'Dolt',
    url: 'https://www.dolthub.com/',
    description:
      'SQL database you can fork, clone, branch, merge, push, and pull just like a Git repository.',
    category: 'development-tools',
    tags: ['database', 'version-control', 'sql', 'git', 'data'],
    body:
      'Dolt is a MySQL-compatible SQL database with built-in version control. It lets teams use Git-style workflows (branch, merge, pull, push) on database tables while still querying with standard SQL. Version history is exposed via system tables, functions, and procedures, and the CLI mirrors familiar Git commands. That makes Dolt useful for data teams that need reproducibility, auditability, and collaboration on evolving datasets without exporting snapshots or bolting on external tooling.',
    sources: [
      { label: 'Dolt Docs', url: 'https://docs.dolthub.com/' },
      { label: 'Dolt GitHub', url: 'https://github.com/dolthub/dolt' },
    ],
  },
  {
    title: 'The Component Gallery',
    url: 'https://component.gallery/',
    description:
      'Up-to-date repository of interface components and design system examples for UI builders.',
    category: 'ui-ux-resources',
    tags: ['components', 'design-systems', 'ui', 'reference'],
    body:
      'The Component Gallery is a curated reference of interface components drawn from real-world design systems. It catalogs components with definitions and examples, making it easier to see how established systems name and implement common UI patterns. Use it when you’re designing a new interface and want to compare approaches, or when you need a shared vocabulary between design and engineering. It’s especially useful for getting unstuck on component naming, interaction patterns, and system consistency.',
    sources: [
      { label: 'Component Gallery', url: 'https://component.gallery/' },
      { label: 'Component Gallery About', url: 'https://component.gallery/about/' },
    ],
  },
  {
    title: 'Web Interactions Gallery',
    url: 'https://www.webinteractions.gallery/',
    description:
      'Curated gallery of creative web interactions and animations to inspire design and motion.',
    category: 'inspiration',
    tags: ['interaction-design', 'animation', 'inspiration', 'web'],
    body:
      'Web Interactions Gallery is a curated collection of creative web interactions and animations. It organizes inspiration by categories like hover interactions, page transitions, preloaders, hero reveals, and more. Designers and frontend engineers can browse patterns quickly to spark ideas for motion design, micro-interactions, and interface polish on real projects.',
    sources: [{ label: 'Web Interactions Gallery', url: 'https://www.webinteractions.gallery/' }],
  },
  {
    title: 'PromptHive',
    url: 'https://prompthive.sh/',
    description:
      'Terminal-native, open-source prompt manager built for fast AI workflows.',
    category: 'ai-tools',
    tags: ['prompts', 'cli', 'open-source', 'ai-workflows'],
    body:
      'PromptHive is a terminal-native, open-source prompt manager focused on speed and composable AI workflows. It’s built for developers who want instant access to curated prompts and the ability to chain them like Unix commands. The project emphasizes fast operations and compatibility with any AI tool, so teams can standardize prompt libraries without vendor lock-in. It’s a strong fit for engineering teams that rely on repeatable prompt workflows in daily development and code review.',
    sources: [
      { label: 'PromptHive', url: 'https://prompthive.sh/' },
      { label: 'PromptHive GitHub', url: 'https://github.com/joryeugene/prompthive' },
    ],
  },
  {
    title: 'Super Productivity',
    url: 'https://super-productivity.com/',
    description:
      'Open-source task manager combining tasks, time tracking, and notes to support deep work.',
    category: 'productivity',
    tags: ['task-management', 'time-tracking', 'notes', 'open-source', 'focus'],
    body:
      'Super Productivity is a deep-work oriented task manager that combines tasks, time tracking, and notes in one workspace. It’s open source and designed to adapt to personal workflows rather than enforcing a rigid system. The app emphasizes focus and privacy, and it supports offline use with optional sync. It’s a strong option for makers who want a flexible, local-first productivity hub without heavy overhead.',
    sources: [
      { label: 'Super Productivity', url: 'https://super-productivity.com/' },
      { label: 'Super Productivity GitHub', url: 'https://github.com/johannesjo/super-productivity' },
    ],
  },
  {
    title: 'Awesome Learning Dev',
    url: 'https://www.learndev.info/en.html',
    description:
      'Curated list of quality learning resources for development, created to avoid outdated or bad tutorials.',
    category: 'learning-resources',
    tags: ['learning', 'development', 'curated', 'resources'],
    body:
      'Awesome Learning Dev is a curated list of development learning resources assembled to highlight good sources and avoid outdated or low-quality tutorials. The collection organizes recommendations by language and includes links to tools, roadmaps, and useful references, making it a practical starting point for self-directed learning or curriculum planning.',
    sources: [{ label: 'Awesome Learning Dev', url: 'https://www.learndev.info/en.html' }],
  },
  {
    title: 'Indie Dev Toolkit',
    url: 'https://github.com/thedaviddias/indie-dev-toolkit',
    description:
      'Curated list of tools and resources for indie hackers, solo founders, and bootstrapped startups.',
    category: 'miscellaneous',
    tags: ['indie', 'startup', 'curated', 'tools'],
    body:
      'Indie Dev Toolkit is a curated collection of tools and resources for indie hackers, solo founders, and bootstrapped startups building web or mobile products. The list emphasizes practical, often free or freemium options across areas like development, design, analytics, and product management. It’s a high-signal overview of the stack choices that help small teams ship quickly and keep costs low.',
    sources: [{ label: 'Indie Dev Toolkit', url: 'https://github.com/thedaviddias/indie-dev-toolkit' }],
  },
];

function validateResource(resource) {
  if (!resource.title || resource.title.length < 2 || resource.title.length > 120) {
    throw new Error(`Invalid title for ${resource.url}`);
  }
  if (!resource.description || resource.description.length < 10 || resource.description.length > 260) {
    throw new Error(`Invalid description length for ${resource.title}`);
  }
  if (!resource.body || wordCount(resource.body) < 40) {
    throw new Error(`Body too short for ${resource.title}`);
  }
}

(async () => {
  const existing = await client.fetch('*[_type == "resource"]{title, slug, url}');
  const existingUrls = new Set(existing.map((r) => normalizeUrl(r.url)));
  const existingSlugs = new Set(existing.map((r) => (r.slug || '').toLowerCase()));
  const existingTitles = new Set(existing.map((r) => (r.title || '').toLowerCase()));

  const created = [];
  const skipped = [];

  for (const resource of resources) {
    validateResource(resource);
    const slug = slugify(resource.title);
    const normUrl = normalizeUrl(resource.url);

    if (existingUrls.has(normUrl)) {
      skipped.push({ title: resource.title, reason: 'url exists' });
      continue;
    }
    if (existingSlugs.has(slug)) {
      skipped.push({ title: resource.title, reason: 'slug exists' });
      continue;
    }
    if (existingTitles.has(resource.title.toLowerCase())) {
      skipped.push({ title: resource.title, reason: 'title exists' });
      continue;
    }

    const doc = {
      _id: `drafts.${crypto.randomUUID()}`,
      _type: 'resource',
      title: resource.title.trim(),
      slug,
      url: resource.url.trim(),
      description: resource.description.trim(),
      category: resource.category,
      tags: resource.tags ?? [],
      featured: false,
      createdAt: new Date().toISOString(),
      body: resource.body.trim(),
      sources: (resource.sources || []).map((s) => ({
        _key: crypto.randomUUID(),
        label: s.label,
        url: s.url,
      })),
    };

    const createdDoc = await client.create(doc);
    created.push({
      id: createdDoc._id,
      title: resource.title,
      slug,
      category: resource.category,
      url: resource.url,
    });
  }

  console.log(JSON.stringify({ created, skipped }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
