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
    <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2" data-walkthrough="branch-bar">
      <BranchActionBanner />
      <div data-walkthrough="branch-select-dropdown" className="shrink-0">
        <BranchLocationFilter
          locations={locations}
          className="h-8 w-[105px] sm:w-[135px] md:w-[165px]"
        />
      </div>
    </div>
  );
}
