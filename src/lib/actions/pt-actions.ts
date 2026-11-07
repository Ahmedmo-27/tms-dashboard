"use server";

import { revalidatePath } from "next/cache";
import { parseStateError } from "../utils/state-errors";
import {
  getPtDropInPrice,
  recordPtGuestDropIn,
  recordPtMemberDropIn,
  settleOwedPtSession,
  getOwedPtSessions,
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

export const settleOwedPtSessionAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const sessionIdsRaw = (formData.get("sessionIds") as string) || "";
    const sessionId = (formData.get("sessionId") as string) || "";
    const sessionIds = [
      ...sessionIdsRaw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
      ...(sessionId ? [sessionId] : []),
    ].filter((id, index, all) => all.indexOf(id) === index);

    const settlementType = formData.get("settlementType") as
      | "PAYMENT"
      | "DEDUCTED"
      | "FOC";
    const paymentMethod =
      (formData.get("paymentMethod") as string) || undefined;
    const pkgId = (formData.get("pkgId") as string) || undefined;
    const amountRaw = formData.get("amount") as string;
    const paymentDate = (formData.get("paymentDate") as string) || undefined;
    const note = (formData.get("note") as string) || undefined;

    if (sessionIds.length === 0) {
      throw new BadRequestError("Session ID is required");
    }
    if (!settlementType) {
      throw new BadRequestError("Settlement type is required");
    }

    const totalAmount = amountRaw ? Number(amountRaw) : undefined;
    const perSessionAmounts =
      settlementType === "PAYMENT" &&
      totalAmount != null &&
      !Number.isNaN(totalAmount) &&
      sessionIds.length > 1
        ? splitAmountAcrossSessions(totalAmount, sessionIds.length)
        : null;

    let response = null;
    for (let i = 0; i < sessionIds.length; i++) {
      response = await settleOwedPtSession({
        sessionId: sessionIds[i],
        settlementType,
        paymentMethod,
        pkgId,
        amount:
          perSessionAmounts != null
            ? perSessionAmounts[i]
            : totalAmount,
        paymentDate,
        note,
      });
    }

    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/our-members");
    revalidatePath("/dashboard/payments");
    return { success: true, errors: null, data: response };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

function splitAmountAcrossSessions(total: number, count: number): number[] {
  const base = Math.floor((total / count) * 100) / 100;
  const amounts = Array.from({ length: count }, () => base);
  const allocated = base * count;
  const remainder = Math.round((total - allocated) * 100) / 100;
  amounts[count - 1] = Math.round((amounts[count - 1] + remainder) * 100) / 100;
  return amounts;
}

export { getPtDropInPrice, getOwedPtSessions, settleOwedPtSession };
