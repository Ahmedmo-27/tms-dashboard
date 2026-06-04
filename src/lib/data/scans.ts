import { tms } from "@/lib/tms-api";
import { format } from "date-fns";

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
