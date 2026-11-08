export type PreviousSessionDateInput =
  | string
  | {
      date: string;
      classId?: string;
      className?: string;
      scid?: string;
    };

import { tms } from "@/lib/tms-api";
import { parseMembers } from "../utils/parsers/members-parser";

export const registerMember = async (
  name: string,
  password: string,
  phoneNumber: string,
  nationalId?: string
) => {
  try {
    const requestBody: Record<string, string> = {
      name,
      phoneNumber,
      password,
    };
    if (nationalId) {
      requestBody.nationalId = nationalId;
    }
    const response = await tms.post("/auth/register-manually", requestBody);
    return response.data.data.user;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateMember = async (
  uid: string,
  payload: {
    name?: string;
    phoneNumber?: string;
    email?: string;
    nationalId?: string;
  }
) => {
  try {
    const response = await tms.patch(`/admin/member/${uid}`, payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getMembers = async (
  searchString: string | undefined | null,
  page: number,
  limit: number,
  uid?: string,
  pkgId?: string
) => {
  try {
    const params: Record<string, string | number> = {
      page,
      limit,
    };
    if (searchString?.trim()) {
      const term = searchString.trim();
      params.search = term;
      params.name = term;
      params.phone = term;
    }
    if (uid) params.uid = uid;
    if (pkgId) params.pkgId = pkgId;
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
  reason: string,
  sessionDate?: string
) => {
  try {
    const requestBody = { uid, pkgId, pkgStartDate, amount, type, reason, sessionDate };
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
  locationId?: string,
  nationalId?: string,
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
      locationId?: string;
      nationalId?: string;
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
      ...(locationId ? { locationId } : {}),
      ...(nationalId ? { nationalId } : {}),
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
  pendingDeduction = false,
  previousSessionDates?: PreviousSessionDateInput[],
  soldBy?: string,
) => {
  try {
    type RequestBody = {
      uid: string;
      pkgId: string;
      pkgStartDate: string;
      paymentMethod: string;
      paymentDate: string | undefined;
      amount: string | undefined;
      pendingDeduction?: boolean;
      previousSessionDates?: PreviousSessionDateInput[];
      locationId?: string;
      soldBy?: string;
    };
    const requestBody: RequestBody = {
      uid,
      pkgId,
      pkgStartDate,
      paymentMethod,
      paymentDate,
      amount,
      ...(previousSessionDates && previousSessionDates.length > 0
        ? { previousSessionDates }
        : {}),
      ...(pendingDeduction ? { pendingDeduction: true } : {}),
      ...(locationId ? { locationId } : {}),
      ...(soldBy ? { soldBy } : {}),
    };
    const response = await tms.post("admin/member-packages", requestBody);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const recordMemberPreviousSessions = async (
  uid: string,
  pkgId: string,
  pkgStartDate: string,
  previousSessionDates: PreviousSessionDateInput[],
  reason?: string
) => {
  try {
    const requestBody = {
      uid,
      pkgId,
      pkgStartDate,
      previousSessionDates,
      ...(reason ? { reason } : {}),
    };
    const response = await tms.post(
      "admin/member-packages/previous-sessions",
      requestBody
    );
    return response.data;
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
