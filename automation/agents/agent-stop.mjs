/**
 * AGENT STOP - Requests a graceful stop for running agents/pipelines.
 *
 * Run:
 *   node automation/agents/agent-stop.mjs
 *   node automation/agents/agent-stop.mjs "Stopping for manual review"
 */

import { requestStop } from './runtime-control.mjs';

const reasonArg = process.argv.slice(2).join(' ').trim();
const reason = reasonArg || 'Manual stop requested from CLI';

const control = requestStop({
  reason,
  requestedBy: 'cli',
});

console.log(
  `stop requested at ${control.requestedAt || 'n/a'} by ${control.requestedBy || 'cli'} (${control.reason || reason})`
);
