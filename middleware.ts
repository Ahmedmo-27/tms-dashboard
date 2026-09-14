import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge UX gate: redirects unauthenticated users away from protected areas.
 * Authorization must still be enforced by the API; this only checks the
 * HttpOnly session cookie set by the Next login server action.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const isLoggedIn = Boolean(token);

  if (pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = isLoggedIn ? "/dashboard/scans-monitor" : "/login";
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (!isLoggedIn && (pathname.startsWith("/dashboard") || pathname.startsWith("/coach"))) {
    // Coach may authenticate with memory Bearer only (no Next cookie) — allow
    // /coach/* through to client RequireCoachAuth when no cookie. Still gate /dashboard.
    if (pathname.startsWith("/coach")) {
      return NextResponse.next();
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && pathname === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/dashboard/scans-monitor";
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/coach/:path*", "/login"],
};
