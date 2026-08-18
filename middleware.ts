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

  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/coach-signup") ||
    pathname.startsWith("/coach/login");

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
    home.pathname = "/";
    return NextResponse.redirect(home);
  }

  // Silence unused for future tightening of auth pages
  void isAuthPage;

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/coach/:path*", "/login"],
};
