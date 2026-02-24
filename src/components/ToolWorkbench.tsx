"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusNotice } from "@/components/StatusNotice";
import { runTool, type ToolOutputLength, type ToolTone } from "@/lib/tools-engine";
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
  const [fileName, setFileName] = useState<string | null>(null);

  const supportsTone = tool.kind === "generator";
  const supportsLength = tool.kind === "generator" || tool.kind === "chat";

  const canRun = useMemo(() => primaryInput.trim().length > 0, [primaryInput]);

  const handleReset = () => {
    setPrimaryInput("");
    setSecondaryInput("");
    setOutput("");
    setWarnings([]);
    setCopied(false);
    setFileName(null);
    setTone("balanced");
    setOutputLength("standard");
    setSource(tool.inputSources[0] ?? "text");
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    setFileName(file.name);
    try {
      const text = await file.text();
      const normalized = text.replace(/\u0000/g, "").trim();
      setPrimaryInput(normalized);

      const nextWarnings: string[] = [];
      if (!normalized) {
        nextWarnings.push(
          "This file did not produce readable text in-browser. Paste extracted text for better results."
        );
      }
      if (file.size > 3 * 1024 * 1024) {
        nextWarnings.push(
          "Large files may parse incompletely in-browser. For production conversion, use server-side extraction."
        );
      }
      setWarnings(nextWarnings);
    } catch {
      setWarnings([
        "Could not parse this file in-browser. Paste extracted text and run the tool again.",
      ]);
    }
  };

  const handleRun = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRunning(true);

    const result = runTool({
      tool,
      source,
      primaryInput,
      secondaryInput,
      tone,
      outputLength,
      fileName: fileName ?? undefined,
    });

    setOutput(result.output);
    setWarnings(result.warnings);

    setTimeout(() => {
      setIsRunning(false);
    }, 120);
  };

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

      <form onSubmit={handleRun} className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-border/80 bg-background/70 p-4">
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
              value={primaryInput}
              onChange={(event) => setPrimaryInput(event.target.value)}
              placeholder={sourcePlaceholder(tool, source)}
              rows={sourceInputRows(source)}
              className="mt-2 block w-full resize-y rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              aria-label={sourceLabel(tool, source)}
              required
            />
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

          <div className="mt-5 flex flex-wrap items-center gap-2">
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

        <section className="rounded-xl border border-border/80 bg-background/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {tool.outputLabel}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyOutput()}
              disabled={!output.trim()}
              className="h-8"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {output ? (
            <pre className="mt-3 max-h-[34rem] overflow-auto rounded-xl border border-border/80 bg-muted/20 p-3 text-sm leading-6 text-foreground whitespace-pre-wrap">
              {output}
            </pre>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
              Run the tool to generate output here.
            </div>
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
