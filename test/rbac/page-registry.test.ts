/**
 * Page-registry coverage.
 *
 * canAccessPage falls back to the longest registered parent, and "/dashboard"
 * itself is registered and open to all four staff roles. So a new page added
 * under /dashboard without a PAGE_ROLES entry is silently reachable by every
 * staff role — including the read-only accountant and the mail-only mailer.
 *
 * This suite walks the real App Router tree on disk and fails when a page is
 * not covered by a PAGE_ROLES entry more specific than the "/dashboard" shell.
 * It is the structural guard behind the role matrix: the matrix checks the
 * rules, this checks that every page is actually subject to one.
 */
import { readdirSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_ROLES, canAccessPage } from "@/lib/config/roles";

const APP_DIR = join(process.cwd(), "src", "app");

/** Collects every `page.tsx` under src/app as a URL route. */
function collectRoutes(dir: string): string[] {
  const routes: string[] = [];

  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (/^page\.(tsx|ts|jsx|js)$/.test(entry)) {
        const rel = relative(dir, current).split(sep).join(posix.sep);
        routes.push(rel === "" ? "/" : `/${rel}`);
      }
    }
  };

  walk(dir);
  return routes.sort();
}

const ALL_ROUTES = collectRoutes(APP_DIR);

/** Routes with a dynamic segment inherit their parent list by design. */
const isDynamic = (route: string) => route.includes("[");

/** Next.js route groups are not part of the URL. */
const stripGroups = (route: string) =>
  route
    .split("/")
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")))
    .join("/") || "/";

const DASHBOARD_ROUTES = ALL_ROUTES.map(stripGroups).filter((r) =>
  r.startsWith("/dashboard")
);

/**
 * The PAGE_ROLES key that canAccessPage would resolve `path` to —
 * mirrors the production lookup so the test reports *which* entry applies.
 */
function resolvedEntry(path: string): string | undefined {
  if (PAGE_ROLES[path]) return path;
  return Object.keys(PAGE_ROLES)
    .filter((key) => path.startsWith(`${key}/`) || path === key)
    .sort((a, b) => b.length - a.length)[0];
}

describe("App Router tree discovery", () => {
  it("finds the dashboard pages on disk", () => {
    // Sanity check: if the glob breaks, every assertion below would pass
    // vacuously. Keep a floor so a broken walk fails loudly.
    expect(DASHBOARD_ROUTES.length).toBeGreaterThan(20);
    expect(DASHBOARD_ROUTES).toContain("/dashboard/finance");
    expect(DASHBOARD_ROUTES).toContain("/dashboard/accounts");
  });

  it("finds the coach pages on disk", () => {
    const coachRoutes = ALL_ROUTES.map(stripGroups).filter((r) =>
      r.startsWith("/coach/")
    );
    expect(coachRoutes.length).toBeGreaterThan(5);
  });
});

describe("every dashboard page is governed by a PAGE_ROLES entry", () => {
  // "/dashboard" is the shell itself, so it legitimately resolves to its own
  // entry; every other page must have a rule of its own.
  const staticRoutes = DASHBOARD_ROUTES.filter(
    (r) => !isDynamic(r) && r !== "/dashboard"
  );

  it.each(staticRoutes)(
    "%s resolves to an entry more specific than the shell",
    (route) => {
      const entry = resolvedEntry(route);

      expect(entry, `${route} matches no PAGE_ROLES entry at all`).toBeTruthy();

      // "/dashboard" is the shell and allows all four staff roles. A page that
      // resolves to it has no access rule of its own.
      expect(
        entry,
        `${route} is not registered in PAGE_ROLES and falls back to the ` +
          `"/dashboard" shell, so every staff role (accountant and mailer ` +
          `included) can open it. Add an explicit PAGE_ROLES entry.`
      ).not.toBe("/dashboard");
    }
  );

  it("the only page allowed to resolve to the shell is /dashboard itself", () => {
    const shellFallbacks = staticRoutes.filter(
      (r) => r !== "/dashboard" && resolvedEntry(r) === "/dashboard"
    );
    expect(shellFallbacks).toEqual([]);
  });
});

describe("dynamic dashboard routes inherit a governed parent", () => {
  const dynamicRoutes = DASHBOARD_ROUTES.filter(isDynamic);

  it("has dynamic routes to check", () => {
    expect(dynamicRoutes.length).toBeGreaterThan(0);
  });

  it.each(dynamicRoutes)("%s inherits a non-shell parent", (route) => {
    // Substitute a realistic ObjectId for the dynamic segment.
    const concrete = route.replace(/\[[^\]]+\]/g, "665544332211aabbccddeeff");
    const entry = resolvedEntry(concrete);
    expect(entry, `${concrete} matches no PAGE_ROLES entry`).toBeTruthy();
    expect(
      entry,
      `${concrete} falls back to the /dashboard shell; register its parent`
    ).not.toBe("/dashboard");
  });
});

describe("PAGE_ROLES has no dead entries", () => {
  it("every registered key corresponds to a real page or page prefix", () => {
    const dead = Object.keys(PAGE_ROLES).filter((key) => {
      if (key === "/dashboard") return false; // the shell layout
      return !DASHBOARD_ROUTES.some(
        (route) => route === key || route.startsWith(`${key}/`)
      );
    });
    expect(
      dead,
      `PAGE_ROLES declares keys with no page behind them: ${dead.join(", ")}`
    ).toEqual([]);
  });

  it("every registered key lists at least one role", () => {
    for (const [key, roles] of Object.entries(PAGE_ROLES)) {
      expect(roles.length, `${key} grants access to nobody`).toBeGreaterThan(0);
    }
  });

  it("every registered key names only known permission roles", () => {
    const known = [
      "management",
      "branch_admin",
      "mailer",
      "accountant",
      "sales_manager",
    ];
    for (const [key, roles] of Object.entries(PAGE_ROLES)) {
      for (const role of roles) {
        expect(known, `${key} lists unknown role ${role}`).toContain(role);
      }
    }
  });

  it("no key is listed twice with different casing", () => {
    const lower = Object.keys(PAGE_ROLES).map((k) => k.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });
});

describe("coach pages are never reachable by staff role checks", () => {
  const coachRoutes = ALL_ROUTES.map(stripGroups)
    .filter((r) => r.startsWith("/coach"))
    .map((r) => r.replace(/\[[^\]]+\]/g, "665544332211aabbccddeeff"));

  it.each(coachRoutes)("%s is denied to every staff role", (route) => {
    for (const role of [
      "management",
      "branch_admin",
      "mailer",
      "accountant",
      "sales_manager",
    ]) {
      expect(canAccessPage(role, route), `${role} reached ${route}`).toBe(false);
    }
  });
});
