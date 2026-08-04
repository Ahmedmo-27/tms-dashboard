"use server";
import { revalidatePath } from "next/cache";
import { tms } from "../tms-api";

export const bookClass = async (
  uid: string,
  clsId: string,
  options?: { overrideTimeRestrictions?: boolean }
) => {
  try {
    const response = await tms.post("/admin/book", {
      uid,
      scid: clsId,
      ...(options?.overrideTimeRestrictions
        ? { overrideTimeRestrictions: true }
        : {}),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const bookDropIn = async (
  uid: string,
  clsId: string,
  paymentMethod: string,
  locationId?: string,
) => {
  try {
    const response = await tms.post("/admin/bookDropIn", {
      uid,
      scid: clsId,
      paymentMethod,
      ...(locationId ? { locationId } : {}),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const cancelBooking = async (uid: string, scid: string) => {
  try {
    const response = await tms.delete("/admin/cancel", { data: { uid, scid } });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};


export const bookClassForNonUser = async (
  name: string,
  phoneNumber: string,
  scid: string
) => {
  try {
    const response = await tms.post("/admin/nonUserBooking", {
      name,
      phoneNumber,
      scid,
    });
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/scans-monitor")
    return response.data;
  } catch (error) {
    console.log("GOT ERROR", JSON.stringify((error as any)))
    throw error;
  }
};

export const bookWalkIn = async (
  name: string,
  phoneNumber: string,
  scid: string,
  paymentMethod?: string,
  amount?: number,
  paymentDate?: string,
  locationId?: string,
) => {
  try {
    const response = await tms.post("/admin/nonUserBooking/walk-in", {
      name,
      phoneNumber,
      scid,
      paymentMethod,
      amount,
      paymentDate,
      ...(locationId ? { locationId } : {}),
    });
    revalidatePath("/dashboard/scans-monitor");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const attendNonUserBooking = async (bookingId: string) => {
  try {
    const response = await tms.post(
      "/admin/nonUserBooking/attend"
    , {
      bookingId,
    });
    revalidatePath("/dashboard/schedule");
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const saveNonUserBookingPayment = async (
  bookingId: string,
  paymentMethod: string,
  amount?: number,
  paymentDate?: string,
  locationId?: string,
) => {
  try {
    const response = await tms.post(
      "/admin/nonUserBooking/pay"
    , {
      bookingId,
      paymentMethod,
      amount,
      paymentDate,
      ...(locationId ? { locationId } : {}),
    });
    revalidatePath("/dashboard/schedule");
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const cancelNonUserBooking = async (bookingId: string) => {
  try {
    const response = await tms.post(
      `/admin/nonUserBooking/cancel/${bookingId}`
    );
    revalidatePath("/dashboard/schedule");
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const recordManualAttendance = async (uid: string, scid: string) => {
  try {
    const response = await tms.post("/admin/attendance/manual", {
      uid,
      scid,
    });
    revalidatePath("/dashboard/schedule");
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const removeManualAttendance = async (uid: string, scid: string) => {
  try {
    const response = await tms.delete("/admin/attendance/manual", {
      data: { uid, scid },
    });
    revalidatePath("/dashboard/schedule");
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

