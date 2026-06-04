import { tms } from "@/lib/tms-api";

export type Location = {
  _id: string;
  branchName: string;
  location: string;
  locationUrl: string;
};

export const getLocations = async (): Promise<Location[]> => {
  const response = await tms.get("/admin/locations");
  return response.data.data;
};
