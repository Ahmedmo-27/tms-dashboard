import { Skeleton } from "../skeleton";
import { Card, CardContent, CardHeader } from "../card";

export function ScansSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <Skeleton className="h-7 w-24 sm:w-28 rounded" />
            <Skeleton className="h-4 w-48 sm:w-60 rounded mt-1.5" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        {/* Date picker & Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-36 sm:w-44 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* 2-Column Attendance Cards (PT & Open Gym) */}
      <div className="grid grid-cols-1 md:grid-cols-2 justify-center gap-4">
        {/* Personal Training Card */}
        <Card className="w-full">
          <CardHeader className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Skeleton className="h-6 w-36 rounded" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[220px] rounded-md border m-2 p-2 divide-y divide-border/40 overflow-hidden">
              <div className="flex justify-between pb-2 text-xs text-muted-foreground">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Open Gym Card */}
        <Card className="w-full">
          <CardHeader className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Skeleton className="h-6 w-28 rounded" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[220px] rounded-md border m-2 p-2 divide-y divide-border/40 overflow-hidden">
              <div className="flex justify-between pb-2 text-xs text-muted-foreground">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming classes section */}
      <div className="flex flex-row items-end justify-between border-b pb-3 pt-2">
        <div>
          <Skeleton className="h-6 w-44 rounded" />
          <Skeleton className="h-3 w-28 rounded mt-1.5" />
        </div>
      </div>

      {/* Upcoming class card skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-32 rounded" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[180px] rounded-md border m-2 p-2 divide-y divide-border/40 overflow-hidden">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between py-2.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
