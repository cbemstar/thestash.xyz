"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZES = [12, 18, 24, 36, 48, 96];
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

export type PaginationProps = {
  /** Current page (1-based) */
  page: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  pageSize: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes (resets to page 1) */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Max number of page buttons to show around current (sibling + current) */
  siblingCount?: number;
  /** Show First/Last page buttons */
  showFirstLast?: boolean;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Show "Showing X–Y of Z" summary */
  showSummary?: boolean;
  /** Show jump-to-page input */
  showJumpTo?: boolean;
  /** Label for items (e.g. "resources", "items") */
  itemLabel?: string;
  /** Size variant */
  size?: "sm" | "default" | "lg";
  /** Layout: "full" (all features inline) | "compact" (minimal) | "centered" (summary left, controls center, pageSize right) */
  variant?: "full" | "compact" | "centered";
  className?: string;
};

export function Pagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  siblingCount = 2,
  showFirstLast = true,
  showPageSize = true,
  showSummary = true,
  showJumpTo = true,
  itemLabel = "items",
  size = "default",
  variant = "full",
  className,
}: PaginationProps) {
  const [jumpValue, setJumpValue] = React.useState("");
  const [isMobile, setIsMobile] = React.useState(false);
  const jumpInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const effectiveSiblingCount = isMobile ? 0 : siblingCount;
  const showFirstLastButtons = showFirstLast && !isMobile;
  const showJumpToControl = showJumpTo && totalPages > 1 && !isMobile;

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= effectiveSiblingCount * 2 + 5) {
      return range(1, totalPages);
    }
    const leftSibling = Math.max(1, page - effectiveSiblingCount);
    const rightSibling = Math.min(totalPages, page + effectiveSiblingCount);
    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      return [...range(1, 3 + effectiveSiblingCount * 2), "ellipsis", totalPages];
    }
    if (showLeftEllipsis && !showRightEllipsis) {
      return [
        1,
        "ellipsis",
        ...range(totalPages - 2 - effectiveSiblingCount * 2, totalPages),
      ];
    }
    return [
      1,
      "ellipsis",
      ...range(leftSibling, rightSibling),
      "ellipsis",
      totalPages,
    ];
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpValue, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
      onPageChange(num);
      setJumpValue("");
    }
    jumpInputRef.current?.blur();
  };

  const sizeClasses = {
    sm: "size-7 min-w-7 text-xs",
    default: "size-9 min-w-9 text-sm",
    lg: "size-10 min-w-10 text-base",
  };
  const btnSize = size === "sm" ? "icon-xs" : size === "lg" ? "icon-lg" : "icon-sm";

  const navButtons = (
    <div className="flex w-full items-center justify-center gap-1 sm:w-auto sm:justify-start">
      {showFirstLastButtons && (
        <Button
          variant="outline"
          size={btnSize}
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          aria-label="First page"
        >
          <ChevronsLeftIcon className="size-4" aria-hidden />
        </Button>
      )}
      <Button
        variant="outline"
        size={btnSize}
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="size-4" aria-hidden />
      </Button>

      <ol className="flex items-center gap-1">
        {getPageNumbers().map((item, i) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${i}`} aria-hidden>
              <span
                className={cn(
                  "flex items-center justify-center text-muted-foreground",
                  sizeClasses[size]
                )}
              >
                …
              </span>
            </li>
          ) : (
            <li key={item}>
              <Button
                variant={page === item ? "default" : "outline"}
                size={btnSize}
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={page === item ? "page" : undefined}
                className={cn(
                  sizeClasses[size],
                  page === item && "pointer-events-none"
                )}
              >
                {item}
              </Button>
            </li>
          )
        )}
      </ol>

      <Button
        variant="outline"
        size={btnSize}
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
      >
        <ChevronRightIcon className="size-4" aria-hidden />
      </Button>
      {showFirstLastButtons && (
        <Button
          variant="outline"
          size={btnSize}
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          aria-label="Last page"
        >
          <ChevronsRightIcon className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );

  const pageSizeSelect = showPageSize && onPageSizeChange && (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Per page</span>
      <Select
        value={String(pageSize)}
        onValueChange={(v) => onPageSizeChange(parseInt(v, 10))}
      >
        <SelectTrigger className="h-9 w-[4.75rem]" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
          {!pageSizeOptions.includes(pageSize) && (
            <SelectItem value={String(pageSize)}>{pageSize}</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  const summaryText = showSummary && (
    <p className="text-sm text-muted-foreground">
      {totalItems === 0 ? (
        <>No {itemLabel}</>
      ) : (
        <>
          Showing {startItem}–{endItem} of {totalItems.toLocaleString()}{" "}
          {itemLabel}
        </>
      )}
    </p>
  );

  const jumpTo = showJumpToControl && (
    <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
      <label htmlFor="pagination-jump" className="sr-only">
        Jump to page
      </label>
      <Input
        id="pagination-jump"
        ref={jumpInputRef}
        type="number"
        min={1}
        max={totalPages}
        placeholder="Page"
        value={jumpValue}
        onChange={(e) => setJumpValue(e.target.value)}
        className="h-9 w-20 text-center"
        aria-label="Jump to page number"
      />
      <Button type="submit" variant="secondary" size="sm">
        Go
      </Button>
    </form>
  );

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:gap-6",
        variant === "centered" && "sm:justify-between",
        className
      )}
    >
      {variant === "compact" ? (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
          {summaryText}
          {navButtons}
        </div>
      ) : variant === "centered" ? (
        <>
          <div className="order-2 sm:order-1">{summaryText}</div>
          <div className="order-1 flex flex-col gap-3 sm:order-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
            {navButtons}
            {jumpTo}
          </div>
          <div className="order-3">{pageSizeSelect}</div>
        </>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            {summaryText}
            {pageSizeSelect}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {navButtons}
            {jumpTo}
          </div>
        </div>
      )}
    </nav>
  );
}
