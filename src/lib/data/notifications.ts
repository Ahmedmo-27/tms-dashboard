import { tms } from "@/lib/tms-api";
import type {
  SendNotificationPayload,
  NotificationHistoryParams,
  NotificationHistoryResponse,
  NotificationStats,
  TargetUserItem,
} from "@/types/notifications";

export const sendNotification = async (
  payload: SendNotificationPayload
): Promise<{
  logId: string;
  matchedUsers: number;
  devicesReached: number;
  status: string;
}> => {
  const response = await tms.post("/admin/notifications/send", payload);
  return response.data.data;
};

export const getNotificationHistory = async (
  params: NotificationHistoryParams = {}
): Promise<NotificationHistoryResponse> => {
  const queryParams: Record<string, string | number> = {
    page: params.page || 1,
    limit: params.limit || 20,
  };

  if (params.search?.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params.targetType && params.targetType !== "all") {
    queryParams.targetType = params.targetType;
  }

  const response = await tms.get("/admin/notifications/history", {
    params: queryParams,
  });

  return response.data.data;
};

export const getNotificationStats = async (): Promise<NotificationStats> => {
  const response = await tms.get("/admin/notifications/stats");
  return response.data.data;
};

export const searchUsersForNotification = async (
  search: string
): Promise<TargetUserItem[]> => {
  if (!search || search.trim().length === 0) return [];

  const response = await tms.get("/admin/users", {
    params: {
      search: search.trim(),
      limit: 15,
    },
  });

  const rawUsers = (response.data?.data?.users || []) as Array<{
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    fcmTokens?: string[];
    locationId?: { branchName?: string; location?: string };
  }>;
  return rawUsers.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    phoneNumber: u.phoneNumber,
    role: u.role,
    hasFcmToken: Array.isArray(u.fcmTokens) && u.fcmTokens.length > 0,
    branchName: u.locationId?.branchName || u.locationId?.location,
  }));
};
