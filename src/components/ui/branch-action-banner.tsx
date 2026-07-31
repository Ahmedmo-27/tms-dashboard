"use client";

import { useBranchContext } from "@/lib/hooks/use-branch-context";

export function BranchActionBanner() {
  const { isManagement, isBranchScopedPage, isViewingAllBranches } =
    useBranchContext();

  if (!isManagement || !isBranchScopedPage || !isViewingAllBranches) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground">
      Showing data from all branches.
    </p>
  );
}
