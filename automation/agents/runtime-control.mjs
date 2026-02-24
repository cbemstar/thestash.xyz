import fs from 'node:fs';
import path from 'node:path';
import { logEvent } from './event-logger.mjs';

const CONTROL_FILE_PATH = './automation/agents/runtime-control.json';

const DEFAULT_CONTROL = {
  stopRequested: false,
  requestedAt: null,
  requestedBy: null,
  reason: null,
  clearedAt: null,
  clearedBy: null,
};

function normalizeControl(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_CONTROL };
  return {
    stopRequested: Boolean(value.stopRequested),
    requestedAt: typeof value.requestedAt === 'string' ? value.requestedAt : null,
    requestedBy: typeof value.requestedBy === 'string' ? value.requestedBy : null,
    reason: typeof value.reason === 'string' ? value.reason : null,
    clearedAt: typeof value.clearedAt === 'string' ? value.clearedAt : null,
    clearedBy: typeof value.clearedBy === 'string' ? value.clearedBy : null,
  };
}

function loadControlFile() {
  try {
    if (!fs.existsSync(CONTROL_FILE_PATH)) return { ...DEFAULT_CONTROL };
    const raw = fs.readFileSync(CONTROL_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return normalizeControl(parsed);
  } catch {
    return { ...DEFAULT_CONTROL };
  }
}

function saveControlFile(control) {
  const normalized = normalizeControl(control);
  fs.mkdirSync(path.dirname(CONTROL_FILE_PATH), { recursive: true });
  fs.writeFileSync(CONTROL_FILE_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

export function getRunControl() {
  return loadControlFile();
}

export function isStopRequested() {
  return loadControlFile().stopRequested;
}

export function requestStop({ reason = 'Manual stop requested', requestedBy = 'unknown' } = {}) {
  const now = new Date().toISOString();
  return saveControlFile({
    stopRequested: true,
    requestedAt: now,
    requestedBy,
    reason,
    clearedAt: null,
    clearedBy: null,
  });
}

export function clearStopRequest({ requestedBy = 'unknown' } = {}) {
  const now = new Date().toISOString();
  const current = loadControlFile();
  return saveControlFile({
    ...current,
    stopRequested: false,
    clearedAt: now,
    clearedBy: requestedBy,
  });
}

export class StopRequestedError extends Error {
  constructor(message = 'Run stopped by control signal') {
    super(message);
    this.name = 'StopRequestedError';
  }
}

export async function assertRunAllowed({
  agentId = 'unknown',
  taskId = `task-${Date.now()}`,
  target = 'pipeline',
  stage = 'checkpoint',
} = {}) {
  const control = loadControlFile();
  if (!control.stopRequested) return;

  const reason = control.reason || 'Manual stop requested';
  await logEvent({
    agentId,
    taskId,
    actionType: 'blocked',
    target,
    metadata: {
      stage,
      reason,
      requestedAt: control.requestedAt,
      requestedBy: control.requestedBy,
    },
    status: 'blocked',
    error: reason,
  });

  throw new StopRequestedError(reason);
}
