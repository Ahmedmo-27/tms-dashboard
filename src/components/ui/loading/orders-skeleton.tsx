import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardContent } from "../card";
import { Separator } from "../separator";

export function OrdersSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-8 p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-7 w-28 rounded" />
            <Skeleton className="h-4 w-44 rounded" />
          </div>
        </div>
      </div>

      <Separator />

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-7 w-20 rounded" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Skeleton className="h-10 w-full md:w-[200px] rounded-md" />
              <Skeleton className="h-10 w-full md:w-[250px] rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-28 rounded hidden sm:block" />
              <Skeleton className="h-4 w-20 rounded hidden md:block" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="divide-y divide-border/40">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                  <Skeleton className="h-4 w-20 rounded hidden md:block" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-8 w-8 rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
