/**
 * Role model:
 * - branch_admin: locked to user.locationId; full branch operational access.
 * - management: same branch abilities as branch_admin when a branch is selected
 *   (?locationId= in URL / locationId in request body); plus global-only actions
 *   (location CRUD, ticket category CRUD). Our Members is shared across branches.
 * - accountant: read-only apart from one write — the sales attribution. Sees
 *   finance analytics, payments, sheet, members and scans monitor across all
 *   branches, can read (never send) mail, and may set who sold a package.
 *   Never listed in ACTION_ROLES.
 * - sales_manager: owns the sales dashboard. Reads sold packages across branches
 *   and its only write is the sales attribution (who sold a package to a member).
 * - sales: a sales account a sold package is credited to. It has no dashboard
 *   access of its own, so it is not a staff role here.
 */

export const STAFF_ROLES = [
  "management",
  "branch_admin",
  "admin",
  "mailer",
  "accountant",
  "sales_manager",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type PermissionRole =
  | "management"
  | "branch_admin"
  | "mailer"
  | "accountant"
  | "sales_manager";

export function toPermissionRole(
  role: string | null | undefined
): PermissionRole | null {
  if (!role) return null;
  if (role === "admin" || role === "management") return "management";
  if (role === "branch_admin") return role;
  if (role === "mailer") return "mailer";
  if (role === "accountant") return "accountant";
  if (role === "sales_manager") return "sales_manager";
  return null;
}

export function isStaffRole(role: string | null | undefined): boolean {
  return toPermissionRole(role) !== null;
}

export function isCoachRole(role: string | null | undefined): boolean {
  return role === "coach" || role === "managing_coach";
}

export function isManagingCoachRole(role: string | null | undefined): boolean {
  return role === "managing_coach";
}

export interface CoachIdentity {
  role?: string | null;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  coachId?: string | null;
  userId?: string | null;
}

/**
 * PT Report page is restricted to managing coaches.
 */
export function canAccessPtReport(coach: CoachIdentity | null | undefined): boolean {
  if (!coach || coach.role !== "managing_coach") return false;
  return true;
}

export function isHanaAbazaCoach(coach: CoachIdentity | null | undefined): boolean {
  if (!coach) return false;

  const name = coach.name?.trim().toLowerCase().replace(/\s+/g, " ");
  if (name === "hana abaza" || name?.includes("abaza")) return true;

  const email = coach.email?.trim().toLowerCase();
  if (email === "hhanaabaza@gmail.com") return true;

  const phone = coach.phoneNumber?.replace(/\D/g, "");
  if (phone === "01222161664" || phone === "201222161664") return true;

  const id = coach.coachId || coach.userId;
  if (
    id === "6a2e4ab4df68bd7a2cf2163a" ||
    id === "69e6764f28c5113f3b4e6f51" ||
    id === "6aa83752f491eb785ab39653"
  ) {
    return true;
  }

  return false;
}

export function isHanaRashwanCoach(coach: CoachIdentity | null | undefined): boolean {
  if (!coach) return false;

  const name = coach.name?.trim().toLowerCase().replace(/\s+/g, " ");
  if (name === "hana rashwan" || name?.includes("rashwan")) return true;

  const email = coach.email?.trim().toLowerCase();
  if (email === "hanarashwan@aucegypt.edu") return true;

  const phone = coach.phoneNumber?.replace(/\D/g, "");
  if (phone === "01001061010" || phone === "201001061010") return true;

  const id = coach.coachId || coach.userId;
  if (id === "69e88f6554d83d6549339c53" || id === "69e6765128c5113f3b4e6f69") {
    return true;
  }

  return false;
}

/**
 * Returns extra category access in the scans monitor for managing coaches:
 * - Hana Abaza: Functional Training ("FUNCTIONAL_TRAINING")
 * - Hana Rashwan: Studio ("STUDIO")
 */
export function getCoachExtraScansCategories(
  coach: CoachIdentity | null | undefined
): string[] {
  if (!coach) return [];
  if (isHanaAbazaCoach(coach)) return ["FUNCTIONAL_TRAINING"];
  if (isHanaRashwanCoach(coach)) return ["STUDIO"];
  return [];
}

export function isMailerRole(role: string | null | undefined): boolean {
  return toPermissionRole(role) === "mailer";
}

export function isAccountantRole(role: string | null | undefined): boolean {
  return toPermissionRole(role) === "accountant";
}

export function isSalesManagerRole(role: string | null | undefined): boolean {
  return toPermissionRole(role) === "sales_manager";
}

/** Roles that may set or clear which sales account sold a package. */
export function canAssignSalesAttribution(
  role: string | null | undefined
): boolean {
  const permissionRole = toPermissionRole(role);
  return (
    permissionRole === "management" ||
    permissionRole === "branch_admin" ||
    permissionRole === "sales_manager" ||
    permissionRole === "accountant"
  );
}

/**
 * Roles that can switch between branches to view data. The accountant is
 * view-only; the sales_manager may only write the sales attribution.
 */
export function canViewAllBranches(role: string | null | undefined): boolean {
  const permissionRole = toPermissionRole(role);
  return (
    permissionRole === "management" ||
    permissionRole === "accountant" ||
    permissionRole === "sales_manager"
  );
}

/** Roles that may send mail, sync the mailbox or change read state. */
export function canWriteMail(role: string | null | undefined): boolean {
  const permissionRole = toPermissionRole(role);
  return permissionRole === "management" || permissionRole === "mailer";
}

export function isBranchScopedRole(role: string | null | undefined): boolean {
  return toPermissionRole(role) === "branch_admin";
}

export function isManagementRole(role: string | null | undefined): boolean {
  return toPermissionRole(role) === "management";
}

export const STAFF_DASHBOARD_HOME = "/dashboard/scans-monitor";
export const COACH_DASHBOARD_HOME = "/coach/today";
export const MAILER_DASHBOARD_HOME = "/dashboard/mailing";
export const ACCOUNTANT_DASHBOARD_HOME = "/dashboard/finance";
export const SALES_MANAGER_DASHBOARD_HOME = "/dashboard/sales";

/**
 * Resolves the primary dashboard landing route for an authorized role.
 * Returns null if the role does not have access to any dashboard (e.g. member, user).
 */
export function getDashboardRouteForRole(
  role: string | null | undefined
): string | null {
  if (!role) return null;
  if (isCoachRole(role)) {
    return COACH_DASHBOARD_HOME;
  }
  if (isMailerRole(role)) {
    return MAILER_DASHBOARD_HOME;
  }
  if (isAccountantRole(role)) {
    return ACCOUNTANT_DASHBOARD_HOME;
  }
  if (isSalesManagerRole(role)) {
    return SALES_MANAGER_DASHBOARD_HOME;
  }
  if (isStaffRole(role)) {
    return STAFF_DASHBOARD_HOME;
  }
  return null;
}

/**
 * Why a signed-in account was turned away at the dashboard login.
 *
 * The role is named so the rejection is diagnosable: the credentials were
 * already accepted by the API, so this leaks nothing the user cannot see on
 * their own account. "sales" is called out because it is the one role that
 * looks like dashboard staff but is deliberately credit-only.
 */
export function unauthorizedRoleMessage(
  role: string | null | undefined
): string {
  if (role === "sales") {
    return (
      'This is a "Sales" account, which is only credited for package sales ' +
      "and cannot sign in to the dashboard. Ask management to change the " +
      'role to "Sales Manager" on the Accounts page.'
    );
  }
  const named = role ? `role "${role}"` : "role";
  return `Unauthorized ${named}. This account does not have dashboard access.`;
}

/** Pages that show cross-branch member data for all staff. */
export const SHARED_GLOBAL_PAGES = [
  "/dashboard/our-members",
  "/dashboard/member-requests",
  "/dashboard/package-freezes",
  "/dashboard/tickets",
  "/dashboard/sales",
] as const;

/** Pages where management acts as branch_admin after selecting a branch. */
export const BRANCH_SCOPED_PAGES = [
  "/dashboard/scans-monitor",
  "/dashboard/qr-codes",
  "/dashboard/sheet",
  "/dashboard/schedule",
  "/dashboard/catalog",
  "/dashboard/payments",
  "/dashboard/refunds",
  "/dashboard/checkout",
  "/dashboard/orders",
  "/dashboard/products",
  "/dashboard/finance",
] as const;

export function isSharedGlobalPage(path: string): boolean {
  return SHARED_GLOBAL_PAGES.some(
    (shared) => path === shared || path.startsWith(`${shared}/`)
  );
}

export function isBranchScopedPage(path: string): boolean {
  if (isSharedGlobalPage(path)) return false;
  return BRANCH_SCOPED_PAGES.some(
    (scoped) => path === scoped || path.startsWith(`${scoped}/`)
  );
}

/** True when the user can perform branch_admin-equivalent actions. */
export function canActAsBranchAdmin(
  role: string | undefined,
  selectedLocationId?: string | null,
  userLocationId?: string | null
): boolean {
  const permissionRole = toPermissionRole(role);
  if (permissionRole === "branch_admin") {
    return Boolean(userLocationId);
  }
  if (permissionRole === "management") {
    return Boolean(selectedLocationId);
  }
  return false;
}

export const PAGE_ROLES: Record<string, readonly PermissionRole[]> = {
  "/dashboard": [
    "management",
    "branch_admin",
    "mailer",
    "accountant",
    "sales_manager",
  ],
  "/dashboard/scans-monitor": ["management", "branch_admin", "accountant"],
  "/dashboard/qr-codes": ["management", "branch_admin"],
  "/dashboard/sheet": ["management", "accountant"],
  "/dashboard/our-members": ["management", "branch_admin", "accountant"],
  "/dashboard/member-requests": ["management", "branch_admin"],
  "/dashboard/package-freezes": ["management", "branch_admin"],
  "/dashboard/schedule": ["management", "branch_admin"],
  "/dashboard/catalog": ["management", "branch_admin"],
  "/dashboard/packages": ["management", "branch_admin"],
  "/dashboard/classes": ["management", "branch_admin"],
  "/dashboard/tickets": ["management", "branch_admin"],
  "/dashboard/payments": ["management", "branch_admin", "accountant"],
  "/dashboard/refunds": ["management", "branch_admin"],
  "/dashboard/checkout": ["management", "branch_admin"],
  "/dashboard/orders": ["management", "branch_admin"],
  "/dashboard/products": ["management", "branch_admin"],
  // Compose is write-only, so the accountant only gets the inbox and sent history.
  "/dashboard/mailing": ["management", "mailer"],
  "/dashboard/mailing/sent": ["management", "mailer", "accountant"],
  "/dashboard/mailing/received": ["management", "mailer", "accountant"],
  "/dashboard/accounts": ["management", "branch_admin"],
  "/dashboard/notifications": ["management"],
  "/dashboard/finance": ["accountant"],
  "/dashboard/sales": [
    "management",
    "branch_admin",
    "sales_manager",
    "accountant",
  ],
};

export function canAccessPage(
  role: string | undefined,
  path: string
): boolean {
  const permissionRole = toPermissionRole(role);
  if (!permissionRole) return false;

  const exact = PAGE_ROLES[path];
  if (exact) return exact.includes(permissionRole);

  const parentPath = Object.keys(PAGE_ROLES)
    .filter((key) => path.startsWith(`${key}/`) || path === key)
    .sort((a, b) => b.length - a.length)[0];

  if (parentPath) {
    return PAGE_ROLES[parentPath].includes(permissionRole);
  }

  // Default-deny: unknown dashboard paths are not accessible.
  return false;
}

/** Management-only capabilities (not part of branch_admin). */
export const MANAGEMENT_ONLY_ACTIONS = {
  locationCrud: ["management"] as const,
  ticketCategoryCrud: ["management"] as const,
  mail: ["management", "mailer"] as const,
  notifications: ["management"] as const,
  accountCrud: ["management", "branch_admin"] as const,
  paymentEdit: ["management", "branch_admin"] as const,
  paymentDelete: ["management"] as const,
  paymentEditDelete: ["management"] as const,
} as const;

/** Branch operational actions — management needs a selected branch. */
export const ACTION_ROLES = {
  classUpdateDelete: ["management", "branch_admin"] as const,
  packageUpdateDelete: ["management", "branch_admin"] as const,
  memberPackageSubscribe: ["management", "branch_admin"] as const,
  coachesCrud: ["management", "branch_admin"] as const,
  payments: ["management", "branch_admin"] as const,
  refunds: ["management", "branch_admin"] as const,
  products: ["management", "branch_admin"] as const,
  orders: ["management", "branch_admin"] as const,
} as const;

export type ActionKey = keyof typeof ACTION_ROLES;

export function canPerformAction(
  role: string | undefined,
  action: ActionKey,
  selectedLocationId?: string | null,
  userLocationId?: string | null
): boolean {
  const permissionRole = toPermissionRole(role);
  if (!permissionRole) return false;
  if (!(ACTION_ROLES[action] as readonly PermissionRole[]).includes(permissionRole)) {
    return false;
  }
  return canActAsBranchAdmin(role, selectedLocationId, userLocationId);
}

export function canPerformManagementOnlyAction(
  role: string | undefined,
  action: keyof typeof MANAGEMENT_ONLY_ACTIONS
): boolean {
  const permissionRole = toPermissionRole(role);
  if (!permissionRole) return false;
  return (MANAGEMENT_ONLY_ACTIONS[action] as readonly PermissionRole[]).includes(
    permissionRole
  );
}

/** branch_admin and management can override booking time restrictions. */
export function canOverrideBookingTimeRestrictions(
  role: string | undefined
): boolean {
  const permissionRole = toPermissionRole(role);
  return (
    permissionRole === "branch_admin" || permissionRole === "management"
  );
}
