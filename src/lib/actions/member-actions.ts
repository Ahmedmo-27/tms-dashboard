"use server";
import { revalidatePath } from "next/cache";
import {
  editMemberPackage,
  adjustMemberPackage,
  subscribeGuestToPackage,
  subscribeMemberToPackage,
  unsubscribeMemberFromPackage,
} from "../data/member";
import { addMember as addMemberRequest } from "../data/users";
import { parseStateError } from "../utils/state-errors";
import { bookClass, bookDropIn, cancelBooking } from "../data/bookings";
import { nonUserDataSchema } from "../schemas/newUserSchema";
import { bookClassSchema } from "../schemas/bookClassSchema";
import { getMembers } from "../data/member";
import { getPackages } from "../data/package";
import { getNextScheduledClasses, getScheduledClasses } from "../data/schedule";
import { getBookingEligibility } from "../utils/booking-eligibility";
import { ApiError } from "@/core/api-error";
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
    if (error instanceof ApiError) {
      return {
        success: false,
        errors: error,
        data: null,
      };
    }
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

    if (!reason) {
      return { success: false, errors: { message: "A reason is required" }, data: null };
    }

    const response = await adjustMemberPackage(uid, pkgId, pkgStartDate, amount, type, reason);

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

    nonUserDataSchema.parse({
      name,
      phoneNumber,
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
    );

    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/member-requests");

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (e) {
    if (e instanceof ApiError) {
      return {
        success: false,
        errors: e,
        data: null,
      };
    }
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

    const response = await subscribeMemberToPackage(
      uid,
      pkgId,
      startDate,
      paymentMethod,
      paymentDate === "" ? undefined : paymentDate,
      priceChanged ? amount : undefined,
      locationId,
      pendingDeduction,
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

    bookClassSchema.parse({ uid, clsId, overrideTimeRestrictions: String(overrideTimeRestrictions) });

    const authUser = await getAuthenticatedUser();
    const canOverride = canOverrideBookingTimeRestrictions(authUser?.role);

    const [memberData, catalogPackages, fullSchedule, upcomingSchedule] =
      await Promise.all([
        getMembers(null, 1, 1, uid),
        getPackages(),
        getScheduledClasses(),
        getNextScheduledClasses(),
      ]);

    const scheduledClasses = [
      ...fullSchedule,
      ...upcomingSchedule.filter(
        (cls) => !fullSchedule.some((existing) => existing._id === cls._id)
      ),
    ];

    const member = memberData.data[0];
    if (!member) {
      return {
        success: false,
        errors: { message: "Member not found" },
        data: null,
      };
    }

    const scheduledClass = scheduledClasses.find((cls) => cls._id === clsId);
    if (!scheduledClass) {
      return {
        success: false,
        errors: { message: "Scheduled class not found" },
        data: null,
      };
    }

    const eligibility = getBookingEligibility(
      member,
      scheduledClass,
      catalogPackages,
      scheduledClasses,
      {
        overrideTimeRestrictions:
          overrideTimeRestrictions && canOverride,
      }
    );

    if (!eligibility.eligible) {
      return {
        success: false,
        errors: {
          message: eligibility.reason ?? "Member cannot book this class",
        },
        data: null,
      };
    }

    const shouldOverrideTime =
      overrideTimeRestrictions && canOverride;

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
    if (error instanceof ApiError) {
      return {
        success: false,
        errors: error,
        data: null,
      };
    }
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

// Leave for refactoring
export const cancelBookingAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const uid = formData.get("uid") as string;
    const scid = formData.get("scid") as string;

    const response = await cancelBooking(uid, scid);

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
