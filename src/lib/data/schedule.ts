import { tms } from "@/lib/tms-api";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { NotFoundError } from "@/core/api-error";
import { parseSchedule } from "../utils/parsers/schedule-parser";
import { formatInTimeZone } from "date-fns-tz";

export const getScheduledClasses = async (
  locationId?: string,
  date?: string | Date
): Promise<ScheduledClass[]> => {
  try {
    let scheduledClasses: any = [];
    const params: Record<string, string> = {};
    if (locationId) params.locationId = locationId;
    if (date) {
      const dateStr =
        typeof date === "string"
          ? (/^\d{4}-\d{2}-\d{2}$/.test(date.trim())
              ? date.trim()
              : formatInTimeZone(new Date(date), "Africa/Cairo", "yyyy-MM-dd"))
          : formatInTimeZone(date, "Africa/Cairo", "yyyy-MM-dd");
      params.date = dateStr;
      params.startDate = dateStr;
    }
    const response = await tms.get("/admin/schedule", { params: Object.keys(params).length ? params : undefined });
    const nonUserBookingsResponse = await tms.get("/admin/nonUserBooking", {
      params: Object.keys(params).length ? params : undefined,
    });
    if (response.data?.data) {
      scheduledClasses = parseSchedule(
        response.data.data,
        nonUserBookingsResponse.data?.data || []
      );
      return scheduledClasses;
    } else {
      return [];
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return [];
    }
    console.error(error);
    throw error;
  }
};

export const getNextScheduledClasses = async (): Promise<ScheduledClass[]> => {
  try {
    const response = await tms.get("/admin/next-schedule");
    const nonUserBookingsResponse = await tms.get("/admin/nonUserBooking");
    const scheduledClasses = parseSchedule(response.data.data, nonUserBookingsResponse.data.data);
    return scheduledClasses;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return [];
    }
    console.error(error);
    throw error;
  }
};

export const scheduleClass = async (scheduledClass: any) => {
  try {
    const response = await tms.post("/admin/schedule", scheduledClass);
    return response.data.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return [];
    }
    console.error(error);
    throw error;
  }
};

export const editClass = async (scid: string, scheduledClassEdits: any) => {
  try {
    const response = await tms.patch(
      `/admin/schedule/${scid}`,
      scheduledClassEdits
    );
    return response.data.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return [];
    }
    console.error(error);
    throw error;
  }
};

export const cancelClass = async (scid: string) => {
  try {
    const response = await tms.delete(`/admin/schedule/${scid}`);
    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
