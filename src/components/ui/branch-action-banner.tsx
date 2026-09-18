"use client";

import { useBranchContext } from "@/lib/hooks/use-branch-context";

export function BranchActionBanner() {
  const { isManagement, isBranchScopedPage, isViewingAllBranches } =
    useBranchContext();

  if (!isManagement || !isBranchScopedPage || !isViewingAllBranches) {
    return null;
  }

  return (
    <p className="hidden xl:inline text-xs text-muted-foreground whitespace-nowrap">
      Showing data from all branches.
    </p>
  );
}
