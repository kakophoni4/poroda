import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
  verifyUserSessionToken,
} from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(adminCookie);
    if (!session) {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      if (adminCookie) res.cookies.delete(ADMIN_COOKIE_NAME);
      return res;
    }
  }

  if (path.startsWith("/account")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifyUserSessionToken(sessionCookie);
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", path);
      const res = NextResponse.redirect(loginUrl);
      if (sessionCookie) res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account", "/account/:path*"],
};
