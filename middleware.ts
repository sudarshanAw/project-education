import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";
const protectSite = process.env.PROTECT_SITE === "true"; // our switch

export function middleware(request: NextRequest) {
  // Only run protection in production when PROTECT_SITE=true
  if (!(isProd && protectSite)) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Allow login + next static assets
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Everything else redirects to login (simple private mode)
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api).*)"],
};
