/**
 * AGENT RESUME - Clears stop request so agents can run again.
 *
 * Run:
 *   node automation/agents/agent-resume.mjs
 */

import { clearStopRequest } from './runtime-control.mjs';

const control = clearStopRequest({ requestedBy: 'cli' });

console.log(
  `stop cleared at ${control.clearedAt || 'n/a'} by ${control.clearedBy || 'cli'} (stopRequested=${control.stopRequested})`
);
