import { Skeleton } from "../skeleton";
import { StatCardsSkeleton } from "./skeleton-cards";
import { SkeletonTable } from "./skeleton-table";

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <div className="h-px bg-border/60 w-full" />

      {/* Metric Cards */}
      <StatCardsSkeleton count={4} />

      {/* Main Table Card */}
      <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 space-y-6">
        <SkeletonTable columns={6} rows={7} showSearch showPagination />
      </div>
    </div>
  );
}
