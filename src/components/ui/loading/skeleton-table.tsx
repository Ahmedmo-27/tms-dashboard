import { Skeleton } from "../skeleton";
import { cn } from "@/lib/utils";

interface SkeletonTableProps {
  columns?: number;
  rows?: number;
  showSearch?: boolean;
  showPagination?: boolean;
  showActions?: boolean;
  className?: string;
}

export function SkeletonTable({
  columns = 5,
  rows = 7,
  showSearch = true,
  showPagination = true,
  showActions = true,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn("space-y-4 w-full", className)}>
      {/* Search & Actions Bar */}
      {(showSearch || showActions) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {showSearch && (
            <div className="flex-1 max-w-sm">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          )}
          {showActions && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-md border border-border/60 overflow-hidden bg-card/40">
        {/* Table Header */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border/60 bg-muted/30">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-4 rounded",
                i === 0 ? "w-28 sm:w-36" : "w-16 sm:w-24",
                i >= 3 && "hidden sm:block"
              )}
            />
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/40">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-center justify-between gap-4 p-4 hover:bg-muted/10 transition-colors"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={cn(
                    "flex items-center gap-2",
                    colIndex >= 3 && "hidden sm:flex"
                  )}
                >
                  {colIndex === 0 && (
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  )}
                  <Skeleton
                    className={cn(
                      "h-4 rounded",
                      colIndex === 0
                        ? "w-24 sm:w-32"
                        : colIndex === 1
                        ? "w-20 sm:w-28"
                        : "w-16 sm:w-20"
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Bar */}
      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Skeleton className="h-4 w-40 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
