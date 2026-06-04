import { attendanceSchema, nonUserBookingSchema, walkInSchema } from "../schemas/newUserSchema";
import { attendNonUserBooking, bookClassForNonUser, bookWalkIn, saveNonUserBookingPayment } from "../data/bookings";
import { ApiError, ConflictError } from "@/core/api-error";
import { parseStateError } from "../utils/state-errors";

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
    if (e instanceof ApiError) {
      return {
        success: false,
        errors: {
          message: e.message,
        },
        data: null,
      };
    }
   return parseStateError(e as Error);
  }
};

export const recordNonUserBookingPaymentAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const bookingData = {
      bookingId: formData.get("bookingId") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      amount: formData.get("amount") || undefined,
      paymentDate: formData.get("paymentDate") || undefined,
    };
    const validatedAttendanceData = attendanceSchema.parse(bookingData);
    const booking = await saveNonUserBookingPayment(
      validatedAttendanceData.bookingId,
      validatedAttendanceData.paymentMethod,
      validatedAttendanceData.amount,
      validatedAttendanceData.paymentDate
    );
    return {
      success: true,
      errors: null,
      data: booking,
    };
  } catch (e) {
    if (e instanceof ApiError) {
      console.log("State Error")
      console.log(e)
      return {
        success: false,
        errors: e,
        data: null,
      };
    }
   return parseStateError(e as Error);
  }
};


export const addWalkIn = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const bookingData = {
      name: formData.get("name") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      scid: formData.get("scid") as string,
      amount: formData.get("amount") || undefined,
      paymentDate: formData.get("paymentDate") || undefined,
    };
    const validatedBookingData = walkInSchema.parse(bookingData);
    const booking = await bookWalkIn(
      validatedBookingData.name,
      validatedBookingData.phoneNumber,
      validatedBookingData.scid,
      validatedBookingData.amount,
      validatedBookingData.paymentDate
    );
    return {
      success: true,
      errors: null,
      data: null,
    };
  } catch (e) {
    if (e instanceof ApiError) {
      console.log(e)
      return {
        success: false,
        errors: e,
        data: null,
      };
    }
   return parseStateError(e as Error);
  }
};
