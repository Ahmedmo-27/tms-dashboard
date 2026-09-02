import { Skeleton } from "../skeleton";
import { cn } from "@/lib/utils";

interface StatCardsSkeletonProps {
  count?: number;
  className?: string;
}

export function StatCardsSkeleton({
  count = 4,
  className,
}: StatCardsSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

interface GridCardsSkeletonProps {
  count?: number;
  columnsClass?: string;
  className?: string;
}

export function GridCardsSkeleton({
  count = 6,
  columnsClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  className,
}: GridCardsSkeletonProps) {
  return (
    <div className={cn("grid gap-4", columnsClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
