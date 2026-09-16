import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isCoachRole,
  isStaffRole,
  getDashboardRouteForRole,
  COACH_DASHBOARD_HOME,
  STAFF_DASHBOARD_HOME,
} from "@/lib/config/roles";

function getJwtRole(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * Edge UX gate: redirects unauthenticated users away from protected areas
 * and prevents cross-role access between Staff and Coach dashboards.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const role = getJwtRole(token);
  const isCoach = isCoachRole(role);
  const isStaff = isStaffRole(role);
  const isAuthenticated = Boolean(token) && (isCoach || isStaff);
  const dashboardHome = getDashboardRouteForRole(role);

  if (pathname === "/") {
    const target = request.nextUrl.clone();
    if (!isAuthenticated || !dashboardHome) {
      target.pathname = "/login";
    } else {
      target.pathname = dashboardHome;
    }
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (pathname === "/login") {
    if (isAuthenticated && dashboardHome) {
      const target = request.nextUrl.clone();
      target.pathname = dashboardHome;
      target.search = "";
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated || !isStaff) {
      if (isCoach) {
        // Coaches are strictly forbidden from staff routes — redirect to coach portal
        const coachUrl = request.nextUrl.clone();
        coachUrl.pathname = COACH_DASHBOARD_HOME;
        coachUrl.search = "";
        return NextResponse.redirect(coachUrl);
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/coach")) {
    if (Boolean(token) && isStaff && !isCoach) {
      // Staff roles trying to access coach portal — redirect to staff dashboard
      const staffUrl = request.nextUrl.clone();
      staffUrl.pathname = STAFF_DASHBOARD_HOME;
      staffUrl.search = "";
      return NextResponse.redirect(staffUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/coach/:path*", "/login"],
};

