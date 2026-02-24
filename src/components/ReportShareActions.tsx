"use client";

import { DownloadIcon, FileTextIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { ShareMenu } from "@/components/ShareMenu";
import { Button } from "@/components/ui/button";

type ReportShareActionsProps = {
  pageUrl: string;
  title: string;
  briefMarkdown: string;
  downloadLinks?: Array<{ label: string; href: string }>;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ReportShareActions({
  pageUrl,
  title,
  briefMarkdown,
  downloadLinks = [],
}: ReportShareActionsProps) {
  const handleDownloadBrief = () => {
    try {
      const fileName = `${slugify(title)}-brief.md`;
      const blob = new Blob([briefMarkdown], { type: "text/markdown;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Report brief downloaded");
    } catch {
      toast.error("Could not download report brief");
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/30 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Download and share
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Share this report to help teams cite one canonical source and link back to The Stash.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {downloadLinks.map((link) => (
          <Button key={link.href} asChild variant="outline" size="sm">
            <a href={link.href}>
              <DownloadIcon className="size-4" />
              {link.label}
            </a>
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={handleDownloadBrief}>
          <FileTextIcon className="size-4" />
          Download brief
        </Button>
        <ShareMenu
          url={pageUrl}
          title={title}
          description="Data-backed report from The Stash."
          className="h-8"
          showLabel
        />
      </div>
    </section>
  );
}
