"use client";

import { useEffect, useState } from "react";
import { useBranchContext } from "./use-branch-context";

/**
 * Resolves branch for management write actions in modals.
 * branch_admin: uses assigned user.locationId (via effectiveLocationId).
 * management with URL filter: uses ?locationId= from the page.
 * management viewing all branches: must pick a branch in the modal.
 */
export function useManagementBranchSelection() {
  const { effectiveLocationId, isManagement } = useBranchContext();
  const [modalLocationId, setModalLocationId] = useState("");

  useEffect(() => {
    if (effectiveLocationId) {
      setModalLocationId(effectiveLocationId);
    }
  }, [effectiveLocationId]);

  const needsBranchSelection = isManagement && !effectiveLocationId;
  const locationId = effectiveLocationId ?? modalLocationId;
  const hasLocationId = Boolean(locationId);

  const resetModalBranch = () => {
    setModalLocationId(effectiveLocationId ?? "");
  };

  return {
    locationId,
    modalLocationId,
    setModalLocationId,
    needsBranchSelection,
    hasLocationId,
    effectiveLocationId,
    resetModalBranch,
  };
}
