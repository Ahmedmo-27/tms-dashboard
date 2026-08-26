import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardContent } from "../card";
import { Separator } from "../separator";

export function PaymentsSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-6 sm:h-7 w-28 sm:w-32 rounded" />
            <Skeleton className="h-3 sm:h-4 w-48 sm:w-60 rounded" />
          </div>
        </div>
      </div>

      <Separator />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-1 min-w-0 space-y-1">
                  <Skeleton className="h-3 sm:h-4 w-24 rounded" />
                  <Skeleton className="h-6 sm:h-7 w-20 rounded" />
                </div>
                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payments Table Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-6 w-44 rounded" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>

            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Skeleton className="h-9 w-full sm:w-[200px] rounded-md" />
              <Skeleton className="h-9 w-full sm:min-w-[180px] sm:flex-1 sm:max-w-[240px] rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-24 rounded hidden sm:block" />
              <Skeleton className="h-4 w-16 rounded hidden md:block" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <div className="divide-y divide-border/40">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <Skeleton className="h-4 w-16 rounded font-mono" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                  <Skeleton className="h-5 w-16 rounded-full hidden md:block" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
