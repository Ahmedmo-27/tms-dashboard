import { tms } from "@/lib/tms-api";
import type {
  AssignSellerResult,
  GetSoldPackagesParams,
  SalesAccount,
  SoldPackagesResponse,
} from "@/types/sales";

/** Sales accounts a sold package can be credited to. */
export const getSalesAccounts = async (): Promise<SalesAccount[]> => {
  const response = await tms.get("/sales/accounts");
  return response.data.data?.accounts ?? [];
};

export const getSoldPackages = async (
  params: GetSoldPackagesParams = {}
): Promise<SoldPackagesResponse> => {
  const queryParams: Record<string, string | number> = {
    page: params.page || 1,
    limit: params.limit || 25,
  };

  if (params.search?.trim()) queryParams.search = params.search.trim();
  if (params.seller && params.seller !== "all") queryParams.seller = params.seller;
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;
  if (params.locationId && params.locationId !== "all") {
    queryParams.locationId = params.locationId;
  }

  const response = await tms.get("/sales/packages", { params: queryParams });
  return response.data.data;
};

/**
 * Credits a sales account for the member that owns this package and all of
 * their non-deleted packages. Pass `null` to clear the attribution.
 */
export const assignSoldPackageSeller = async (
  memberPackageId: string,
  soldBy: string | null
): Promise<AssignSellerResult> => {
  const response = await tms.patch(
    `/sales/packages/${memberPackageId}/seller`,
    { soldBy }
  );
  return response.data.data;
};
