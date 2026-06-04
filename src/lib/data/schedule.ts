import { tms } from "@/lib/tms-api";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { NotFoundError } from "@/core/api-error";
import { parseSchedule } from "../utils/parsers/schedule-parser";

export const getScheduledClasses = async (): Promise<ScheduledClass[]> => {
  try {
    let scheduledClasses: any = [];
    const response = await tms.get("/admin/schedule");
    const nonUserBookingsResponse = await tms.get("/admin/nonUserBooking");
    if (response.data.data) {
      scheduledClasses = parseSchedule(
        response.data.data,
        nonUserBookingsResponse.data.data
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
    console.log(error);
  }
};
