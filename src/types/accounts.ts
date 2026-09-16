export type AccountRole =
  | "management"
  | "branch_admin"
  | "admin"
  | "coach"
  | "managing_coach"
  | "mailer"
  | "member"
  | "user";

export const EMAIL_ELIGIBLE_ROLES = [
  "management",
  "admin",
  "mailer",
  "managing_coach",
] as const;

export function isEmailEligibleRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (EMAIL_ELIGIBLE_ROLES as readonly string[]).includes(role);
}

export interface BranchLocation {
  _id: string;
  branchName: string;
  location: string;
  locationUrl?: string;
}

export interface LinkedCoach {
  _id: string;
  coachName: string;
}

export interface UserAccount {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: AccountRole;
  locationId?: BranchLocation | string;
  tmsEmail?: string;
  sendAsName?: string;
  coach?: LinkedCoach | null;
  createdAt: string;
}

export interface GetAccountsParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  locationId?: string;
}

export interface AccountsResponse {
  users: UserAccount[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAccountPayload {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: AccountRole;
  locationId?: string;
  tmsEmail?: string;
  sendAsName?: string;
  coachId?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  role?: AccountRole;
  locationId?: string | null;
  tmsEmail?: string | null;
  sendAsName?: string | null;
  coachId?: string;
}

