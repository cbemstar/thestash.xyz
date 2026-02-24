import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type QueueItem = {
  queueId?: string;
  submittedAt?: string;
  status?: string;
  type?: string;
  data?: {
    title?: string;
    url?: string;
  };
  approvedAt?: string;
};

type ApproveBody = {
  action?: "approve" | "reject";
  itemIds?: string[];
  approveAll?: boolean;
  rejectAll?: boolean;
};

const QUEUE_PATH = path.join(
  process.cwd(),
  "automation",
  "agents",
  "approval-queue.json"
);

function asQueueItems(value: unknown): QueueItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item) => item && typeof item === "object"
  ) as QueueItem[];
}

function normalizeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function ensureQueueIds(queue: QueueItem[]): boolean {
  let changed = false;
  for (const item of queue) {
    const existingId = normalizeId(item.queueId);
    if (existingId) {
      item.queueId = existingId;
      continue;
    }
    item.queueId = randomUUID();
    changed = true;
  }
  return changed;
}

function itemMatchesSelected(item: QueueItem, selectedIds: Set<string>): boolean {
  if (selectedIds.size === 0) return false;
  const queueId = normalizeId(item.queueId);
  if (queueId && selectedIds.has(queueId)) return true;
  const submittedAt = normalizeId(item.submittedAt);
  // Legacy fallback: only match prefixed submitted IDs to avoid collision-based bulk approvals.
  if (submittedAt && selectedIds.has(`submitted:${submittedAt}`)) return true;
  return false;
}

function loadQueue(): QueueItem[] {
  try {
    const raw = fs.readFileSync(QUEUE_PATH, "utf-8");
    return asQueueItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApproveBody;
    const action = body?.action;
    const selectedIds = new Set(
      (Array.isArray(body?.itemIds) ? body.itemIds : [])
        .map((id) => normalizeId(id))
        .filter((id): id is string => Boolean(id))
    );

    const queue = loadQueue();
    if (queue.length === 0) {
      return NextResponse.json({ error: "No approval queue" }, { status: 400 });
    }

    const queueIdBackfillChanged = ensureQueueIds(queue);

    if (action === "approve") {
      const candidates = body.approveAll
        ? queue.filter((item) => item.status === "reviewed")
        : queue.filter((item) => itemMatchesSelected(item, selectedIds));
      const toApprove = candidates.filter((item) => item.status === "reviewed");

      for (const item of toApprove) {
        item.status = "approved";
        item.approvedAt = new Date().toISOString();
      }

      if (queueIdBackfillChanged || toApprove.length > 0) {
        saveQueue(queue);
      }

      return NextResponse.json({
        success: true,
        approved: toApprove.length,
        skipped:
          body.approveAll || selectedIds.size === 0
            ? 0
            : Math.max(0, candidates.length - toApprove.length),
        items: toApprove.map((item) => ({
          queueId: item.queueId,
          type: item.type,
          title: item.data?.title || item.data?.url || "Untitled",
        })),
      });
    }

    if (action === "reject") {
      const rejectTargets = body.rejectAll
        ? queue.filter((item) => item.status !== "approved")
        : queue.filter((item) => itemMatchesSelected(item, selectedIds));

      const rejectIds = new Set(
        rejectTargets
          .map((item) => normalizeId(item.queueId))
          .filter((id): id is string => Boolean(id))
      );

      const nextQueue = queue.filter((item) => {
        const id = normalizeId(item.queueId);
        if (!id) return true;
        return !rejectIds.has(id);
      });

      if (queueIdBackfillChanged || rejectIds.size > 0) {
        saveQueue(nextQueue);
      }

      return NextResponse.json({
        success: true,
        rejected: rejectIds.size,
        items: rejectTargets.map((item) => ({
          queueId: item.queueId,
          type: item.type,
          title: item.data?.title || item.data?.url || "Untitled",
        })),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
