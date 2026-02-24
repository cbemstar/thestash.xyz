import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

type RunControl = {
  stopRequested: boolean;
  requestedAt: string | null;
  requestedBy: string | null;
  reason: string | null;
  clearedAt: string | null;
  clearedBy: string | null;
};

type ControlRequestBody = {
  action?: 'stop' | 'resume';
  reason?: string;
  requestedBy?: string;
};

const CONTROL_PATH = path.join(process.cwd(), 'automation', 'agents', 'runtime-control.json');

const DEFAULT_CONTROL: RunControl = {
  stopRequested: false,
  requestedAt: null,
  requestedBy: null,
  reason: null,
  clearedAt: null,
  clearedBy: null,
};

function normalizeControl(value: unknown): RunControl {
  if (!value || typeof value !== 'object') return { ...DEFAULT_CONTROL };
  const row = value as Partial<RunControl>;
  return {
    stopRequested: Boolean(row.stopRequested),
    requestedAt: typeof row.requestedAt === 'string' ? row.requestedAt : null,
    requestedBy: typeof row.requestedBy === 'string' ? row.requestedBy : null,
    reason: typeof row.reason === 'string' ? row.reason : null,
    clearedAt: typeof row.clearedAt === 'string' ? row.clearedAt : null,
    clearedBy: typeof row.clearedBy === 'string' ? row.clearedBy : null,
  };
}

function loadControl(): RunControl {
  try {
    if (!fs.existsSync(CONTROL_PATH)) return { ...DEFAULT_CONTROL };
    const raw = fs.readFileSync(CONTROL_PATH, 'utf-8');
    return normalizeControl(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CONTROL };
  }
}

function saveControl(control: RunControl): RunControl {
  const normalized = normalizeControl(control);
  fs.mkdirSync(path.dirname(CONTROL_PATH), { recursive: true });
  fs.writeFileSync(CONTROL_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

export async function GET(): Promise<Response> {
  return NextResponse.json({
    success: true,
    control: loadControl(),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ControlRequestBody;
    const action = body?.action;
    const requestedBy =
      typeof body?.requestedBy === 'string' && body.requestedBy.trim()
        ? body.requestedBy.trim()
        : 'dashboard';

    if (action !== 'stop' && action !== 'resume') {
      return NextResponse.json({ success: false, error: 'Invalid control action' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let next = loadControl();

    if (action === 'stop') {
      const reason =
        typeof body?.reason === 'string' && body.reason.trim()
          ? body.reason.trim()
          : 'Manual stop requested from dashboard';
      next = {
        stopRequested: true,
        requestedAt: now,
        requestedBy,
        reason,
        clearedAt: null,
        clearedBy: null,
      };
    } else {
      next = {
        ...next,
        stopRequested: false,
        clearedAt: now,
        clearedBy: requestedBy,
      };
    }

    const saved = saveControl(next);
    return NextResponse.json({ success: true, action, control: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
