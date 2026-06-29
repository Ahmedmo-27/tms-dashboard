import { tms } from "@/lib/tms-api";
import { format } from "date-fns";
import { getScheduledClasses } from "./schedule";
import {
  parseScans,
  parseDailyAttendance,
} from "../utils/parsers/scans-parser";
import type {
  ClassContainerProps,
  ClassScan,
} from "@/components/ui/scans/class-container";

export const getScans = async () => {
  try {
    const response = await tms.get("/admin/schedule");
    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getDailyAttendance = async (date: Date) => {
  try {
    const response = await tms.get(`/admin/daily-attendance?date=${format(date, "yyyy-MM-dd")}`);
    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export async function fetchScansMonitorData(
  classDate: Date,
  checkInsDate: Date
): Promise<{
  scans: ClassContainerProps[];
  dailyAttendance: { pt: ClassScan[]; openGym: ClassScan[] };
}> {
  const [scheduledClasses, dailyAttendanceRaw] = await Promise.all([
    getScheduledClasses(),
    getDailyAttendance(checkInsDate),
  ]);

  const scans =
    scheduledClasses.length > 0 ? parseScans(scheduledClasses, classDate) : [];

  const dailyAttendance =
    dailyAttendanceRaw.length > 0
      ? parseDailyAttendance(dailyAttendanceRaw)
      : { pt: [], openGym: [] };

  return { scans, dailyAttendance };
}
