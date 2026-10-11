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
  status?: "SUCCESS" | "FAILED" | "WILL_PAY";
  /** Guest rows (open gym or class walk-in). */
  guestName?: string;
  guestPhone?: string;
  /** Move this scan to a new scheduled class. */
  targetScid?: string;
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
 * Moves a check-in to a new scheduled class (e.g. if the member scanned a false QR code).
 * Returns the session from the false class and charges/records it in the target class.
 */
export const moveScanToClass = async (
  ref: ScanRowRef,
  targetScid: string,
  options?: {
    uid?: string;
    pkgId?: string;
    time?: string;
    status?: "SUCCESS" | "FAILED" | "WILL_PAY";
  },
) => {
  try {
    const response = await tms.post(`${path(ref)}/move-class`, {
      targetScid,
      ...options,
    });
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
