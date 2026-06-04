import { tms } from "@/lib/tms-api";

export const getNonUserPackages = async (
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
        params.phoneNumber = searchString; // Search by phone if numeric
      } else {
        params.name = searchString; // Search by name if not numeric
      }
    }
    const response = await tms.get("/admin/nonUserPackage", {
      params,
    });
    console.log(response.data)
    return {
      data: response.data.data,
    };
  } catch (error) {
    throw error;
  }
};
