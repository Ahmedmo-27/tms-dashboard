import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardContent } from "../card";

export function ProductsSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-8 p-8">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <Skeleton className="h-6 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-10 w-full md:w-[250px] rounded-md" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-20 rounded hidden sm:block" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <div className="divide-y divide-border/40">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20 rounded hidden sm:block" />
                    <Skeleton className="h-4 w-16 rounded" />
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
