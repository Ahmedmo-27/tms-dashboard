"use client";

import { AlertCircle } from "lucide-react";
import { useBranchContext } from "@/lib/hooks/use-branch-context";

export function BranchActionBanner() {
  const { isManagement, isBranchScopedPage, canActAsBranchAdmin } =
    useBranchContext();

  if (!isManagement || !isBranchScopedPage || canActAsBranchAdmin) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Select a branch above to schedule classes, record payments, manage orders,
        and perform other branch operations. You can still browse all branches without
        a selection; branch-specific writes require a selected branch.
      </span>
    </div>
  );
}
