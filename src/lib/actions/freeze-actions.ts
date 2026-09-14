"use server";

import { revalidatePath } from "next/cache";
import {
  approveFreezeRequest,
  rejectFreezeRequest,
  adminFreezePackage,
  adminUnfreezePackage,
} from "../data/freeze";
import { parseStateError } from "../utils/state-errors";
import { ApiError } from "@/core/api-error";

export async function approveFreezeAction(
  requestId: string,
  approvedDurationDays?: number,
  adminNote?: string
) {
  try {
    const response = await approveFreezeRequest(
      requestId,
      approvedDurationDays,
      adminNote
    );
    revalidatePath("/dashboard/member-requests");
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/package-freezes");
    return { success: true, errors: null, data: response };
  } catch (error) {
    return parseStateError(error as Error);
  }
}

export async function rejectFreezeAction(
  requestId: string,
  rejectionReason?: string
) {
  try {
    const response = await rejectFreezeRequest(requestId, rejectionReason);
    revalidatePath("/dashboard/member-requests");
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/package-freezes");
    return { success: true, errors: null, data: response };
  } catch (error) {
    return parseStateError(error as Error);
  }
}

export async function adminFreezePackageAction(
  _prevState: unknown,
  formData: FormData
) {
  try {
    const uid = formData.get("uid") as string;
    const pkgId = formData.get("pkgId") as string;
    const pkgStartDate = formData.get("pkgStartDate") as string;
    const durationDays = Number(formData.get("durationDays"));
    const reason = (formData.get("reason") as string)?.trim();

    if (!durationDays || durationDays < 1) {
      return {
        success: false,
        errors: { message: "Duration must be at least 1 day" },
        data: null,
      };
    }

    const response = await adminFreezePackage(
      uid,
      pkgId,
      pkgStartDate,
      durationDays,
      reason
    );

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/member-requests");
    revalidatePath("/dashboard/package-freezes");

    return { success: true, errors: null, data: response };
  } catch (error) {
    return parseStateError(error as Error);
  }
}

export async function adminUnfreezePackageAction(
  uid: string,
  pkgId: string,
  pkgStartDate: string
) {
  try {
    const response = await adminUnfreezePackage(uid, pkgId, pkgStartDate);

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/member-requests");
    revalidatePath("/dashboard/package-freezes");

    return { success: true, errors: null, data: response };
  } catch (error) {
    return parseStateError(error as Error);
  }
}
