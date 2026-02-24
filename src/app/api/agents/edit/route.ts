import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

type QueueItem = {
  queueId?: string;
  submittedAt?: string;
  status?: string;
  editedAt?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

type EditRequestBody = {
  itemId?: string;
  updatedData?: Record<string, unknown>;
};

const QUEUE_PATH = path.join(
  process.cwd(),
  'automation',
  'agents',
  'approval-queue.json'
);

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function loadQueue(): QueueItem[] {
  try {
    const raw = fs.readFileSync(QUEUE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

function itemMatchesId(item: QueueItem, itemId: string): boolean {
  const normalized = asString(itemId);
  if (!normalized) return false;
  const queueId = asString(item.queueId);
  const submittedAt = asString(item.submittedAt);
  if (queueId && queueId === normalized) return true;
  if (submittedAt && `submitted:${submittedAt}` === normalized) return true;
  return false;
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as EditRequestBody;
    const itemId = asString(body?.itemId);
    const updatedData =
      body?.updatedData && typeof body.updatedData === 'object' && !Array.isArray(body.updatedData)
        ? body.updatedData
        : null;

    if (!itemId || !updatedData) {
      return NextResponse.json(
        { error: 'itemId and updatedData are required' },
        { status: 400 }
      );
    }

    const queue = loadQueue();
    if (queue.length === 0) {
      return NextResponse.json({ error: 'No approval queue' }, { status: 400 });
    }

    const index = queue.findIndex((item) => itemMatchesId(item, itemId));
    if (index === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const current = queue[index];
    queue[index] = {
      ...current,
      data: { ...(current.data || {}), ...updatedData },
      status: 'reviewed',
      editedAt: new Date().toISOString(),
    };

    saveQueue(queue);

    return NextResponse.json({
      success: true,
      updated: queue[index],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
