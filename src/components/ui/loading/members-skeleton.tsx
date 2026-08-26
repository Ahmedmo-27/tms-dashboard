import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../card";

export function MembersSkeleton({ title = "Members" }: { title?: string }) {
  return (
    <div className="flex min-h-full flex-col p-4 sm:p-6 w-full">
      <Card className="w-full">
        <CardHeader className="pb-0 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-md shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-lg sm:text-xl">
                  <Skeleton className="h-6 w-28 rounded" />
                </CardTitle>
                <Skeleton className="h-3.5 w-44 rounded" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Skeleton className="h-10 flex-1 lg:max-w-md rounded-md" />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-36 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-24 rounded hidden sm:block" />
              <Skeleton className="h-4 w-28 rounded hidden md:block" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="divide-y divide-border/40">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded sm:hidden" />
                  </div>
                  <Skeleton className="h-4 w-28 rounded hidden sm:block" />
                  <Skeleton className="h-4 w-36 rounded hidden md:block" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            <Skeleton className="h-4 w-36 rounded" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
