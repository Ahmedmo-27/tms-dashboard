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

export type OpenGymBranchPrice = {
  locationId: string;
  branchName: string;
  location: string;
  price: number | null;
};

export const getOpenGymDropInPrices = async (): Promise<
  OpenGymBranchPrice[]
> => {
  const response = await tms.get("/admin/openGym/dropInPrices");
  return response.data.data;
};

export const setOpenGymDropInPrice = async (
  locationId: string,
  price: number
) => {
  const response = await tms.patch("/admin/openGym/dropInPrice", {
    locationId,
    price,
  });
  revalidatePath("/dashboard/scans-monitor");
  revalidatePath("/dashboard/catalog");
  return response.data.data;
};

export const createOpenGymPackage = async (params: {
  name: string;
  price: number;
  renewalPeriod: "WEEKLY" | "MONTHLY";
  locationId: string;
}) => {
  const response = await tms.post("/admin/packages", {
    name: params.name,
    category: "OPEN_GYM",
    price: params.price,
    renewalPeriod: params.renewalPeriod,
    locationId: params.locationId,
  });
  revalidatePath("/dashboard/catalog");
  return response.data.data;
};

/**
 * Creates a per-branch OPEN_GYM package, or updates its price if one already
 * exists for that branch + renewalPeriod (pkgId provided). Keeps a single
 * weekly and single monthly package per branch instead of duplicating.
 */
export const upsertOpenGymPackage = async (params: {
  pkgId?: string;
  name: string;
  price: number;
  renewalPeriod: "WEEKLY" | "MONTHLY";
  locationId: string;
}) => {
  if (params.pkgId) {
    const response = await tms.patch(`/admin/packages/${params.pkgId}`, {
      price: String(params.price),
      renewalPeriod: params.renewalPeriod,
      locationId: params.locationId,
    });
    revalidatePath("/dashboard/catalog");
    return response.data.data;
  }
  return createOpenGymPackage({
    name: params.name,
    price: params.price,
    renewalPeriod: params.renewalPeriod,
    locationId: params.locationId,
  });
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
