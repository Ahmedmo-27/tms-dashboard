import { tms } from "@/lib/tms-api";
import { parseMembers } from "../utils/parsers/members-parser";

export const registerMember = async (
  name: string,
  password: string,
  phoneNumber: string
) => {
  try {
    const requestBody = {
      name,
      phoneNumber,
      password,
    };
    const response = await tms.post("/auth/register-manually", requestBody);
    return response.data.data.user;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getMembers = async (
  searchString: string | undefined | null,
  page: number,
  limit: number,
  uid?: string
) => {
  try {
    const params: Record<string, string | number> = {
      page,
      limit,
    };
    if (searchString?.trim()) {
      if (/^\d+$/.test(searchString)) {
        params.phone = searchString; // Search by phone if numeric
      } else {
        params.name = searchString; // Search by name if not numeric
      }
    }
    if (uid) params.uid = uid;
    const response = await tms.get("/admin/member", {
      params,
    });
    return {
      data: parseMembers(response.data.data.members),
      total: response.data.data.total, // Total members count from response data
    };
  } catch (error) {
    console.log(error)
    throw error;
  }
};

export const editMemberPackage = async (
  uid: string,
  pkgId: string,
  pkgStartDate: string,
  pkgEndDate: string | null
) => {
  try {
    const requestBody = { uid, pkgId, pkgStartDate, pkgEndDate };
    const response = await tms.patch("admin/member-packages/edit", requestBody);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const adjustMemberPackage = async (
  uid: string,
  pkgId: string,
  pkgStartDate: string,
  amount: number,
  type: "ADD" | "DEDUCT",
  reason: string
) => {
  try {
    const requestBody = { uid, pkgId, pkgStartDate, amount, type, reason };
    const response = await tms.patch("admin/member-packages/adjust", requestBody);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const subscribeGuestToPackage = async (
  name: string,
  phoneNumber: string,
  pkgId: string,
  pkgStartDate: string,
  paymentMethod: string,
  pendingDeduction: boolean,
  paymentDate?: string,
  amount?: string,
) => {
  try {
    type RequestBody = {
      name: string;
      phoneNumber: string;
      pkgId: string;
      pkgStartDate: string;
      paymentMethod: string;
      paymentDate: string | undefined;
      amount: string | undefined;
      pendingDeduction: boolean;
    };
    const requestBody: RequestBody = {
      name,
      phoneNumber,
      pkgId,
      pkgStartDate,
      paymentMethod,
      paymentDate,
      amount,
      pendingDeduction,
    };
    console.log(requestBody)
    const response = await tms.post("admin/nonUserPackage", requestBody);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const subscribeMemberToPackage = async (
  uid: string,
  pkgId: string,
  pkgStartDate: string,
  paymentMethod: string,
  paymentDate?: string,
  amount?: string,
  locationId?: string,
) => {
  try {
    type RequestBody = {
      uid: string;
      pkgId: string;
      pkgStartDate: string;
      paymentMethod: string;
      paymentDate: string | undefined;
      amount: string | undefined;
      locationId?: string;
    };
    const requestBody: RequestBody = {
      uid,
      pkgId,
      pkgStartDate,
      paymentMethod,
      paymentDate,
      amount,
      ...(locationId ? { locationId } : {}),
    };
    const response = await tms.post("admin/member-packages", requestBody);
    return response.data;
    return {}
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const unsubscribeMemberFromPackage = async (
  uid: string,
  pkgId: string,
  pkgStartDate: string
) => {
  try {
    type RequestBody = {
      uid: string;
      pkgId: string;
      pkgStartDate: string;
    };

    const requestBody: RequestBody = { uid, pkgId, pkgStartDate };

    const response = await tms.delete("admin/member-packages", {
      data: requestBody,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
