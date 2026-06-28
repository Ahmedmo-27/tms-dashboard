"use server";

import { revalidatePath } from "next/cache";
import { parseStateError } from "../utils/state-errors";
import {
  getOpenGymDropInPrice,
  recordOpenGymGuestDropIn,
  recordOpenGymMemberDropIn,
} from "../data/open-gym";
import { ApiError } from "@/core/api-error";
import { nonUserDataSchema } from "../schemas/newUserSchema";

export const openGymMemberDropInAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const uid = formData.get("uid") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const amountRaw = formData.get("amount") as string;
    const paymentDate = (formData.get("paymentDate") as string) || undefined;
    const priceChanged = (formData.get("priceChanged") as string) === "true";

    const response = await recordOpenGymMemberDropIn(
      uid,
      paymentMethod,
      priceChanged && amountRaw ? Number(amountRaw) : undefined,
      paymentDate
    );

    return { success: true, errors: null, data: response };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export const openGymGuestDropInAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const amountRaw = formData.get("amount") as string;
    const paymentDate = (formData.get("paymentDate") as string) || undefined;
    const priceChanged = (formData.get("priceChanged") as string) === "true";

    nonUserDataSchema.parse({ name, phoneNumber });

    await recordOpenGymGuestDropIn(
      name,
      phoneNumber,
      paymentMethod,
      priceChanged && amountRaw ? Number(amountRaw) : undefined,
      paymentDate
    );

    revalidatePath("/dashboard/scans-monitor");
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

export { getOpenGymDropInPrice };