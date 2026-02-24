/**
 * UX AGENT - Weekly UX/content health analysis.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/ux-agent.mjs
 */

import { getSanityClient, isDirectRun, loadJson, saveJson } from './agent-shared.mjs';
import { assertRunAllowed } from './runtime-control.mjs';

function summarizeCategoryImbalance(byCategory) {
  const values = Object.values(byCategory || {});
  if (values.length === 0) return null;

  const max = Math.max(...values);
  const underrepresented = Object.entries(byCategory)
    .filter(([, count]) => count < max * 0.3)
    .map(([category]) => category);

  if (underrepresented.length === 0) return null;
  return underrepresented;
}

function generateRecommendations(resourceStats, articleStats, collectionStats) {
  const recommendations = [];

  if (resourceStats.withoutDescription > 10) {
    recommendations.push({
      priority: 'high',
      category: 'content',
      issue: `${resourceStats.withoutDescription} resources missing descriptions`,
      suggestion: 'Backfill description fields for affected resources.',
    });
  }

  if (resourceStats.withoutTags > 20) {
    recommendations.push({
      priority: 'high',
      category: 'seo',
      issue: `${resourceStats.withoutTags} resources missing tags`,
      suggestion: 'Add tags for better filtering and internal linking.',
    });
  }

  const categoryImbalance = summarizeCategoryImbalance(resourceStats.byCategory);
  if (categoryImbalance) {
    recommendations.push({
      priority: 'medium',
      category: 'content',
      issue: `Category imbalance in: ${categoryImbalance.join(', ')}`,
      suggestion: 'Prioritize discovery for underrepresented categories.',
    });
  }

  if (articleStats.withoutExcerpt > 5) {
    recommendations.push({
      priority: 'medium',
      category: 'seo',
      issue: `${articleStats.withoutExcerpt} articles missing excerpts`,
      suggestion: 'Add excerpt/meta descriptions for those articles.',
    });
  }

  const recent = articleStats.recent || [];
  if (recent.length > 0) {
    const lastPublished = new Date(recent[0].publishedAt).getTime();
    const daysSince = Math.floor((Date.now() - lastPublished) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) {
      recommendations.push({
        priority: 'high',
        category: 'content',
        issue: `No recently published article in ${daysSince} days`,
        suggestion: 'Publish one decision-stage article to maintain freshness.',
      });
    }
  }

  const sparseCollections = (collectionStats.collections || []).filter((collection) => collection.resourceCount < 5);
  if (sparseCollections.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'collections',
      issue: `${sparseCollections.length} collections have fewer than 5 resources`,
      suggestion: 'Expand or consolidate sparse collections.',
    });
  }

  return recommendations;
}

export async function runUXAgent() {
  const taskId = `ux-${Date.now()}`;
  await assertRunAllowed({
    agentId: 'ux',
    taskId,
    target: 'ux.pipeline',
    stage: 'start',
  });

  const sanity = getSanityClient();

  console.log('UX start');

  const [resourceStats, articleStats, collectionStats] = await Promise.all([
    sanity.fetch(`{
      "total": count(*[_type == "resource"]),
      "byCategory": {
        "design-tools": count(*[_type == "resource" && category == "design-tools"]),
        "development-tools": count(*[_type == "resource" && category == "development-tools"]),
        "ai-tools": count(*[_type == "resource" && category == "ai-tools"]),
        "productivity": count(*[_type == "resource" && category == "productivity"]),
        "learning-resources": count(*[_type == "resource" && category == "learning-resources"]),
        "ui-ux-resources": count(*[_type == "resource" && category == "ui-ux-resources"]),
        "inspiration": count(*[_type == "resource" && category == "inspiration"]),
        "webflow": count(*[_type == "resource" && category == "webflow"]),
        "shadcn": count(*[_type == "resource" && category == "shadcn"]),
        "miscellaneous": count(*[_type == "resource" && category == "miscellaneous"])
      },
      "featured": count(*[_type == "resource" && featured == true]),
      "withoutDescription": count(*[_type == "resource" && !defined(description)]),
      "withoutTags": count(*[_type == "resource" && !defined(tags)]),
      "withoutBestFor": count(*[_type == "resource" && !defined(bestFor)]),
      "withoutAlternatives": count(*[_type == "resource" && !defined(alternatives)])
    }`),
    sanity.fetch(`{
      "total": count(*[_type == "article"]),
      "published": count(*[_type == "article" && defined(publishedAt)]),
      "withoutExcerpt": count(*[_type == "article" && !defined(excerpt)]),
      "withoutKeyword": count(*[_type == "article" && !defined(primaryKeyword)]),
      "withoutIntent": count(*[_type == "article" && !defined(intentStage)]),
      "withoutRelated": count(*[_type == "article" && !defined(relatedResources)]),
      "recent": *[_type == "article" && defined(publishedAt)] | order(publishedAt desc)[0...5]{ title, publishedAt }
    }`),
    sanity.fetch(`{
      "total": count(*[_type == "collection"]),
      "collections": *[_type == "collection"]{ title, slug, "resourceCount": count(resources) } | order(resourceCount desc)
    }`),
  ]);

  const recommendations = generateRecommendations(resourceStats, articleStats, collectionStats);

  const report = {
    timestamp: new Date().toISOString(),
    resourceStats,
    articleStats,
    collectionStats,
    recommendations,
  };

  saveJson('./automation/agents/ux-report.json', report);
  const historical = loadJson('./automation/agents/ux-reports.json', []);
  saveJson('./automation/agents/ux-reports.json', [report, ...historical].slice(0, 20));

  console.log(`UX done recommendations=${recommendations.length}`);
  return report;
}

async function runFromCli() {
  try {
    await runUXAgent();
  } catch (error) {
    console.error(`UX failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
