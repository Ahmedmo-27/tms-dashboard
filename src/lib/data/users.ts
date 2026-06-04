import { NetworkError } from "@/core/api-error";
import { tms } from "@/lib/tms-api";

export const getUsers = async (
  searchString: string | undefined | null,
  page: number,
  limit: number
) => {
  try {
    const params: Record<string, string | number> = {
      page,
      limit,
    };
    if (searchString?.trim()) {
      if (/^\d+$/.test(searchString)) {
        params.phone = searchString; // Search by phone if numeric
      } else {
        params.name = searchString; // Search by name if not numeric
      }
    }
    const response = await tms.get("/admin/pending-members", {
      params,
    });
    return {
      data: response.data.data.users,
      total: response.data.data.total,
    };
  } catch (error) {
    throw error;
  }
};

export const getAllPendingMembers = async () => {
  const response = await tms.get("/admin/pending-members", {
    params: { page: 1, limit: 10000 },
  });
  return response.data.data.users as Array<{
    name: string;
    phoneNumber: string;
    email: string;
    createdAt: string;
  }>;
};

export const addMember = async (uid: string) => {
  try {
    const response = await tms.post(`/admin/member/${uid}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
