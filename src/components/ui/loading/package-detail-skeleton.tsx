import { Skeleton } from "../skeleton";
import { MembersSkeleton } from "./members-skeleton";

export function PackageDetailSkeleton() {
  return (
    <div className="flex min-h-full flex-col p-4 sm:p-6 gap-4 sm:gap-6">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>

      <MembersSkeleton />
    </div>
  );
}
