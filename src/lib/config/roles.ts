/**
 * Role model:
 * - branch_admin: locked to user.locationId; full branch operational access.
 * - management: same branch abilities as branch_admin when a branch is selected
 *   (?locationId= in URL / locationId in request body); plus global-only actions
 *   (location CRUD, ticket category CRUD). Our Members is shared across branches.
 */

export const STAFF_ROLES = [
  "management",
  "branch_admin",
  "admin",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type PermissionRole = "management" | "branch_admin";

export function toPermissionRole(
  role: string | undefined
): PermissionRole | null {
  if (!role) return null;
  if (role === "admin" || role === "management") return "management";
  if (role === "branch_admin") return role;
  return null;
}

export function isStaffRole(role: string | undefined): boolean {
  return toPermissionRole(role) !== null;
}

export function isCoachRole(role: string | undefined): boolean {
  return role === "coach";
}

export function isBranchScopedRole(role: string | undefined): boolean {
  return toPermissionRole(role) === "branch_admin";
}

export function isManagementRole(role: string | undefined): boolean {
  return toPermissionRole(role) === "management";
}

/** Pages that show cross-branch member data for all staff. */
export const SHARED_GLOBAL_PAGES = [
  "/dashboard/our-members",
  "/dashboard/member-requests",
] as const;

/** Pages where management acts as branch_admin after selecting a branch. */
export const BRANCH_SCOPED_PAGES = [
  "/dashboard/scans-monitor",
  "/dashboard/qr-codes",
  "/dashboard/schedule",
  "/dashboard/catalog",
  "/dashboard/tickets",
  "/dashboard/payments",
  "/dashboard/refunds",
  "/dashboard/checkout",
  "/dashboard/orders",
  "/dashboard/products",
  "/dashboard/mailing",
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
  "/dashboard/scans-monitor": ["management", "branch_admin"],
  "/dashboard/qr-codes": ["management", "branch_admin"],
  "/dashboard/our-members": ["management", "branch_admin"],
  "/dashboard/member-requests": ["management", "branch_admin"],
  "/dashboard/schedule": ["management", "branch_admin"],
  "/dashboard/catalog": ["management", "branch_admin"],
  "/dashboard/tickets": ["management", "branch_admin"],
  "/dashboard/payments": ["management", "branch_admin"],
  "/dashboard/refunds": ["management", "branch_admin"],
  "/dashboard/checkout": ["management", "branch_admin"],
  "/dashboard/orders": ["management", "branch_admin"],
  "/dashboard/products": ["management", "branch_admin"],
  "/dashboard/mailing": ["management", "branch_admin"],
  "/dashboard/mailing/sent": ["management", "branch_admin"],
  "/dashboard/mailing/received": ["management", "branch_admin"],
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

  return true;
}

/** Management-only capabilities (not part of branch_admin). */
export const MANAGEMENT_ONLY_ACTIONS = {
  locationCrud: ["management"] as const,
  ticketCategoryCrud: ["management"] as const,
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
  mail: ["management", "branch_admin"] as const,
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
