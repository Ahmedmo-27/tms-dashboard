"use server";

import { revalidatePath } from "next/cache";
import { tms } from "../tms-api";

export const getPtDropInPrice = async (
  locationId?: string,
  coachId?: string,
): Promise<number> => {
  const params: Record<string, string> = {};
  if (locationId) params.locationId = locationId;
  if (coachId) params.coachId = coachId;
  const response = await tms.get("/admin/pt/dropInPrice", {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return response.data.data.price;
};

export type PtBranchPrice = {
  locationId: string;
  branchName: string;
  location: string;
  price: number | null;
};

export type PtCoachPrice = {
  coachId: string;
  coachName: string;
  price: number | null;
};

export const getPtDropInPrices = async (): Promise<PtBranchPrice[]> => {
  const response = await tms.get("/admin/pt/dropInPrices");
  return response.data.data;
};

export const setPtDropInPrice = async (
  locationId: string,
  price: number
) => {
  const response = await tms.patch("/admin/pt/dropInPrice", {
    locationId,
    price,
  });
  revalidatePath("/dashboard/scans-monitor");
  revalidatePath("/dashboard/catalog");
  return response.data.data;
};

export const getPtCoachDropInPrices = async (): Promise<PtCoachPrice[]> => {
  const response = await tms.get("/admin/pt/coachDropInPrices");
  return response.data?.data ?? [];
};

export const setPtCoachDropInPrice = async (
  coachId: string,
  price: number | null,
) => {
  const response = await tms.patch("/admin/pt/coachDropInPrice", {
    coachId,
    price,
  });
  revalidatePath("/dashboard/scans-monitor");
  revalidatePath("/dashboard/catalog");
  return response.data?.data;
};

export const recordPtMemberDropIn = async (
  uid: string,
  paymentMethod: string,
  locationId: string,
  coachId?: string,
  amount?: number,
  paymentDate?: string,
  note?: string
) => {
  const response = await tms.post("/admin/pt/memberDropIn", {
    uid,
    paymentMethod,
    coachId: coachId || undefined,
    amount,
    paymentDate,
    locationId,
    note,
  });
  revalidatePath("/dashboard/scans-monitor");
  revalidatePath(`/dashboard/our-members/${uid}`);
  revalidatePath("/dashboard/our-members");
  return response.data;
};

export const recordPtGuestDropIn = async (
  name: string,
  phoneNumber: string,
  paymentMethod: string,
  locationId: string,
  coachId?: string,
  amount?: number,
  paymentDate?: string,
  note?: string
) => {
  const response = await tms.post("/admin/pt/guestDropIn", {
    name,
    phoneNumber,
    paymentMethod,
    coachId: coachId || undefined,
    amount,
    paymentDate,
    locationId,
    note,
  });
  revalidatePath("/dashboard/scans-monitor");
  return response.data;
};
