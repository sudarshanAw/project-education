import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const protectSite = process.env.PROTECT_SITE === "true";

  // Only protect in production when PROTECT_SITE=true
  if (!(isProd && protectSite)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow login page and static files
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Redirect everything else to login
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api).*)"],
};
