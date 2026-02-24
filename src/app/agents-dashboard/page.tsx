'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type QueueType = 'resource' | 'blog' | string;
type QueueStatus = 'pending' | 'reviewed' | 'approved' | 'needs_revision' | string;
type AgentName =
  | 'scout'
  | 'research'
  | 'writer'
  | 'editor'
  | 'publisher'
  | 'curator'
  | 'ux'
  | 'loops'
  | 'orchestrator';

type AgentControl = {
  name: Exclude<AgentName, 'orchestrator'>;
  label: string;
  desc: string;
};

type QueueReview = {
  score?: number;
  valid?: boolean;
  issues?: string[];
  warnings?: string[];
  passed?: string[];
  reviewedAt?: string;
};

type QueueData = {
  title?: string;
  slug?: string;
  description?: string;
  excerpt?: string;
  url?: string;
  category?: string;
  bestFor?: string[];
  tags?: string[];
  sources?: Array<{ label?: string; url?: string }>;
  body?: unknown;
  relatedResources?: unknown[];
  primaryResource?: unknown;
  [key: string]: unknown;
};

type QueueItem = {
  queueId?: string;
  submittedAt?: string;
  editedAt?: string;
  approvedAt?: string;
  status?: QueueStatus;
  type?: QueueType;
  needsApproval?: boolean;
  data?: QueueData;
  review?: QueueReview;
};

type AgentEvent = {
  timestamp: string;
  agentId: string;
  taskId?: string;
  actionType?: string;
  target?: string;
  status?: string;
  durationMs?: number;
  metadata?: unknown;
  error?: string;
};

type EventStats = {
  total: number;
  byAgent: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: AgentEvent[];
};

type RunControl = {
  stopRequested?: boolean;
  requestedAt?: string | null;
  requestedBy?: string | null;
  reason?: string | null;
  clearedAt?: string | null;
  clearedBy?: string | null;
};

type StatusPayload = {
  files?: {
    'lead-queue'?: unknown[];
    'validated-leads'?: unknown[];
    'approval-queue'?: QueueItem[];
    [key: string]: unknown;
  };
  events?: AgentEvent[];
  eventStats?: EventStats;
  runControl?: RunControl;
  timestamp?: string;
};

const AGENTS: AgentControl[] = [
  { name: 'scout', label: 'Scout', desc: 'Discover new tools' },
  { name: 'research', label: 'Research', desc: 'Validate and enrich' },
  { name: 'writer', label: 'Writer', desc: 'Generate draft blogs' },
  { name: 'editor', label: 'Editor', desc: 'Review quality gates' },
  { name: 'publisher', label: 'Publisher', desc: 'Publish approved items' },
  { name: 'curator', label: 'Curator', desc: 'Run scout + research + editor' },
];

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function queueActionId(item: QueueItem): string | null {
  const queueId = asString(item.queueId);
  if (queueId) return queueId;
  const submittedAt = asString(item.submittedAt);
  if (submittedAt) return `submitted:${submittedAt}`;
  return null;
}

function queuePreviewId(item: QueueItem): string | null {
  const queueId = asString(item.queueId);
  if (queueId) return queueId;
  const submittedAt = asString(item.submittedAt);
  return submittedAt || null;
}

function normalizeSlug(input: unknown): string {
  const slug = asString(input).replace(/^\/+/, '');
  return slug.replace(/^blog\//, '');
}

function formatDateTime(value: string | undefined): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function countBodyWords(body: unknown): number {
  let total = 0;
  const blocks = asArray<Record<string, unknown>>(body);
  for (const block of blocks) {
    const children = asArray<Record<string, unknown>>(block.children);
    const text = children
      .map((child) => (typeof child.text === 'string' ? child.text : ''))
      .join(' ');
    total += text.split(/\s+/).filter(Boolean).length;
  }
  return total;
}

function countHeadings(body: unknown): number {
  const blocks = asArray<Record<string, unknown>>(body);
  return blocks.filter((block) => {
    const style = asString(block.style).toLowerCase();
    return /^h[1-6]$/.test(style);
  }).length;
}

function countVisuals(body: unknown): { infographics: number; sourcedImages: number } {
  const blocks = asArray<Record<string, unknown>>(body);
  let infographics = 0;
  let sourcedImages = 0;
  for (const block of blocks) {
    const type = asString(block._type);
    if (type === 'infographic') infographics += 1;
    if (type === 'sourcedImage') sourcedImages += 1;
  }
  return { infographics, sourcedImages };
}

export default function AgentsDashboard() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState<'pipeline' | 'events'>('pipeline');
  const [eventFilter, setEventFilter] = useState<{ agent: string; status: string }>({
    agent: '',
    status: '',
  });
  const [liveEvents, setLiveEvents] = useState<AgentEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const runAbortRef = useRef<AbortController | null>(null);

  const [queueTypeFilter, setQueueTypeFilter] = useState<'all' | 'resource' | 'blog'>('all');
  const [queueStatusFilter, setQueueStatusFilter] = useState<
    'all' | 'pending' | 'reviewed' | 'approved' | 'needs_revision'
  >('all');
  const [queueSearch, setQueueSearch] = useState('');
  const [showActionableOnly, setShowActionableOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status', { cache: 'no-store' });
      const json = (await res.json()) as StatusPayload;
      setData(json);
      setLastUpdate(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch dashboard status.';
      setNotice({ tone: 'error', text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (activeTab !== 'events') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const source = new EventSource('/api/agents/events?limit=100');
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      if (event.data.startsWith(':')) return;
      try {
        const parsed = JSON.parse(event.data) as AgentEvent;
        setLiveEvents((prev) => [parsed, ...prev].slice(0, 100));
      } catch {
        // Ignore malformed events.
      }
    };

    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [activeTab]);

  const queue = useMemo(
    () => asArray<QueueItem>(data?.files?.['approval-queue']),
    [data]
  );
  const runControl = data?.runControl || {};
  const stopRequested = Boolean(runControl.stopRequested);
  const leadsCount = asArray(data?.files?.['lead-queue']).length;
  const validatedCount = asArray(data?.files?.['validated-leads']).length;

  const pendingCount = queue.filter((item) => item.status === 'pending').length;
  const reviewedCount = queue.filter((item) => item.status === 'reviewed').length;
  const approvedCount = queue.filter((item) => item.status === 'approved').length;
  const needsRevisionCount = queue.filter((item) => item.status === 'needs_revision').length;
  const actionableCount = queue.filter((item) => item.status !== 'approved').length;

  const filteredQueue = useMemo(() => {
    const normalizedQuery = queueSearch.trim().toLowerCase();
    return queue.filter((item) => {
      const type = asString(item.type);
      const status = asString(item.status);
      const title = asString(item.data?.title || item.data?.url);
      const slug = normalizeSlug(item.data?.slug);
      const description = asString(item.data?.description || item.data?.excerpt);

      if (queueTypeFilter !== 'all' && type !== queueTypeFilter) return false;
      if (queueStatusFilter !== 'all' && status !== queueStatusFilter) return false;
      if (showActionableOnly && status === 'approved') return false;

      if (!normalizedQuery) return true;
      return (
        title.toLowerCase().includes(normalizedQuery) ||
        slug.toLowerCase().includes(normalizedQuery) ||
        description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [queue, queueSearch, queueStatusFilter, queueTypeFilter, showActionableOnly]);

  useEffect(() => {
    const valid = new Set(
      queue
        .map((item) => queueActionId(item))
        .filter((id): id is string => Boolean(id))
    );
    setSelectedIds((prev) => prev.filter((id) => valid.has(id)));
  }, [queue]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleIds = useMemo(
    () =>
      filteredQueue
        .map((item) => queueActionId(item))
        .filter((id): id is string => Boolean(id)),
    [filteredQueue]
  );

  const visibleReviewedIds = useMemo(
    () =>
      filteredQueue
        .filter((item) => item.status === 'reviewed')
        .map((item) => queueActionId(item))
        .filter((id): id is string => Boolean(id)),
    [filteredQueue]
  );

  const selectedReviewedIds = useMemo(
    () =>
      filteredQueue
        .filter((item) => item.status === 'reviewed')
        .map((item) => queueActionId(item))
        .filter((id): id is string => typeof id === 'string' && selectedSet.has(id)),
    [filteredQueue, selectedSet]
  );

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  const runAgent = useCallback(
    async (agent: AgentName, action?: 'daily' | 'weekly') => {
      const runningId = agent === 'orchestrator' ? `${agent}-${action || 'daily'}` : agent;
      setRunning(runningId);
      const controller = new AbortController();
      runAbortRef.current = controller;
      try {
        const res = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent, action }),
          signal: controller.signal,
        });
        const result = (await res.json()) as {
          success?: boolean;
          error?: string;
          output?: string;
        };
        if (result.success) {
          setNotice({
            tone: 'success',
            text: `${agent}${action ? ` (${action})` : ''} completed successfully.`,
          });
        } else {
          setNotice({
            tone: 'error',
            text: result.error || `Failed running ${agent}.`,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          setNotice({
            tone: 'info',
            text: `${agent}${action ? ` (${action})` : ''} stop requested.`,
          });
        } else {
          const message = error instanceof Error ? error.message : `Failed running ${agent}.`;
          setNotice({ tone: 'error', text: message });
        }
      } finally {
        runAbortRef.current = null;
        setRunning(null);
        await fetchData();
      }
    },
    [fetchData]
  );

  const setRunControl = useCallback(
    async (action: 'stop' | 'resume') => {
      try {
        const payload =
          action === 'stop'
            ? {
                action,
                reason: 'Manual stop requested from dashboard',
                requestedBy: 'dashboard',
              }
            : { action, requestedBy: 'dashboard' };

        const res = await fetch('/api/agents/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed updating run control.');
        }

        if (action === 'stop' && runAbortRef.current) {
          runAbortRef.current.abort();
        }

        setNotice({
          tone: 'info',
          text:
            action === 'stop'
              ? 'Stop signal sent. Running agents will halt at the next checkpoint.'
              : 'Stop signal cleared. Agents can run again.',
        });
        await fetchData();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Run control update failed.';
        setNotice({ tone: 'error', text: message });
      }
    },
    [fetchData]
  );

  const runQueueAction = useCallback(
    async (payload: {
      action: 'approve' | 'reject';
      itemIds?: string[];
      approveAll?: boolean;
      rejectAll?: boolean;
    }) => {
      const res = await fetch('/api/agents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        success?: boolean;
        approved?: number;
        rejected?: number;
        error?: string;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Queue action failed.');
      }
      return json;
    },
    []
  );

  const handleApproveSelected = useCallback(async () => {
    if (selectedReviewedIds.length === 0) {
      setNotice({ tone: 'info', text: 'Select one or more reviewed items to approve.' });
      return;
    }
    try {
      const result = await runQueueAction({
        action: 'approve',
        itemIds: selectedReviewedIds,
      });
      setNotice({ tone: 'success', text: `Approved ${result.approved || 0} selected item(s).` });
      setSelectedIds([]);
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve selected items.';
      setNotice({ tone: 'error', text: message });
    }
  }, [fetchData, runQueueAction, selectedReviewedIds]);

  const handleRejectSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      setNotice({ tone: 'info', text: 'Select one or more items to reject.' });
      return;
    }
    if (!window.confirm(`Reject ${selectedIds.length} selected item(s)?`)) return;
    try {
      const result = await runQueueAction({
        action: 'reject',
        itemIds: selectedIds,
      });
      setNotice({ tone: 'success', text: `Rejected ${result.rejected || 0} selected item(s).` });
      setSelectedIds([]);
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject selected items.';
      setNotice({ tone: 'error', text: message });
    }
  }, [fetchData, runQueueAction, selectedIds]);

  const handleApproveAllReviewed = useCallback(async () => {
    if (reviewedCount === 0) {
      setNotice({ tone: 'info', text: 'No reviewed items are ready for approval.' });
      return;
    }
    try {
      const result = await runQueueAction({ action: 'approve', approveAll: true });
      setNotice({ tone: 'success', text: `Approved ${result.approved || 0} reviewed item(s).` });
      setSelectedIds([]);
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve reviewed items.';
      setNotice({ tone: 'error', text: message });
    }
  }, [fetchData, reviewedCount, runQueueAction]);

  const handleRejectAll = useCallback(async () => {
    if (actionableCount === 0) {
      setNotice({ tone: 'info', text: 'No actionable queue items to reject.' });
      return;
    }
    if (!window.confirm(`Reject all actionable queue items (${actionableCount})?`)) return;
    try {
      const result = await runQueueAction({ action: 'reject', rejectAll: true });
      setNotice({
        tone: 'success',
        text: `Rejected ${result.rejected || 0} item(s) from the queue.`,
      });
      setSelectedIds([]);
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject all queue items.';
      setNotice({ tone: 'error', text: message });
    }
  }, [actionableCount, fetchData, runQueueAction]);

  const toggleSelectAllVisible = useCallback(() => {
    if (visibleIds.length === 0) return;
    setSelectedIds((prev) => {
      const prevSet = new Set(prev);
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      const merged = [...prev];
      for (const id of visibleIds) {
        if (!prevSet.has(id)) merged.push(id);
      }
      return merged;
    });
  }, [allVisibleSelected, visibleIds]);

  const eventFeed = liveEvents.length > 0 ? liveEvents : asArray<AgentEvent>(data?.events);
  const filteredEvents = eventFeed.filter(
    (event) =>
      (!eventFilter.agent || event.agentId === eventFilter.agent) &&
      (!eventFilter.status || event.status === eventFilter.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_2.5%,var(--stash-canvas))_0%,var(--stash-canvas)_20rem,var(--stash-canvas)_100%)] flex items-center justify-center">
        <div className="browse-shell px-5 py-3 text-lg font-medium text-foreground">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_2.5%,var(--stash-canvas))_0%,var(--stash-canvas)_20rem,var(--stash-canvas)_100%)] text-foreground px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-start justify-start gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              Automation Control Dashboard
            </h1>
            <p className="text-stash-muted-text mt-2 text-sm sm:text-base">
              Human review pipeline: {leadsCount} discovered to {validatedCount} validated to{' '}
              {pendingCount + reviewedCount + needsRevisionCount} in queue to {approvedCount} approved
            </p>
          </div>
          <div className="browse-shell px-3 py-2 text-left text-xs sm:text-sm text-stash-muted-text">
            <div className="flex flex-wrap items-center gap-2">
              <span>Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</span>
              <button
                onClick={fetchData}
                className="font-medium text-primary hover:text-foreground underline underline-offset-2 transition-colors"
                type="button"
              >
                Refresh
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-2 py-0.5 ${
                  stopRequested
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {stopRequested ? 'Stop requested' : 'Run control clear'}
              </span>
              {stopRequested ? (
                <span className="text-[11px] text-stash-muted-text">
                  {runControl.requestedAt ? formatDateTime(runControl.requestedAt || undefined) : ''}
                </span>
              ) : null}
              {!stopRequested ? (
                <button
                  onClick={() => setRunControl('stop')}
                  type="button"
                  className="inline-flex min-h-8 items-center rounded-full border border-amber-500/45 bg-amber-500/15 px-3 text-xs font-medium text-amber-200 transition hover:bg-amber-500/25"
                >
                  Request stop
                </button>
              ) : (
                <button
                  onClick={() => setRunControl('resume')}
                  type="button"
                  className="inline-flex min-h-8 items-center rounded-full border border-emerald-500/45 bg-emerald-500/15 px-3 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/25"
                >
                  Clear stop
                </button>
              )}
            </div>
          </div>
        </div>

        {notice ? (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              notice.tone === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : notice.tone === 'error'
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : 'border-primary/45 bg-primary/10 text-primary'
            }`}
          >
            {notice.text}
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="New leads" value={leadsCount} color="text-sky-300" />
          <StatCard label="Validated" value={validatedCount} color="text-violet-300" />
          <StatCard label="Pending" value={pendingCount} color="text-amber-300" />
          <StatCard label="Reviewed" value={reviewedCount} color="text-primary" />
          <StatCard label="Approved" value={approvedCount} color="text-emerald-300" />
        </div>

        <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-stash-line-soft bg-stash-control p-1 mb-6">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'pipeline'
                ? 'bg-stash-panel-strong text-foreground border border-stash-line-soft'
                : 'text-stash-muted-text hover:text-foreground'
            }`}
            type="button"
          >
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-stash-panel-strong text-foreground border border-stash-line-soft'
                : 'text-stash-muted-text hover:text-foreground'
            }`}
            type="button"
          >
            Live events
            <span className="ml-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
              {filteredEvents.length}
            </span>
          </button>
        </div>

        {activeTab === 'events' ? (
          <div className="browse-shell p-6 mb-8">
            <div className="flex flex-wrap items-center justify-start gap-3 mb-4">
              <h2 className="text-xl font-semibold">Live agent events</h2>
              <div className="flex gap-2">
                <select
                  value={eventFilter.agent}
                  onChange={(e) => setEventFilter((prev) => ({ ...prev, agent: e.target.value }))}
                  className="browse-control h-10 rounded px-3 py-1.5 text-sm text-foreground"
                >
                  <option value="">All agents</option>
                  <option value="scout">Scout</option>
                  <option value="research">Research</option>
                  <option value="writer">Writer</option>
                  <option value="editor">Editor</option>
                  <option value="publisher">Publisher</option>
                  <option value="curator">Curator</option>
                  <option value="daemon">Daemon</option>
                  <option value="orchestrator">Orchestrator</option>
                </select>
                <select
                  value={eventFilter.status}
                  onChange={(e) => setEventFilter((prev) => ({ ...prev, status: e.target.value }))}
                  className="browse-control h-10 rounded px-3 py-1.5 text-sm text-foreground"
                >
                  <option value="">All statuses</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard
                label="Total events"
                value={data?.eventStats?.total || 0}
                color="text-primary"
              />
              <StatCard
                label="Completed"
                value={data?.eventStats?.byStatus?.completed || 0}
                color="text-emerald-300"
              />
              <StatCard
                label="Failed"
                value={data?.eventStats?.byStatus?.failed || 0}
                color="text-red-300"
              />
              <StatCard
                label="Running"
                value={data?.eventStats?.byStatus?.running || 0}
                color="text-amber-300"
              />
            </div>

            <div className="space-y-2 max-h-[38rem] overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-stash-muted-text">
                  No events yet. Run an agent to see activity.
                </div>
              ) : (
                filteredEvents.map((event, index) => (
                  <div
                    key={`${event.timestamp}-${event.agentId}-${event.actionType || index}`}
                    className={`rounded-lg border-l-4 border border-stash-line-soft bg-stash-panel-strong/55 p-3 ${
                      event.status === 'completed'
                        ? 'border-l-emerald-500'
                        : event.status === 'failed'
                          ? 'border-l-red-500'
                          : event.status === 'blocked'
                            ? 'border-l-amber-500'
                            : 'border-l-primary'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-0.5 text-xs text-stash-muted-text">
                          {event.agentId}
                        </span>
                        <span className="text-sm font-medium text-foreground">{event.actionType}</span>
                      </div>
                      <span className="text-xs text-stash-muted-text">{formatDateTime(event.timestamp)}</span>
                    </div>
                    <div className="mt-1 text-sm text-foreground/85">
                      {event.target || 'N/A'}
                      {event.durationMs ? (
                        <span className="ml-2 text-stash-muted-text">({event.durationMs}ms)</span>
                      ) : null}
                    </div>
                    {event.error ? (
                      <div className="mt-2 rounded border border-red-500/35 bg-red-500/10 p-2 text-xs font-mono text-red-200">
                        {event.error}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'pipeline' ? (
          <>
            {queue.length > 0 ? (
              <div className="browse-shell p-6 mb-8">
                <div className="flex flex-wrap items-center justify-start gap-3 mb-4">
                  <h2 className="text-xl font-semibold">
                    Approval queue ({filteredQueue.length}/{queue.length})
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleApproveAllReviewed}
                      type="button"
                      disabled={reviewedCount === 0}
                      className="inline-flex min-h-10 items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve all reviewed ({reviewedCount})
                    </button>
                    <button
                      onClick={handleRejectAll}
                      type="button"
                      disabled={actionableCount === 0}
                      className="inline-flex min-h-10 items-center rounded-full border border-red-500/40 bg-red-500/15 px-4 text-sm font-medium text-red-200 transition hover:bg-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject all ({actionableCount})
                    </button>
                    <button
                      onClick={() => runAgent('publisher')}
                      type="button"
                      disabled={running !== null || approvedCount === 0}
                      className="inline-flex min-h-10 items-center rounded-full border border-primary/45 bg-primary/20 px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {running === 'publisher'
                        ? 'Publishing...'
                        : `Publish approved (${approvedCount})`}
                    </button>
                    <button
                      onClick={() => runAgent('editor')}
                      type="button"
                      disabled={running !== null}
                      className="inline-flex min-h-10 items-center rounded-full border border-stash-line-soft bg-stash-control px-4 text-sm font-medium text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Run editor
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Search title, slug, description"
                    className="browse-control h-10 lg:col-span-2 rounded px-3 py-2 text-sm text-foreground placeholder:text-stash-muted-text"
                  />
                  <select
                    value={queueTypeFilter}
                    onChange={(e) =>
                      setQueueTypeFilter(e.target.value as 'all' | 'resource' | 'blog')
                    }
                    className="browse-control h-10 rounded px-3 py-2 text-sm text-foreground"
                  >
                    <option value="all">All types</option>
                    <option value="resource">Resources</option>
                    <option value="blog">Blogs</option>
                  </select>
                  <select
                    value={queueStatusFilter}
                    onChange={(e) =>
                      setQueueStatusFilter(
                        e.target.value as 'all' | 'pending' | 'reviewed' | 'approved' | 'needs_revision'
                      )
                    }
                    className="browse-control h-10 rounded px-3 py-2 text-sm text-foreground"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                    <option value="needs_revision">Needs revision</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-start gap-3 mb-4">
                  <label className="inline-flex items-center gap-2 text-sm text-stash-muted-text">
                    <input
                      type="checkbox"
                      checked={showActionableOnly}
                      onChange={(e) => setShowActionableOnly(e.target.checked)}
                      className="rounded border-stash-line-soft bg-stash-control"
                    />
                    Show actionable only (hide approved)
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={toggleSelectAllVisible}
                      type="button"
                      disabled={visibleIds.length === 0}
                      className="inline-flex min-h-10 items-center rounded-full border border-stash-line-soft bg-stash-control px-3 text-sm text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {allVisibleSelected ? 'Clear visible selection' : 'Select visible'}
                    </button>
                    <button
                      onClick={handleApproveSelected}
                      type="button"
                      disabled={selectedReviewedIds.length === 0}
                      className="inline-flex min-h-10 items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 text-sm text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve selected ({selectedReviewedIds.length})
                    </button>
                    <button
                      onClick={handleRejectSelected}
                      type="button"
                      disabled={selectedIds.length === 0}
                      className="inline-flex min-h-10 items-center rounded-full border border-red-500/40 bg-red-500/15 px-3 text-sm text-red-200 transition hover:bg-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject selected ({selectedIds.length})
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredQueue.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-stash-line-soft py-8 text-center text-stash-muted-text">
                      No queue items match the current filters.
                    </div>
                  ) : (
                    filteredQueue.map((item, index) => {
                      const id = queueActionId(item);
                      return (
                        <QueueItemCard
                          key={id || item.submittedAt || `${item.type}-${index}`}
                          item={item}
                          selected={Boolean(id && selectedSet.has(id))}
                          onToggleSelected={(checked) => {
                            if (!id) return;
                            setSelectedIds((prev) => {
                              const set = new Set(prev);
                              if (checked) set.add(id);
                              else set.delete(id);
                              return [...set];
                            });
                          }}
                          onRefresh={fetchData}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="browse-shell mb-8 p-6 text-stash-muted-text">
                Approval queue is empty.
              </div>
            )}

            <div className="browse-shell p-6">
              <h2 className="text-xl font-semibold mb-4">Run agents</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.name}
                    onClick={() => runAgent(agent.name)}
                    disabled={running !== null}
                    type="button"
                    className={`p-4 rounded-lg border transition-all text-left ${
                      running === agent.name
                        ? 'border-primary/55 bg-primary/20 text-foreground'
                        : 'border-stash-line-soft bg-stash-control text-foreground hover:border-stash-line-strong hover:bg-stash-control-hover'
                    }`}
                  >
                    <div className="font-medium">{agent.label}</div>
                    <div className="text-xs text-stash-muted-text mt-1">{agent.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-stash-line-soft flex flex-wrap gap-3">
                <button
                  onClick={() => runAgent('orchestrator', 'daily')}
                  disabled={running !== null}
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-full border border-primary/45 bg-primary/20 px-6 text-sm font-medium text-white transition hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Run daily pipeline
                </button>
                <button
                  onClick={() => runAgent('orchestrator', 'weekly')}
                  disabled={running !== null}
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-full border border-stash-line-soft bg-stash-control px-6 text-sm font-medium text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Run weekly pipeline
                </button>
              </div>
            </div>
          </>
        ) : null}

        {running ? (
          <div className="fixed bottom-6 right-6 rounded-full border border-primary/45 bg-stash-panel px-3 py-2 text-sm text-foreground shadow-lg">
            <div className="flex items-center gap-2">
              <span>Running: {running}</span>
              {!stopRequested ? (
                <button
                  onClick={() => setRunControl('stop')}
                  type="button"
                  className="inline-flex min-h-8 items-center rounded-full border border-amber-500/45 bg-amber-500/15 px-3 text-xs font-medium text-amber-200 transition hover:bg-amber-500/25"
                >
                  Stop
                </button>
              ) : (
                <span className="rounded-full border border-amber-500/45 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                  Stop pending
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="browse-card rounded-xl p-4">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-stash-muted-text">{label}</div>
    </div>
  );
}

function QueueItemCard({
  item,
  selected,
  onToggleSelected,
  onRefresh,
}: {
  item: QueueItem;
  selected: boolean;
  onToggleSelected: (checked: boolean) => void;
  onRefresh: () => Promise<void> | void;
}) {
  const isBlog = item.type === 'blog';
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editData, setEditData] = useState<QueueData>(item.data || {});

  const actionId = queueActionId(item);
  const previewId = queuePreviewId(item);
  const slug = normalizeSlug(item.data?.slug);
  const title = asString(item.data?.title || item.data?.url) || 'Untitled';
  const score = Number(item.review?.score || 0);

  const previewPath = slug && previewId ? `${isBlog ? '/blog' : ''}/${slug}?previewQueueId=${encodeURIComponent(previewId)}` : '';
  const livePath = slug ? `${isBlog ? '/blog' : ''}/${slug}` : '';

  const wordCount = isBlog ? countBodyWords(item.data?.body) : 0;
  const headingCount = isBlog ? countHeadings(item.data?.body) : 0;
  const visuals = isBlog ? countVisuals(item.data?.body) : { infographics: 0, sourcedImages: 0 };
  const sourceCount = asArray(item.data?.sources).length;
  const tagCount = asArray(item.data?.tags).length;
  const relatedCount = asArray(item.data?.relatedResources).length;

  const handleApprove = async () => {
    if (!actionId) return;
    await fetch('/api/agents/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', itemIds: [actionId] }),
    });
    await onRefresh();
  };

  const handleReject = async () => {
    if (!actionId) return;
    if (!window.confirm('Reject this item?')) return;
    await fetch('/api/agents/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', itemIds: [actionId] }),
    });
    await onRefresh();
  };

  const handleSave = async () => {
    if (!actionId) return;
    await fetch('/api/agents/edit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: actionId, updatedData: editData }),
    });
    setIsEditing(false);
    await onRefresh();
  };

  if (isEditing) {
    return (
      <div className="browse-card rounded-lg p-4 border-primary/50">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              isBlog
                ? 'border border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-300'
                : 'border border-sky-500/35 bg-sky-500/10 text-sky-300'
            }`}
          >
            {isBlog ? 'Blog' : 'Resource'}
          </span>
          <span className="text-primary text-xs">Editing draft</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-stash-muted-text">Title</label>
            <input
              type="text"
              value={asString(editData.title)}
              onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
              className="browse-control h-10 w-full rounded px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-stash-muted-text">
              {isBlog ? 'Excerpt' : 'Description'}
            </label>
            <textarea
              value={asString(isBlog ? editData.excerpt : editData.description)}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  [isBlog ? 'excerpt' : 'description']: e.target.value,
                }))
              }
              className="browse-control h-24 w-full rounded px-3 py-2 text-sm text-foreground"
            />
          </div>
          {!isBlog ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stash-muted-text">Category</label>
                <input
                  type="text"
                  value={asString(editData.category)}
                  onChange={(e) => setEditData((prev) => ({ ...prev, category: e.target.value }))}
                  className="browse-control h-10 w-full rounded px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-stash-muted-text">URL</label>
                <input
                  type="text"
                  value={asString(editData.url)}
                  onChange={(e) => setEditData((prev) => ({ ...prev, url: e.target.value }))}
                  className="browse-control h-10 w-full rounded px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="inline-flex min-h-10 items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/25"
            type="button"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="inline-flex min-h-10 items-center rounded-full border border-stash-line-soft bg-stash-control px-4 text-sm text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover"
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-card rounded-lg p-4">
      <div className="flex flex-col items-start gap-3">
        <div className="w-full min-w-0">
          <div className="flex w-full flex-wrap items-center !justify-start !content-start gap-2 mb-2">
            <label className="inline-flex items-center gap-2 text-xs text-stash-muted-text">
              <input
                type="checkbox"
                checked={selected}
                disabled={!actionId}
                onChange={(e) => onToggleSelected(e.target.checked)}
                className="rounded border-stash-line-soft bg-stash-control"
              />
              Select
            </label>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                isBlog
                  ? 'border border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-300'
                  : 'border border-sky-500/35 bg-sky-500/10 text-sky-300'
              }`}
            >
              {isBlog ? 'Blog' : 'Resource'}
            </span>
            <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1 text-xs text-stash-muted-text">
              {asString(item.status) || 'pending'}
            </span>
            {item.status === 'reviewed' ? (
              <span
                className={`px-2 py-1 rounded text-xs ${
                  score >= 80
                    ? 'border border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                    : score >= 60
                      ? 'border border-amber-500/35 bg-amber-500/10 text-amber-300'
                      : 'border border-red-500/35 bg-red-500/10 text-red-300'
                }`}
              >
                Score {score}%
              </span>
            ) : null}
          </div>

          <h3 className="font-semibold text-lg leading-snug break-words">{title}</h3>

          {!isBlog && asString(item.data?.description) ? (
            <p className="mt-1 line-clamp-2 text-sm text-stash-muted-text">{asString(item.data?.description)}</p>
          ) : null}
          {isBlog && asString(item.data?.excerpt) ? (
            <p className="mt-1 line-clamp-2 text-sm text-stash-muted-text">{asString(item.data?.excerpt)}</p>
          ) : null}

          <div className="mt-2 flex w-full flex-wrap items-center !justify-start !content-start gap-2 text-xs text-stash-muted-text">
            {isBlog ? (
              <>
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">{wordCount} words</span>
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">{headingCount} headings</span>
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">{sourceCount} sources</span>
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">{tagCount} tags</span>
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">
                  {visuals.infographics} infographics
                </span>
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">
                  {visuals.sourcedImages} sourced images
                </span>
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">{relatedCount} related resources</span>
              </>
            ) : (
              <>
                {asString(item.data?.category) ? (
                  <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">{asString(item.data?.category)}</span>
                ) : null}
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">{sourceCount} sources</span>
                <span className="rounded border border-stash-line-soft bg-stash-control px-2 py-1">{tagCount} tags</span>
              </>
            )}
          </div>

          <div className="mt-3 flex w-full flex-wrap items-center !justify-start !content-start gap-3 text-sm">
            {previewPath ? (
              <a
                href={previewPath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 transition-colors hover:text-foreground"
              >
                Preview draft
              </a>
            ) : null}
            {livePath ? (
              <a
                href={livePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stash-muted-text underline underline-offset-2 transition-colors hover:text-foreground"
              >
                View live route
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="text-sky-300 underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>

          {showDetails ? (
            <div className="mt-3 space-y-2 rounded-lg border border-stash-line-soft bg-stash-panel-strong/55 p-3 text-xs text-stash-muted-text">
              <p>Queue ID: {asString(item.queueId) || 'N/A'}</p>
              <p>Submitted: {formatDateTime(item.submittedAt)}</p>
              <p>Edited: {formatDateTime(item.editedAt)}</p>
              <p>Reviewed: {formatDateTime(item.review?.reviewedAt)}</p>
              <p>Approved: {formatDateTime(item.approvedAt)}</p>
              {asArray<string>(item.review?.issues).length > 0 ? (
                <div>
                  <p className="mb-1 text-red-300">Issues</p>
                  {asArray<string>(item.review?.issues).map((issue, index) => (
                    <p key={`${issue}-${index}`} className="text-red-200">
                      - {issue}
                    </p>
                  ))}
                </div>
              ) : null}
              {asArray<string>(item.review?.warnings).length > 0 ? (
                <div>
                  <p className="mb-1 text-amber-300">Warnings</p>
                  {asArray<string>(item.review?.warnings).map((warning, index) => (
                    <p key={`${warning}-${index}`} className="text-amber-200">
                      - {warning}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap items-center !justify-start !content-start gap-2">
          {item.status === 'reviewed' ? (
            <button
              onClick={handleApprove}
              disabled={!actionId}
              className="inline-flex min-h-10 items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 text-sm text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Approve
            </button>
          ) : null}
          {item.status !== 'approved' ? (
            <button
              onClick={handleReject}
              disabled={!actionId}
              className="inline-flex min-h-10 items-center rounded-full border border-red-500/40 bg-red-500/15 px-3 text-sm text-red-200 transition hover:bg-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Reject
            </button>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 text-sm text-emerald-300">
              Ready
            </span>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex min-h-10 items-center rounded-full border border-stash-line-soft bg-stash-control px-3 text-sm text-foreground transition hover:border-stash-line-strong hover:bg-stash-control-hover"
            type="button"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
