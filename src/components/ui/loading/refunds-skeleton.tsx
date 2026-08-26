import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { Separator } from "../separator";

export function RefundsSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-6 sm:h-7 w-28 sm:w-36 rounded" />
            <Skeleton className="h-3.5 sm:h-4 w-60 rounded" />
          </div>
        </div>
      </div>

      <Separator />

      {/* 2 Forms Grid (Member Refund & Cash Out) */}
      <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
        {/* Member Refund Form Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-36 rounded" />
            </CardTitle>
            <Skeleton className="h-3.5 w-64 rounded mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-md pt-2" />
          </CardContent>
        </Card>

        {/* Cash Out Form Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-24 rounded" />
            </CardTitle>
            <Skeleton className="h-3.5 w-60 rounded mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-md pt-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
