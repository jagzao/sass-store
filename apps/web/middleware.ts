import { NextRequest, NextResponse } from "next/server";

// Cookie names used by NextAuth v5 (authjs)
const SESSION_COOKIE_PROD = "__Secure-authjs.session-token";
const SESSION_COOKIE_DEV = "authjs.session-token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isTenantAdmin = /^\/t\/[^/]+\/admin(\/|$)/.test(pathname);

  if (!isAdminRoute && !isTenantAdmin) return NextResponse.next();

  // Check for an active session cookie (Edge-compatible, no DB access)
  // Full JWT validation happens in the server component via auth()
  const sessionCookie =
    req.cookies.get(SESSION_COOKIE_PROD)?.value ??
    req.cookies.get(SESSION_COOKIE_DEV)?.value;

  if (!sessionCookie) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/t/:tenant/admin/:path*"],
};
