"use server";

import { revalidatePath } from "next/cache";
import { parseStateError } from "../utils/state-errors";
import {
  getPtDropInPrice,
  recordPtGuestDropIn,
  recordPtMemberDropIn,
} from "../data/pt";
import { ApiError, BadRequestError } from "@/core/api-error";
import { nonUserDataSchema } from "../schemas/newUserSchema";

export const ptMemberDropInAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const uid = formData.get("uid") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const locationId = formData.get("locationId") as string;
    const coachId = (formData.get("coachId") as string) || undefined;
    const amountRaw = formData.get("amount") as string;
    const paymentDate = (formData.get("paymentDate") as string) || undefined;
    const note = (formData.get("note") as string) || undefined;
    const priceChanged = (formData.get("priceChanged") as string) === "true";

    if (!locationId) {
      throw new BadRequestError("Select a branch to record drop-in");
    }
    if (!coachId) {
      throw new BadRequestError("Please select a trainer for this PT session");
    }

    const response = await recordPtMemberDropIn(
      uid,
      paymentMethod,
      locationId,
      coachId,
      priceChanged && amountRaw ? Number(amountRaw) : undefined,
      paymentDate,
      note
    );

    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/payments");
    revalidatePath(`/dashboard/our-members/${uid}`);
    revalidatePath("/dashboard/our-members");
    return { success: true, errors: null, data: response };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const ptGuestDropInAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const locationId = formData.get("locationId") as string;
    const coachId = (formData.get("coachId") as string) || undefined;
    const amountRaw = formData.get("amount") as string;
    const paymentDate = (formData.get("paymentDate") as string) || undefined;
    const note = (formData.get("note") as string) || undefined;
    const priceChanged = (formData.get("priceChanged") as string) === "true";

    if (!locationId) {
      throw new BadRequestError("Select a branch to record drop-in");
    }
    if (!coachId) {
      throw new BadRequestError("Please select a trainer for this PT session");
    }

    nonUserDataSchema.parse({ name, phoneNumber });

    await recordPtGuestDropIn(
      name,
      phoneNumber,
      paymentMethod,
      locationId,
      coachId,
      priceChanged && amountRaw ? Number(amountRaw) : undefined,
      paymentDate,
      note
    );

    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/payments");
    return { success: true, errors: null, data: null };
  } catch (e) {
    if (e instanceof ApiError && e.message?.length === 24) {
      return {
        success: false,
        errors: { userExists: true, message: e.message },
        usrId: e.message,
        data: null,
      };
    }
    return parseStateError(e as Error);
  }
};

export { getPtDropInPrice };
