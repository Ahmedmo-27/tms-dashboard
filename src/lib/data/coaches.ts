import { tms } from "@/lib/tms-api";

export const getCoaches = async () => {
  try {
    const response = await tms.get("/admin/coaches");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const addCoach = async (coach: {
  coachName: string;
  phoneNumber: string;
}) => {
  try {
    const response = await tms.post("/admin/coaches", coach);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const editCoach = async (
  id: string,
  coach: { coachName?: string; phoneNumber?: string }
) => {
  try {
    const response = await tms.patch(`/admin/coaches/${id}`, coach);
    return response.data;
  } catch (error) {
    throw error;
  }
};
