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

export type OpenGymPackagePayload = {
  name: string;
  price: number;
  expiryPeriod: number;
  locationId: string;
  numberOfSessions?: number;
  opensClasses?: string[];
  classRestrictions?: { cid: string; limit: number }[];
};

export const createOpenGymPackage = async (params: OpenGymPackagePayload) => {
  const response = await tms.post("/admin/packages", {
    name: params.name,
    category: "OPEN_GYM",
    price: params.price,
    expiryPeriod: params.expiryPeriod,
    locationId: params.locationId,
    ...(params.numberOfSessions != null
      ? { numberOfSessions: params.numberOfSessions }
      : {}),
    ...(params.opensClasses ? { opensClasses: params.opensClasses } : {}),
    ...(params.classRestrictions
      ? { classRestrictions: params.classRestrictions }
      : {}),
  });
  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/scans-monitor");
  return response.data.data;
};

export const updateOpenGymPackage = async (
  params: OpenGymPackagePayload & { pkgId: string },
) => {
  const response = await tms.patch(`/admin/packages/${params.pkgId}`, {
    name: params.name,
    price: String(params.price),
    expiryPeriod: params.expiryPeriod,
    locationId: params.locationId,
    numberOfSessions: params.numberOfSessions,
    opensClasses: params.opensClasses ?? [],
    classRestrictions: params.classRestrictions ?? [],
  });
  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/scans-monitor");
  return response.data.data;
};

export const deleteOpenGymPackage = async (pkgId: string) => {
  const response = await tms.delete(`/admin/packages/${pkgId}`);
  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/scans-monitor");
  return response.data.data;
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
