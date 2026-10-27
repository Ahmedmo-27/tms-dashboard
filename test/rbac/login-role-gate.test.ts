/**
 * The dashboard login role gate.
 *
 * "sales" is the one role that looks like dashboard staff but is deliberately
 * credit-only, so a sales account turned away at login must say so instead of
 * leaving the operator with a dead end. "sales_manager" is the role that owns
 * the sales dashboard and must land on it.
 */
import { describe, expect, it } from "vitest";
import {
  SALES_MANAGER_DASHBOARD_HOME,
  getDashboardRouteForRole,
  isCoachRole,
  isStaffRole,
  unauthorizedRoleMessage,
} from "@/lib/config/roles";

const rejected = (role: string | null | undefined) =>
  !isStaffRole(role) && !isCoachRole(role);

describe("the login role gate", () => {
  it("turns away a sales account and names sales_manager as the fix", () => {
    expect(rejected("sales")).toBe(true);
    expect(getDashboardRouteForRole("sales")).toBeNull();

    const message = unauthorizedRoleMessage("sales");
    expect(message).toContain("Sales Manager");
    expect(message).toContain("cannot sign in");
  });

  it("lets a sales_manager in and lands it on the sales dashboard", () => {
    expect(rejected("sales_manager")).toBe(false);
    expect(getDashboardRouteForRole("sales_manager")).toBe(
      SALES_MANAGER_DASHBOARD_HOME
    );
  });

  it("names the rejected role so the failure is diagnosable", () => {
    expect(unauthorizedRoleMessage("member")).toContain('role "member"');
    expect(unauthorizedRoleMessage("user")).toContain('role "user"');
  });

  it("still reads sensibly when the API sends no role at all", () => {
    for (const role of [null, undefined, ""]) {
      expect(rejected(role)).toBe(true);
      expect(unauthorizedRoleMessage(role)).toBe(
        "Unauthorized role. This account does not have dashboard access."
      );
    }
  });
});
