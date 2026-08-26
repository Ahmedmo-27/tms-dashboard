import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../card";

export function MailingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl">
            <Skeleton className="h-8 w-44 rounded" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72 rounded mt-1" />
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {/* Send Mode Select */}
          <div className="px-6 mb-6 space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-3.5 w-60 rounded" />
          </div>

          {/* Form */}
          <div className="space-y-5 bg-card border rounded-none sm:rounded-lg sm:mx-6 p-4 sm:p-6 shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-[220px] w-full rounded-md" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            <div className="pt-4 flex justify-end">
              <Skeleton className="h-11 w-36 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
