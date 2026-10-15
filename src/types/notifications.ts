export type NotificationTargetType =
  | "all"
  | "members"
  | "coaches"
  | "branch"
  | "custom";

export type NotificationDeliveryStatus = "sent" | "partial" | "failed";

export interface SendNotificationPayload {
  title?: string;
  body: string;
  targetType: NotificationTargetType;
  locationId?: string;
  userIds?: string[];
  data?: Record<string, string>;
}

export interface NotificationLog {
  _id: string;
  title: string;
  body: string;
  targetType: NotificationTargetType;
  locationId?: {
    _id: string;
    branchName: string;
    location?: string;
  };
  recipientCount: number;
  recipientIds?: string[];
  sentBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  sentByName?: string;
  status: NotificationDeliveryStatus;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface NotificationHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  targetType?: string;
}

export interface NotificationHistoryResponse {
  items: NotificationLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationStats {
  totalSent: number;
  sentThisMonth: number;
  reachableUsersCount: number;
  totalRecipientsReached: number;
}

export interface TargetUserItem {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  hasFcmToken: boolean;
  branchName?: string;
}
