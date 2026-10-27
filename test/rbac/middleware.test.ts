/**
 * Edge middleware gate.
 *
 * middleware.ts is the first thing a request hits. It decodes the JWT *without
 * verifying the signature* (it is a UX gate, not the security boundary — the
 * API re-checks everything), so the tests below cover both the happy paths and
 * the malformed / hostile token shapes that must not crash the edge or let a
 * role through.
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware, config } from "../../middleware";
import {
  COACH_DASHBOARD_HOME,
  STAFF_DASHBOARD_HOME,
} from "@/lib/config/roles";

const BASE = "https://dash.example.test";

/** Builds an unsigned JWT-shaped string with the given payload. */
function tokenFor(payload: Record<string, unknown>): string {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.c2lnbmF0dXJl`;
}

function request(path: string, token?: string | null): NextRequest {
  const req = new NextRequest(new URL(path, BASE));
  if (token !== undefined && token !== null) {
    req.cookies.set("token", token);
  }
  return req;
}

/** Reads the Location header of a redirect response as a pathname. */
function redirectPath(res: Response): string | null {
  const loc = res.headers.get("location");
  if (!loc) return null;
  return new URL(loc, BASE).pathname;
}

const isPassThrough = (res: Response) =>
  res.status === 200 && res.headers.get("location") === null;

const ROLE_TOKENS = {
  management: tokenFor({ role: "management", uid: "u1" }),
  admin: tokenFor({ role: "admin", uid: "u2" }),
  branch_admin: tokenFor({ role: "branch_admin", uid: "u3" }),
  mailer: tokenFor({ role: "mailer", uid: "u4" }),
  accountant: tokenFor({ role: "accountant", uid: "u5" }),
  sales_manager: tokenFor({ role: "sales_manager", uid: "u10" }),
  coach: tokenFor({ role: "coach", uid: "u6" }),
  managing_coach: tokenFor({ role: "managing_coach", uid: "u7" }),
  member: tokenFor({ role: "member", uid: "u8" }),
  user: tokenFor({ role: "user", uid: "u9" }),
} as const;

const STAFF = [
  "management",
  "admin",
  "branch_admin",
  "mailer",
  "accountant",
  "sales_manager",
] as const;
const COACHES = ["coach", "managing_coach"] as const;
const NON_PORTAL = ["member", "user"] as const;

describe("matcher scope", () => {
  it("guards the root, login, dashboard and coach trees only", () => {
    expect(config.matcher).toEqual([
      "/",
      "/dashboard/:path*",
      "/coach/:path*",
      "/login",
    ]);
  });
});

describe("root redirect", () => {
  it("sends anonymous visitors to /login", () => {
    const res = middleware(request("/"));
    expect(redirectPath(res)).toBe("/login");
  });

  it.each(STAFF)("sends %s to its own dashboard home", (role) => {
    const res = middleware(request("/", ROLE_TOKENS[role]));
    const expected =
      role === "mailer"
        ? "/dashboard/mailing"
        : role === "accountant"
          ? "/dashboard/finance"
          : role === "sales_manager"
            ? "/dashboard/sales"
            : STAFF_DASHBOARD_HOME;
    expect(redirectPath(res)).toBe(expected);
  });

  it.each(COACHES)("sends %s to the coach portal", (role) => {
    const res = middleware(request("/", ROLE_TOKENS[role]));
    expect(redirectPath(res)).toBe(COACH_DASHBOARD_HOME);
  });

  it.each(NON_PORTAL)("sends %s to /login — no portal exists", (role) => {
    const res = middleware(request("/", ROLE_TOKENS[role]));
    expect(redirectPath(res)).toBe("/login");
  });

  it("drops the query string when redirecting off the root", () => {
    const res = middleware(request("/?next=%2Fdashboard%2Faccounts", ROLE_TOKENS.accountant));
    const loc = new URL(res.headers.get("location") as string, BASE);
    expect(loc.pathname).toBe("/dashboard/finance");
    expect(loc.search).toBe("");
  });
});

describe("/login", () => {
  it("is reachable while anonymous", () => {
    expect(isPassThrough(middleware(request("/login")))).toBe(true);
  });

  it.each([...STAFF, ...COACHES])(
    "bounces the signed-in %s away from /login",
    (role) => {
      const res = middleware(request("/login", ROLE_TOKENS[role]));
      expect(redirectPath(res)).toBeTruthy();
    }
  );

  it.each(NON_PORTAL)("keeps %s on /login — it has no dashboard", (role) => {
    expect(isPassThrough(middleware(request("/login", ROLE_TOKENS[role])))).toBe(
      true
    );
  });
});

describe("/dashboard tree", () => {
  const paths = [
    "/dashboard",
    "/dashboard/scans-monitor",
    "/dashboard/finance",
    "/dashboard/accounts",
    "/dashboard/our-members/665544332211aabbccddeeff",
  ];

  it.each(paths)("lets staff through to %s", (path) => {
    for (const role of STAFF) {
      expect(
        isPassThrough(middleware(request(path, ROLE_TOKENS[role]))),
        `${role} was blocked from ${path}`
      ).toBe(true);
    }
  });

  it.each(paths)("redirects anonymous visitors from %s to /login", (path) => {
    expect(redirectPath(middleware(request(path)))).toBe("/login");
  });

  it.each(paths)("redirects coaches from %s to the coach portal", (path) => {
    for (const role of COACHES) {
      expect(
        redirectPath(middleware(request(path, ROLE_TOKENS[role]))),
        `${role} was not bounced from ${path}`
      ).toBe(COACH_DASHBOARD_HOME);
    }
  });

  it.each(paths)("redirects members from %s to /login", (path) => {
    for (const role of NON_PORTAL) {
      expect(redirectPath(middleware(request(path, ROLE_TOKENS[role])))).toBe(
        "/login"
      );
    }
  });

  it("note: the edge gate is coarse — per-page rules are canAccessPage's job", () => {
    // The middleware only separates staff from coach from anonymous. It does
    // NOT enforce PAGE_ROLES, so a mailer passes the edge on /dashboard/accounts
    // and is stopped by the page-level guard instead. Pinned so that a future
    // reader does not mistake this for a hole in canAccessPage.
    expect(
      isPassThrough(middleware(request("/dashboard/accounts", ROLE_TOKENS.mailer)))
    ).toBe(true);
  });
});

describe("/coach tree", () => {
  const paths = ["/coach", "/coach/today", "/coach/clients", "/coach/settings"];

  it.each(paths)("lets coaches through to %s", (path) => {
    for (const role of COACHES) {
      expect(
        isPassThrough(middleware(request(path, ROLE_TOKENS[role]))),
        `${role} was blocked from ${path}`
      ).toBe(true);
    }
  });

  it.each(paths)("bounces staff from %s to the staff dashboard", (path) => {
    for (const role of STAFF) {
      expect(
        redirectPath(middleware(request(path, ROLE_TOKENS[role]))),
        `${role} was not bounced from ${path}`
      ).toBe(STAFF_DASHBOARD_HOME);
    }
  });

  it.each(paths)("lets anonymous visitors reach %s (page-level auth takes over)", (path) => {
    // No token => isStaff is false => the staff-bounce branch is skipped.
    // Pinned as current behaviour; the coach pages do their own auth check.
    expect(isPassThrough(middleware(request(path)))).toBe(true);
  });
});

describe("malformed and hostile tokens never crash the edge", () => {
  const bad = [
    "",
    "not-a-jwt",
    "a.b",
    "a.b.c.d",
    "....",
    "header.%%%%.sig",
    // valid base64, invalid JSON
    `${Buffer.from("{}").toString("base64url")}.${Buffer.from("not json").toString("base64url")}.sig`,
    // valid JSON, no role
    tokenFor({ uid: "u1" }),
    // role of the wrong type
    tokenFor({ role: 42 }),
    tokenFor({ role: null }),
    tokenFor({ role: { name: "management" } }),
    tokenFor({ role: ["management"] }),
    // JSON null / array payloads
    `${Buffer.from("{}").toString("base64url")}.${Buffer.from("null").toString("base64url")}.sig`,
    `${Buffer.from("{}").toString("base64url")}.${Buffer.from("[1,2]").toString("base64url")}.sig`,
  ];

  it.each(bad)("treats %p as unauthenticated on /dashboard", (token) => {
    const res = middleware(request("/dashboard", token));
    expect(redirectPath(res)).toBe("/login");
  });

  it.each(bad)("treats %p as unauthenticated on the root", (token) => {
    expect(redirectPath(middleware(request("/", token)))).toBe("/login");
  });

  it("does not accept a role smuggled in the header segment", () => {
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const smuggled = `${b64({ role: "management" })}.${b64({ uid: "u1" })}.sig`;
    expect(redirectPath(middleware(request("/dashboard", smuggled)))).toBe(
      "/login"
    );
  });

  it("does not accept a case-variant role", () => {
    for (const role of ["MANAGEMENT", "Management", "Coach", "ACCOUNTANT"]) {
      expect(
        redirectPath(middleware(request("/dashboard", tokenFor({ role })))),
        `${role} was accepted`
      ).toBe("/login");
    }
  });

  it("does not accept an invented privileged role", () => {
    for (const role of ["superadmin", "root", "owner", "__proto__"]) {
      expect(
        redirectPath(middleware(request("/dashboard", tokenFor({ role })))),
        `${role} was accepted`
      ).toBe("/login");
    }
  });
});

describe("paths outside the matcher are untouched by role logic", () => {
  // The matcher means these never reach middleware in production; calling it
  // directly documents that it would not redirect them anyway.
  it.each(["/coach-signup", "/error/network"])("%s passes through", (path) => {
    expect(isPassThrough(middleware(request(path)))).toBe(true);
  });

  it("/coach-signup is not caught by the /coach prefix check for staff", () => {
    // startsWith("/coach") is true for "/coach-signup", so a staff user
    // calling middleware on it WOULD be bounced. The matcher prevents that in
    // production; pinned here so a matcher change surfaces the interaction.
    const res = middleware(request("/coach-signup", ROLE_TOKENS.management));
    expect(redirectPath(res)).toBe(STAFF_DASHBOARD_HOME);
  });
});
