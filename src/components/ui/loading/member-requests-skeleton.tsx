import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { Separator } from "../separator";

export function MemberRequestsSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-6 sm:h-7 w-64 sm:w-80 rounded" />
            <Skeleton className="h-3.5 sm:h-4 w-72 sm:w-96 rounded" />
          </div>
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-md" />
      </div>

      <Separator className="hidden sm:block" />

      <div className="flex-1 space-y-10">
        {/* Pending Members Card */}
        <Card className="w-full">
          <CardHeader className="pb-0 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-md shrink-0" />
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-lg sm:text-xl">
                    <Skeleton className="h-6 w-36 rounded" />
                  </CardTitle>
                  <Skeleton className="h-3.5 w-60 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-10 flex-1 sm:max-w-md rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                <Skeleton className="h-4 w-28 rounded hidden md:block" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <div className="divide-y divide-border/40">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                    <Skeleton className="h-4 w-28 rounded hidden md:block" />
                    <Skeleton className="h-5 w-32 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Packages Card */}
        <Card className="w-full">
          <CardHeader className="pb-0 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg sm:text-xl">
                  <Skeleton className="h-6 w-48 rounded" />
                </CardTitle>
                <Skeleton className="h-3.5 w-72 rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 space-y-4">
            <Skeleton className="h-10 w-full sm:max-w-md rounded-md" />
            <div className="rounded-md border overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <div className="divide-y divide-border/40">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
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
