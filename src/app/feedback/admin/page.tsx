"use client";

import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FeedbackItem, FeedbackStatus } from "@/lib/feedback-store";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";

const ADMIN_KEY_STORAGE = "feedback-admin-key";
const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "shipped", label: "Shipped" },
];

function useAdminKey() {
  const [key, setKeyState] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!stored) {
      setVerified(false);
      return;
    }
    setKeyState(stored);
    fetch("/api/feedback/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: stored }),
    })
      .then((r) => {
        setVerified(r.ok);
        if (!r.ok) sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      })
      .catch(() => {
        setVerified(false);
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      });
  }, []);

  const verifyAndStore = useCallback(async (candidate: string) => {
    const res = await fetch("/api/feedback/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: candidate }),
    });
    if (res.ok) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, candidate);
      setKeyState(candidate);
      setVerified(true);
      return true;
    }
    return false;
  }, []);

  const clearKey = useCallback(() => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setKeyState(null);
    setVerified(false);
  }, []);

  return { key, verified, verifyAndStore, clearKey };
}

function adminFetch(key: string, url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: { ...options.headers, "X-Admin-Key": key },
  });
}

export default function FeedbackAdminPage() {
  const { key, verified, verifyAndStore, clearKey } = useAdminKey();
  const [password, setPassword] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState<Record<string, { status?: FeedbackStatus; votes?: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadItems = useCallback(() => {
    if (!key) return;
    setLoading(true);
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((data: { items: FeedbackItem[] }) => {
        setItems(data.items ?? []);
        setDirty({});
      })
      .finally(() => setLoading(false));
  }, [key]);

  useEffect(() => {
    if (verified && key) loadItems();
  }, [verified, key, loadItems]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifyLoading(true);
    const ok = await verifyAndStore(password);
    setVerifyLoading(false);
    if (!ok) setVerifyError("Invalid key");
    else setPassword("");
  };

  const getItemState = (id: string) => {
    const item = items.find((i) => i.id === id);
    const d = dirty[id];
    return {
      status: (d?.status ?? item?.status) ?? "idea",
      votes: d?.votes ?? item?.votes ?? 0,
    };
  };

  const setItemDirty = (id: string, updates: { status?: FeedbackStatus; votes?: number }) => {
    setDirty((prev) => {
      const next = { ...prev };
      const cur = next[id] ?? {};
      next[id] = { ...cur, ...updates };
      return next;
    });
  };

  const saveItem = async (id: string) => {
    if (!key) return;
    const d = dirty[id];
    if (!d) return;
    setSaving(id);
    try {
      const res = await adminFetch(key, `/api/feedback/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      if (res.ok) {
        const updated = (await res.json()) as FeedbackItem;
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
        setDirty((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setSaving(null);
    }
  };

  const deleteItem = async (id: string) => {
    if (!key) return;
    if (!confirm("Delete this idea? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await adminFetch(key, `/api/feedback/admin/${id}`, { method: "DELETE" });
      if (res.status === 204) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setDirty((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setDeleting(null);
    }
  };

  if (verified === null) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-muted-foreground">Checking access…</p>
        </main>
      </div>
    );
  }

  if (verified === false) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-sm px-4 py-16">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="font-display text-xl font-semibold text-foreground">
              Feedback admin
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your admin key to manage ideas and roadmap.
            </p>
            <form onSubmit={handleUnlock} className="mt-4 space-y-3">
              <label htmlFor="admin-key" className="sr-only">
                Admin key
              </label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Admin key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={verifyLoading}
                autoComplete="off"
                className="w-full"
              />
              {verifyError && (
                <p className="text-sm text-destructive" role="alert">
                  {verifyError}
                </p>
              )}
              <Button type="submit" disabled={verifyLoading} className="w-full">
                {verifyLoading ? "Checking…" : "Unlock"}
              </Button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Feedback admin
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update status, set votes, or delete ideas. Not visible to the public.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </Button>
            <Button variant="ghost" size="sm" onClick={clearKey}>
              Lock
            </Button>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No feedback items yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const { status, votes } = getItemState(item.id);
              const isDirty = !!dirty[item.id];
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-foreground">{item.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={status}
                        onChange={(e) =>
                          setItemDirty(item.id, {
                            ...dirty[item.id],
                            status: e.target.value as FeedbackStatus,
                          })
                        }
                        className={cn(
                          "border-input rounded-md border bg-transparent px-2 py-1.5 text-sm",
                          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]"
                        )}
                        aria-label={`Status for ${item.title}`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">Votes</span>
                        <input
                          type="number"
                          min={0}
                          value={votes}
                          onChange={(e) =>
                            setItemDirty(item.id, {
                              ...dirty[item.id],
                              votes: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className={cn(
                            "border-input w-16 rounded-md border bg-transparent px-2 py-1.5 text-sm tabular-nums",
                            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]"
                          )}
                        />
                      </label>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => saveItem(item.id)}
                        disabled={!isDirty || saving === item.id}
                      >
                        {saving === item.id ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteItem(item.id)}
                        disabled={deleting === item.id}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${item.title}`}
                      >
                        {deleting === item.id ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="size-4" aria-hidden />
                        )}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
