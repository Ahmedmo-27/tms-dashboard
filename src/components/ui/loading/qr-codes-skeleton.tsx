import { Skeleton } from "../skeleton";

export function QrCodesSkeleton() {
  return (
    <div className="p-6 space-y-8">
      {/* Static QR Codes Section */}
      <div>
        <Skeleton className="h-6 w-36 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card p-6 flex flex-col items-center space-y-4 text-center"
            >
              <Skeleton className="h-44 w-44 rounded-lg" />
              <div className="space-y-1.5 w-full">
                <Skeleton className="h-5 w-3/4 mx-auto rounded" />
                <Skeleton className="h-3.5 w-1/2 mx-auto rounded" />
              </div>
              <Skeleton className="h-9 w-full rounded-md mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Today's Classes Section */}
      <div>
        <Skeleton className="h-6 w-44 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card p-6 flex flex-col items-center space-y-4 text-center"
            >
              <Skeleton className="h-44 w-44 rounded-lg" />
              <div className="space-y-1.5 w-full">
                <Skeleton className="h-5 w-3/4 mx-auto rounded" />
                <Skeleton className="h-3.5 w-1/2 mx-auto rounded" />
              </div>
              <Skeleton className="h-9 w-full rounded-md mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
