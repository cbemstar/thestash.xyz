/**
 * DAEMON SERVICE - Manage agent-daemon as a detached background process.
 *
 * Run:
 *   node automation/agents/daemon-service.mjs start [daemon args...]
 *   node automation/agents/daemon-service.mjs stop
 *   node automation/agents/daemon-service.mjs status
 *   node automation/agents/daemon-service.mjs logs [--lines=200] [--follow]
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { clearStopRequest, requestStop } from './runtime-control.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const RUNTIME_DIR = path.join(ROOT_DIR, 'automation', 'agents', 'runtime');
const PID_FILE = path.join(RUNTIME_DIR, 'daemon.pid.json');
const LOG_FILE = path.join(RUNTIME_DIR, 'daemon.log');
const DAEMON_SCRIPT = path.join(ROOT_DIR, 'automation', 'agents', 'agent-daemon.mjs');

const DEFAULT_INTERVAL_MIN = String(process.env.AGENT_INTERVAL_MIN || 60);
const DEFAULT_WEEKLY_HOURS = String(process.env.AGENT_WEEKLY_HOURS || 168);
const DEFAULT_MAX_PUBLISH = String(process.env.AGENT_MAX_PUBLISH || 0);

function ensureRuntimeDir() {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPidState() {
  try {
    if (!fs.existsSync(PID_FILE)) return null;
    const raw = fs.readFileSync(PID_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Number.isInteger(parsed.pid)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePidState(state) {
  ensureRuntimeDir();
  fs.writeFileSync(PID_FILE, JSON.stringify(state, null, 2));
}

function removePidState() {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
}

function getDefaultDaemonArgs() {
  return [
    `--interval-min=${DEFAULT_INTERVAL_MIN}`,
    `--weekly-hours=${DEFAULT_WEEKLY_HOURS}`,
    '--auto-approve-reviewed',
    '--publish-approved',
    '--include-blogs',
    `--max-publish=${DEFAULT_MAX_PUBLISH}`,
  ];
}

function normalizeDaemonArgs(inputArgs) {
  const cleaned = inputArgs.filter(Boolean);
  return cleaned.length > 0 ? cleaned : getDefaultDaemonArgs();
}

function printUsage() {
  console.log(`Usage:
  npm run agent:daemon:start [-- daemon args...]
  npm run agent:daemon:stop
  npm run agent:daemon:status
  npm run agent:daemon:logs -- --lines=200 --follow

Defaults for start (when no daemon args are passed):
  --interval-min=${DEFAULT_INTERVAL_MIN}
  --weekly-hours=${DEFAULT_WEEKLY_HOURS}
  --auto-approve-reviewed
  --publish-approved
  --include-blogs
  --max-publish=${DEFAULT_MAX_PUBLISH} (0/all/unlimited = no limit)
`);
}

function parseNumberFlag(args, key, fallback) {
  const matched = args.find((arg) => arg.startsWith(`${key}=`));
  if (!matched) return fallback;
  const parsed = Number.parseInt(matched.split('=').slice(1).join('='), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function hasFlag(args, key) {
  return args.includes(key);
}

async function startService(rawArgs) {
  ensureRuntimeDir();
  const existing = readPidState();
  if (existing && isPidAlive(existing.pid)) {
    console.log(`agent-daemon already running (pid=${existing.pid})`);
    console.log(`log: ${LOG_FILE}`);
    return;
  }
  if (existing && !isPidAlive(existing.pid)) {
    removePidState();
  }

  clearStopRequest({ requestedBy: 'daemon-service' });

  const daemonArgs = normalizeDaemonArgs(rawArgs);
  const logFd = fs.openSync(LOG_FILE, 'a');
  const child = spawn(
    process.execPath,
    ['--env-file=.env.local', DAEMON_SCRIPT, ...daemonArgs],
    {
      cwd: ROOT_DIR,
      detached: true,
      stdio: ['ignore', logFd, logFd],
    }
  );
  child.unref();
  fs.closeSync(logFd);

  const state = {
    pid: child.pid,
    startedAt: new Date().toISOString(),
    args: daemonArgs,
    logFile: LOG_FILE,
  };
  writePidState(state);

  await sleep(600);
  if (!isPidAlive(child.pid)) {
    removePidState();
    throw new Error(`daemon failed to stay running. Check log: ${LOG_FILE}`);
  }

  console.log(`agent-daemon started (pid=${child.pid})`);
  console.log(`log: ${LOG_FILE}`);
  console.log(`args: ${daemonArgs.join(' ')}`);
}

async function stopService() {
  const state = readPidState();
  if (!state || !isPidAlive(state.pid)) {
    removePidState();
    console.log('agent-daemon is not running');
    return;
  }

  requestStop({
    reason: 'agent-daemon-service stop requested',
    requestedBy: 'daemon-service',
  });

  try {
    process.kill(state.pid, 'SIGTERM');
  } catch {
    removePidState();
    console.log('agent-daemon stopped');
    return;
  }

  for (let i = 0; i < 20; i += 1) {
    if (!isPidAlive(state.pid)) break;
    await sleep(500);
  }

  if (isPidAlive(state.pid)) {
    try {
      process.kill(state.pid, 'SIGKILL');
    } catch {
      // Ignore if process already exited.
    }
  }

  removePidState();
  console.log('agent-daemon stopped');
}

function statusService() {
  const state = readPidState();
  if (!state || !isPidAlive(state.pid)) {
    removePidState();
    console.log('agent-daemon status: stopped');
    console.log(`log: ${LOG_FILE}`);
    process.exit(1);
  }

  console.log('agent-daemon status: running');
  console.log(`pid: ${state.pid}`);
  console.log(`startedAt: ${state.startedAt || 'n/a'}`);
  console.log(`args: ${(state.args || []).join(' ') || 'n/a'}`);
  console.log(`log: ${LOG_FILE}`);
}

function readLastLines(filePath, lines = 120) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content) return [];
  const rows = content.split('\n');
  return rows.slice(-Math.max(lines, 1));
}

function logsService(rawArgs) {
  const lines = parseNumberFlag(rawArgs, '--lines', 120);
  const follow = hasFlag(rawArgs, '--follow');

  const tailRows = readLastLines(LOG_FILE, lines);
  if (tailRows.length === 0) {
    console.log(`log file is empty or missing: ${LOG_FILE}`);
  } else {
    console.log(tailRows.join('\n'));
  }

  if (!follow) return;

  const child = spawn('tail', ['-n', String(lines), '-f', LOG_FILE], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exit(code);
    }
  });
}

async function main() {
  const [command = '', ...rest] = process.argv.slice(2);
  if (command === 'start') {
    await startService(rest);
    return;
  }
  if (command === 'stop') {
    await stopService();
    return;
  }
  if (command === 'status') {
    statusService();
    return;
  }
  if (command === 'logs') {
    logsService(rest);
    return;
  }

  printUsage();
  process.exit(1);
}

main().catch((error) => {
  console.error(`daemon-service failed: ${error.message}`);
  process.exit(1);
});
