"use client";

import { usePathname } from "next/navigation";
import { BranchLocationFilter } from "@/components/ui/branch-location-filter";
import { BranchActionBanner } from "@/components/ui/branch-action-banner";
import { useLocations } from "@/lib/hooks/use-locations";
import {
  isBranchScopedPage,
  isManagementRole,
} from "@/lib/config/roles";
import { useAppSelector } from "@/lib/hooks";

export function DashboardBranchBar() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role as string | undefined;

  const showBar =
    isManagementRole(role) && isBranchScopedPage(pathname);

  const { locations } = useLocations(showBar);

  if (!showBar) return null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <BranchActionBanner />
      <BranchLocationFilter
        locations={locations}
        className="h-8 w-[180px]"
      />
    </div>
  );
}
