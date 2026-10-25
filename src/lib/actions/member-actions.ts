"use server";
import { revalidatePath } from "next/cache";
import {
  PreviousSessionDateInput,
  editMemberPackage,
  adjustMemberPackage,
  recordMemberPreviousSessions,
  subscribeGuestToPackage,
  subscribeMemberToPackage,
  unsubscribeMemberFromPackage,
  updateMember,
} from "../data/member";
import { addMember as addMemberRequest } from "../data/users";
import { parseStateError } from "../utils/state-errors";
import { bookClass, bookDropIn, cancelBooking } from "../data/bookings";
import { nonUserDataSchema, editMemberSchema, addNonMemberPackageSchema } from "../schemas/newUserSchema";
import { bookClassSchema } from "../schemas/bookClassSchema";
import { getAuthenticatedUser } from "../data/auth";
import { canOverrideBookingTimeRestrictions } from "../config/roles";

export const acceptMemberAction = async (uid: string) => {
  try {
    if (!uid?.trim()) {
      return {
        success: false,
        errors: { message: "Member id is required" },
        data: null,
      };
    }

    const response = await addMemberRequest(uid);
    revalidatePath("/dashboard/member-requests");
    revalidatePath("/dashboard/our-members");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const adjustClassesAction = async (_prevState: any, formData: FormData) => {
  try {
    const uid = formData.get("uid") as string;
    const pkgId = formData.get("pkgId") as string;
    const pkgStartDate = formData.get("pkgStartDate") as string;
    const amount = Number(formData.get("amount"));
    const type = formData.get("type") as "ADD" | "DEDUCT";
    const reason = (formData.get("reason") as string)?.trim();
    let sessionDate = (formData.get("sessionDate") as string)?.trim() || undefined;
    if (sessionDate && /^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      const [y, m, d] = sessionDate.split("-").map(Number);
      const now = new Date();
      sessionDate = new Date(
        y,
        m - 1,
        d,
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      ).toISOString();
    }

    if (!reason) {
      return { success: false, errors: { message: "A reason is required" }, data: null };
    }

    const response = await adjustMemberPackage(uid, pkgId, pkgStartDate, amount, type, reason, sessionDate);

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");

    return { success: true, errors: null, data: response };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const changePkgEndDate = async (_prevState: any, formData: FormData) => {
  try {
    const uid = formData.get("uid") as string;
    const pkgId = formData.get("pkgId") as string;
    const pkgStartDate = formData.get("pkgStartDate") as string;
    const date = formData.get("date") as string;
    console.log(pkgStartDate);

    const response = await editMemberPackage(uid, pkgId, pkgStartDate, date);

    // Revalidate the member's page and the members list
    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const subscribeGuestPackageAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const rawNationalId = (formData.get("nationalId") as string) || "";
    const cleanNationalId = rawNationalId.trim().replace(/[\s\-]/g, "");
    const pkgId = formData.get("pkgId") as string;
    const startDate = formData.get("startDate") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const paymentDate = formData.get("paymentDate") as string;
    const amount = formData.get("amount") as string;
    const priceChanged = (formData.get("priceChanged") as string) === "true";
    const pendingDeduction =
      (formData.get("pendingDeduction") as string) === "true";
    const locationId = (formData.get("locationId") as string) || undefined;

    console.log(formData);

    addNonMemberPackageSchema.parse({
      name,
      phoneNumber,
      nationalId: cleanNationalId,
    });

    const response = await subscribeGuestToPackage(
      name,
      phoneNumber,
      pkgId,
      startDate,
      paymentMethod,
      pendingDeduction,
      paymentDate === "" ? undefined : paymentDate,
      priceChanged ? amount : undefined,
      locationId,
      cleanNationalId,
    );

    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/member-requests");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (e) {
    return parseStateError(e as Error);
  }
};

export const subscribePackageAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const uid = formData.get("uid") as string;
    const pkgId = formData.get("pkgId") as string;
    const startDate = formData.get("startDate") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const paymentDate = formData.get("paymentDate") as string;
    const amount = formData.get("amount") as string;
    const locationId = (formData.get("locationId") as string) || undefined;
    const priceChanged = (formData.get("priceChanged") as string) === "true";
    const pendingDeduction =
      (formData.get("pendingDeduction") as string) === "true";
    const rawPreviousDates = formData.get("previousSessionDates") as string;

    let previousSessionDates: PreviousSessionDateInput[] | undefined = undefined;
    if (rawPreviousDates) {
      try {
        const parsed = JSON.parse(rawPreviousDates);
        if (Array.isArray(parsed)) previousSessionDates = parsed;
      } catch {
        previousSessionDates = rawPreviousDates
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    // Optional at the point of sale — the sales dashboard can set it later.
    const soldBy = (formData.get("soldBy") as string) || undefined;

    const response = await subscribeMemberToPackage(
      uid,
      pkgId,
      startDate,
      paymentMethod,
      paymentDate === "" ? undefined : paymentDate,
      priceChanged ? amount : undefined,
      locationId,
      pendingDeduction,
      previousSessionDates,
      soldBy,
    );

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const recordPreviousSessionsAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const uid = formData.get("uid") as string;
    const pkgId = formData.get("pkgId") as string;
    const pkgStartDate = formData.get("pkgStartDate") as string;
    const rawDates = formData.get("previousSessionDates") as string;
    const reason = (formData.get("reason") as string)?.trim() || undefined;

    if (!uid || !pkgId || !pkgStartDate) {
      return {
        success: false,
        errors: { message: "Member, package, and start date are required" },
        data: null,
      };
    }

    let dates: PreviousSessionDateInput[] = [];
    if (rawDates) {
      try {
        const parsed = JSON.parse(rawDates);
        if (Array.isArray(parsed)) dates = parsed;
      } catch {
        dates = rawDates.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    if (dates.length === 0) {
      return {
        success: false,
        errors: { message: "At least one previous session date is required" },
        data: null,
      };
    }

    const response = await recordMemberPreviousSessions(
      uid,
      pkgId,
      pkgStartDate,
      dates,
      reason
    );

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const unsubscribePackageAction = async (
  uid: string,
  pkgId: string,
  pkgStartDate: string
) => {
  try {
    const response = await unsubscribeMemberFromPackage(
      uid,
      pkgId,
      pkgStartDate
    );

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const bookClassAction = async (_prevState: any, formData: FormData) => {
  try {
    const uid = formData.get("uid") as string;
    const clsId = formData.get("clsId") as string;
    const overrideTimeRestrictions =
      formData.get("overrideTimeRestrictions") === "true";

    bookClassSchema.parse({
      uid,
      clsId,
      overrideTimeRestrictions: String(overrideTimeRestrictions),
    });

    const authUser = await getAuthenticatedUser();
    const canOverride = canOverrideBookingTimeRestrictions(authUser?.role);
    const shouldOverrideTime = overrideTimeRestrictions && canOverride;

    const response = await bookClass(uid, clsId, {
      overrideTimeRestrictions: shouldOverrideTime,
    });

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/schedule");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const bookDropInAction = async (_prevState: any, formData: FormData) => {
  try {
    const uid = formData.get("uid") as string;
    const clsId = formData.get("clsId") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const locationId = (formData.get("locationId") as string) || undefined;
    const response = await bookDropIn(uid, clsId, paymentMethod, locationId);

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const cancelBookingAction = async (uid: string, scid: string) => {
  try {
    const response = await cancelBooking(uid, scid);

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/schedule");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error);
  }
};

export const editMemberAction = async (_prevState: any, formData: FormData) => {
  try {
    const uid = formData.get("uid") as string;
    if (!uid?.trim()) {
      return {
        success: false,
        errors: { message: "Member ID is required" },
        data: null,
      };
    }

    const rawNationalId = (formData.get("nationalId") as string) || "";
    const cleanNationalId = rawNationalId.trim().replace(/[\s\-]/g, "");
    const name = (formData.get("name") as string)?.trim();
    const phoneNumber = (formData.get("phoneNumber") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();

    const validated = editMemberSchema.parse({
      name,
      phoneNumber,
      email: email || undefined,
      nationalId: cleanNationalId,
    });

    const payload: {
      name: string;
      phoneNumber: string;
      email?: string;
      nationalId?: string;
    } = {
      name: validated.name,
      phoneNumber: validated.phoneNumber,
      nationalId: validated.nationalId || "",
    };
    if (validated.email) {
      payload.email = validated.email;
    }

    const response = await updateMember(uid, payload);

    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};
