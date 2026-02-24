import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

type AgentEvent = {
  timestamp?: string;
  agentId?: string;
  status?: string;
  actionType?: string;
  target?: string;
  durationMs?: number;
  metadata?: unknown;
  error?: string;
};

const EVENT_LOG_PATH = path.join(
  process.cwd(),
  'automation',
  'agents',
  'event-log.json'
);

function loadEvents(): AgentEvent[] {
  try {
    if (!fs.existsSync(EVENT_LOG_PATH)) return [];
    const raw = fs.readFileSync(EVENT_LOG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AgentEvent[]) : [];
  } catch {
    return [];
  }
}

function getEventKey(event: AgentEvent): string {
  return `${event.timestamp || 'n/a'}:${event.agentId || 'n/a'}:${event.actionType || 'n/a'}`;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId') || '';
  const status = searchParams.get('status') || '';
  const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '50', 10) || 50);

  const encoder = new TextEncoder();
  let filtered = loadEvents()
    .filter((event) => (!agentId ? true : event.agentId === agentId))
    .filter((event) => (!status ? true : event.status === status))
    .sort((a, b) => {
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);

  const stream = new ReadableStream({
    start(controller) {
      for (const event of filtered) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 10_000);

      let previousStamp = fs.existsSync(EVENT_LOG_PATH)
        ? fs.statSync(EVENT_LOG_PATH).mtimeMs
        : 0;

      const pollInterval = setInterval(() => {
        try {
          const stat = fs.existsSync(EVENT_LOG_PATH) ? fs.statSync(EVENT_LOG_PATH) : null;
          const stamp = stat ? stat.mtimeMs : 0;
          if (stamp === previousStamp) return;
          previousStamp = stamp;

          const latest = loadEvents()
            .filter((event) => (!agentId ? true : event.agentId === agentId))
            .filter((event) => (!status ? true : event.status === status))
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

          const existing = new Set(filtered.map((event) => getEventKey(event)));
          const newOnes = latest.filter((event) => !existing.has(getEventKey(event)));

          for (const event of newOnes.reverse()) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }

          filtered = latest.slice(0, limit);
        } catch {
          // Ignore polling errors to keep stream alive.
        }
      }, 2_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
