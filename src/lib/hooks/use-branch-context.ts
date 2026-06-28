"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import {
  canActAsBranchAdmin,
  isBranchScopedPage,
  isManagementRole,
} from "@/lib/config/roles";

export function useBranchContext() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role as string | undefined;
  const userLocationId = (user as { locationId?: string } | null)?.locationId;
  const selectedLocationId = searchParams.get("locationId");

  const isManagement = isManagementRole(role);
  const branchScopedPage = isBranchScopedPage(pathname);

  return {
    role,
    selectedLocationId,
    userLocationId,
    isManagement,
    isBranchScopedPage: branchScopedPage,
    isViewingAllBranches:
      isManagement && branchScopedPage && !selectedLocationId,
    canActAsBranchAdmin: canActAsBranchAdmin(
      role,
      selectedLocationId,
      userLocationId
    ),
    effectiveLocationId:
      selectedLocationId ?? userLocationId ?? undefined,
  };
}
