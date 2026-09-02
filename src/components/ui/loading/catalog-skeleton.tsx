import { Skeleton } from "../skeleton";
import { Card, CardContent, CardHeader } from "../card";
import { Separator } from "../separator";

export function CatalogSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
      {/* Tabs List */}
      <div className="mb-2 w-full sm:w-auto flex items-center gap-1">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-7 w-28 rounded" />
              <Skeleton className="h-4 w-60 rounded" />
            </div>
          </div>
          <Skeleton className="h-10 w-full md:w-32 rounded-md shrink-0" />
        </div>

        <Separator />

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="py-0">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-6 w-12 rounded" />
                  </div>
                  <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Container Card */}
        <Card className="min-w-0">
          <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <Skeleton className="h-10 w-full sm:max-w-xs rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0">
            <div className="rounded-md border overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-20 rounded hidden sm:block" />
                <Skeleton className="h-4 w-16 rounded hidden md:block" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              {/* Rows */}
              <div className="divide-y divide-border/40">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
                    <Skeleton className="h-4 w-12 rounded hidden md:block" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
