/**
 * AGENT DAEMON - 24/7 loop runner for curator + weekly jobs.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/agent-daemon.mjs
 *
 * Optional args:
 *   --interval-min=180
 *   --weekly-hours=168
 *   --max-publish=0          (0/all/unlimited = no limit)
 *   --auto-approve-reviewed
 *   --publish-approved
 *   --include-blogs
 *
 * Optional env:
 *   AGENT_INTERVAL_MIN
 *   AGENT_WEEKLY_HOURS
 *   AGENT_MAX_PUBLISH
 *   AGENT_AUTO_APPROVE_REVIEWED=1
 *   AGENT_PUBLISH_APPROVED=1
 *   AGENT_INCLUDE_BLOGS=1
 */

import { isDirectRun } from './agent-shared.mjs';
import { logEvent } from './event-logger.mjs';
import { assertRunAllowed, isStopRequested } from './runtime-control.mjs';
import { runCuratorAgent } from './curator-agent.mjs';
import { runWeekly } from './orchestrator.mjs';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseNumberArg(argv, key, fallback) {
  const row = argv.find((arg) => arg.startsWith(`${key}=`));
  if (!row) return fallback;
  const value = Number.parseInt(row.split('=').slice(1).join('='), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseMaxPublishValue(rawValue, fallback) {
  const raw = String(rawValue ?? '').trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === 'all' || raw === 'unlimited' || raw === 'none') return 0;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function parseMaxPublishArg(argv) {
  const row = argv.find((arg) => arg.startsWith('--max-publish='));
  if (!row) return null;
  const raw = row.split('=').slice(1).join('=');
  return parseMaxPublishValue(raw, null);
}

function hasFlag(argv, key) {
  return argv.includes(key);
}

function asBoolean(input) {
  return input === true || input === '1' || input === 'true';
}

export async function runAgentDaemon() {
  const taskId = `daemon-${Date.now()}`;
  const args = process.argv.slice(2);
  const intervalMin =
    parseNumberArg(args, '--interval-min', 0) ||
    Number.parseInt(process.env.AGENT_INTERVAL_MIN || '180', 10);
  const weeklyHours =
    parseNumberArg(args, '--weekly-hours', 0) ||
    Number.parseInt(process.env.AGENT_WEEKLY_HOURS || '168', 10);
  const maxPublishArg = parseMaxPublishArg(args);
  const maxPublish =
    maxPublishArg ?? parseMaxPublishValue(process.env.AGENT_MAX_PUBLISH, 0);

  const autoApproveReviewed =
    hasFlag(args, '--auto-approve-reviewed') ||
    asBoolean(process.env.AGENT_AUTO_APPROVE_REVIEWED);
  const publishApproved =
    hasFlag(args, '--publish-approved') ||
    asBoolean(process.env.AGENT_PUBLISH_APPROVED);
  const includeBlogs =
    hasFlag(args, '--include-blogs') || asBoolean(process.env.AGENT_INCLUDE_BLOGS);

  let shouldStop = false;
  let nextCuratorAt = 0;
  let nextWeeklyAt = Date.now() + weeklyHours * 60 * 60 * 1000;

  const stop = () => {
    shouldStop = true;
    console.log('AGENT_DAEMON stopping...');
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  console.log(
    `AGENT_DAEMON start intervalMin=${intervalMin} weeklyHours=${weeklyHours} maxPublish=${maxPublish} autoApprove=${autoApproveReviewed} publish=${publishApproved} includeBlogs=${includeBlogs}`
  );
  await logEvent({
    agentId: 'daemon',
    taskId,
    actionType: 'started',
    target: 'daemon.loop',
    metadata: {
      intervalMin,
      weeklyHours,
      maxPublish,
      autoApproveReviewed,
      publishApproved,
      includeBlogs,
    },
    status: 'running',
  });

  while (!shouldStop) {
    if (isStopRequested()) {
      shouldStop = true;
      console.log('AGENT_DAEMON stop requested by runtime control');
      break;
    }

    const now = Date.now();

    if (now >= nextCuratorAt) {
      try {
        await assertRunAllowed({
          agentId: 'daemon',
          taskId,
          target: 'daemon.curator-cycle',
          stage: 'before-curator',
        });
        await runCuratorAgent({
          autoApproveReviewed,
          publishApproved,
          includeBlogs,
          maxPublish,
        });
      } catch (error) {
        console.error(`AGENT_DAEMON curator cycle failed: ${error.message}`);
      } finally {
        nextCuratorAt = Date.now() + intervalMin * 60 * 1000;
      }
    }

    if (now >= nextWeeklyAt) {
      try {
        await assertRunAllowed({
          agentId: 'daemon',
          taskId,
          target: 'daemon.weekly-cycle',
          stage: 'before-weekly',
        });
        await runWeekly();
      } catch (error) {
        console.error(`AGENT_DAEMON weekly cycle failed: ${error.message}`);
      } finally {
        nextWeeklyAt = Date.now() + weeklyHours * 60 * 60 * 1000;
      }
    }

    await sleep(15000);
  }

  console.log('AGENT_DAEMON stopped');
  await logEvent({
    agentId: 'daemon',
    taskId,
    actionType: 'completed',
    target: 'daemon.loop',
    status: 'completed',
  });
}

async function runFromCli() {
  try {
    await runAgentDaemon();
  } catch (error) {
    console.error(`AGENT_DAEMON failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
