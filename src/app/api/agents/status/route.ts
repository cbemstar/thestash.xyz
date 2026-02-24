import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

type QueueItem = {
  queueId?: string;
  [key: string]: unknown;
};

type AgentEvent = {
  timestamp?: string;
  agentId?: string;
  status?: string;
  [key: string]: unknown;
};

const AGENTS_DIR = path.join(process.cwd(), 'automation', 'agents');
const EVENT_LOG_PATH = path.join(AGENTS_DIR, 'event-log.json');
const APPROVAL_QUEUE_PATH = path.join(AGENTS_DIR, 'approval-queue.json');
const RUN_CONTROL_PATH = path.join(AGENTS_DIR, 'runtime-control.json');

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ensureQueueIds(queue: QueueItem[]): boolean {
  let changed = false;
  for (const item of queue) {
    const existing = typeof item.queueId === 'string' ? item.queueId.trim() : '';
    if (existing) {
      item.queueId = existing;
      continue;
    }
    item.queueId = randomUUID();
    changed = true;
  }
  return changed;
}

export async function GET(): Promise<Response> {
  try {
    const files: Record<string, string> = {
      'lead-queue': 'lead-queue.json',
      'validated-leads': 'validated-leads.json',
      'approval-queue': 'approval-queue.json',
      'blog-draft': 'blog-draft.json',
      'ux-report': 'ux-report.json',
      'digest-log': 'digest-log.json',
      'published-log': 'published-log.json',
    };

    const data: Record<string, unknown> = {};

    for (const [key, filename] of Object.entries(files)) {
      const filePath = path.join(AGENTS_DIR, filename);
      data[key] = loadJson<unknown>(filePath, null);
    }

    const queue = Array.isArray(data['approval-queue'])
      ? (data['approval-queue'] as QueueItem[])
      : [];
    if (queue.length > 0 && ensureQueueIds(queue)) {
      fs.writeFileSync(APPROVAL_QUEUE_PATH, JSON.stringify(queue, null, 2));
      data['approval-queue'] = queue;
    }

    const eventLog = loadJson<AgentEvent[]>(EVENT_LOG_PATH, []);
    const runControl = loadJson<Record<string, unknown>>(RUN_CONTROL_PATH, {
      stopRequested: false,
      requestedAt: null,
      requestedBy: null,
      reason: null,
      clearedAt: null,
      clearedBy: null,
    });
    const eventStats: {
      total: number;
      byAgent: Record<string, number>;
      byStatus: Record<string, number>;
      recentActivity: AgentEvent[];
    } = {
      total: eventLog.length,
      byAgent: {},
      byStatus: {},
      recentActivity: eventLog.slice(-20).reverse(),
    };

    for (const event of eventLog) {
      const agent = typeof event.agentId === 'string' ? event.agentId : 'unknown';
      const status = typeof event.status === 'string' ? event.status : 'unknown';
      eventStats.byAgent[agent] = (eventStats.byAgent[agent] || 0) + 1;
      eventStats.byStatus[status] = (eventStats.byStatus[status] || 0) + 1;
    }

    const agentFiles = [
      'scout-agent.mjs',
      'research-agent.mjs',
      'writer-agent.mjs',
      'editor-agent.mjs',
      'publisher-agent.mjs',
      'curator-agent.mjs',
      'agent-daemon.mjs',
      'ux-agent.mjs',
      'loops-agent.mjs',
      'orchestrator.mjs',
    ];

    const agents = agentFiles.map((file) => {
      const filePath = path.join(AGENTS_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          name: file.replace('.mjs', ''),
          file,
          lastModified: stats.mtime.toISOString(),
        };
      } catch {
        return {
          name: file.replace('.mjs', ''),
          file,
          lastModified: null,
        };
      }
    });

    return NextResponse.json({
      agents,
      files: data,
      events: eventLog.slice(-50),
      eventStats,
      runControl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
