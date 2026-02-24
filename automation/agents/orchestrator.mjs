/**
 * ORCHESTRATOR - Coordinates automation agents.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/orchestrator.mjs daily
 */

import { isDirectRun, loadJson, saveJson } from './agent-shared.mjs';
import { logEvent } from './event-logger.mjs';
import { assertRunAllowed } from './runtime-control.mjs';

const APPROVAL_QUEUE_FILE = './automation/agents/approval-queue.json';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDaily() {
  const taskId = `orchestrator-daily-${Date.now()}`;
  console.log('ORCHESTRATOR daily start');
  await logEvent({
    agentId: 'orchestrator',
    taskId,
    actionType: 'started',
    target: 'orchestrator.daily',
    status: 'running',
  });

  await assertRunAllowed({
    agentId: 'orchestrator',
    taskId,
    target: 'orchestrator.daily',
    stage: 'before-scout',
  });

  const { runScoutAgent } = await import('./scout-agent.mjs');
  const scoutLeads = await runScoutAgent();
  console.log(`ORCHESTRATOR scout leads=${scoutLeads.length}`);

  await sleep(300);

  await assertRunAllowed({
    agentId: 'orchestrator',
    taskId,
    target: 'orchestrator.daily',
    stage: 'before-research',
  });
  const { runResearchAgent } = await import('./research-agent.mjs');
  const validatedLeads = await runResearchAgent();
  console.log(`ORCHESTRATOR research validated=${validatedLeads.length}`);

  await sleep(300);

  await assertRunAllowed({
    agentId: 'orchestrator',
    taskId,
    target: 'orchestrator.daily',
    stage: 'before-writer',
  });
  const { runWriterAgent } = await import('./writer-agent.mjs');
  const article = await runWriterAgent();
  console.log(`ORCHESTRATOR writer article=${article.slug}`);

  await sleep(300);

  await assertRunAllowed({
    agentId: 'orchestrator',
    taskId,
    target: 'orchestrator.daily',
    stage: 'before-editor',
  });
  const { runEditorAgent } = await import('./editor-agent.mjs');
  const reviewed = await runEditorAgent();
  const readyForApproval = reviewed.filter((item) => item.status === 'reviewed').length;
  const needsRevision = reviewed.filter((item) => item.status === 'needs_revision').length;

  console.log(
    `ORCHESTRATOR editor reviewed=${reviewed.length} ready=${readyForApproval} needs_revision=${needsRevision}`
  );

  const summary = {
    scoutLeads: scoutLeads.length,
    validatedLeads: validatedLeads.length,
    reviewedItems: reviewed.length,
    readyForApproval,
    needsRevision,
  };

  await logEvent({
    agentId: 'orchestrator',
    taskId,
    actionType: 'completed',
    target: 'orchestrator.daily',
    metadata: summary,
    status: 'completed',
  });

  return summary;
}

export async function runWeekly() {
  const taskId = `orchestrator-weekly-${Date.now()}`;
  console.log('ORCHESTRATOR weekly start');
  await logEvent({
    agentId: 'orchestrator',
    taskId,
    actionType: 'started',
    target: 'orchestrator.weekly',
    status: 'running',
  });

  await assertRunAllowed({
    agentId: 'orchestrator',
    taskId,
    target: 'orchestrator.weekly',
    stage: 'before-ux',
  });

  const { runUXAgent } = await import('./ux-agent.mjs');
  const uxReport = await runUXAgent();
  console.log(`ORCHESTRATOR ux recommendations=${uxReport.recommendations?.length || 0}`);

  await sleep(300);

  await assertRunAllowed({
    agentId: 'orchestrator',
    taskId,
    target: 'orchestrator.weekly',
    stage: 'before-loops',
  });
  const { runLoopsAgent } = await import('./loops-agent.mjs');
  const digest = await runLoopsAgent();
  console.log(`ORCHESTRATOR loops succeeded=${digest.succeeded || 0}`);

  const summary = { ux: uxReport, loops: digest };
  await logEvent({
    agentId: 'orchestrator',
    taskId,
    actionType: 'completed',
    target: 'orchestrator.weekly',
    status: 'completed',
  });
  return summary;
}

export async function approveAndPublish({ autoApproveReviewed = false } = {}) {
  const taskId = `orchestrator-approve-${Date.now()}`;
  console.log('ORCHESTRATOR publish start');
  await logEvent({
    agentId: 'orchestrator',
    taskId,
    actionType: 'started',
    target: 'orchestrator.approve',
    metadata: { autoApproveReviewed },
    status: 'running',
  });

  await assertRunAllowed({
    agentId: 'orchestrator',
    taskId,
    target: 'orchestrator.approve',
    stage: 'before-approval',
  });

  const queue = loadJson(APPROVAL_QUEUE_FILE, []);

  if (autoApproveReviewed) {
    let changed = 0;
    for (const item of queue) {
      if (item.status === 'reviewed') {
        item.status = 'approved';
        item.approvedAt = new Date().toISOString();
        changed += 1;
      }
    }
    saveJson(APPROVAL_QUEUE_FILE, queue);
    console.log(`ORCHESTRATOR auto-approved reviewed items=${changed}`);
  }

  const approvedItems = queue.filter((item) => item.status === 'approved');
  if (approvedItems.length === 0) {
    console.log('ORCHESTRATOR no approved items to publish');
    return [];
  }

  const { runPublisherAgent } = await import('./publisher-agent.mjs');
  const results = await runPublisherAgent(approvedItems);

  const success = results.filter((result) => result.success).length;
  const failed = results.length - success;
  console.log(`ORCHESTRATOR publish done total=${results.length} success=${success} failed=${failed}`);

  await logEvent({
    agentId: 'orchestrator',
    taskId,
    actionType: 'completed',
    target: 'orchestrator.approve',
    metadata: { total: results.length, success, failed },
    status: 'completed',
  });

  return results;
}

async function runSingle(command) {
  switch (command) {
    case 'scout': {
      const { runScoutAgent } = await import('./scout-agent.mjs');
      return runScoutAgent();
    }
    case 'research': {
      const { runResearchAgent } = await import('./research-agent.mjs');
      return runResearchAgent();
    }
    case 'writer': {
      const { runWriterAgent } = await import('./writer-agent.mjs');
      return runWriterAgent();
    }
    case 'editor': {
      const { runEditorAgent } = await import('./editor-agent.mjs');
      return runEditorAgent();
    }
    case 'publisher': {
      const { runPublisherAgent } = await import('./publisher-agent.mjs');
      return runPublisherAgent();
    }
    case 'ux': {
      const { runUXAgent } = await import('./ux-agent.mjs');
      return runUXAgent();
    }
    case 'loops': {
      const { runLoopsAgent } = await import('./loops-agent.mjs');
      return runLoopsAgent();
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'daily';
  const autoApproveReviewed = args.includes('--approve-reviewed');

  if (command === 'daily') {
    await runDaily();
  } else if (command === 'weekly') {
    await runWeekly();
  } else if (command === 'approve') {
    await approveAndPublish({ autoApproveReviewed });
  } else if (command === 'full') {
    await runDaily();
    await approveAndPublish({ autoApproveReviewed });
  } else {
    await runSingle(command);
  }

  console.log('ORCHESTRATOR done');
}

async function runFromCli() {
  try {
    await main();
  } catch (error) {
    console.error(`ORCHESTRATOR failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
