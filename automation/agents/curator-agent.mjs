/**
 * CURATOR AGENT - Resource-focused pipeline runner.
 *
 * Combines:
 *   scout -> research -> editor -> (optional) auto-approve -> (optional) publish
 *
 * Run:
 *   node --env-file=.env.local automation/agents/curator-agent.mjs
 *   node --env-file=.env.local automation/agents/curator-agent.mjs --auto-approve-reviewed --publish-approved
 *   node --env-file=.env.local automation/agents/curator-agent.mjs --auto-approve-reviewed --publish-approved --max-publish=25
 */

import { logEvent } from './event-logger.mjs';
import { asArray, isDirectRun, loadJson, saveJson } from './agent-shared.mjs';
import { assertRunAllowed } from './runtime-control.mjs';
import { runScoutAgent } from './scout-agent.mjs';
import { runResearchAgent } from './research-agent.mjs';
import { runEditorAgent } from './editor-agent.mjs';
import { runPublisherAgent } from './publisher-agent.mjs';

const APPROVAL_QUEUE_FILE = './automation/agents/approval-queue.json';

function parseBooleanArg(args, key) {
  return args.has(key);
}

function parseNumberArg(args, key, fallback = 0) {
  const matched = [...args].find((arg) => arg.startsWith(`${key}=`));
  if (!matched) return fallback;
  const raw = Number.parseInt(matched.split('=').slice(1).join('='), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function autoApproveItems(queue, { includeBlogs }) {
  let changed = 0;
  for (const item of queue) {
    if (item.status !== 'reviewed') continue;
    if (item.type === 'blog' && !includeBlogs) continue;
    if (item.type !== 'resource' && item.type !== 'blog') continue;
    item.status = 'approved';
    item.approvedAt = new Date().toISOString();
    changed += 1;
  }
  return changed;
}

function selectApprovedItems(queue, { includeBlogs, maxPublish }) {
  const approved = queue.filter((item) => {
    if (item.status !== 'approved') return false;
    if (item.type === 'resource') return true;
    if (item.type === 'blog') return includeBlogs;
    return false;
  });

  if (!Number.isInteger(maxPublish) || maxPublish <= 0) return approved;
  return approved.slice(0, maxPublish);
}

function removePublishedItemsFromQueue(queue, results) {
  const successQueueIds = new Set(
    asArray(results)
      .filter((result) => result?.success && result?.queueId)
      .map((result) => result.queueId)
  );

  if (successQueueIds.size === 0) return queue;
  return queue.filter((item) => !item.queueId || !successQueueIds.has(item.queueId));
}

export async function runCuratorAgent(options = {}) {
  const startedAt = Date.now();
  const runId = `curator-${startedAt}`;
  const opts = {
    autoApproveReviewed: Boolean(options.autoApproveReviewed),
    publishApproved: Boolean(options.publishApproved),
    includeBlogs: Boolean(options.includeBlogs),
    maxPublish: Number.isInteger(options.maxPublish) ? options.maxPublish : 0,
  };

  console.log(
    `CURATOR start runId=${runId} autoApprove=${opts.autoApproveReviewed} publish=${opts.publishApproved} includeBlogs=${opts.includeBlogs} maxPublish=${opts.maxPublish || 'all'}`
  );

  await logEvent({
    agentId: 'curator',
    taskId: runId,
    actionType: 'started',
    target: 'curator.pipeline',
    metadata: opts,
    status: 'running',
  });

  await assertRunAllowed({
    agentId: 'curator',
    taskId: runId,
    target: 'curator.pipeline',
    stage: 'before-scout',
  });
  await logEvent({
    agentId: 'curator',
    taskId: runId,
    actionType: 'message',
    target: 'stage:scout',
    status: 'running',
  });
  const scoutLeads = await runScoutAgent();

  await assertRunAllowed({
    agentId: 'curator',
    taskId: runId,
    target: 'curator.pipeline',
    stage: 'before-research',
  });
  await logEvent({
    agentId: 'curator',
    taskId: runId,
    actionType: 'message',
    target: 'stage:research',
    metadata: { scoutLeads: scoutLeads.length },
    status: 'running',
  });
  const validated = await runResearchAgent();

  await assertRunAllowed({
    agentId: 'curator',
    taskId: runId,
    target: 'curator.pipeline',
    stage: 'before-editor',
  });
  await logEvent({
    agentId: 'curator',
    taskId: runId,
    actionType: 'message',
    target: 'stage:editor',
    metadata: { validated: validated.length },
    status: 'running',
  });
  const reviewed = await runEditorAgent();

  const queue = loadJson(APPROVAL_QUEUE_FILE, []);
  const autoApproved = opts.autoApproveReviewed
    ? autoApproveItems(queue, { includeBlogs: opts.includeBlogs })
    : 0;
  if (autoApproved > 0) saveJson(APPROVAL_QUEUE_FILE, queue);

  let publishResults = [];
  if (opts.publishApproved) {
    await assertRunAllowed({
      agentId: 'curator',
      taskId: runId,
      target: 'curator.pipeline',
      stage: 'before-publish',
    });

    const currentQueue = loadJson(APPROVAL_QUEUE_FILE, []);
    const approvedItems = selectApprovedItems(currentQueue, opts);
    if (approvedItems.length > 0) {
      publishResults = await runPublisherAgent(approvedItems);
      const updatedQueue = removePublishedItemsFromQueue(currentQueue, publishResults);
      saveJson(APPROVAL_QUEUE_FILE, updatedQueue);
    }
  }

  const summary = {
    runId,
    scoutLeads: scoutLeads.length,
    validated: validated.length,
    reviewed: reviewed.length,
    autoApproved,
    published: publishResults.filter((result) => result.success).length,
    publishFailed: publishResults.filter((result) => !result.success).length,
    durationMs: Date.now() - startedAt,
  };

  await logEvent({
    agentId: 'curator',
    taskId: runId,
    actionType: 'completed',
    target: 'curator.pipeline',
    metadata: summary,
    durationMs: summary.durationMs,
    status: 'completed',
  });

  console.log(
    `CURATOR done leads=${summary.scoutLeads} validated=${summary.validated} reviewed=${summary.reviewed} autoApproved=${summary.autoApproved} published=${summary.published} failed=${summary.publishFailed}`
  );
  return summary;
}

async function runFromCli() {
  const args = new Set(process.argv.slice(2));
  const options = {
    autoApproveReviewed: parseBooleanArg(args, '--auto-approve-reviewed'),
    publishApproved: parseBooleanArg(args, '--publish-approved'),
    includeBlogs: parseBooleanArg(args, '--include-blogs'),
    maxPublish: parseNumberArg(args, '--max-publish', 0),
  };

  try {
    const summary = await runCuratorAgent(options);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await logEvent({
      agentId: 'curator',
      taskId: `curator-failed-${Date.now()}`,
      actionType: 'failed',
      target: 'curator.pipeline',
      metadata: options,
      status: 'failed',
      error: error.message,
    });
    console.error(`CURATOR failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
