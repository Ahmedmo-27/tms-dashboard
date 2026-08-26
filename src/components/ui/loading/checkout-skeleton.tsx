import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../card";

export function CheckoutSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 sm:h-9 w-32 rounded" />
          <Skeleton className="h-4 w-60 rounded" />
        </div>
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Input & Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Products Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <Skeleton className="h-5 w-28 rounded" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Skeleton className="h-11 flex-1 rounded-md" />
                <Skeleton className="h-11 w-24 rounded-md" />
              </div>
              <Skeleton className="h-3.5 w-72 rounded" />
            </CardContent>
          </Card>

          {/* Cart Table Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <Skeleton className="h-5 w-32 rounded" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-10 rounded" />
                </div>
                <div className="divide-y divide-border/40">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-7 w-20 rounded-md" />
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

        {/* Right side: Summary Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-5 w-32 rounded" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
