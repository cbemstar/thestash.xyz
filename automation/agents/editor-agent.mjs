/**
 * EDITOR AGENT - Validates queued resources and blog drafts against quality gates.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/editor-agent.mjs
 */

import { asArray, countWords, isDirectRun, loadJson, saveJson, toPortableTextPlain } from './agent-shared.mjs';
import { assertRunAllowed } from './runtime-control.mjs';

const APPROVAL_QUEUE_FILE = './automation/agents/approval-queue.json';

const VALID_CATEGORIES = [
  'design-tools',
  'development-tools',
  'ui-ux-resources',
  'inspiration',
  'ai-tools',
  'productivity',
  'learning-resources',
  'webflow',
  'shadcn',
  'coding',
  'github',
  'html',
  'css',
  'javascript',
  'languages',
  'miscellaneous',
];

const GENERIC_PHRASES = [
  'comprehensive guide',
  'game changer',
  'ever-evolving',
  'in today\'s fast-paced',
  'move the needle',
  'one size fits all',
  'best-in-class',
  'unleash the power',
  'in this article we will',
  'it depends on your needs',
];

const TIER_RULES = {
  tier1: {
    minWords: 1800,
    minHeadings: 8,
    minListItems: 12,
    minInlineLinks: 8,
    minInternalLinks: 3,
    minExternalLinks: 4,
    minFactStatements: 8,
    minInferenceStatements: 6,
    minRecommendationStatements: 8,
    minSources: 6,
    minRelatedResources: 3,
    minTags: 6,
    minInfographics: 2,
    minSourcedImages: 2,
    minVisualAttributions: 4,
    minUniqueSourceDomains: 5,
  },
  tier2: {
    minWords: 1300,
    minHeadings: 6,
    minListItems: 8,
    minInlineLinks: 5,
    minInternalLinks: 2,
    minExternalLinks: 3,
    minFactStatements: 5,
    minInferenceStatements: 4,
    minRecommendationStatements: 5,
    minSources: 4,
    minRelatedResources: 2,
    minTags: 4,
    minInfographics: 1,
    minSourcedImages: 1,
    minVisualAttributions: 2,
    minUniqueSourceDomains: 4,
  },
};

const LOW_AUTHORITY_SOURCE_DOMAINS = new Set([
  'x.com',
  'twitter.com',
  't.co',
  'reddit.com',
  'www.reddit.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'medium.com',
  'substack.com',
]);

function scoreFromFindings(issues, warnings, passed) {
  const passedCount = Array.isArray(passed) ? passed.length : Number(passed) || 0;
  const weighted = passedCount * 2 - issues.length * 6 - warnings.length * 2;
  return Math.max(0, Math.min(100, 50 + weighted));
}

function countRegex(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim().toLowerCase())
    .filter((sentence) => sentence.length > 0);
}

function collectNarrativeSignals(plainText) {
  const lower = plainText.toLowerCase();
  const factCount = countRegex(plainText, /\bFact\s*\(/g);
  const inferenceCount = countRegex(plainText, /\bInference\s*:/g);
  const recommendationCount = countRegex(plainText, /\bRecommendation\s*:/g);
  const dateStampCount = countRegex(plainText, /\b20\d{2}-\d{2}-\d{2}\b/g);

  const genericMatches = GENERIC_PHRASES.filter((phrase) => lower.includes(phrase));

  const sentences = splitIntoSentences(plainText);
  const sentenceFrequency = new Map();
  for (const sentence of sentences) {
    sentenceFrequency.set(sentence, (sentenceFrequency.get(sentence) || 0) + 1);
  }

  let repeatedSentenceCount = 0;
  for (const count of sentenceFrequency.values()) {
    if (count > 1) repeatedSentenceCount += count - 1;
  }

  const repetitionRatio = sentences.length === 0 ? 0 : repeatedSentenceCount / sentences.length;

  return {
    factCount,
    inferenceCount,
    recommendationCount,
    dateStampCount,
    genericMatches,
    repetitionRatio,
  };
}

function validateAuthorityBrief(article) {
  const issues = [];

  const brief = article?.authorityBrief;
  if (!brief || typeof brief !== 'object') {
    issues.push('authorityBrief missing');
    return issues;
  }

  const requiredKeys = [
    'searchIntent',
    'primaryKeyword',
    'evaluationCriteria',
    'differentiation',
    'freshnessDate',
    'internalLinks',
    'citationPolicy',
  ];

  for (const key of requiredKeys) {
    if (!brief[key]) issues.push(`authorityBrief.${key} missing`);
  }

  if (!Array.isArray(brief.evaluationCriteria) || brief.evaluationCriteria.length < 5) {
    issues.push('authorityBrief.evaluationCriteria should have at least 5 criteria');
  }

  if (!Array.isArray(brief.internalLinks) || brief.internalLinks.length < 2) {
    issues.push('authorityBrief.internalLinks should include at least 2 links');
  }
  if (Array.isArray(brief.internalLinks)) {
    const includesCollection = brief.internalLinks.some((link) =>
      typeof link === 'string' && link.startsWith('/collections')
    );
    if (!includesCollection) {
      issues.push('authorityBrief.internalLinks should include /collections path');
    }
  }
  if (!Array.isArray(brief.shortlistedTools) || brief.shortlistedTools.length < 5) {
    issues.push('authorityBrief.shortlistedTools should include at least 5 tools');
  }

  return issues;
}

function validateResource(resource) {
  const issues = [];
  const warnings = [];
  const passed = [];

  if (!resource?.title || String(resource.title).trim().length < 2) {
    issues.push('Missing or invalid title');
  } else {
    passed.push('title');
  }

  if (!resource?.url || !/^https?:\/\//i.test(String(resource.url))) {
    issues.push('Missing or invalid url');
  } else {
    passed.push('url');
  }

  const descriptionLength = String(resource?.description || '').trim().length;
  if (descriptionLength < 10 || descriptionLength > 260) {
    issues.push('description must be 10..260 characters');
  } else {
    passed.push('description');
  }

  if (!VALID_CATEGORIES.includes(resource?.category)) {
    issues.push('Invalid category');
  } else {
    passed.push('category');
  }

  if (!resource?.slug || !/^[a-z0-9-]+$/.test(String(resource.slug))) {
    warnings.push('slug missing or not normalized');
  } else {
    passed.push('slug');
  }

  const bodyWords = countWords(resource?.body || '');
  if (bodyWords < 35) {
    warnings.push('body depth is low (<35 words)');
  } else {
    passed.push('body-depth');
  }

  const tier = String(resource?.contentTier || 'tier3');
  const sourceCount = asArray(resource?.sources).length;

  if ((tier === 'tier1' || tier === 'tier2') && sourceCount < 3) {
    issues.push('tier1/tier2 resource needs at least 3 sources');
  } else if (sourceCount > 0) {
    passed.push('sources');
  } else {
    warnings.push('sources missing');
  }

  if (!Number.isInteger(resource?.refreshCadenceDays) || resource.refreshCadenceDays < 7 || resource.refreshCadenceDays > 365) {
    warnings.push('refreshCadenceDays should be an integer in 7..365');
  } else {
    passed.push('refresh-cadence');
  }

  if (!resource?.factCheckStatus) {
    warnings.push('factCheckStatus missing');
  } else {
    passed.push('fact-check');
  }

  const score = scoreFromFindings(issues, warnings, passed);
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    passed,
    score,
  };
}

function collectBodyMetrics(body) {
  const metrics = {
    wordCount: 0,
    headingCount: 0,
    listItemCount: 0,
    linkCount: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
    infographicCount: 0,
    sourcedImageCount: 0,
    visualAttributionCount: 0,
  };

  for (const block of asArray(body)) {
    if (!block || typeof block !== 'object') continue;

    const blockType = String(block._type || 'block');

    if (blockType === 'infographic') {
      metrics.infographicCount += 1;
      if (block.sourceLabel && block.sourceUrl) metrics.visualAttributionCount += 1;

      const chunks = [];
      if (typeof block.title === 'string') chunks.push(block.title);
      for (const stat of asArray(block.stats)) {
        if (stat?.label) chunks.push(String(stat.label));
        if (stat?.value) chunks.push(String(stat.value));
        if (stat?.subtext) chunks.push(String(stat.subtext));
      }
      metrics.wordCount += countWords(chunks.join(' '));
      continue;
    }

    if (blockType === 'sourcedImage') {
      metrics.sourcedImageCount += 1;
      if (block.sourceLabel && block.sourceUrl) metrics.visualAttributionCount += 1;
      const chunks = [
        typeof block.alt === 'string' ? block.alt : '',
        typeof block.caption === 'string' ? block.caption : '',
      ];
      metrics.wordCount += countWords(chunks.join(' '));
      continue;
    }

    const style = String(block.style || 'normal').toLowerCase();
    if (/^h[1-6]$/.test(style)) metrics.headingCount += 1;

    if (block.listItem || style === 'bullet' || style === 'numbered' || style === 'bulletlist' || style === 'numberedlist') {
      metrics.listItemCount += 1;
    }

    const children = asArray(block.children);
    const text = children
      .map((child) => (child && typeof child.text === 'string' ? child.text : ''))
      .join(' ');
    metrics.wordCount += countWords(text);

    const referencedMarks = new Set();
    for (const child of children) {
      for (const mark of asArray(child?.marks)) {
        referencedMarks.add(mark);
      }
    }

    const linkDefs = asArray(block.markDefs).filter(
      (markDef) => markDef && markDef._type === 'link' && markDef._key && referencedMarks.has(markDef._key)
    );

    metrics.linkCount += linkDefs.length;
    for (const linkDef of linkDefs) {
      const href = String(linkDef.href || '');
      if (href.startsWith('/')) metrics.internalLinkCount += 1;
      else if (/^https?:\/\//i.test(href)) metrics.externalLinkCount += 1;
    }
  }

  return metrics;
}

function collectHeadingTexts(body) {
  const headings = [];
  for (const block of asArray(body)) {
    if (!block || typeof block !== 'object') continue;
    const style = String(block.style || '').toLowerCase();
    if (!/^h[1-6]$/.test(style)) continue;
    const text = asArray(block.children)
      .map((child) => (child && typeof child.text === 'string' ? child.text : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) headings.push(text.toLowerCase());
  }
  return headings;
}

function normalizeDomain(url) {
  try {
    return new URL(String(url || '')).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function collectSourceDomainSignals(article) {
  const domains = asArray(article?.sources)
    .map((source) => normalizeDomain(source?.url))
    .filter(Boolean);
  const uniqueDomains = [...new Set(domains)];
  const lowAuthority = uniqueDomains.filter((domain) => LOW_AUTHORITY_SOURCE_DOMAINS.has(domain));
  return {
    uniqueDomains,
    lowAuthority,
  };
}

function validateVisualEvidence(article, bodyMetrics) {
  const issues = [];
  const warnings = [];
  const passed = [];
  const sourceDomains = new Set(
    asArray(article?.sources)
      .map((source) => normalizeDomain(source?.url))
      .filter(Boolean)
  );

  const visuals = asArray(article?.body).filter((block) => {
    const type = String(block?._type || '');
    return type === 'infographic' || type === 'sourcedImage';
  });

  for (const visual of visuals) {
    const visualType = String(visual?._type || 'visual');
    const sourceLabel = String(visual?.sourceLabel || '').trim();
    const sourceUrl = String(visual?.sourceUrl || '').trim();
    const imageUrl = String(visual?.imageUrl || '').trim();

    if (!sourceLabel || !sourceUrl) {
      issues.push(`${visualType} is missing sourceLabel/sourceUrl attribution`);
      continue;
    }

    if (!/^https?:\/\//i.test(sourceUrl)) {
      issues.push(`${visualType} sourceUrl must be a valid http(s) URL`);
    }

    if (visualType === 'sourcedImage' && imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      issues.push('sourcedImage.imageUrl must be a valid http(s) URL');
    }

    const sourceDomain = normalizeDomain(sourceUrl);
    if (sourceDomain && sourceDomains.size > 0 && !sourceDomains.has(sourceDomain)) {
      warnings.push(
        `${visualType} source domain (${sourceDomain}) is not listed in article.sources`
      );
    }
  }

  if (bodyMetrics.infographicCount > 0) passed.push('infographics');
  if (bodyMetrics.sourcedImageCount > 0) passed.push('sourced-images');
  if (bodyMetrics.visualAttributionCount > 0) passed.push('visual-attribution');

  return { issues, warnings, passed };
}

function validateArticle(article) {
  const issues = [];
  const warnings = [];
  const passed = [];

  const requiredFields = ['title', 'slug', 'excerpt', 'primaryKeyword', 'intentStage', 'body'];
  for (const field of requiredFields) {
    if (!article?.[field]) issues.push(`Missing required field: ${field}`);
    else passed.push(field);
  }

  if (article?.slug && !/^[a-z0-9-]+$/.test(String(article.slug))) {
    issues.push('slug must be lowercase kebab-case');
  }

  const validIntents = ['awareness', 'consideration', 'decision', 'implementation'];
  if (article?.intentStage && !validIntents.includes(String(article.intentStage))) {
    issues.push('intentStage must be awareness|consideration|decision|implementation');
  }

  const bodyMetrics = collectBodyMetrics(article?.body);
  const headingTexts = collectHeadingTexts(article?.body);
  const hasQuickVerdictHeading = headingTexts.some(
    (heading) => heading.includes('quick verdict') || heading.includes('quick answer')
  );
  const hasFaqHeading = headingTexts.some((heading) => heading === 'faq' || heading.startsWith('faq '));
  const hasImplementationHeading = headingTexts.some(
    (heading) =>
      heading.includes('implementation') ||
      heading.includes('rollout') ||
      heading.includes('checklist')
  );
  const sourceDomainSignals = collectSourceDomainSignals(article);

  passed.push(
    `body-metrics words=${bodyMetrics.wordCount} headings=${bodyMetrics.headingCount} listItems=${bodyMetrics.listItemCount} links=${bodyMetrics.linkCount} infographics=${bodyMetrics.infographicCount} sourcedImages=${bodyMetrics.sourcedImageCount}`
  );
  const visualValidation = validateVisualEvidence(article, bodyMetrics);
  issues.push(...visualValidation.issues);
  warnings.push(...visualValidation.warnings);
  passed.push(...visualValidation.passed);

  const plainText = toPortableTextPlain(article?.body);
  const narrative = collectNarrativeSignals(plainText);

  if (narrative.dateStampCount < 1) {
    issues.push('body must include at least one absolute freshness date (YYYY-MM-DD)');
  } else {
    passed.push('freshness-date');
  }

  if (narrative.genericMatches.length > 0) {
    issues.push(`generic phrasing detected: ${narrative.genericMatches.join(', ')}`);
  } else {
    passed.push('non-generic-phrasing');
  }

  if (narrative.repetitionRatio > 0.28) {
    warnings.push(`sentence repetition ratio is high (${narrative.repetitionRatio.toFixed(2)})`);
  } else {
    passed.push('repetition-check');
  }

  const tier = String(article?.contentTier || 'tier3');
  const tierRule = TIER_RULES[tier];

  const sourceCount = asArray(article?.sources).length;
  const relatedCount = asArray(article?.relatedResources).length;
  const tagCount = asArray(article?.tags).filter((tag) => typeof tag === 'string' && tag.trim()).length;
  const primaryResourceRef = article?.primaryResource?._ref || article?.primaryResource?._id || null;

  if (tagCount === 0) issues.push('tags missing');
  else passed.push('tags');

  if (!primaryResourceRef) {
    warnings.push('primaryResource missing');
  } else {
    passed.push('primary-resource');
  }

  if (!article?.author) warnings.push('author missing');
  else passed.push('author');

  if (!article?.publishedAt) warnings.push('publishedAt missing');
  else passed.push('published-at');

  if (tierRule) {
    if (!article?.lastReviewedAt) issues.push('tier1/tier2 article needs lastReviewedAt');
    if (!hasQuickVerdictHeading) {
      issues.push('tier1/tier2 article needs a quick verdict/quick answer section heading');
    } else {
      passed.push('quick-verdict-section');
    }
    if (!hasFaqHeading) {
      issues.push('tier1/tier2 article needs an FAQ section heading');
    } else {
      passed.push('faq-section');
    }
    if (!hasImplementationHeading) {
      issues.push('tier1/tier2 article needs an implementation/checklist/rollout section heading');
    } else {
      passed.push('implementation-section');
    }

    if (sourceCount < tierRule.minSources) {
      issues.push(`tier1/tier2 article needs at least ${tierRule.minSources} sources`);
    }
    if (sourceDomainSignals.uniqueDomains.length < tierRule.minUniqueSourceDomains) {
      issues.push(
        `tier1/tier2 article needs at least ${tierRule.minUniqueSourceDomains} unique source domains`
      );
    } else {
      passed.push('source-domain-diversity');
    }
    if (sourceDomainSignals.lowAuthority.length > 0) {
      issues.push(
        `low-authority source domains detected: ${sourceDomainSignals.lowAuthority.join(', ')}`
      );
    } else {
      passed.push('source-authority');
    }
    if (relatedCount < tierRule.minRelatedResources) {
      issues.push(
        `tier1/tier2 article needs at least ${tierRule.minRelatedResources} relatedResources`
      );
    }
    if (tagCount < tierRule.minTags) {
      issues.push(`tier1/tier2 article needs at least ${tierRule.minTags} tags`);
    }

    if (bodyMetrics.wordCount < tierRule.minWords) {
      issues.push(`wordCount below ${tier}: ${bodyMetrics.wordCount} < ${tierRule.minWords}`);
    }
    if (bodyMetrics.headingCount < tierRule.minHeadings) {
      issues.push(`headingCount below ${tier}: ${bodyMetrics.headingCount} < ${tierRule.minHeadings}`);
    }
    if (bodyMetrics.listItemCount < tierRule.minListItems) {
      issues.push(`listItemCount below ${tier}: ${bodyMetrics.listItemCount} < ${tierRule.minListItems}`);
    }
    if (bodyMetrics.linkCount < tierRule.minInlineLinks) {
      issues.push(`inline link count below ${tier}: ${bodyMetrics.linkCount} < ${tierRule.minInlineLinks}`);
    }
    if (bodyMetrics.internalLinkCount < tierRule.minInternalLinks) {
      issues.push(`internal link count below ${tier}: ${bodyMetrics.internalLinkCount} < ${tierRule.minInternalLinks}`);
    }
    if (bodyMetrics.externalLinkCount < tierRule.minExternalLinks) {
      issues.push(`external link count below ${tier}: ${bodyMetrics.externalLinkCount} < ${tierRule.minExternalLinks}`);
    }
    if (bodyMetrics.infographicCount < tierRule.minInfographics) {
      issues.push(`infographic count below ${tier}: ${bodyMetrics.infographicCount} < ${tierRule.minInfographics}`);
    }
    if (bodyMetrics.sourcedImageCount < tierRule.minSourcedImages) {
      issues.push(`sourced image count below ${tier}: ${bodyMetrics.sourcedImageCount} < ${tierRule.minSourcedImages}`);
    }
    if (bodyMetrics.visualAttributionCount < tierRule.minVisualAttributions) {
      issues.push(`visual attribution count below ${tier}: ${bodyMetrics.visualAttributionCount} < ${tierRule.minVisualAttributions}`);
    }

    if (narrative.factCount < tierRule.minFactStatements) {
      issues.push(`fact statement count below ${tier}: ${narrative.factCount} < ${tierRule.minFactStatements}`);
    }
    if (narrative.inferenceCount < tierRule.minInferenceStatements) {
      issues.push(`inference statement count below ${tier}: ${narrative.inferenceCount} < ${tierRule.minInferenceStatements}`);
    }
    if (narrative.recommendationCount < tierRule.minRecommendationStatements) {
      issues.push(`recommendation statement count below ${tier}: ${narrative.recommendationCount} < ${tierRule.minRecommendationStatements}`);
    }

    const briefIssues = validateAuthorityBrief(article);
    issues.push(...briefIssues);
    if (briefIssues.length === 0) passed.push('authority-brief');
  } else {
    if (sourceCount === 0) warnings.push('sources missing');
    if (!hasQuickVerdictHeading) warnings.push('quick verdict/quick answer heading missing');
    if (!hasFaqHeading) warnings.push('FAQ section missing');
    if (relatedCount === 0) warnings.push('relatedResources missing');
    if (tagCount === 0) warnings.push('tags missing');
    if (sourceDomainSignals.uniqueDomains.length < 3) warnings.push('source domain diversity is low (<3)');
    if (sourceDomainSignals.lowAuthority.length > 0) {
      warnings.push(
        `low-authority source domains detected: ${sourceDomainSignals.lowAuthority.join(', ')}`
      );
    }
    if (bodyMetrics.infographicCount === 0) warnings.push('infographics missing');
    if (bodyMetrics.sourcedImageCount === 0) warnings.push('sourced images missing');
    if (countWords(plainText) < 450) warnings.push('tier3 body depth is low (<450 words)');
  }

  const score = scoreFromFindings(issues, warnings, passed);
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    passed,
    score,
  };
}

export async function runEditorAgent() {
  const taskId = `editor-${Date.now()}`;
  await assertRunAllowed({
    agentId: 'editor',
    taskId,
    target: 'editor.pipeline',
    stage: 'start',
  });

  console.log('EDITOR start');

  const approvalQueue = loadJson(APPROVAL_QUEUE_FILE, []);
  if (approvalQueue.length === 0) {
    console.log('EDITOR queue empty');
    return [];
  }

  const reviewedItems = [];

  for (const item of approvalQueue) {
    await assertRunAllowed({
      agentId: 'editor',
      taskId,
      target: 'editor.review',
      stage: 'item-review',
    });

    if (item.status !== 'pending') continue;

    let validation;
    if (item.type === 'resource') validation = validateResource(item.data);
    else if (item.type === 'blog') validation = validateArticle(item.data);
    else {
      item.status = 'needs_revision';
      item.review = {
        valid: false,
        score: 0,
        issues: ['Unknown queue item type'],
        warnings: [],
        reviewedAt: new Date().toISOString(),
      };
      reviewedItems.push(item);
      continue;
    }

    item.review = {
      valid: validation.valid,
      score: validation.score,
      issues: validation.issues,
      warnings: validation.warnings,
      passed: validation.passed,
      reviewedAt: new Date().toISOString(),
    };

    if (validation.valid) {
      item.status = 'reviewed';
      item.needsApproval = true;
    } else {
      item.status = 'needs_revision';
      item.needsApproval = false;
    }

    reviewedItems.push(item);
  }

  saveJson(APPROVAL_QUEUE_FILE, approvalQueue);

  const ready = reviewedItems.filter((item) => item.status === 'reviewed').length;
  const failed = reviewedItems.filter((item) => item.status === 'needs_revision').length;

  console.log(`EDITOR reviewed=${reviewedItems.length} ready=${ready} needs_revision=${failed}`);
  return reviewedItems;
}

async function runFromCli() {
  try {
    const reviewed = await runEditorAgent();
    console.log('EDITOR done');
    console.log(JSON.stringify({ reviewed: reviewed.length }, null, 2));
  } catch (error) {
    console.error(`EDITOR failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
