/**
 * LOOPS AGENT - Triggers weekly digest via existing cron endpoint.
 *
 * Run:
 *   node --env-file=.env.local automation/agents/loops-agent.mjs
 */

import { isDirectRun, loadJson, saveJson } from './agent-shared.mjs';
import { assertRunAllowed } from './runtime-control.mjs';

const SUBSCRIBER_LIST_FILE = './automation/agents/subscriber-list.json';
const DIGEST_LOG_FILE = './automation/agents/digest-log.json';

function getDigestEndpoint() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thestash.xyz';
  return new URL('/api/cron/weekly-digest', baseUrl).toString();
}

function getAuthSecret() {
  return process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET || '';
}

function getSubscriberEmailsFromFile() {
  const rows = loadJson(SUBSCRIBER_LIST_FILE, []);
  return rows
    .map((row) => String(row).trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function getSubscriberEmailsFromEnv() {
  const envValue = process.env.LOOPS_DIGEST_EMAILS || '';
  if (!envValue.trim()) return [];
  return envValue
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export async function runLoopsAgent() {
  const taskId = `loops-${Date.now()}`;
  await assertRunAllowed({
    agentId: 'loops',
    taskId,
    target: 'loops.pipeline',
    stage: 'start',
  });

  const secret = getAuthSecret();
  if (!secret) {
    throw new Error('Missing CRON_SECRET or VERCEL_CRON_SECRET');
  }

  const emailsFromEnv = getSubscriberEmailsFromEnv();
  const emailsFromFile = emailsFromEnv.length > 0 ? [] : getSubscriberEmailsFromFile();
  const endpoint = getDigestEndpoint();

  const payload = emailsFromFile.length > 0 ? { emails: emailsFromFile } : undefined;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Digest endpoint failed: HTTP ${response.status} ${data?.error || ''}`.trim());
  }

  const logEntry = {
    sentAt: new Date().toISOString(),
    endpoint,
    totalEmails: data.totalEmails || 0,
    succeeded: data.succeeded || 0,
    failed: data.failed || 0,
    resourcesCount: data.resourcesCount || 0,
  };

  const existingLogs = loadJson(DIGEST_LOG_FILE, []);
  saveJson(DIGEST_LOG_FILE, [logEntry, ...existingLogs].slice(0, 52));

  console.log(
    `LOOPS digest triggered total=${logEntry.totalEmails} succeeded=${logEntry.succeeded} failed=${logEntry.failed}`
  );

  return logEntry;
}

async function runFromCli() {
  try {
    const logEntry = await runLoopsAgent();
    console.log('LOOPS done');
    console.log(JSON.stringify(logEntry, null, 2));
  } catch (error) {
    console.error(`LOOPS failed: ${error.message}`);
    process.exit(1);
  }
}

if (isDirectRun(import.meta.url)) {
  runFromCli();
}
