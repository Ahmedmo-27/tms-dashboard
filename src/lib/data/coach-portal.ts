import type { AxiosInstance } from "axios";
import type {
  CoachMeDto,
  DeductionHistoryItemDto,
  TodaySummaryDto,
} from "@/types/coach.types";
import type { CoachNotification } from "@/lib/store/features/coachSlice";

export async function getCoachMe(api: AxiosInstance): Promise<CoachMeDto> {
  const res = await api.get("/api/coach/me");
  return res.data.data as CoachMeDto;
}

export async function getCoachToday(api: AxiosInstance): Promise<TodaySummaryDto> {
  const res = await api.get("/api/coach/today");
  return res.data.data as TodaySummaryDto;
}

export async function getCoachNotifications(
  api: AxiosInstance
): Promise<CoachNotification[]> {
  const res = await api.get("/api/coach/notifications");
  return (res.data.data?.notifications ?? []) as CoachNotification[];
}

export async function markCoachNotificationsRead(api: AxiosInstance): Promise<void> {
  await api.patch("/api/coach/notifications/read");
}

export async function changeCoachPassword(
  api: AxiosInstance,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.post("/api/coach/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

export async function getCoachDeductions(
  api: AxiosInstance,
  memberId: string
): Promise<DeductionHistoryItemDto[]> {
  const res = await api.get(`/api/coach/clients/${memberId}/deductions`);
  return (res.data.data?.deductions ?? []) as DeductionHistoryItemDto[];
}
