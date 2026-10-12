"use server";

import { attendanceSchema, nonUserBookingSchema, walkInSchema } from "../schemas/newUserSchema";
import { attendNonUserBooking, bookClassForNonUser, bookWalkIn, saveNonUserBookingPayment } from "../data/bookings";
import { ApiError, ConflictError } from "@/core/api-error";
import { parseStateError } from "../utils/state-errors";
import { revalidatePath } from "next/cache";

export const bookNonUserAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const bookingData = {
      name: formData.get("name") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      scid: formData.get("scid") as string,
    };
    const validatedBookingData = nonUserBookingSchema.parse(bookingData);
    const booking = await bookClassForNonUser(
      validatedBookingData.name,
      validatedBookingData.phoneNumber,
      validatedBookingData.scid
    );
    return {
      success: true,
      errors: null,
      data: booking,
    };
  } catch (e) {
    return parseStateError(e);
  }
};

export const recordNonUserBookingPaymentAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const paymentMethodRaw = (formData.get("paymentMethod") as string) || "";
    const isFoc = paymentMethodRaw.trim().toUpperCase() === "FOC";
    const isDeducted = paymentMethodRaw.trim().toUpperCase() === "DEDUCTED";
    const paymentMethod = isFoc
      ? "FOC"
      : isDeducted
      ? "DEDUCTED"
      : paymentMethodRaw;
    const bookingData = {
      bookingId: formData.get("bookingId") as string,
      paymentMethod,
      amount: isFoc || isDeducted ? undefined : formData.get("amount") || undefined,
      paymentDate: isFoc || isDeducted ? undefined : formData.get("paymentDate") || undefined,
      uid: (formData.get("uid") as string) || undefined,
      pkgId: (formData.get("pkgId") as string) || undefined,
      phoneNumber: (formData.get("phoneNumber") as string) || undefined,
    };
    const locationId = (formData.get("locationId") as string) || undefined;
    const validatedAttendanceData = attendanceSchema.parse(bookingData);
    const booking = await saveNonUserBookingPayment(
      validatedAttendanceData.bookingId,
      validatedAttendanceData.paymentMethod,
      validatedAttendanceData.amount,
      validatedAttendanceData.paymentDate,
      locationId,
      validatedAttendanceData.uid,
      validatedAttendanceData.pkgId,
      validatedAttendanceData.phoneNumber,
    );
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/payments");
    return {
      success: true,
      errors: null,
      data: booking,
    };
  } catch (e) {
    return parseStateError(e as Error);
  }
};


export const addWalkIn = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const paymentMethodRaw = (formData.get("paymentMethod") as string) || undefined;
    const isFoc = paymentMethodRaw?.trim().toUpperCase() === "FOC";
    const bookingData = {
      name: formData.get("name") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      scid: formData.get("scid") as string,
      paymentMethod: isFoc ? "FOC" : paymentMethodRaw,
      amount: isFoc ? undefined : formData.get("amount") || undefined,
      paymentDate: isFoc ? undefined : formData.get("paymentDate") || undefined,
    };
    const locationId = (formData.get("locationId") as string) || undefined;
    const validatedBookingData = walkInSchema.parse(bookingData);
    const paymentMethod =
      validatedBookingData.paymentMethod === "WILL_PAY"
        ? undefined
        : validatedBookingData.paymentMethod;
    const booking = await bookWalkIn(
      validatedBookingData.name,
      validatedBookingData.phoneNumber || "",
      validatedBookingData.scid,
      paymentMethod,
      isFoc ? undefined : validatedBookingData.amount,
      isFoc ? undefined : validatedBookingData.paymentDate,
      locationId,
    );
    revalidatePath("/dashboard/scans-monitor");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/payments");
    return {
      success: true,
      errors: null,
      data: null,
    };
  } catch (e) {
    return parseStateError(e as Error);
  }
};
