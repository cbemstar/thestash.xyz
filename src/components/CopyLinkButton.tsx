"use client";

import { useState } from "react";
import { Link2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyLinkButtonProps {
  url: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | "icon-xs";
  /** Show label next to icon */
  showLabel?: boolean;
  ariaLabel?: string;
}

export function CopyLinkButton({
  url,
  className,
  variant = "ghost",
  size = "icon-sm",
  showLabel = false,
  ariaLabel = "Copy link",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      aria-label={ariaLabel}
      title="Copy link"
    >
      <Link2Icon className="size-4 shrink-0" aria-hidden />
      {showLabel && (
        <span className="ml-1.5">{copied ? "Copied!" : "Copy link"}</span>
      )}
    </Button>
  );
}
