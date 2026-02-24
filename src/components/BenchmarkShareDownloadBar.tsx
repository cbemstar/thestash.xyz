"use client";

import { DownloadIcon, FileTextIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { ShareMenu } from "@/components/ShareMenu";
import { Button } from "@/components/ui/button";

type BenchmarkShareDownloadBarProps = {
  pageUrl: string;
  title: string;
  reportBriefMarkdown: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BenchmarkShareDownloadBar({
  pageUrl,
  title,
  reportBriefMarkdown,
}: BenchmarkShareDownloadBarProps) {
  const handleDownloadBrief = () => {
    try {
      const fileName = `${slugify(title)}-official-brief.md`;
      const blob = new Blob([reportBriefMarkdown], { type: "text/markdown;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Benchmark brief downloaded");
    } catch {
      toast.error("Could not download benchmark brief");
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/30 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Download and share
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Share this benchmark page to help teams cite a single canonical source and link back to
        The Stash.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href="/api/seo/benchmark/ai-coding-tools?format=csv">
            <DownloadIcon className="size-4" />
            Download CSV
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href="/api/seo/benchmark/ai-coding-tools">
            <DownloadIcon className="size-4" />
            Download JSON
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleDownloadBrief}>
          <FileTextIcon className="size-4" />
          Download report brief
        </Button>
        <ShareMenu
          url={pageUrl}
          title={title}
          description="AI coding tools benchmark with official-source metrics and report infographics."
          className="h-8"
          showLabel
        />
      </div>
    </section>
  );
}
