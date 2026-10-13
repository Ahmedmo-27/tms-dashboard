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
    const trimmed = searchString?.trim();
    if (trimmed) {
      const cleanDigits = trimmed.replace(/\D/g, "");
      if (cleanDigits.length >= 4) {
        params.phoneNumber = cleanDigits;
      } else {
        params.name = trimmed;
      }
      params.search = trimmed;
    }
    const response = await tms.get("/admin/nonUserPackage", {
      params,
    });
    return {
      data: response.data.data || [],
    };
  } catch (error: any) {
    if (
      error?.status === 404 ||
      error?.response?.status === 404 ||
      error?.name === "NotFoundError" ||
      error?.message?.includes("404")
    ) {
      return {
        data: [],
      };
    }
    throw error;
  }
};
