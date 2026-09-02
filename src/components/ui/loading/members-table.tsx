
import { Skeleton } from "../skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 w-full">
      <div className="rounded-md border border-border/60 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/30">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-28 rounded hidden sm:block" />
          <Skeleton className="h-4 w-24 rounded hidden md:block" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>

        {/* Table rows */}
        <div className="divide-y divide-border/40">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 gap-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <Skeleton className="h-4 w-28 rounded hidden sm:block" />
              <Skeleton className="h-4 w-24 rounded hidden md:block" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-8 w-8 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
