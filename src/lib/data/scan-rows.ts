"use server";

import { tms } from "../tms-api";
import type { ScanSource } from "@/components/ui/scans/class-container";

export interface ScanRowRef {
  source: ScanSource;
  parentId: string;
  rowId: string;
}

export interface ScanRowChanges {
  /** Reassign the check-in to this member. */
  uid?: string;
  /** Charge the visit to this package instead. */
  pkgId?: string;
  time?: string;
  status?: "SUCCESS" | "FAILED";
  /** Open gym guest rows only. */
  guestName?: string;
  guestPhone?: string;
}

function path({ source, parentId, rowId }: ScanRowRef): string {
  return `/admin/scans/${source}/${parentId}/${rowId}`;
}

export const updateScanRow = async (
  ref: ScanRowRef,
  changes: ScanRowChanges,
) => {
  try {
    const response = await tms.patch(path(ref), changes);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * Removes a check-in. By default the session it consumed goes back to the
 * member's package; pass restoreSession false to drop the row only.
 */
export const deleteScanRow = async (
  ref: ScanRowRef,
  restoreSession = true,
) => {
  try {
    const response = await tms.delete(path(ref), {
      params: { restoreSession: restoreSession ? "true" : "false" },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
