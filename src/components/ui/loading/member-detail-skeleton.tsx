import { Skeleton } from "../skeleton";

export function MemberDetailSkeleton() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-7 w-44 sm:w-56 rounded" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Tabs Header */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        {/* Packages Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-36 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
