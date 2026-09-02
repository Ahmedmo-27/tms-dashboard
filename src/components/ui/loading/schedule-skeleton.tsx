import { Skeleton } from "../skeleton";

export function ScheduleSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-w-0 flex-col-reverse gap-4 overflow-y-auto overflow-x-hidden p-3 md:flex-row">
      {/* Left side: Scheduled classes container */}
      <div className="h-full min-w-0 flex-[2] space-y-4">
        {/* Top Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 sm:h-7 w-48 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>

        {/* Schedule Table View */}
        <div className="rounded-md border overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-24 rounded hidden sm:block" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-8 w-8 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Calendar & Filters */}
      <div className="flex min-w-0 max-w-[350px] flex-1 shrink-0 flex-col gap-3 md:min-w-[240px] lg:min-w-[280px]">
        {/* Month Calendar box */}
        <div className="rounded-md border bg-card p-3 space-y-3">
          <div className="flex items-center justify-between px-2">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="flex gap-1">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-7 mx-auto rounded" />
            ))}
          </div>
        </div>

        {/* Location Dropdown */}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
