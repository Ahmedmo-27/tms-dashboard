
import { Skeleton } from "../skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {/* Table header */}
          <div className="flex items-center justify-between pb-2 border-b">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-24" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
