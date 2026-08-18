"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  pageIndex: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
  className?: string;
}

function pageItems(pageIndex: number, pageCount: number): (number | "ellipsis")[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }

  const items: (number | "ellipsis")[] = [0];
  const start = Math.max(1, pageIndex - 1);
  const end = Math.min(pageCount - 2, pageIndex + 1);

  if (start > 1) items.push("ellipsis");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < pageCount - 2) items.push("ellipsis");
  items.push(pageCount - 1);

  return items;
}

export function TablePagination({
  pageIndex,
  pageCount,
  total,
  pageSize,
  onPageChange,
  className,
}: TablePaginationProps) {
  if (pageCount <= 1) return null;

  const start = pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3",
        className
      )}
    >
      <p className="text-[11px] sm:text-xs text-muted-foreground text-center sm:text-left">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center justify-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        {pageItems(pageIndex, pageCount).map((item, i) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === pageIndex ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0 text-xs"
              onClick={() => onPageChange(item)}
            >
              {item + 1}
            </Button>
          )
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          disabled={pageIndex >= pageCount - 1}
          onClick={() => onPageChange(pageIndex + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export const CATALOG_PAGE_SIZE = 10;
