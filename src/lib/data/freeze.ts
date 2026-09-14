import { tms } from "@/lib/tms-api";

export interface FreezeRequestItem {
  _id: string;
  memberId: {
    _id: string;
    name: string;
    phoneNumber: string;
    email: string;
    role: string;
  };
  pkgId:
    | {
        _id: string;
        name: string;
        price?: number;
        expiryPeriod?: number;
      }
    | string;
  pkgStartDate: string;
  pkgName: string;
  locationId?: {
    _id: string;
    branchName: string;
    location: string;
  } | null;
  requestedDurationDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedDurationDays?: number;
  adminNote?: string;
  rejectionReason?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  } | null;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FreezeRequestsResponse {
  requests: FreezeRequestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getFreezeRequests(
  status?: string,
  search?: string,
  page = 1,
  limit = 20,
  locationId?: string
): Promise<FreezeRequestsResponse> {
  const params: Record<string, string | number> = {
    page,
    limit,
  };
  if (status && status !== "ALL") params.status = status;
  if (search && search.trim()) params.search = search.trim();
  if (locationId) params.locationId = locationId;

  const response = await tms.get("/admin/freeze-requests", { params });
  return response.data.data;
}

export async function approveFreezeRequest(
  requestId: string,
  approvedDurationDays?: number,
  adminNote?: string
) {
  const payload: Record<string, string | number> = {};
  if (approvedDurationDays !== undefined) {
    payload.approvedDurationDays = approvedDurationDays;
  }
  if (adminNote) {
    payload.adminNote = adminNote;
  }

  const response = await tms.patch(
    `/admin/freeze-requests/${requestId}/approve`,
    payload
  );
  return response.data;
}

export async function rejectFreezeRequest(
  requestId: string,
  rejectionReason?: string
) {
  const payload: Record<string, string> = {};
  if (rejectionReason) {
    payload.rejectionReason = rejectionReason;
  }

  const response = await tms.patch(
    `/admin/freeze-requests/${requestId}/reject`,
    payload
  );
  return response.data;
}

export async function adminFreezePackage(
  uid: string,
  pkgId: string,
  pkgStartDate: string,
  durationDays: number,
  reason?: string
) {
  const payload = {
    uid,
    pkgId,
    pkgStartDate,
    durationDays,
    reason,
  };
  const response = await tms.post("/admin/member-packages/freeze", payload);
  return response.data;
}

export async function adminUnfreezePackage(
  uid: string,
  pkgId: string,
  pkgStartDate: string
) {
  const payload = {
    uid,
    pkgId,
    pkgStartDate,
  };
  const response = await tms.post("/admin/member-packages/unfreeze", payload);
  return response.data;
}

export interface FrozenPackageItem {
  member: {
    _id: string;
    name: string;
    phoneNumber: string;
    email: string;
    role: string;
  };
  pkgId: string;
  pkgName: string;
  pkgStartDate: string;
  pkgEndDate: string;
  remainingClasses: number;
  locationId?: {
    _id: string;
    branchName: string;
    location: string;
  } | null;
  freezeInfo?: {
    isFrozen: boolean;
    freezeStartDate?: string;
    freezeEndDate?: string;
    allowedFreezeDays: number;
    usedFreezeDays: number;
    extraFreezeDaysApproved: number;
    freezeHistory?: Array<{
      startDate: string;
      endDate?: string;
      durationDays: number;
      type: "STANDARD" | "EXTRA" | "ADMIN";
      reason?: string;
      createdAt: string;
    }>;
  };
  status: string;
}

export interface FrozenPackagesResponse {
  packages: FrozenPackageItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getFrozenPackages(
  search?: string,
  page = 1,
  limit = 20,
  locationId?: string
): Promise<FrozenPackagesResponse> {
  const params: Record<string, string | number> = {
    page,
    limit,
  };
  if (search && search.trim()) params.search = search.trim();
  if (locationId) params.locationId = locationId;

  const response = await tms.get("/admin/frozen-packages", { params });
  return response.data.data;
}
