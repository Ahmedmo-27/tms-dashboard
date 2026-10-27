/**
 * Exhaustive RBAC matrix.
 *
 * Every known role is asserted against every dashboard page and every action.
 * The point is not to restate `roles.ts` — it is to pin the *product* rules so
 * a refactor of the role helpers cannot silently widen access:
 *
 *   - accountant is strictly read-only and never gains a write action,
 *   - branch_admin is locked to its own branch,
 *   - management needs a selected branch for branch-scoped actions,
 *   - mailer only ever reaches mail,
 *   - coaches never reach the staff dashboard,
 *   - unknown / member / null roles are denied by default.
 */
import { describe, expect, it } from "vitest";
import {
  ACTION_ROLES,
  ACCOUNTANT_DASHBOARD_HOME,
  BRANCH_SCOPED_PAGES,
  COACH_DASHBOARD_HOME,
  MAILER_DASHBOARD_HOME,
  SALES_MANAGER_DASHBOARD_HOME,
  MANAGEMENT_ONLY_ACTIONS,
  PAGE_ROLES,
  SHARED_GLOBAL_PAGES,
  STAFF_DASHBOARD_HOME,
  STAFF_ROLES,
  canAccessPage,
  canActAsBranchAdmin,
  canOverrideBookingTimeRestrictions,
  canPerformAction,
  canPerformManagementOnlyAction,
  canViewAllBranches,
  canWriteMail,
  getDashboardRouteForRole,
  canAssignSalesAttribution,
  isAccountantRole,
  isSalesManagerRole,
  isBranchScopedPage,
  isBranchScopedRole,
  isCoachRole,
  isMailerRole,
  isManagementRole,
  isManagingCoachRole,
  isSharedGlobalPage,
  isStaffRole,
  toPermissionRole,
  type ActionKey,
} from "@/lib/config/roles";

/** Every role string the API's User model can store. */
const API_ROLES = [
  "member",
  "user",
  "admin",
  "management",
  "branch_admin",
  "coach",
  "managing_coach",
  "mailer",
  "accountant",
  "sales",
  "sales_manager",
] as const;

/** Inputs that must never resolve to a role, including hostile ones. */
const NON_ROLES = [
  null,
  undefined,
  "",
  "   ",
  "MANAGEMENT",
  "Management",
  "superadmin",
  "root",
  "owner",
  "admin ",
  "accountant;management",
  "management,accountant",
  "../management",
  "__proto__",
  "constructor",
  "toString",
] as const;

const LOC_A = "6a3e9509c72a8d349f150900";
const LOC_B = "6a3e9509c72a8d349f150910";

const ALL_ACTIONS = Object.keys(ACTION_ROLES) as ActionKey[];
const ALL_MGMT_ONLY = Object.keys(
  MANAGEMENT_ONLY_ACTIONS
) as (keyof typeof MANAGEMENT_ONLY_ACTIONS)[];
const ALL_PAGES = Object.keys(PAGE_ROLES);

describe("toPermissionRole normalisation", () => {
  it("folds admin into management", () => {
    expect(toPermissionRole("admin")).toBe("management");
  });

  it.each([
    "management",
    "branch_admin",
    "mailer",
    "accountant",
    "sales_manager",
  ])(
    "maps %s to itself",
    (role) => {
      expect(toPermissionRole(role)).toBe(role);
    }
  );

  // "sales" is only credited for a sale — it has no dashboard of its own.
  it.each(["member", "user", "coach", "managing_coach", "sales"])(
    "gives %s no staff permission role",
    (role) => {
      expect(toPermissionRole(role)).toBeNull();
    }
  );

  it.each(NON_ROLES)("rejects the non-role %p", (role) => {
    expect(toPermissionRole(role as string | null | undefined)).toBeNull();
  });

  it("is case sensitive — no uppercase bypass", () => {
    expect(toPermissionRole("ACCOUNTANT")).toBeNull();
    expect(toPermissionRole("Branch_Admin")).toBeNull();
  });

  it("does not treat prototype keys as roles", () => {
    // A JWT carrying role: "__proto__" must not resolve through the
    // PAGE_ROLES object prototype chain.
    expect(toPermissionRole("__proto__")).toBeNull();
    expect(canAccessPage("__proto__", "/dashboard/finance")).toBe(false);
  });
});

describe("role predicates are mutually consistent", () => {
  it.each(API_ROLES)("%s: staff and coach are disjoint", (role) => {
    expect(isStaffRole(role) && isCoachRole(role)).toBe(false);
  });

  it("recognises every declared staff role", () => {
    for (const role of STAFF_ROLES) {
      expect(isStaffRole(role)).toBe(true);
    }
  });

  it("identifies coaches", () => {
    expect(isCoachRole("coach")).toBe(true);
    expect(isCoachRole("managing_coach")).toBe(true);
    expect(isManagingCoachRole("managing_coach")).toBe(true);
    expect(isManagingCoachRole("coach")).toBe(false);
  });

  it("identifies the single-purpose roles", () => {
    expect(isMailerRole("mailer")).toBe(true);
    expect(isAccountantRole("accountant")).toBe(true);
    expect(isSalesManagerRole("sales_manager")).toBe(true);
    expect(isSalesManagerRole("sales")).toBe(false);
    expect(isManagementRole("admin")).toBe(true);
    expect(isManagementRole("management")).toBe(true);
    expect(isBranchScopedRole("branch_admin")).toBe(true);
    expect(isBranchScopedRole("management")).toBe(false);
  });

  it.each([
    "member",
    "user",
    "coach",
    "managing_coach",
    "sales",
    ...NON_ROLES,
  ])(
    "denies staff status to %p",
    (role) => {
      expect(isStaffRole(role as string | null)).toBe(false);
    }
  );
});

describe("landing route per role", () => {
  const expected: Array<[string, string | null]> = [
    ["admin", STAFF_DASHBOARD_HOME],
    ["management", STAFF_DASHBOARD_HOME],
    ["branch_admin", STAFF_DASHBOARD_HOME],
    ["mailer", MAILER_DASHBOARD_HOME],
    ["accountant", ACCOUNTANT_DASHBOARD_HOME],
    ["sales_manager", SALES_MANAGER_DASHBOARD_HOME],
    ["sales", null],
    ["coach", COACH_DASHBOARD_HOME],
    ["managing_coach", COACH_DASHBOARD_HOME],
    ["member", null],
    ["user", null],
  ];

  it.each(expected)("%s lands on %s", (role, route) => {
    expect(getDashboardRouteForRole(role)).toBe(route);
  });

  it.each(NON_ROLES)("gives no landing route to %p", (role) => {
    expect(getDashboardRouteForRole(role as string | null)).toBeNull();
  });

  it("every landing route is a page the role may actually open", () => {
    for (const role of [
      "admin",
      "management",
      "branch_admin",
      "mailer",
      "accountant",
      "sales_manager",
    ]) {
      const route = getDashboardRouteForRole(role);
      expect(route, `${role} has no landing route`).toBeTruthy();
      expect(
        canAccessPage(role, route as string),
        `${role} cannot open its own landing route ${route}`
      ).toBe(true);
    }
  });
});

describe("page access matrix", () => {
  // Explicit expectation table, written out rather than derived from
  // PAGE_ROLES so that editing PAGE_ROLES alone cannot make the test pass.
  const MATRIX: Record<string, string[]> = {
    "/dashboard": [
      "management",
      "branch_admin",
      "mailer",
      "accountant",
      "sales_manager",
    ],
    "/dashboard/scans-monitor": ["management", "branch_admin"],
    "/dashboard/qr-codes": ["management", "branch_admin"],
    "/dashboard/sheet": ["management", "branch_admin"],
    "/dashboard/our-members": ["management", "branch_admin"],
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
    "/dashboard/mailing": ["management", "mailer"],
    "/dashboard/mailing/sent": ["management", "mailer", "accountant"],
    "/dashboard/mailing/received": ["management", "mailer", "accountant"],
    "/dashboard/accounts": ["management"],
    "/dashboard/finance": ["management", "accountant"],
    "/dashboard/sales": [
      "management",
      "branch_admin",
      "sales_manager",
      "accountant",
    ],
  };

  const PERMISSION_ROLES = [
    "management",
    "branch_admin",
    "mailer",
    "accountant",
    "sales_manager",
  ] as const;

  it("covers every page declared in PAGE_ROLES", () => {
    expect(Object.keys(MATRIX).sort()).toEqual([...ALL_PAGES].sort());
  });

  for (const [page, allowed] of Object.entries(MATRIX)) {
    describe(page, () => {
      for (const role of PERMISSION_ROLES) {
        const shouldAllow = allowed.includes(role);
        it(`${shouldAllow ? "allows" : "denies"} ${role}`, () => {
          expect(canAccessPage(role, page)).toBe(shouldAllow);
        });
      }

      it("treats admin exactly like management", () => {
        expect(canAccessPage("admin", page)).toBe(
          canAccessPage("management", page)
        );
      });

      it.each(["coach", "managing_coach", "member", "user", "sales"])(
        "denies %s",
        (role) => {
          expect(canAccessPage(role, page)).toBe(false);
        }
      );

      it.each(NON_ROLES)("denies the non-role %p", (role) => {
        expect(canAccessPage(role as string | undefined, page)).toBe(false);
      });
    });
  }
});

describe("page access falls back to the longest matching parent", () => {
  const cases: Array<[string, string, boolean]> = [
    // Finance sub-pages inherit /dashboard/finance.
    ["accountant", "/dashboard/finance/sales", true],
    ["accountant", "/dashboard/finance/ledger", true],
    ["accountant", "/dashboard/finance/report", true],
    ["accountant", "/dashboard/finance/coach-hours", true],
    ["accountant", "/dashboard/finance/deferred-revenue", true],
    ["accountant", "/dashboard/finance/retention", true],
    ["accountant", "/dashboard/finance/branches", true],
    ["accountant", "/dashboard/finance/pt", true],
    ["accountant", "/dashboard/finance/coach-packages", true],
    ["branch_admin", "/dashboard/finance/sales", false],
    ["mailer", "/dashboard/finance/sales", false],
    // Dynamic segments inherit their parent list.
    ["branch_admin", "/dashboard/our-members/665544332211aabbccddeeff", true],
    ["accountant", "/dashboard/our-members/665544332211aabbccddeeff", false],
    ["branch_admin", "/dashboard/packages/665544332211aabbccddeeff", true],
    ["accountant", "/dashboard/packages/665544332211aabbccddeeff", false],
    // Mail: compose is management/mailer, archives add the accountant.
    ["accountant", "/dashboard/mailing", false],
    ["accountant", "/dashboard/mailing/sent", true],
    ["accountant", "/dashboard/mailing/received", true],
    ["mailer", "/dashboard/mailing", true],
    ["branch_admin", "/dashboard/mailing", false],
    ["branch_admin", "/dashboard/mailing/sent", false],
    // Sales attribution: the sales_manager owns it, finance roles are not in it.
    ["sales_manager", "/dashboard/sales", true],
    ["accountant", "/dashboard/sales", true],
    ["mailer", "/dashboard/sales", false],
    ["sales_manager", "/dashboard/finance/sales", false],
    ["sales_manager", "/dashboard/our-members", false],
  ];

  it.each(cases)("%s on %s -> %s", (role, path, expected) => {
    expect(canAccessPage(role, path)).toBe(expected);
  });

  it("prefers the most specific parent, not the first match", () => {
    // /dashboard/mailing/sent must resolve to its own entry (accountant: yes),
    // not to /dashboard/mailing (accountant: no) or /dashboard (accountant: yes).
    expect(canAccessPage("accountant", "/dashboard/mailing/sent")).toBe(true);
    expect(canAccessPage("accountant", "/dashboard/mailing")).toBe(false);
  });
});

describe("paths outside the dashboard tree are denied outright", () => {
  const outside = [
    "/dashboardfinance",
    "/internal/metrics",
    "/coach/today",
    "/api/admin/users",
    "/login",
    "/",
    "",
  ];

  it.each(outside)("denies every staff role on %p", (path) => {
    for (const role of [
      "management",
      "branch_admin",
      "mailer",
      "accountant",
      "sales_manager",
    ]) {
      expect(canAccessPage(role, path), `${role} reached ${path}`).toBe(false);
    }
  });
});

describe("unregistered paths under /dashboard inherit the shell, not default-deny", () => {
  /*
   * Documented behaviour of canAccessPage: it picks the LONGEST registered key
   * that the path sits under. "/dashboard" is itself registered (it is the
   * shell layout, open to all four staff roles), so an unregistered child such
   * as "/dashboard/whatever" inherits the shell's permissive list rather than
   * being denied.
   *
   * The "Default-deny" comment in roles.ts therefore only holds for paths
   * outside the dashboard tree (covered above). This is pinned deliberately:
   * the consequence is that a NEW page added under /dashboard without a
   * PAGE_ROLES entry is reachable by every staff role, including the
   * read-only accountant and the mail-only mailer. The guard against that is
   * the page-registry coverage test in test/rbac/page-registry.test.ts, which
   * fails when a real page is missing from PAGE_ROLES.
   */
  const unregistered = [
    "/dashboard/not-a-real-page",
    "/dashboard/admin-secret",
    // Sibling prefix: NOT a child of /dashboard/finance (no "/" boundary),
    // so it falls back to /dashboard, not to the finance entry.
    "/dashboard/finance-report",
  ];

  it.each(unregistered)("resolves %p to the /dashboard shell list", (path) => {
    for (const role of [
      "management",
      "branch_admin",
      "mailer",
      "accountant",
      "sales_manager",
    ]) {
      expect(canAccessPage(role, path)).toBe(canAccessPage(role, "/dashboard"));
    }
  });

  it("a sibling prefix does not inherit the finance entry", () => {
    // If "/dashboard/finance-report" had inherited /dashboard/finance, then
    // branch_admin (denied on finance) would be denied here too. It is not —
    // proving the fallback used /dashboard and respected the "/" boundary.
    expect(canAccessPage("branch_admin", "/dashboard/finance")).toBe(false);
    expect(canAccessPage("branch_admin", "/dashboard/finance-report")).toBe(
      true
    );
  });
});

describe("branch scoping of pages", () => {
  it("marks every declared branch-scoped page", () => {
    for (const page of BRANCH_SCOPED_PAGES) {
      expect(isBranchScopedPage(page), `${page} not branch scoped`).toBe(true);
    }
  });

  it("marks every declared shared page as global, never branch scoped", () => {
    for (const page of SHARED_GLOBAL_PAGES) {
      expect(isSharedGlobalPage(page)).toBe(true);
      expect(isBranchScopedPage(page), `${page} leaked into branch scope`).toBe(
        false
      );
    }
  });

  it("no page is both shared-global and branch-scoped", () => {
    const overlap = BRANCH_SCOPED_PAGES.filter((p) =>
      (SHARED_GLOBAL_PAGES as readonly string[]).includes(p)
    );
    expect(overlap).toEqual([]);
  });

  it("applies scoping to child routes", () => {
    expect(isBranchScopedPage("/dashboard/schedule/week-2")).toBe(true);
    expect(isSharedGlobalPage("/dashboard/our-members/abc123")).toBe(true);
    expect(isBranchScopedPage("/dashboard/our-members/abc123")).toBe(false);
  });

  it("does not scope unrelated or sibling-prefix paths", () => {
    expect(isBranchScopedPage("/dashboard/accounts")).toBe(false);
    expect(isBranchScopedPage("/dashboard/schedulex")).toBe(false);
    expect(isSharedGlobalPage("/dashboard/ticketsx")).toBe(false);
  });
});

describe("cross-branch visibility", () => {
  it("management, accountant and sales_manager may view all branches", () => {
    expect(canViewAllBranches("management")).toBe(true);
    expect(canViewAllBranches("admin")).toBe(true);
    expect(canViewAllBranches("accountant")).toBe(true);
    expect(canViewAllBranches("sales_manager")).toBe(true);
  });

  it("branch_admin and mailer may not", () => {
    expect(canViewAllBranches("branch_admin")).toBe(false);
    expect(canViewAllBranches("mailer")).toBe(false);
  });

  it.each(["coach", "member", "user", "sales", ...NON_ROLES])(
    "denies cross-branch view to %p",
    (role) => {
      expect(canViewAllBranches(role as string | null)).toBe(false);
    }
  );
});

describe("canActAsBranchAdmin", () => {
  it("branch_admin acts only when it has its own locationId", () => {
    expect(canActAsBranchAdmin("branch_admin", null, LOC_A)).toBe(true);
    expect(canActAsBranchAdmin("branch_admin", LOC_B, LOC_A)).toBe(true);
    expect(canActAsBranchAdmin("branch_admin", null, null)).toBe(false);
    expect(canActAsBranchAdmin("branch_admin", LOC_B, null)).toBe(false);
    expect(canActAsBranchAdmin("branch_admin", LOC_B, "")).toBe(false);
  });

  it("management acts only after selecting a branch", () => {
    expect(canActAsBranchAdmin("management", LOC_A, null)).toBe(true);
    expect(canActAsBranchAdmin("admin", LOC_A, null)).toBe(true);
    expect(canActAsBranchAdmin("management", null, LOC_A)).toBe(false);
    expect(canActAsBranchAdmin("management", "", LOC_A)).toBe(false);
    expect(canActAsBranchAdmin("management", undefined, undefined)).toBe(false);
  });

  it.each([
    "accountant",
    "mailer",
    "sales_manager",
    "sales",
    "coach",
    "managing_coach",
    "member",
    "user",
  ])("never lets %s act as branch admin, even with both ids", (role) => {
    expect(canActAsBranchAdmin(role, LOC_A, LOC_A)).toBe(false);
  });

  it.each(NON_ROLES)("never lets %p act as branch admin", (role) => {
    expect(canActAsBranchAdmin(role as string | undefined, LOC_A, LOC_A)).toBe(
      false
    );
  });
});

describe("branch-scoped action matrix", () => {
  it("covers every declared action", () => {
    expect([...ALL_ACTIONS].sort()).toEqual(
      [
        "classUpdateDelete",
        "coachesCrud",
        "memberPackageSubscribe",
        "orders",
        "packageUpdateDelete",
        "payments",
        "products",
        "refunds",
      ].sort()
    );
  });

  describe.each(ALL_ACTIONS)("%s", (action) => {
    it("branch_admin with its own branch may act", () => {
      expect(canPerformAction("branch_admin", action, null, LOC_A)).toBe(true);
    });

    it("branch_admin without a branch may not", () => {
      expect(canPerformAction("branch_admin", action, null, null)).toBe(false);
    });

    it("management may act once a branch is selected", () => {
      expect(canPerformAction("management", action, LOC_A, null)).toBe(true);
      expect(canPerformAction("admin", action, LOC_A, null)).toBe(true);
    });

    it("management may NOT act before selecting a branch", () => {
      expect(canPerformAction("management", action, null, null)).toBe(false);
      expect(canPerformAction("management", action, "", null)).toBe(false);
    });

    it("accountant is refused even with every id supplied", () => {
      expect(canPerformAction("accountant", action, LOC_A, LOC_A)).toBe(false);
    });

    it.each([
      "mailer",
      "sales_manager",
      "sales",
      "coach",
      "managing_coach",
      "member",
      "user",
    ])(
      "%s is refused",
      (role) => {
        expect(canPerformAction(role, action, LOC_A, LOC_A)).toBe(false);
      }
    );

    it.each(NON_ROLES)("non-role %p is refused", (role) => {
      expect(
        canPerformAction(role as string | undefined, action, LOC_A, LOC_A)
      ).toBe(false);
    });
  });
});

describe("management-only action matrix", () => {
  it("covers every declared management-only action", () => {
    expect([...ALL_MGMT_ONLY].sort()).toEqual(
      [
        "accountCrud",
        "locationCrud",
        "mail",
        "paymentEditDelete",
        "ticketCategoryCrud",
      ].sort()
    );
  });

  describe.each(ALL_MGMT_ONLY)("%s", (action) => {
    it("management and admin may act", () => {
      expect(canPerformManagementOnlyAction("management", action)).toBe(true);
      expect(canPerformManagementOnlyAction("admin", action)).toBe(true);
    });

    it("branch_admin may not", () => {
      expect(canPerformManagementOnlyAction("branch_admin", action)).toBe(false);
    });

    it("accountant may not", () => {
      expect(canPerformManagementOnlyAction("accountant", action)).toBe(false);
    });

    it("sales_manager may not", () => {
      expect(canPerformManagementOnlyAction("sales_manager", action)).toBe(
        false
      );
    });

    it.each(["coach", "managing_coach", "member", "user"])(
      "%s may not",
      (role) => {
        expect(canPerformManagementOnlyAction(role, action)).toBe(false);
      }
    );

    it.each(NON_ROLES)("non-role %p may not", (role) => {
      expect(
        canPerformManagementOnlyAction(role as string | undefined, action)
      ).toBe(false);
    });
  });

  it("mail is the one management-only action the mailer shares", () => {
    expect(canPerformManagementOnlyAction("mailer", "mail")).toBe(true);
    for (const action of ALL_MGMT_ONLY.filter((a) => a !== "mail")) {
      expect(
        canPerformManagementOnlyAction("mailer", action),
        `mailer unexpectedly allowed ${action}`
      ).toBe(false);
    }
  });
});

describe("mail write permission", () => {
  it("management and mailer may write", () => {
    expect(canWriteMail("management")).toBe(true);
    expect(canWriteMail("admin")).toBe(true);
    expect(canWriteMail("mailer")).toBe(true);
  });

  it("accountant may read mail but never write it", () => {
    expect(canAccessPage("accountant", "/dashboard/mailing/received")).toBe(
      true
    );
    expect(canWriteMail("accountant")).toBe(false);
  });

  it.each([
    "branch_admin",
    "sales_manager",
    "sales",
    "coach",
    "managing_coach",
    "member",
    "user",
    ...NON_ROLES,
  ])("denies mail write to %p", (role) => {
    expect(canWriteMail(role as string | null)).toBe(false);
  });
});

describe("booking time-restriction override", () => {
  it("is limited to management and branch_admin", () => {
    expect(canOverrideBookingTimeRestrictions("management")).toBe(true);
    expect(canOverrideBookingTimeRestrictions("admin")).toBe(true);
    expect(canOverrideBookingTimeRestrictions("branch_admin")).toBe(true);
  });

  it.each([
    "accountant",
    "mailer",
    "sales_manager",
    "sales",
    "coach",
    "managing_coach",
    "member",
    "user",
    ...NON_ROLES,
  ])("denies override to %p", (role) => {
    expect(canOverrideBookingTimeRestrictions(role as string | undefined)).toBe(
      false
    );
  });
});

describe("accountant writes nothing but the sales attribution", () => {
  it("appears in no branch-scoped action list", () => {
    for (const [action, roles] of Object.entries(ACTION_ROLES)) {
      expect(
        (roles as readonly string[]).includes("accountant"),
        `accountant found in ACTION_ROLES.${action}`
      ).toBe(false);
    }
  });

  it("appears in no management-only action list", () => {
    for (const [action, roles] of Object.entries(MANAGEMENT_ONLY_ACTIONS)) {
      expect(
        (roles as readonly string[]).includes("accountant"),
        `accountant found in MANAGEMENT_ONLY_ACTIONS.${action}`
      ).toBe(false);
    }
  });

  it("may set who sold a package — its one write", () => {
    // Deliberate exception to the read-only rule, and the only one: the
    // attribution is not a branch action, so it stays out of ACTION_ROLES.
    expect(canAssignSalesAttribution("accountant")).toBe(true);
  });

  it("cannot perform any action under any combination of branch ids", () => {
    const idCombos: Array<[string | null, string | null]> = [
      [null, null],
      [LOC_A, null],
      [null, LOC_A],
      [LOC_A, LOC_B],
      [LOC_A, LOC_A],
    ];
    for (const action of ALL_ACTIONS) {
      for (const [selected, own] of idCombos) {
        expect(
          canPerformAction("accountant", action, selected, own),
          `accountant performed ${action} with (${selected}, ${own})`
        ).toBe(false);
      }
    }
  });

  it("reaches finance, payments, the mail archives and sales attribution", () => {
    const reachable = ALL_PAGES.filter((p) => canAccessPage("accountant", p));
    expect(reachable.sort()).toEqual(
      [
        "/dashboard",
        "/dashboard/finance",
        "/dashboard/mailing/received",
        "/dashboard/mailing/sent",
        "/dashboard/payments",
        "/dashboard/sales",
      ].sort()
    );
  });
});

describe("mailer is mail-only", () => {
  it("reaches only the dashboard shell and mail", () => {
    const reachable = ALL_PAGES.filter((p) => canAccessPage("mailer", p));
    expect(reachable.sort()).toEqual(
      [
        "/dashboard",
        "/dashboard/mailing",
        "/dashboard/mailing/received",
        "/dashboard/mailing/sent",
      ].sort()
    );
  });

  it("performs no branch action", () => {
    for (const action of ALL_ACTIONS) {
      expect(canPerformAction("mailer", action, LOC_A, LOC_A)).toBe(false);
    }
  });
});

describe("sales_manager owns sales attribution only", () => {
  it("reaches only the dashboard shell and the sales page", () => {
    const reachable = ALL_PAGES.filter((p) => canAccessPage("sales_manager", p));
    expect(reachable.sort()).toEqual(["/dashboard", "/dashboard/sales"].sort());
  });

  it("performs no branch action", () => {
    for (const action of ALL_ACTIONS) {
      expect(canPerformAction("sales_manager", action, LOC_A, LOC_A)).toBe(
        false
      );
    }
  });

  it("appears in no branch-scoped or management-only action list", () => {
    for (const [action, roles] of Object.entries(ACTION_ROLES)) {
      expect(
        (roles as readonly string[]).includes("sales_manager"),
        `sales_manager found in ACTION_ROLES.${action}`
      ).toBe(false);
    }
    for (const [action, roles] of Object.entries(MANAGEMENT_ONLY_ACTIONS)) {
      expect(
        (roles as readonly string[]).includes("sales_manager"),
        `sales_manager found in MANAGEMENT_ONLY_ACTIONS.${action}`
      ).toBe(false);
    }
  });
});

describe("sales attribution write permission", () => {
  it("is held by sales_manager, management, branch_admin and the accountant", () => {
    expect(canAssignSalesAttribution("sales_manager")).toBe(true);
    expect(canAssignSalesAttribution("management")).toBe(true);
    expect(canAssignSalesAttribution("admin")).toBe(true);
    expect(canAssignSalesAttribution("branch_admin")).toBe(true);
    expect(canAssignSalesAttribution("accountant")).toBe(true);
  });

  it.each([
    "mailer",
    "sales",
    "coach",
    "managing_coach",
    "member",
    "user",
    ...NON_ROLES,
  ])("denies the sales attribution write to %p", (role) => {
    expect(canAssignSalesAttribution(role as string | null)).toBe(false);
  });
});

describe("branch_admin reach", () => {
  it("never reaches finance, accounts or mail", () => {
    for (const page of [
      "/dashboard/finance",
      "/dashboard/finance/sales",
      "/dashboard/accounts",
      "/dashboard/mailing",
      "/dashboard/mailing/sent",
      "/dashboard/mailing/received",
    ]) {
      expect(canAccessPage("branch_admin", page), `reached ${page}`).toBe(false);
    }
  });

  it("is a strict subset of management page reach", () => {
    for (const page of ALL_PAGES) {
      if (canAccessPage("branch_admin", page)) {
        expect(
          canAccessPage("management", page),
          `branch_admin reaches ${page} but management does not`
        ).toBe(true);
      }
    }
  });
});

describe("no role escalates through an alias", () => {
  it("admin never exceeds management anywhere", () => {
    for (const page of ALL_PAGES) {
      expect(canAccessPage("admin", page)).toBe(
        canAccessPage("management", page)
      );
    }
    for (const action of ALL_ACTIONS) {
      expect(canPerformAction("admin", action, LOC_A, LOC_A)).toBe(
        canPerformAction("management", action, LOC_A, LOC_A)
      );
    }
  });

  it("every API role resolves to a known permission role or none", () => {
    for (const role of API_ROLES) {
      const resolved = toPermissionRole(role);
      expect(
        resolved === null ||
          [
            "management",
            "branch_admin",
            "mailer",
            "accountant",
            "sales_manager",
          ].includes(resolved)
      ).toBe(true);
    }
  });
});
