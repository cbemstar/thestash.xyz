"use client";

import { useState } from "react";
import { IconShare2, IconCopy, IconBrandX, IconBrandLinkedin } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ShareMenuProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export function ShareMenu({ url, title, description, className }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const shareText = description ? `${title} — ${description.slice(0, 100)}…` : title;

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${title} | The Stash`,
        text: shareText,
        url,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className={className}
          aria-label="Share this resource"
        >
          <IconShare2 className="size-4" aria-hidden />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {hasNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <IconShare2 className="size-4" />
            Share via…
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy}>
          <IconCopy className="size-4" />
          {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <IconBrandX className="size-4" />
            Share on X
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <IconBrandLinkedin className="size-4" />
            Share on LinkedIn
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
