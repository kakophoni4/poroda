import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "poroda_admin";
const SESSION_COOKIE = "poroda_session";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (path.startsWith("/account")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account", "/account/:path*"],
};
