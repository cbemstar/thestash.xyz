/**
 * WRITER AGENT - Generates authority-grade article drafts with sourced visuals.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/writer-agent.mjs
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
} from './agent-shared.mjs';

const VALIDATED_FILE = './automation/agents/validated-leads.json';
const BLOG_DRAFT_FILE = './automation/agents/blog-draft.json';
const APPROVAL_QUEUE_FILE = './automation/agents/approval-queue.json';
const WRITER_STYLE_PLAYBOOK_FILE = './automation/agents/blog-style-playbook.json';
const WRITER_LEARNING_LOG_FILE = './automation/agents/writer-learning-log.json';

const DEFAULT_WRITER_PLAYBOOK = {
  version: '2026-02-24.1',
  minCandidates: 4,
  maxCandidates: 8,
  minSources: 8,
  framework: ['fact', 'inference', 'recommendation'],
  requiredInternalLinks: ['/collections', '/compare', '/alternatives', '/latest'],
  citationPolicy:
    'Prioritize first-party product docs, official benchmarks, and attributed visuals for decision-critical claims.',
  styleGoals: [
    'answer-first opening',
    'explicit tradeoff framing',
    'implementation-first recommendations',
  ],
};

const CATEGORY_LABELS = {
  'ai-tools': 'AI Tools',
  'design-tools': 'Design Tools',
  'development-tools': 'Developer Tools',
  productivity: 'Productivity Tools',
  'learning-resources': 'Learning Resources',
  'ui-ux-resources': 'UI/UX Resources',
  inspiration: 'Inspiration Resources',
  webflow: 'Webflow Tools',
  shadcn: 'Shadcn Resources',
  coding: 'Coding Resources',
  github: 'GitHub Resources',
  html: 'HTML Resources',
  css: 'CSS Resources',
  javascript: 'JavaScript Resources',
  languages: 'Programming Language Resources',
  miscellaneous: 'Developer Resources',
};

const STYLE_INTROS = {
  'development-tools': 'Teams shipping product every week need tooling that reduces friction without creating ops overhead.',
  'ai-tools': 'AI tooling decisions fail when teams optimize for demos instead of sustained production workflows.',
  'design-tools': 'Design stack choices compound quickly because they shape handoffs, feedback loops, and implementation speed.',
  productivity: 'Productivity tooling only works when it makes coordination clearer than the process it replaces.',
  'learning-resources': 'Learning stacks perform best when they balance authoritative references with practical execution drills.',
};

const EVALUATION_CRITERIA = [
  'Implementation effort and migration risk',
  'Integration depth across existing stack',
  'Time-to-value for first production workflow',
  'Governance controls and auditability',
  'Long-term maintenance overhead and roadmap clarity',
  'Commercial risk (pricing volatility and lock-in)',
];

const VISUAL_REPORTS = [
  {
    id: 'stack-overflow-dev-survey-2025-ai',
    categories: ['ai-tools', 'development-tools', 'coding', 'github', 'javascript', 'languages', 'all'],
    organization: 'Stack Overflow',
    title: 'Developer Survey 2025 (AI)',
    summary:
      'Annual developer sentiment dataset covering AI adoption, trust, and workflow impact.',
    publishedDate: '2025-07-29',
    reportUrl: 'https://survey.stackoverflow.co/2025/ai',
    imageUrl:
      'https://survey.stackoverflow.co/2025/charts/stackoverflow-dev-survey-2025-ai-sentiment-and-usage-ai-select-social.png',
    imageAlt:
      'Stack Overflow 2025 chart showing developer AI usage and sentiment distribution.',
    metrics: [
      { label: 'Developers using/planning AI', value: '84%', subtext: 'Stack Overflow 2025' },
      { label: 'Pros using AI daily', value: '51%', subtext: 'Stack Overflow 2025' },
      { label: 'Pros distrusting AI accuracy', value: '46%', subtext: 'Stack Overflow 2025' },
    ],
  },
  {
    id: 'github-octoverse-2025',
    categories: ['ai-tools', 'development-tools', 'coding', 'github', 'javascript', 'languages', 'all'],
    organization: 'GitHub',
    title: 'Octoverse 2025',
    summary:
      'State-of-development report tracking developer growth and AI project adoption.',
    publishedDate: '2025-11-06',
    reportUrl:
      'https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/',
    imageUrl:
      'https://github.blog/wp-content/uploads/2025/11/Octoverse-2025-top-metrics.png?resize=1024%2C576',
    imageAlt: 'GitHub Octoverse 2025 top metrics graphic.',
    metrics: [
      { label: 'Developers on GitHub', value: '180M+', subtext: 'Global contributor base' },
      { label: 'AI projects on GitHub', value: '4.3M', subtext: 'Octoverse 2025' },
      { label: 'New developer joins', value: '1/sec', subtext: 'Throughout 2025' },
    ],
  },
  {
    id: 'dora-report-2025',
    categories: ['all'],
    organization: 'Google Cloud / DORA',
    title: 'DORA Report 2025',
    summary:
      'Software delivery research on AI usage, platform engineering maturity, and delivery performance.',
    publishedDate: '2025-01-01',
    reportUrl: 'https://dora.dev/research/2025/dora-report/',
    imageUrl: 'https://dora.dev/research/shared/dora-report-2025/images/hero-mobile.png',
    imageAlt: 'DORA Report 2025 hero visual.',
    metrics: [
      { label: 'Professionals using AI daily work', value: '90%', subtext: 'DORA 2025' },
      { label: 'Organizations with internal dev platform', value: '90%', subtext: 'DORA 2025' },
      { label: 'Organizations with platform team', value: '76%', subtext: 'DORA 2025' },
    ],
  },
];

const TOPIC_COVERAGE = {
  'development-tools': [
    'Architecture and integration patterns',
    'Rollout sequencing across teams',
    'Security and access controls',
    'Migration and rollback planning',
    'Maintenance and ownership model',
    'Commercial and licensing risk',
    'Developer experience impact',
    'Reporting and KPI instrumentation',
  ],
  'ai-tools': [
    'Model governance and prompt operations',
    'Workflow integration and tool orchestration',
    'Data privacy and policy boundaries',
    'Cost and token consumption controls',
    'Reliability and fallback paths',
    'Vendor lock-in mitigation',
    'Cross-team adoption plan',
    'Measurement framework for ROI',
  ],
  'design-tools': [
    'Design system integration depth',
    'Handoff quality to engineering',
    'Collaboration and review loops',
    'Prototype fidelity and iteration speed',
    'Asset management and governance',
    'Migration complexity from current stack',
    'Pricing and seat-management tradeoffs',
    'Change management and enablement',
  ],
};

const INTERNAL_GUIDE_LINKS = {
  'ai-tools': [
    '/blog/claude-vs-chatgpt-vs-gemini-for-developers-2026',
    '/blog/ai-code-review-workflow-github-cursor-claude-2026',
    '/blog/llm-observability-stack-langfuse-literalai-helicone-2026',
    '/blog/best-mcp-tools-and-servers-developer-workflows-2026',
    '/blog/how-integrate-ai-apis-web-projects-2026',
    '/blog/future-ai-developers-workflow-2026',
  ],
  'development-tools': [
    '/blog/best-mcp-tools-and-servers-developer-workflows-2026',
    '/blog/how-integrate-ai-apis-web-projects-2026',
    '/blog/ai-code-review-workflow-github-cursor-claude-2026',
    '/compare',
    '/alternatives',
  ],
  'design-tools': [
    '/collections',
    '/latest',
    '/compare',
    '/alternatives',
  ],
};

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentYear() {
  return new Date().getUTCFullYear();
}

function loadWriterPlaybook() {
  const fromDisk = loadJson(WRITER_STYLE_PLAYBOOK_FILE, null);
  if (!fromDisk || typeof fromDisk !== 'object') return DEFAULT_WRITER_PLAYBOOK;
  return {
    ...DEFAULT_WRITER_PLAYBOOK,
    ...fromDisk,
    framework: asArray(fromDisk.framework).length > 0
      ? asArray(fromDisk.framework)
      : DEFAULT_WRITER_PLAYBOOK.framework,
    requiredInternalLinks: asArray(fromDisk.requiredInternalLinks).length > 0
      ? asArray(fromDisk.requiredInternalLinks)
      : DEFAULT_WRITER_PLAYBOOK.requiredInternalLinks,
    styleGoals: asArray(fromDisk.styleGoals).length > 0
      ? asArray(fromDisk.styleGoals)
      : DEFAULT_WRITER_PLAYBOOK.styleGoals,
  };
}

function collectBodyMetrics(body) {
  const metrics = {
    wordCount: 0,
    headingCount: 0,
    listItemCount: 0,
    linkCount: 0,
  };

  for (const block of asArray(body)) {
    if (!block || typeof block !== 'object') continue;
    if (block._type !== 'block') continue;

    if (typeof block.style === 'string' && /^h[2-4]$/.test(block.style)) {
      metrics.headingCount += 1;
    }
    if (block.listItem === 'bullet') metrics.listItemCount += 1;
    metrics.linkCount += asArray(block.markDefs).filter((mark) => mark?._type === 'link').length;

    const plain = asArray(block.children)
      .map((child) => (typeof child?.text === 'string' ? child.text : ''))
      .join(' ');
    metrics.wordCount += countWords(plain);
  }

  return metrics;
}

function persistWriterLearningLog(entry) {
  const rows = asArray(loadJson(WRITER_LEARNING_LOG_FILE, []));
  rows.unshift(entry);
  saveJson(WRITER_LEARNING_LOG_FILE, rows.slice(0, 120));
}

function countByCategory(items) {
  const counts = new Map();
  for (const item of items) {
    const key = item?.category || 'development-tools';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function pickTargetCategory(validatedLeads, resources) {
  const combined = [...validatedLeads, ...resources];
  const ranked = countByCategory(combined);
  if (ranked.length === 0) return 'development-tools';
  return ranked[0][0];
}

function buildLinkedBlock(parts, style = 'normal', listItem = null) {
  const markDefs = [];
  const children = [];

  for (const part of parts) {
    if (!part || !part.text) continue;
    if (part.href) {
      const key = `link-${randomUUID().slice(0, 8)}`;
      markDefs.push({ _type: 'link', _key: key, href: part.href });
      children.push({ _type: 'span', text: part.text, marks: [key] });
    } else {
      children.push({ _type: 'span', text: part.text });
    }
  }

  const block = { _type: 'block', style, children };
  if (markDefs.length > 0) block.markDefs = markDefs;
  if (listItem) block.listItem = listItem;
  return block;
}

function heading(level, text) {
  return {
    _type: 'block',
    style: level,
    children: [{ _type: 'span', text }],
  };
}

function paragraph(text) {
  return {
    _type: 'block',
    style: 'normal',
    children: [{ _type: 'span', text }],
  };
}

function bullet(text) {
  return {
    _type: 'block',
    style: 'normal',
    listItem: 'bullet',
    children: [{ _type: 'span', text }],
  };
}

function sourcedImage({ imageUrl, alt, caption, sourceLabel, sourceUrl, width = 1600, height = 900 }) {
  return {
    _type: 'sourcedImage',
    _key: randomUUID(),
    imageUrl,
    alt,
    caption,
    sourceLabel,
    sourceUrl,
    width,
    height,
  };
}

function infographic({ variant = 'grid', title, stats, sourceLabel, sourceUrl }) {
  return {
    _type: 'infographic',
    _key: randomUUID(),
    variant,
    title,
    stats: asArray(stats).map((stat) => ({
      label: String(stat?.label || '').trim(),
      value: String(stat?.value || '').trim(),
      subtext: String(stat?.subtext || '').trim(),
    })),
    sourceLabel,
    sourceUrl,
  };
}

function normalizeCandidate(item, sourceType) {
  return {
    _id: item._id || null,
    title: String(item.title || '').trim(),
    slug: String(item.slug || '').trim(),
    url: String(item.url || '').trim(),
    description: String(item.description || '').replace(/\s+/g, ' ').trim(),
    tags: asArray(item.tags).slice(0, 6),
    bestFor: asArray(item.bestFor).slice(0, 3),
    notFor: asArray(item.notFor).slice(0, 3),
    sourceType,
  };
}

function displayTitle(candidate) {
  const raw = String(candidate.title || '').trim();
  const hostname = getHostname(candidate.url);

  try {
    const parsed = new URL(candidate.url);
    const parts = parsed.pathname.split('/').filter(Boolean);

    if (hostname === 'github.com' && parts.length >= 2) {
      return `${parts[1]}`;
    }
  } catch {
    // ignore
  }

  if (raw.startsWith('GitHub - ')) {
    const afterPrefix = raw.replace(/^GitHub\s*-\s*/i, '');
    const repoPart = afterPrefix.split(':')[0]?.trim();
    if (repoPart?.includes('/')) return repoPart.split('/')[1] || repoPart;
    return repoPart || raw;
  }

  if (raw.includes(':')) {
    const left = raw.split(':')[0].trim();
    if (left.length >= 3 && left.length <= 80) return left;
  }

  return raw.slice(0, 90);
}

function getCandidatesForCategory(category, validatedLeads, resources) {
  const seen = new Set();
  const output = [];

  const validated = validatedLeads
    .filter((lead) => lead.category === category)
    .map((lead) => normalizeCandidate(lead, 'validated'));

  const cms = resources
    .filter((resource) => resource.category === category)
    .map((resource) => normalizeCandidate(resource, 'cms'));

  for (const candidate of [...validated, ...cms]) {
    const key = normalizeUrl(candidate.url || `slug:${candidate.slug}`);
    if (!candidate.title || !candidate.url || seen.has(key)) continue;
    seen.add(key);
    output.push(candidate);
  }

  return output.slice(0, 10);
}

function ensureUniqueSlug(baseSlug, existingSlugs) {
  if (!existingSlugs.has(baseSlug)) return baseSlug;
  let index = 2;
  while (existingSlugs.has(`${baseSlug}-${index}`)) {
    index += 1;
  }
  return `${baseSlug}-${index}`;
}

function deriveSignals(candidate) {
  const text = `${candidate.description} ${candidate.tags.join(' ')}`.toLowerCase();

  const strengths = [];
  const constraints = [];

  if (/(api|sdk|integration|webhook)/.test(text)) {
    strengths.push('Strong integration surface for existing engineering workflows');
  }
  if (/(cli|terminal|devtool|developer)/.test(text)) {
    strengths.push('Fits developer-first execution paths without heavy UI overhead');
  }
  if (/(open source|open-source|github)/.test(text)) {
    strengths.push('Transparent implementation details with community-level auditability');
  }
  if (/(team|collaboration|workspace|project)/.test(text)) {
    strengths.push('Better coordination potential for multi-role delivery teams');
  }
  if (/(automation|agent|ai|copilot|llm)/.test(text)) {
    strengths.push('Potential to reduce repetitive tasks if guardrails are defined early');
  }

  if (/(beta|alpha|experimental)/.test(text)) {
    constraints.push('Release maturity may introduce avoidable migration churn');
  }
  if (/(enterprise|pricing|premium)/.test(text)) {
    constraints.push('Commercial model may become expensive as seats or usage scale');
  }
  if (!/(docs|documentation|guide)/.test(text)) {
    constraints.push('Documentation depth is not obvious from first-pass signals');
  }
  if (/(open source|open-source)/.test(text) && !/(managed|cloud|hosted)/.test(text)) {
    constraints.push('Self-managed operation may require additional platform support');
  }

  const integrationChecks = [];
  if (/(api|sdk|integration|webhook)/.test(text)) {
    integrationChecks.push('Validate API limits, auth model, and webhook retry semantics before rollout.');
  } else {
    integrationChecks.push('Confirm whether automation hooks exist or if workarounds are needed.');
  }

  if (/(open source|open-source)/.test(text)) {
    integrationChecks.push('Review maintainer cadence and contributor health before relying on roadmap assumptions.');
  } else {
    integrationChecks.push('Request roadmap transparency and SLA details for critical workflows.');
  }

  const governanceChecks = [];
  if (/(security|privacy|enterprise|compliance)/.test(text)) {
    governanceChecks.push('Map existing policy controls to product controls and document residual risk.');
  } else {
    governanceChecks.push('Define access controls, data-retention boundaries, and audit expectations before launch.');
  }
  governanceChecks.push('Assign an internal owner for onboarding, policy review, and vendor escalation.');

  if (strengths.length === 0) {
    strengths.push('Shows enough implementation signal to justify a scoped pilot');
  }
  if (constraints.length === 0) {
    constraints.push('Adoption risk should still be validated through a bounded production trial');
  }

  return {
    strengths: strengths.slice(0, 3),
    constraints: constraints.slice(0, 3),
    integrationChecks: integrationChecks.slice(0, 2),
    governanceChecks: governanceChecks.slice(0, 2),
  };
}

function buildCandidateSection(candidate, index, publishDateLabel) {
  const name = displayTitle(candidate);
  const signals = deriveSignals(candidate);

  const bestFor = candidate.bestFor.length > 0
    ? candidate.bestFor.join('; ')
    : 'Teams that need measurable throughput improvements in active delivery cycles.';

  const notFor = candidate.notFor.length > 0
    ? candidate.notFor.join('; ')
    : 'Teams that cannot support process changes during the evaluation window.';

  const blocks = [];
  blocks.push(heading('h3', `${index}. ${name}`));
  blocks.push(paragraph(`Fact (${publishDateLabel}): ${name} positions itself as follows: ${candidate.description || 'No concise description available from first-party metadata.'}`));
  blocks.push(paragraph(`Inference: Based on current metadata signals, ${name} is likely to perform best when ${bestFor.toLowerCase()}`));
  blocks.push(paragraph(`Recommendation: Pilot ${name} in one live workflow first, then scale only if adoption metrics and defect rates improve against baseline.`));

  blocks.push(bullet(`Strength: ${signals.strengths[0]}`));
  if (signals.strengths[1]) blocks.push(bullet(`Strength: ${signals.strengths[1]}`));
  if (signals.strengths[2]) blocks.push(bullet(`Strength: ${signals.strengths[2]}`));
  blocks.push(bullet(`Constraint: ${signals.constraints[0]}`));
  if (signals.constraints[1]) blocks.push(bullet(`Constraint: ${signals.constraints[1]}`));
  if (signals.constraints[2]) blocks.push(bullet(`Constraint: ${signals.constraints[2]}`));
  blocks.push(bullet(`Integration check: ${signals.integrationChecks[0]}`));
  blocks.push(bullet(`Governance check: ${signals.governanceChecks[0]}`));
  blocks.push(bullet(`Not ideal for: ${notFor}`));

  blocks.push(
    buildLinkedBlock([
      { text: 'Source URL: ' },
      { text: candidate.url, href: candidate.url },
    ])
  );

  return blocks;
}

function pickVisualReports(category) {
  const specific = VISUAL_REPORTS.filter((report) => report.categories.includes(category));
  const globals = VISUAL_REPORTS.filter((report) => report.categories.includes('all'));
  const selected = [...specific, ...globals];
  const deduped = [];
  const seen = new Set();
  for (const report of selected) {
    if (seen.has(report.id)) continue;
    seen.add(report.id);
    deduped.push(report);
  }
  return deduped.slice(0, 3);
}

function buildVisualEvidenceSection({ categoryLabel, publishDateLabel, visualReports }) {
  const blocks = [];
  blocks.push(heading('h2', `Market evidence and visuals (${publishDateLabel})`));
  blocks.push(
    paragraph(
      `Fact (${publishDateLabel}): The visuals below are sourced from first-party benchmark reports to anchor this ${categoryLabel.toLowerCase()} evaluation in external evidence, not opinion alone.`
    )
  );

  for (const report of visualReports) {
    blocks.push(heading('h3', `${report.organization} - ${report.title}`));
    blocks.push(paragraph(`Fact (${report.publishedDate}): ${report.summary}`));
    blocks.push(
      sourcedImage({
        imageUrl: report.imageUrl,
        alt: report.imageAlt,
        caption: `${report.organization} benchmark visual used for editorial context.`,
        sourceLabel: `${report.organization}: ${report.title}`,
        sourceUrl: report.reportUrl,
      })
    );
    blocks.push(
      infographic({
        variant: 'grid',
        title: `${report.organization} key signals`,
        stats: report.metrics,
        sourceLabel: `${report.organization} report`,
        sourceUrl: report.reportUrl,
      })
    );
  }

  return blocks;
}

function buildTopicCoverageSection({ category, categoryLabel }) {
  const coverage = TOPIC_COVERAGE[category] || [
    'Integration risk and rollout sequencing',
    'Governance and ownership model',
    'Cost visibility and procurement controls',
    'Migration and rollback planning',
    'Operational reliability and incident handling',
    'Training and adoption design',
    'Measurement model and KPI alignment',
    'Long-term maintainability',
  ];

  const blocks = [];
  blocks.push(heading('h2', `Topic coverage map for ${categoryLabel.toLowerCase()}`));
  blocks.push(
    paragraph(
      'Inference: Decision-stage content is most useful when it spans architecture, adoption, governance, economics, and execution risk rather than only feature snapshots.'
    )
  );
  for (const topic of coverage) {
    blocks.push(bullet(topic));
  }
  return blocks;
}

function buildScenarioVerdictSection({ candidates, categoryLabel, publishDateLabel }) {
  const shortlist = candidates.slice(0, 5);
  const blocks = [];

  blocks.push(heading('h2', 'Quick verdict by scenario'));
  blocks.push(
    paragraph(
      `Fact (${publishDateLabel}): No single ${categoryLabel.toLowerCase()} option consistently wins every workflow. Teams generally perform better with workflow-specific primary tools and one fallback path.`
    )
  );

  for (const candidate of shortlist) {
    const name = displayTitle(candidate);
    const bestFor = candidate.bestFor.length > 0
      ? candidate.bestFor.join('; ')
      : 'delivery teams with clear implementation ownership and measurable rollout goals';
    blocks.push(
      bullet(`Recommendation: Choose ${name} first when ${bestFor.toLowerCase()}.`)
    );
  }

  blocks.push(
    paragraph(
      'Inference: A primary-plus-fallback operating model usually reduces continuity risk when pricing, policy, or reliability conditions change.'
    )
  );

  return blocks;
}

function buildIntegrationRealitySection() {
  return [
    heading('h2', 'Integration and deployment reality checks'),
    paragraph(
      'Inference: Most rollout failures occur at the integration layer (ownership gaps, weak fallback behavior, and missing review controls), not at the prompt layer.'
    ),
    bullet('Recommendation: Define task-level prompt contracts for production-impacting workflows before enabling broad usage.'),
    bullet('Recommendation: Require human approval gates for changes that can affect production reliability, security, or billing.'),
    bullet('Recommendation: Log model/provider metadata for accepted outputs so review decisions are auditable.'),
    bullet('Recommendation: Maintain one fallback path and test failover behavior before full-team rollout.'),
  ];
}

function buildCostModelSection() {
  return [
    heading('h2', 'Cost model: optimize accepted outcomes, not raw prompt spend'),
    paragraph(
      'Fact (2026-02-23): Low per-call pricing can still create higher total cost if acceptance rates are weak and review/rework overhead grows.'
    ),
    bullet('Cost per accepted implementation change'),
    bullet('Cost per resolved debugging incident'),
    bullet('Prompt-to-merge cycle time'),
    bullet('Human rework time per accepted output'),
    bullet('Acceptance ratio by workflow domain'),
  ];
}

function buildSourceQualityPolicySection({ publishDateLabel, stylePlaybook }) {
  return [
    heading('h2', 'Source quality and citation policy'),
    paragraph(
      `Fact (${publishDateLabel}): This draft prioritizes first-party product documentation, official benchmark reports, and attributed visuals from high-authority domains.`
    ),
    bullet('Every embedded visual includes alt text, source label, and source URL attribution.'),
    bullet('Time-sensitive statements use absolute dates and should be re-verified before publication.'),
    bullet('Unattributed social claims and low-authority aggregators are excluded from decision-critical sections.'),
    bullet(`Policy: ${stylePlaybook.citationPolicy}`),
  ];
}

function buildCommonMistakesSection() {
  return [
    heading('h2', 'Common mistakes to avoid'),
    bullet('Selecting one tool globally before workflow-level validation.'),
    bullet('Approving rollout without baseline metrics and explicit success/failure thresholds.'),
    bullet('Ignoring fallback strategy and continuity planning for provider shifts.'),
    bullet('Comparing token pricing only, without tracking acceptance quality and rework overhead.'),
    bullet('Running pilots without assigning clear owner accountability and governance controls.'),
  ];
}

function buildFaqSection({ categoryLabel }) {
  return [
    heading('h2', 'FAQ'),
    heading('h3', `Is there one universal winner in ${categoryLabel.toLowerCase()}?`),
    paragraph(
      `No. Recommendation: assign primary tools by workflow domain, then keep one fallback option for continuity.`
    ),
    heading('h3', 'Should we standardize on one option for every team?'),
    paragraph(
      'Inference: Standardizing too early can reduce adaptability. Most organizations perform better with a controlled primary-plus-fallback model.'
    ),
    heading('h3', 'How often should this comparison be refreshed?'),
    paragraph(
      'Fact (2026-02-23): Re-validate quarterly, and also after major product updates, pricing changes, or policy shifts.'
    ),
    heading('h3', 'What should we measure during pilot evaluation?'),
    paragraph(
      'Recommendation: measure accepted output quality, rework time, cycle-time impact, and governance fit by workflow.'
    ),
  ];
}

function buildRoleGuidanceSection({ categoryLabel, publishDateLabel }) {
  return [
    heading('h2', 'Role-based recommendation paths'),
    heading('h3', 'Engineering leaders'),
    paragraph(
      `Fact (${publishDateLabel}): Engineering leaders typically optimize for reliability, maintainability, and time-to-value under delivery pressure.`
    ),
    paragraph(
      `Recommendation: For ${categoryLabel.toLowerCase()}, run scoped pilots with explicit rollback criteria and weekly instrumentation reviews before org-wide rollout.`
    ),
    heading('h3', 'Product and ops owners'),
    paragraph(
      'Inference: Product and operations owners benefit most when tools reduce coordination overhead and shorten feedback loops between teams.'
    ),
    paragraph(
      'Recommendation: Require a clear owner, onboarding plan, and adoption rubric before approving expanded spend.'
    ),
    heading('h3', 'Security and governance stakeholders'),
    paragraph(
      'Inference: Security teams generally need evidence of policy controls, access boundaries, and data handling paths before sign-off.'
    ),
    paragraph(
      'Recommendation: Complete a policy mapping checklist and document unresolved gaps prior to production rollout.'
    ),
  ];
}

function buildExecutionSection() {
  return [
    heading('h2', 'Execution plan and operating checklist'),
    heading('h3', 'Days 1-30: baseline and pilot design'),
    bullet('Define baseline metrics (cycle time, defect escape rate, adoption rate, and support load).'),
    bullet('Run one bounded production pilot with clear success and rollback thresholds.'),
    bullet('Capture integration blockers, manual workarounds, and security questions in one backlog.'),
    heading('h3', 'Days 31-60: controlled expansion'),
    bullet('Expand to a second workflow only after first-pilot KPIs show measurable improvement.'),
    bullet('Harden onboarding docs, usage guardrails, and incident playbooks from pilot learnings.'),
    bullet('Review commercial terms against projected usage to avoid surprise spend growth.'),
    heading('h3', 'Days 61-90: governance and scale readiness'),
    bullet('Formalize ownership model, review cadence, and escalation paths for critical failures.'),
    bullet('Document migration path and fallback plan if pricing, roadmap, or reliability changes materially.'),
    bullet('Publish adoption scorecard and decision log for leadership visibility.'),
  ];
}

function buildArticleBody({
  category,
  categoryLabel,
  candidates,
  publishDateLabel,
  introLine,
  guideLinks,
  stylePlaybook,
}) {
  const body = [];
  const visualReports = pickVisualReports(category);
  const candidateCap = Number.isInteger(stylePlaybook.maxCandidates)
    ? stylePlaybook.maxCandidates
    : 8;
  const requiredInternal = new Set(asArray(stylePlaybook.requiredInternalLinks));

  body.push(heading('h2', `Quick answer (${publishDateLabel}): which ${categoryLabel.toLowerCase()} options should teams shortlist now?`));
  body.push(
    paragraph(
      `Shortlist tools that show clear implementation signals, predictable maintenance burden, and explicit integration paths. ${introLine} This guide is decision-first and optimized for high-intent evaluation workflows.`
    )
  );

  body.push(...buildScenarioVerdictSection({ candidates, categoryLabel, publishDateLabel }));

  body.push(
    buildLinkedBlock([
      { text: 'Internal paths: ' },
      { text: `/category/${category}`, href: `/category/${category}` },
      { text: ' | ' },
      { text: '/latest', href: '/latest' },
      { text: ' | ' },
      { text: '/collections', href: '/collections' },
      { text: ' | ' },
      { text: '/compare', href: '/compare' },
      { text: ' | ' },
      { text: '/alternatives', href: '/alternatives' },
    ])
  );
  if (guideLinks.length > 0) {
    const guideParts = [{ text: 'Related guides: ' }];
    guideLinks.slice(0, 6).forEach((link, index) => {
      if (index > 0) guideParts.push({ text: ' | ' });
      guideParts.push({ text: link, href: link });
    });
    body.push(buildLinkedBlock(guideParts));
  }

  body.push(heading('h2', 'Authority brief and decision context'));
  body.push(paragraph(`Fact (${publishDateLabel}): Search intent is decision-stage evaluation for ${categoryLabel.toLowerCase()} with near-term implementation pressure.`));
  body.push(paragraph(`Reader job-to-be-done: choose a tool that improves delivery speed without adding unbounded operational complexity.`));
  body.push(paragraph(`Primary failure risk: selecting a tool on feature demos alone and discovering integration friction after rollout.`));

  body.push(...buildTopicCoverageSection({ category, categoryLabel }));
  body.push(...buildVisualEvidenceSection({ categoryLabel, publishDateLabel, visualReports }));

  body.push(heading('h2', 'Evaluation criteria used in this draft'));
  for (const criterion of EVALUATION_CRITERIA) {
    body.push(bullet(criterion));
  }
  body.push(bullet('Evidence quality and source freshness for every critical claim'));
  body.push(bullet('Operational readiness: ownership, onboarding, and incident response expectations'));
  body.push(bullet('Security/compliance mapping completeness before scaled rollout'));
  if (requiredInternal.size > 0) {
    body.push(
      bullet(
        `Internal link policy: include ${[...requiredInternal].join(', ')} in every decision guide.`
      )
    );
  }

  body.push(heading('h2', `${categoryLabel} candidates and tradeoff analysis`));

  let index = 1;
  for (const candidate of candidates.slice(0, candidateCap)) {
    body.push(...buildCandidateSection(candidate, index, publishDateLabel));
    index += 1;
  }

  body.push(...buildIntegrationRealitySection());
  body.push(...buildRoleGuidanceSection({ categoryLabel, publishDateLabel }));
  body.push(...buildExecutionSection());
  body.push(...buildCostModelSection());
  body.push(...buildSourceQualityPolicySection({ publishDateLabel, stylePlaybook }));
  body.push(...buildCommonMistakesSection());

  body.push(heading('h2', 'Where recommendations can fail'));
  body.push(bullet('Failure mode: no baseline metrics before pilot, making improvement claims unverifiable.'));
  body.push(bullet('Failure mode: rollout to entire org before validating integration reliability in one workflow.'));
  body.push(bullet('Failure mode: procurement decision made without ownership for maintenance and onboarding.'));
  body.push(bullet('Failure mode: ignoring migration plan if pricing or roadmap changes materially.'));

  body.push(heading('h2', 'Implementation sequence (30/60/90 days)'));
  body.push(paragraph('Recommendation: Days 1-30 should define baseline metrics and run one scoped pilot with weekly review checkpoints.'));
  body.push(paragraph('Recommendation: Days 31-60 should expand to a second workflow only if pilot metrics improve and rollback path remains viable.'));
  body.push(paragraph('Recommendation: Days 61-90 should formalize governance, training, and cost controls before wider rollout.'));

  body.push(heading('h2', 'Final recommendation'));
  body.push(paragraph('Inference: Teams that treat tool selection as an operational decision, not a novelty decision, usually see better long-term outcomes.'));
  body.push(paragraph('Recommendation: Publish this shortlist with sourced visuals, explicit tradeoff notes, and a freshness timestamp, then rerun validation before every major content refresh.'));

  body.push(heading('h2', 'Methodology and source freshness'));
  body.push(paragraph(`Fact (${publishDateLabel}): Sources in this draft are first-party links captured during the current research cycle.`));
  body.push(paragraph(`Fact (${publishDateLabel}): Time-sensitive claims should be re-verified on ${publishDateLabel} before publication, including benchmark visuals and cited metrics.`));
  body.push(...buildFaqSection({ categoryLabel }));

  return body;
}

function buildSources(candidates, visualReports) {
  const seen = new Set();
  const sources = [];

  for (const candidate of candidates) {
    const url = normalizeUrl(candidate.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);

    sources.push({
      _key: randomUUID(),
      label: `${displayTitle(candidate)} official site`,
      url,
    });

    if (sources.length >= 10) break;
  }

  for (const report of visualReports) {
    const reportUrl = normalizeUrl(report.reportUrl);
    if (!reportUrl || seen.has(reportUrl)) continue;
    seen.add(reportUrl);
    sources.push({
      _key: randomUUID(),
      label: `${report.organization}: ${report.title}`,
      url: reportUrl,
    });
  }

  return sources;
}

function buildAuthorityBrief({
  category,
  categoryLabel,
  candidates,
  publishDateLabel,
  visualReports,
  guideLinks,
  primaryKeyword,
  stylePlaybook,
}) {
  const shortlisted = candidates.slice(0, 8).map((candidate) => displayTitle(candidate));
  const benchmarkLabels = visualReports.map((report) => `${report.organization} ${report.title}`);

  return {
    searchIntent: `Decision-stage readers evaluating ${categoryLabel.toLowerCase()} for implementation in the next quarter`,
    primaryKeyword: primaryKeyword || `${categoryLabel.toLowerCase()} for teams`,
    safeHarborKeywords: [
      `${categoryLabel.toLowerCase()} comparison`,
      `${categoryLabel.toLowerCase()} alternatives`,
      `${categoryLabel.toLowerCase()} for startup teams`,
      `${categoryLabel.toLowerCase()} implementation checklist`,
      `${categoryLabel.toLowerCase()} security checklist`,
      `${categoryLabel.toLowerCase()} rollout plan`,
    ],
    readerJob: 'Select a tool with clear adoption upside and bounded operational risk.',
    failureRisks: [
      'No baseline metrics for evaluation',
      'Insufficient integration validation',
      'Undefined rollback path',
    ],
    evaluationCriteria: EVALUATION_CRITERIA,
    evidencePlan: `Prioritize first-party product URLs, benchmark reports, and attributed visuals (${benchmarkLabels.join('; ')}).`,
    internalLinks: [
      `/category/${category}`,
      '/collections',
      '/latest',
      '/compare',
      '/alternatives',
      ...guideLinks.slice(0, 4),
    ],
    differentiation:
      'Combines answer-first verdicts, source-attributed visuals, explicit fact/inference/recommendation framing, and execution checklists.',
    freshnessDate: publishDateLabel,
    shortlistedTools: shortlisted,
    citationPolicy: stylePlaybook.citationPolicy,
  };
}

function buildArticleTags({ category, categoryLabel, candidates, year }) {
  const tags = new Set();
  tags.add(category);
  tags.add(`${categoryLabel.toLowerCase()} guide`);
  tags.add('tool evaluation');
  tags.add('implementation checklist');
  tags.add('decision framework');
  tags.add(String(year));
  if (category === 'ai-tools') {
    tags.add('ai assistants');
    tags.add('developer workflow');
    if (hasNameMatch(candidates, /\bclaude\b/)) tags.add('claude');
    if (hasNameMatch(candidates, /\bchatgpt\b/)) tags.add('chatgpt');
    if (hasNameMatch(candidates, /\bgemini\b/)) tags.add('gemini');
  }

  for (const candidate of candidates.slice(0, 6)) {
    const token = slugify(displayTitle(candidate)).replace(/-/g, ' ').trim();
    if (token) tags.add(token);
  }

  return [...tags].slice(0, 14);
}

function hasNameMatch(candidates, pattern) {
  return candidates.some((candidate) => pattern.test(displayTitle(candidate).toLowerCase()));
}

function buildArticleIdentity({ category, categoryLabel, candidates, year }) {
  const hasClaude = hasNameMatch(candidates, /\bclaude\b/);
  const hasChatgpt = hasNameMatch(candidates, /\bchatgpt\b/);
  const hasGemini = hasNameMatch(candidates, /\bgemini\b/);

  if (category === 'ai-tools' && hasClaude && hasChatgpt && hasGemini) {
    return {
      title: `Claude vs ChatGPT vs Gemini for Teams (${year} Decision Guide)`,
      primaryKeyword: 'claude vs chatgpt vs gemini for developers',
      intentStage: 'consideration',
      excerpt:
        'A source-verified decision guide comparing Claude, ChatGPT, and Gemini for team workflows, implementation constraints, and governance fit.',
    };
  }

  return {
    title: `Best ${categoryLabel} for Teams (${year} Decision Guide)`,
    primaryKeyword: `${categoryLabel.toLowerCase()} for teams`,
    intentStage: 'decision',
    excerpt: `${categoryLabel} shortlist with fact/inference/recommendation framing, explicit tradeoffs, and source-backed implementation guidance for ${year}.`,
  };
}

export async function runWriterAgent() {
  const startedAt = Date.now();
  const taskId = `writer-${startedAt}`;
  const stylePlaybook = loadWriterPlaybook();
  console.log(`WRITER start playbook=${stylePlaybook.version}`);

  await logEvent({
    agentId: 'writer',
    taskId,
    actionType: 'started',
    target: 'writer.pipeline',
    metadata: { playbookVersion: stylePlaybook.version },
    status: 'running',
  });

  await assertRunAllowed({
    agentId: 'writer',
    taskId,
    target: 'writer.pipeline',
    stage: 'initialization',
  });

  const sanity = getSanityClient();
  const validatedLeads = loadJson(VALIDATED_FILE, []);

  const resources = await sanity.fetch(
    `*[_type == "resource"] | order(coalesce(lastReviewedAt, publishedAt, _updatedAt) desc)[0...80]{
      _id,
      title,
      slug,
      url,
      description,
      category,
      tags,
      bestFor,
      notFor
    }`
  );

  await assertRunAllowed({
    agentId: 'writer',
    taskId,
    target: 'writer.pipeline',
    stage: 'candidate-selection',
  });

  const category = pickTargetCategory(validatedLeads, resources);
  const categoryLabel = CATEGORY_LABELS[category] || 'Developer Tools';
  const visualReports = pickVisualReports(category);

  const candidates = getCandidatesForCategory(category, validatedLeads, resources);
  const minimumCandidates = Number.isInteger(stylePlaybook.minCandidates)
    ? stylePlaybook.minCandidates
    : 4;
  if (candidates.length < minimumCandidates) {
    throw new Error(`Insufficient candidate depth for writer in category ${category}`);
  }

  const existingArticles = await sanity.fetch(`*[_type == "article"]{ slug }`);
  const existingSlugSet = new Set(
    existingArticles.map((row) => String(row.slug || '').toLowerCase()).filter(Boolean)
  );

  const year = getCurrentYear();
  const dateLabel = isoDate();
  const guideLinks = asArray(INTERNAL_GUIDE_LINKS[category]).concat(['/collections', '/compare']);
  const articleIdentity = buildArticleIdentity({ category, categoryLabel, candidates, year });
  const title = articleIdentity.title;
  const slug = ensureUniqueSlug(slugify(title), existingSlugSet);

  const introLine = STYLE_INTROS[category] || 'The safest picks tend to be the ones with observable implementation clarity and realistic maintenance costs.';

  const body = buildArticleBody({
    category,
    categoryLabel,
    candidates,
    publishDateLabel: dateLabel,
    introLine,
    guideLinks,
    stylePlaybook,
  });

  await assertRunAllowed({
    agentId: 'writer',
    taskId,
    target: 'writer.pipeline',
    stage: 'draft-build',
  });

  const sources = buildSources(candidates, visualReports);
  const minimumSources = Number.isInteger(stylePlaybook.minSources)
    ? stylePlaybook.minSources
    : 8;
  if (sources.length < minimumSources) {
    throw new Error(`Insufficient source depth for writer: ${sources.length} < ${minimumSources}`);
  }
  const relatedResourceRefs = resources
    .filter((resource) => resource.category === category && resource._id)
    .slice(0, 6)
    .map((resource) => ({ _type: 'reference', _ref: resource._id }));

  const tags = buildArticleTags({
    category,
    categoryLabel,
    candidates,
    year,
  });

  const primaryResource = relatedResourceRefs[0] || null;
  const contentTier = sources.length >= 6 && relatedResourceRefs.length >= 3 ? 'tier1' : 'tier2';

  const article = {
    _type: 'article',
    title,
    slug,
    excerpt: articleIdentity.excerpt,
    primaryKeyword: articleIdentity.primaryKeyword,
    intentStage: articleIdentity.intentStage,
    contentTier,
    body,
    category,
    tags,
    sources,
    relatedResources: relatedResourceRefs,
    ...(primaryResource ? { primaryResource } : {}),
    author: 'The Stash Editorial Team',
    publishedAt: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString(),
    refreshCadenceDays: 90,
    factCheckStatus: 'needs-review',
    authorityBrief: buildAuthorityBrief({
      category,
      categoryLabel,
      candidates,
      publishDateLabel: dateLabel,
      visualReports,
      guideLinks,
      primaryKeyword: articleIdentity.primaryKeyword,
      stylePlaybook,
    }),
  };

  saveJson(BLOG_DRAFT_FILE, article);

  const approvalQueue = loadJson(APPROVAL_QUEUE_FILE, []);
  const existingQueueItem = approvalQueue.find(
    (item) => item.type === 'blog' && item?.data?.slug === slug && item.status !== 'rejected'
  );

  if (existingQueueItem) {
    existingQueueItem.data = article;
    existingQueueItem.submittedAt = new Date().toISOString();
    existingQueueItem.status = 'pending';
    delete existingQueueItem.review;
    delete existingQueueItem.needsApproval;
    delete existingQueueItem.approvedAt;
    saveJson(APPROVAL_QUEUE_FILE, approvalQueue);
  } else {
    approvalQueue.push({
      queueId: randomUUID(),
      type: 'blog',
      data: article,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    });
    saveJson(APPROVAL_QUEUE_FILE, approvalQueue);
  }

  const bodyMetrics = collectBodyMetrics(body);
  persistWriterLearningLog({
    timestamp: new Date().toISOString(),
    playbookVersion: stylePlaybook.version,
    slug,
    title,
    category,
    contentTier,
    candidates: candidates.length,
    sources: sources.length,
    relatedResources: relatedResourceRefs.length,
    bodyMetrics,
    styleGoals: stylePlaybook.styleGoals,
  });

  await logEvent({
    agentId: 'writer',
    taskId,
    actionType: 'completed',
    target: 'writer.pipeline',
    metadata: {
      slug,
      category,
      contentTier,
      candidates: candidates.length,
      sources: sources.length,
      playbookVersion: stylePlaybook.version,
      bodyMetrics,
    },
    durationMs: Date.now() - startedAt,
    status: 'completed',
  });

  console.log(
    `WRITER drafted title="${title}" tier=${contentTier} candidates=${candidates.length} visuals=${visualReports.length} tags=${tags.length} log=${WRITER_LEARNING_LOG_FILE}`
  );
  return article;
}

async function runFromCli() {
  try {
    const article = await runWriterAgent();
    console.log('WRITER done');
    console.log(JSON.stringify({ title: article.title, slug: article.slug }, null, 2));
  } catch (error) {
    await logEvent({
      agentId: 'writer',
      taskId: `writer-failed-${Date.now()}`,
      actionType: 'failed',
      target: 'writer.pipeline',
      metadata: null,
      status: 'failed',
      error: error.message,
    });
    console.error(`WRITER failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
