"use server";

import { revalidatePath } from "next/cache";
import { tms } from "../tms-api";

export const getOpenGymDropInPrice = async (
  locationId?: string
): Promise<number> => {
  const params = locationId ? { locationId } : undefined;
  const response = await tms.get("/admin/openGym/dropInPrice", { params });
  return response.data.data.price;
};

export const recordOpenGymMemberDropIn = async (
  uid: string,
  paymentMethod: string,
  locationId: string,
  amount?: number,
  paymentDate?: string
) => {
  const response = await tms.post("/admin/openGym/memberDropIn", {
    uid,
    paymentMethod,
    amount,
    paymentDate,
    locationId,
  });
  revalidatePath("/dashboard/scans-monitor");
  revalidatePath(`/dashboard/our-members/${uid}`);
  revalidatePath("/dashboard/our-members");
  return response.data;
};

export const recordOpenGymGuestDropIn = async (
  name: string,
  phoneNumber: string,
  paymentMethod: string,
  locationId: string,
  amount?: number,
  paymentDate?: string
) => {
  const response = await tms.post("/admin/openGym/guestDropIn", {
    name,
    phoneNumber,
    paymentMethod,
    amount,
    paymentDate,
    locationId,
  });
  revalidatePath("/dashboard/scans-monitor");
  return response.data;
};
