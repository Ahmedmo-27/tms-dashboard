"use client";

import { useBranchContext } from "@/lib/hooks/use-branch-context";

export function BranchActionBanner() {
  const { canViewAllBranches, isBranchScopedPage, isViewingAllBranches } =
    useBranchContext();

  if (!canViewAllBranches || !isBranchScopedPage || !isViewingAllBranches) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground">
      Showing data from all branches.
    </p>
  );
}
