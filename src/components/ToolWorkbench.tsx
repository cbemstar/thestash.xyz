"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { StatusNotice } from "@/components/StatusNotice";
import { type ToolOutputLength, type ToolTone } from "@/lib/tools-engine";
import type { ToolDefinition, ToolInputSource } from "@/lib/tools-catalog";

type ToolWorkbenchProps = {
  tool: ToolDefinition;
};

const SOURCE_LABELS: Record<ToolInputSource, string> = {
  text: "Paste text",
  url: "Use URL",
  file: "Upload file",
};

const LENGTH_LABELS: Array<{ value: ToolOutputLength; label: string }> = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
];

const TONE_LABELS: Array<{ value: ToolTone; label: string }> = [
  { value: "direct", label: "Direct" },
  { value: "balanced", label: "Balanced" },
  { value: "friendly", label: "Friendly" },
];

function sourceLabel(tool: ToolDefinition, source: ToolInputSource): string {
  if (source === "url") return "Source URL";
  if (source === "file") return "Uploaded content";
  return tool.primaryInputLabel;
}

function sourcePlaceholder(tool: ToolDefinition, source: ToolInputSource): string {
  if (source === "url") return "https://example.com";
  if (source === "file") {
    return "After uploading, review or edit parsed text here before running.";
  }
  return tool.primaryPlaceholder;
}

function sourceInputRows(source: ToolInputSource): number {
  if (source === "file") return 8;
  if (source === "url") return 3;
  return 10;
}

export function ToolWorkbench({ tool }: ToolWorkbenchProps) {
  const [source, setSource] = useState<ToolInputSource>(tool.inputSources[0] ?? "text");
  const [primaryInput, setPrimaryInput] = useState("");
  const [secondaryInput, setSecondaryInput] = useState("");
  const [tone, setTone] = useState<ToolTone>("balanced");
  const [outputLength, setOutputLength] = useState<ToolOutputLength>("standard");
  const [output, setOutput] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxPages, setMaxPages] = useState<number>(() => tool.crawlerMaxPagesDefault ?? 50);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const showProgressBar = Boolean(tool.showProgressBar);
  const showMaxPages = tool.crawlerMaxPagesDefault != null;
  const supportsTone = tool.kind === "generator";

  const estimatedRange = useMemo(() => {
    const base = tool.estimatedDurationSeconds;
    if (!base) return null;
    if (!showMaxPages || tool.crawlerMaxPagesDefault == null) {
      return { min: base.min, max: base.max };
    }
    const defaultPages = tool.crawlerMaxPagesDefault;
    const factor = Math.min(3, Math.max(0.5, maxPages / defaultPages));
    return {
      min: Math.round(base.min * factor),
      max: Math.round(Math.min(300, base.max * factor)),
    };
  }, [tool.estimatedDurationSeconds, tool.crawlerMaxPagesDefault, showMaxPages, maxPages]);
  const supportsLength = tool.kind === "generator" || tool.kind === "chat";
  const hasOutput = output.trim().length > 0;

  const outputStats = useMemo(() => {
    if (!hasOutput) {
      return { words: 0, lines: 0, characters: 0 };
    }

    return {
      words: output.trim().split(/\s+/).length,
      lines: output.split(/\n/).length,
      characters: output.length,
    };
  }, [hasOutput, output]);

  const canRun = useMemo(() => {
    if (source === "file") {
      return Boolean(uploadedFile) || primaryInput.trim().length > 0;
    }
    return primaryInput.trim().length > 0;
  }, [primaryInput, source, uploadedFile]);

  useEffect(() => {
    if (tool.crawlerMaxPagesDefault != null) {
      setMaxPages(tool.crawlerMaxPagesDefault);
    }
  }, [tool.slug, tool.crawlerMaxPagesDefault]);

  useEffect(() => {
    if (!isRunning) return;
    setElapsedSeconds(0);
    const intervalId = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning]);

  const handleReset = () => {
    setPrimaryInput("");
    setSecondaryInput("");
    setOutput("");
    setWarnings([]);
    setCopied(false);
    setFileName(null);
    setUploadedFile(null);
    setTone("balanced");
    setOutputLength("standard");
    setSource(tool.inputSources[0] ?? "text");
    setProgressPercent(null);
    setElapsedSeconds(0);
    if (tool.crawlerMaxPagesDefault != null) {
      setMaxPages(tool.crawlerMaxPagesDefault);
    }
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    setUploadedFile(file);
    setFileName(file.name);
    setWarnings([]);

    const normalizedType = (file.type ?? "").toLowerCase();
    const canPreviewAsText =
      /^text\//i.test(normalizedType) ||
      [
        "application/json",
        "text/json",
        "application/xml",
        "text/xml",
        "application/csv",
        "text/csv",
        "application/rtf",
        "text/rtf",
        "text/markdown",
      ].includes(normalizedType) ||
      /\.(txt|md|csv|json|xml|html|htm|rtf)$/i.test(file.name);

    if (!canPreviewAsText) {
      setPrimaryInput("");
      setWarnings([
        "Preview unavailable for this file type. Content will be extracted when you run the tool.",
      ]);
      return;
    }

    try {
      const text = await file.text();
      const normalized = text.replace(/\u0000/g, "").trim();
      setPrimaryInput(normalized.slice(0, 120_000));
    } catch {
      setPrimaryInput("");
      setWarnings([
        "Could not preview this file in-browser. You can still run conversion using the uploaded file.",
      ]);
    }
  };

  const handleRun = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsRunning(true);
      setCopied(false);
      let progressIntervalId: ReturnType<typeof setInterval> | null = null;
      if (showProgressBar) {
        setProgressPercent(0);
        progressIntervalId = setInterval(() => {
          setProgressPercent((prev) => {
            if (prev == null) return 0;
            if (prev >= 90) return 90;
            return prev + Math.random() * 6 + 4;
          });
        }, 600);
      }

      try {
        const effectiveSecondary =
          showMaxPages
            ? secondaryInput.trim()
              ? `max pages: ${maxPages}\n${secondaryInput}`
              : `max pages: ${maxPages}`
            : secondaryInput;

        const payload = new FormData();
        payload.set("slug", tool.slug);
        payload.set("source", source);
        payload.set("primaryInput", primaryInput);
        payload.set("secondaryInput", effectiveSecondary);
        payload.set("tone", tone);
        payload.set("outputLength", outputLength);
        if (source === "file" && uploadedFile) {
          payload.set("file", uploadedFile);
        }

        const response = await fetch("/api/tools/run", {
          method: "POST",
          body: payload,
        });

        const data = (await response.json()) as {
          output?: string;
          warnings?: string[];
          error?: string;
        };

        if (showProgressBar) {
          setProgressPercent(100);
        }

        if (!response.ok || data.error) {
          setOutput("");
          setWarnings([data.error ?? "Tool run failed."]);
          return;
        }

        setOutput(data.output ?? "");
        setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      } catch {
        setOutput("");
        setWarnings(["Tool request failed. Check your connection and try again."]);
      } finally {
        if (progressIntervalId != null) {
          clearInterval(progressIntervalId);
        }
        setIsRunning(false);
        if (showProgressBar) {
          setTimeout(() => setProgressPercent(null), 400);
        }
      }
    },
    [
      tool.slug,
      source,
      primaryInput,
      secondaryInput,
      tone,
      outputLength,
      uploadedFile,
      showProgressBar,
      showMaxPages,
      maxPages,
    ]
  );

  const copyOutput = async () => {
    if (!output.trim()) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setWarnings((previous) => [
        ...previous,
        "Clipboard access failed in this browser. Copy output manually.",
      ]);
    }
  };

  const downloadOutput = (extension: "md" | "txt") => {
    if (!hasOutput) return;

    const content = output;
    const mimeType = extension === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `${tool.slug}-${timestamp}.${extension}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const clearOutput = () => {
    setOutput("");
    setWarnings([]);
    setCopied(false);
  };

  return (
    <section className="mt-8 section-panel sm:p-6" aria-labelledby="tool-workbench-title">
      <header className="mb-4">
        <h2 id="tool-workbench-title" className="section-title">
          Try {tool.title}
        </h2>
        <p className="section-copy">
          Provide input, run the tool, and copy the result into your workflow.
        </p>
      </header>

      <form onSubmit={handleRun} className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
        <section className="min-w-0 rounded-xl border border-border/80 bg-background/70 p-4">
          {tool.inputSources.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Input source">
              {tool.inputSources.map((entry) => {
                const active = source === entry;
                return (
                  <button
                    key={entry}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSource(entry)}
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                      active
                        ? "border-primary/40 bg-primary/[0.11] text-primary"
                        : "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {SOURCE_LABELS[entry]}
                  </button>
                );
              })}
            </div>
          )}

          {source === "file" && (
            <label className="mb-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground transition hover:border-primary/35 hover:bg-primary/[0.05]">
              <Upload className="size-5" aria-hidden />
              <span>Upload a file</span>
              <span className="text-xs text-muted-foreground/80 break-all">
                {tool.fileAccept
                  ? `Accepted: ${tool.fileAccept}`
                  : "Use .txt, .md, .csv, .json, or similar text-based formats."}
              </span>
              <input
                type="file"
                className="sr-only"
                accept={tool.fileAccept}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleFileUpload(file);
                }}
              />
            </label>
          )}

          {fileName && source === "file" && (
            <p className="mb-3 text-xs text-muted-foreground">Loaded file: {fileName}</p>
          )}

          <label className="block text-sm font-medium text-foreground" htmlFor="tool-primary-input">
            {sourceLabel(tool, source)}
          </label>
          {source === "url" ? (
            <Input
              id="tool-primary-input"
              name="primary_input"
              type="url"
              value={primaryInput}
              onChange={(event) => setPrimaryInput(event.target.value)}
              placeholder={sourcePlaceholder(tool, source)}
              className="mt-2 border-border/80 bg-background/80"
              aria-label={sourceLabel(tool, source)}
              autoComplete="off"
              required
            />
          ) : (
            <textarea
              id="tool-primary-input"
              name="primary_input"
              value={primaryInput}
              onChange={(event) => setPrimaryInput(event.target.value)}
              placeholder={sourcePlaceholder(tool, source)}
              rows={sourceInputRows(source)}
              className="mt-2 block w-full resize-y rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              aria-label={sourceLabel(tool, source)}
              required={source !== "file"}
            />
          )}

          {showMaxPages && (
            <div className="mt-4">
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor="tool-max-pages"
              >
                Max pages to fetch
              </label>
              <Input
                id="tool-max-pages"
                type="number"
                min={10}
                max={1000}
                value={maxPages}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setMaxPages(10);
                    return;
                  }
                  const n = parseInt(raw, 10);
                  if (!Number.isNaN(n)) setMaxPages(Math.min(1000, Math.max(10, n)));
                }}
                className="mt-2 w-28 border-border/80 bg-background/80"
                aria-label="Maximum number of pages to crawl or fetch"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Crawl will stop after this many pages (10–1000).
              </p>
            </div>
          )}

          {tool.secondaryInputLabel && (
            <>
              <label
                className="mt-4 block text-sm font-medium text-foreground"
                htmlFor="tool-secondary-input"
              >
                {tool.secondaryInputLabel}
              </label>
              <textarea
                id="tool-secondary-input"
                name="secondary_input"
                value={secondaryInput}
                onChange={(event) => setSecondaryInput(event.target.value)}
                placeholder={tool.secondaryInputPlaceholder}
                rows={4}
                className="mt-2 block w-full resize-y rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                aria-label={tool.secondaryInputLabel}
              />
            </>
          )}

          {(supportsTone || supportsLength) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {supportsTone && (
                <div>
                  <label className="block text-sm font-medium text-foreground" htmlFor="tool-tone">
                    Tone
                  </label>
                  <Select value={tone} onValueChange={(value) => setTone(value as ToolTone)}>
                    <SelectTrigger
                      id="tool-tone"
                      className="mt-2 border-border/80 bg-background/80"
                      aria-label="Tone"
                    >
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_LABELS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {supportsLength && (
                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="tool-output-length"
                  >
                    Output length
                  </label>
                  <Select
                    value={outputLength}
                    onValueChange={(value) => setOutputLength(value as ToolOutputLength)}
                  >
                    <SelectTrigger
                      id="tool-output-length"
                      className="mt-2 border-border/80 bg-background/80"
                      aria-label="Output length"
                    >
                      <SelectValue placeholder="Output length" />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTH_LABELS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {showProgressBar && (isRunning || progressPercent != null) && (
            <div className="mt-4 space-y-1" role="status" aria-live="polite" aria-label="Tool progress">
              <Progress value={progressPercent ?? 0} className="h-2" />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                {isRunning ? (
                  <>
                    <span>Fetching and processing…</span>
                    {estimatedRange && (
                      <span>Estimated: ~{estimatedRange.min}–{estimatedRange.max} sec</span>
                    )}
                    <span aria-live="off">Elapsed: {elapsedSeconds}s</span>
                  </>
                ) : (
                  <span>Done.</span>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPrimaryInput(tool.primaryPlaceholder);
                setSecondaryInput(tool.secondaryInputPlaceholder ?? "");
              }}
              className="h-9"
              aria-label="Load sample input to try the tool"
            >
              Try with sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9"
            >
              Reset
            </Button>
            <Button type="submit" size="sm" className="h-9" disabled={!canRun || isRunning}>
              {tool.actionLabel}
            </Button>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-border/80 bg-background/70 p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {tool.outputLabel}
            </h3>
            <div className="flex flex-wrap content-start items-center justify-start gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyOutput()}
                disabled={!hasOutput}
                className="h-8"
              >
                {copied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadOutput("md")}
                disabled={!hasOutput}
                className="h-8"
              >
                <Download className="size-4" aria-hidden />
                Download .md
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadOutput("txt")}
                disabled={!hasOutput}
                className="h-8"
              >
                <Download className="size-4" aria-hidden />
                Download .txt
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearOutput}
                disabled={!hasOutput}
                className="h-8"
              >
                <Trash2 className="size-4" aria-hidden />
                Clear
              </Button>
            </div>
          </div>

          {output ? (
            <div
              id="tool-output-scroll"
              tabIndex={0}
              aria-label={`${tool.outputLabel} scroll area`}
              className="mt-3 max-h-[34rem] overflow-y-auto overflow-x-auto overscroll-contain rounded-xl border border-border/80 bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 touch-pan-y"
              onWheelCapture={(event) => {
                const node = event.currentTarget;
                const atTop = node.scrollTop <= 0;
                const atBottom = Math.ceil(node.scrollTop + node.clientHeight) >= node.scrollHeight;
                if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) {
                  event.stopPropagation();
                }
              }}
            >
              <pre className="p-3 text-sm leading-6 text-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {output}
              </pre>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
              Run the tool to generate output here.
            </div>
          )}

          {hasOutput && (
            <p className="mt-2 text-xs text-muted-foreground">
              {outputStats.words.toLocaleString()} words · {outputStats.lines.toLocaleString()} lines ·{" "}
              {outputStats.characters.toLocaleString()} characters
            </p>
          )}

          {warnings.length > 0 && (
            <StatusNotice
              variant="helper"
              title="Run notes"
              items={warnings}
              className="mt-4"
            />
          )}
        </section>
      </form>
    </section>
  );
}
