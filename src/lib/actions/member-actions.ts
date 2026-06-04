"use server";
import { revalidatePath } from "next/cache";
import {
  editMemberPackage,
  adjustMemberPackage,
  subscribeGuestToPackage,
  subscribeMemberToPackage,
  unsubscribeMemberFromPackage,
} from "../data/member";
import { parseStateError } from "../utils/state-errors";
import { bookClass, bookDropIn, cancelBooking } from "../data/bookings";
import { nonUserDataSchema } from "../schemas/newUserSchema";
import { ApiError } from "@/core/api-error";

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
      priceChanged ? amount : undefined
    );

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
    const priceChanged = (formData.get("priceChanged") as string) === "true";

    console.log(formData);
    const response = await subscribeMemberToPackage(
      uid,
      pkgId,
      startDate,
      paymentMethod,
      paymentDate === "" ? undefined : paymentDate,
      priceChanged ? amount : undefined
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
    const response = await bookClass(uid, clsId);

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

export const bookDropInAction = async (_prevState: any, formData: FormData) => {
  try {
    const uid = formData.get("uid") as string;
    const clsId = formData.get("clsId") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const response = await bookDropIn(uid, clsId, paymentMethod);

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

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    return parseStateError(error as Error);
  }
};
