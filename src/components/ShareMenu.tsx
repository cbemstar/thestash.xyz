"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Share1Icon,
  CopyIcon,
  TwitterLogoIcon,
  LinkedInLogoIcon,
  EnvelopeClosedIcon,
} from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MicroExpander } from "@/components/satisui/micro-expander";

const SHARE_SITE_PITCH =
  "The Stash is a curated directory of dev & design resources — hand-picked tools, inspiration, and links for developers and designers. thestash.xyz";

interface ShareMenuProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  /** When false, only the share icon is shown (e.g. in compact action bars). */
  showLabel?: boolean;
  /** Use MicroExpander (expand-on-hover pill) as the trigger instead of a regular button. */
  useMicroExpander?: boolean;
}

export function ShareMenu({ url, title, description, className, showLabel = true, useMicroExpander = false }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const socialText = `Check out this amazing resource I found on thestash.xyz: ${title}. ${SHARE_SITE_PITCH}`;
  const twitterText = `${title} — found on thestash.xyz. ${SHARE_SITE_PITCH}`;

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(twitterText)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Check out this resource I found on thestash.xyz: ${title}`)}`;
  const emailSubject = encodeURIComponent(`${title} | The Stash`);
  const emailBody = encodeURIComponent(
    `Check out this resource I found on thestash.xyz:\n\n${title}\n${url}\n\n${SHARE_SITE_PITCH}`
  );
  const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${title} | The Stash`,
        text: socialText,
        url,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const trigger = useMicroExpander ? (
    <MicroExpander
      text="Share"
      icon={<Share1Icon className="h-5 w-5" />}
      variant="ghost"
      className={className}
      aria-label="Share this resource"
    />
  ) : (
    <Button
      variant="outline"
      size="default"
      className={className}
      aria-label="Share this resource"
    >
      <Share1Icon className="size-4 shrink-0" aria-hidden />
      {showLabel && <span className="ml-2">Share</span>}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11.25rem]">
        {hasNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share1Icon className="size-4" />
            Share via…
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy}>
          <CopyIcon className="size-4" />
          {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <TwitterLogoIcon className="size-4" />
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
            <LinkedInLogoIcon className="size-4" />
            Share on LinkedIn
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Share1Icon className="size-4" />
            Share on Facebook
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Share1Icon className="size-4" />
            Share on Reddit
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={emailUrl} className="flex items-center gap-2">
            <EnvelopeClosedIcon className="size-4" />
            Share via email
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
