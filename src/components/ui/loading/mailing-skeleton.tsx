import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../card";

export function MailingSkeleton() {
  return (
    <Card className="border shadow-xs rounded-xl overflow-hidden bg-card">
      <CardHeader className="p-4 sm:p-6 pb-4 border-b bg-muted/15">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded mt-1.5" />
          </div>
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Audience 4-card Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3.5 rounded-xl border space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-full rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Recipients input */}
        <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Subject input */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
        </div>

        {/* Message Editor */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-7 w-32 rounded-lg" />
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Skeleton className="h-9 w-full rounded-none" />
            <Skeleton className="h-56 w-full rounded-none" />
          </div>
        </div>

        {/* Attachment dropzone */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        {/* Action bar */}
        <div className="pt-4 border-t flex justify-between items-center">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

