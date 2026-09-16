import { tms } from "@/lib/tms-api";
import type {
  AccountsResponse,
  CreateAccountPayload,
  GetAccountsParams,
  UpdateAccountPayload,
  UserAccount,
} from "@/types/accounts";

export const getAccounts = async (
  params: GetAccountsParams = {}
): Promise<AccountsResponse> => {
  const queryParams: Record<string, string | number> = {
    page: params.page || 1,
    limit: params.limit || 25,
  };

  if (params.search?.trim()) {
    queryParams.search = params.search.trim();
  }

  if (params.role && params.role !== "all") {
    queryParams.role = params.role;
  }

  if (params.locationId && params.locationId !== "all") {
    queryParams.locationId = params.locationId;
  }

  const response = await tms.get("/admin/users", {
    params: queryParams,
  });

  return response.data.data;
};

export const createAccount = async (
  payload: CreateAccountPayload
): Promise<UserAccount> => {
  const response = await tms.post("/admin/users", payload);
  return response.data.data;
};

export const updateAccount = async (
  id: string,
  payload: UpdateAccountPayload
): Promise<UserAccount> => {
  const response = await tms.patch(`/admin/users/${id}`, payload);
  return response.data.data;
};

export const deleteAccount = async (id: string): Promise<{ id: string }> => {
  const response = await tms.delete(`/admin/users/${id}`);
  return response.data.data;
};

