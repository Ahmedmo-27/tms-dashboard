"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BranchLocationFilter } from "@/components/ui/branch-location-filter";
import { BranchActionBanner } from "@/components/ui/branch-action-banner";
import { getLocations, type Location } from "@/lib/data/locations";
import {
  isBranchScopedPage,
  isManagementRole,
} from "@/lib/config/roles";
import { useAppSelector } from "@/lib/hooks";

export function DashboardBranchBar() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role as string | undefined;
  const [locations, setLocations] = useState<Location[]>([]);

  const showBar =
    isManagementRole(role) && isBranchScopedPage(pathname);

  useEffect(() => {
    if (!showBar) return;
    getLocations()
      .then(setLocations)
      .catch(() => setLocations([]));
  }, [showBar]);

  if (!showBar) return null;

  return (
    <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Management: select a branch to use the same abilities as a branch admin.
        </p>
        <BranchLocationFilter locations={locations} requireSelection />
      </div>
      <BranchActionBanner />
    </div>
  );
}
