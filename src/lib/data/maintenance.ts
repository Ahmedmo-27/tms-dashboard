import { tms } from "@/lib/tms-api";

export type MaintenanceItemId =
  | "showers_bottles"
  | "towels"
  | "communal_area"
  | "gym_prepared";

export interface MaintenanceCheckItem {
  id: MaintenanceItemId;
  title: string;
  isCompleted: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  completedByName?: string;
  notes?: string;
}

export type MaintenanceOverallStatus = "pending" | "in_progress" | "completed";

export interface CurrentSlotData {
  location: {
    _id: string;
    branchName: string;
    location: string;
  };
  slotDate: string;
  slotHour: number;
  slotStartTime: string;
  nextHourStartTime: string;
  secondsRemainingInHour: number;
  items: MaintenanceCheckItem[];
  overallStatus: MaintenanceOverallStatus;
  completedCount: number;
  totalCount: number;
  lastUpdatedBy?: string | null;
  lastUpdatedByName?: string;
  notes?: string;
  isCurrentHourActive: boolean;
}

export interface ManagementBranchCard {
  locationId: string;
  branchName: string;
  location: string;
  currentHour: {
    slotHour: number;
    overallStatus: MaintenanceOverallStatus;
    completedCount: number;
    totalCount: number;
    items: MaintenanceCheckItem[];
    lastUpdatedByName: string;
    lastUpdatedAt?: string | null;
  };
  todayStats: {
    completedHours: number;
    elapsedOperatingHours: number;
    complianceRate: number;
  };
}

export interface ManagementOverviewData {
  slotDate: string;
  slotHour: number;
  secondsRemainingInHour: number;
  overallCompliance: number;
  branches: ManagementBranchCard[];
}

export interface MaintenanceLogEntry {
  _id: string;
  locationId: {
    _id: string;
    branchName: string;
    location: string;
  } | string;
  slotDate: string;
  slotHour: number;
  slotStartTime: string;
  items: MaintenanceCheckItem[];
  overallStatus: MaintenanceOverallStatus;
  completedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedByName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceHistoryData {
  date: string;
  currentCairoHour: number;
  isToday: boolean;
  logs: MaintenanceLogEntry[];
  timelineHours: number[];
}

export async function getCurrentMaintenanceSlot(
  locationId?: string | null
): Promise<CurrentSlotData> {
  const params: Record<string, string> = {};
  if (locationId) {
    params.locationId = locationId;
  }
  const response = await tms.get("/admin/maintenance/current", { params });
  return response.data.data as CurrentSlotData;
}

export async function updateMaintenanceItem(payload: {
  locationId?: string | null;
  itemId: MaintenanceItemId;
  isCompleted: boolean;
  notes?: string;
  slotHour?: number;
  slotDate?: string;
}): Promise<{
  completedCount: number;
  totalCount: number;
  overallStatus: MaintenanceOverallStatus;
}> {
  const response = await tms.post("/admin/maintenance/check", payload);
  return response.data.data;
}

export async function batchUpdateMaintenance(payload: {
  locationId?: string | null;
  items: Array<{
    id: MaintenanceItemId;
    isCompleted: boolean;
    notes?: string;
  }>;
  notes?: string;
  slotHour?: number;
  slotDate?: string;
}): Promise<{
  completedCount: number;
  totalCount: number;
  overallStatus: MaintenanceOverallStatus;
}> {
  const response = await tms.post("/admin/maintenance/batch-submit", payload);
  return response.data.data;
}

export async function getManagementMaintenanceOverview(): Promise<ManagementOverviewData> {
  const response = await tms.get("/admin/maintenance/overview");
  return response.data.data as ManagementOverviewData;
}

export async function getMaintenanceHistory(params?: {
  locationId?: string | null;
  date?: string;
}): Promise<MaintenanceHistoryData> {
  const query: Record<string, string> = {};
  if (params?.locationId) query.locationId = params.locationId;
  if (params?.date) query.date = params.date;
  const response = await tms.get("/admin/maintenance/history", { params: query });
  return response.data.data as MaintenanceHistoryData;
}
