/** Sales attribution — which sales account sold a package to which member. */

export interface SalesAccount {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: "sales" | "sales_manager";
  branchName: string | null;
}

export interface SoldPackageSeller {
  _id: string;
  name: string;
  role?: string;
}

export interface SoldPackage {
  /** Id of the package entry on the member — the row's identity. */
  memberPackageId: string;
  uid: string;
  memberName: string;
  memberPhone: string;
  pkgId: string;
  packageName: string;
  category: string;
  pkgStartDate: string;
  pkgEndDate: string;
  status: "ACTIVE" | "EXPIRED" | "COMPLETED" | "FROZEN" | "DELETED";
  locationId: string | null;
  branchName: string;
  soldBy: SoldPackageSeller | null;
  soldByAssignedAt: string | null;
  soldByAssignedBy: { _id: string; name: string } | null;
}

export interface SoldPackagesSummary {
  total: number;
  assigned: number;
  unassigned: number;
  bySeller: { salesAccountId: string; name: string; count: number }[];
}

export interface SoldPackagesResponse {
  rows: SoldPackage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: SoldPackagesSummary;
}

export interface GetSoldPackagesParams {
  page?: number;
  limit?: number;
  search?: string;
  /** "all" | "assigned" | "unassigned" | a sales account id */
  seller?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
}
