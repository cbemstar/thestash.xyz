/**
 * AGENT WATCH - Streams live agent events from event-log.json.
 *
 * Run:
 *   node automation/agents/agent-watch.mjs
 *   node automation/agents/agent-watch.mjs --agent=research
 *   node automation/agents/agent-watch.mjs --status=failed
 */

import { getEvents } from './event-logger.mjs';
import { getRunControl } from './runtime-control.mjs';

function parseArg(name, fallback = '') {
  const key = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(key));
  return match ? match.slice(key.length) : fallback;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatEvent(event) {
  const ts = event.timestamp || 'n/a';
  const agent = event.agentId || 'unknown';
  const status = event.status || 'n/a';
  const action = event.actionType || 'unknown';
  const target = event.target || 'n/a';
  const duration = Number.isFinite(event.durationMs) ? ` ${event.durationMs}ms` : '';
  const error = event.error ? ` error=${event.error}` : '';
  return `${ts} [${agent}] ${status} ${action} ${target}${duration}${error}`;
}

function eventKey(event) {
  return `${event.timestamp || ''}:${event.agentId || ''}:${event.actionType || ''}:${event.target || ''}`;
}

function printControlStatus() {
  const control = getRunControl();
  if (!control.stopRequested) {
    console.log('run-control: clear');
    return;
  }
  console.log(
    `run-control: STOP requested at ${control.requestedAt || 'n/a'} by ${control.requestedBy || 'unknown'} (${control.reason || 'no reason'})`
  );
}

async function runWatch() {
  const agentId = parseArg('agent', '');
  const status = parseArg('status', '');
  const limit = toInt(parseArg('limit', '60'), 60);
  const intervalMs = toInt(parseArg('interval-ms', '1000'), 1000);

  const seen = new Set();

  console.log(`watching events agent=${agentId || 'all'} status=${status || 'all'} limit=${limit}`);
  printControlStatus();

  const initial = getEvents({ agentId: agentId || undefined, status: status || undefined, limit })
    .slice()
    .reverse();

  for (const event of initial) {
    const key = eventKey(event);
    seen.add(key);
    console.log(formatEvent(event));
  }

  let lastControlState = JSON.stringify(getRunControl());
  const timer = setInterval(() => {
    const latest = getEvents({ agentId: agentId || undefined, status: status || undefined, limit })
      .slice()
      .reverse();

    for (const event of latest) {
      const key = eventKey(event);
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(formatEvent(event));
    }

    const controlState = JSON.stringify(getRunControl());
    if (controlState !== lastControlState) {
      lastControlState = controlState;
      printControlStatus();
    }
  }, intervalMs);

  process.on('SIGINT', () => {
    clearInterval(timer);
    console.log('\nagent-watch stopped');
    process.exit(0);
  });
}

runWatch().catch((error) => {
  console.error(`agent-watch failed: ${error.message}`);
  process.exit(1);
});
