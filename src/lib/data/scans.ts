import { tms } from "@/lib/tms-api";
import { formatInTimeZone } from "date-fns-tz";
import { getScheduledClasses } from "./schedule";
import {
  parseScans,
  parseDailyAttendance,
} from "../utils/parsers/scans-parser";
import type {
  ClassContainerProps,
  ClassScan,
} from "@/components/ui/scans/class-container";

const toCairoDateString = (date: Date | string): string => {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return date.trim();
  }
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(dateObj, "Africa/Cairo", "yyyy-MM-dd");
};

export const getScans = async (date: Date | string, locationId?: string) => {
  try {
    const params: Record<string, string> = {
      date: toCairoDateString(date),
    };
    if (locationId) params.locationId = locationId;
    const response = await tms.get("/admin/schedule", { params });
    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getDailyAttendance = async (date: Date | string, locationId?: string) => {
  try {
    const params: Record<string, string> = {
      date: toCairoDateString(date),
    };
    if (locationId) params.locationId = locationId;
    const response = await tms.get("/admin/daily-attendance", { params });
    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export async function fetchScansMonitorData(
  classDate: Date | string,
  checkInsDate: Date | string,
  locationId?: string
): Promise<{
  scans: ClassContainerProps[];
  dailyAttendance: { pt: ClassScan[]; openGym: ClassScan[] };
}> {
  const [scheduledClasses, dailyAttendanceRaw] = await Promise.all([
    getScheduledClasses(locationId, classDate),
    getDailyAttendance(checkInsDate, locationId),
  ]);

  const scans =
    scheduledClasses.length > 0 ? parseScans(scheduledClasses, classDate) : [];

  const dailyAttendance =
    dailyAttendanceRaw && dailyAttendanceRaw.length > 0
      ? parseDailyAttendance(dailyAttendanceRaw)
      : { pt: [], openGym: [] };

  return { scans, dailyAttendance };
}
