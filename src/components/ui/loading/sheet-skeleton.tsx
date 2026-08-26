import { Skeleton } from "../skeleton";
import { Separator } from "../separator";

export function SheetSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-md shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-3.5 w-40 rounded" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-9 w-[12.5rem] rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      <Separator />

      {/* Sheet Panes Grid */}
      <div className="relative min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/20 p-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Classes Pane */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="bg-muted/40 p-3 border-b flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <div className="divide-y divide-border/40">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5">
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-8 flex-1 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                  <Skeleton className="h-8 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Space / PT Pane */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="bg-muted/40 p-3 border-b flex items-center justify-between">
              <Skeleton className="h-5 w-28 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <div className="divide-y divide-border/40">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5">
                  <Skeleton className="h-4 w-8 rounded" />
                  <Skeleton className="h-8 flex-1 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                  <Skeleton className="h-8 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
