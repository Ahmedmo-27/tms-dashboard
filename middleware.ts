import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getJwtRole(token: string | undefined): string | null {
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
  const isLoggedIn = Boolean(token);
  const role = getJwtRole(token);
  const isCoach = role === "coach";

  if (pathname === "/") {
    const target = request.nextUrl.clone();
    if (!isLoggedIn) {
      target.pathname = "/login";
    } else if (isCoach) {
      target.pathname = "/coach/today";
    } else {
      target.pathname = "/dashboard/scans-monitor";
    }
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (isLoggedIn && pathname === "/login") {
    const target = request.nextUrl.clone();
    target.pathname = isCoach ? "/coach/today" : "/dashboard/scans-monitor";
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
    if (isCoach) {
      // Coaches are strictly forbidden from staff routes — redirect to coach portal
      const coachUrl = request.nextUrl.clone();
      coachUrl.pathname = "/coach/today";
      coachUrl.search = "";
      return NextResponse.redirect(coachUrl);
    }
  }

  if (pathname.startsWith("/coach")) {
    if (isLoggedIn && !isCoach && role) {
      // Staff roles trying to access coach portal — redirect to staff dashboard
      const staffUrl = request.nextUrl.clone();
      staffUrl.pathname = "/dashboard/scans-monitor";
      staffUrl.search = "";
      return NextResponse.redirect(staffUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/coach/:path*", "/login"],
};

