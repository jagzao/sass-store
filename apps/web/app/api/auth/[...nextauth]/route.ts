import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { withNoCache } from "@/lib/cache-headers";
import { authRateLimiter } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  // SEC-011: Ensure auth responses are never cached
  return withNoCache(response as NextResponse);
}

export async function POST(request: NextRequest) {
  // STRY-022: Rate limiting en login — previene brute force de credenciales
  // Solo aplica a la acción de signIn (no a callbacks OAuth)
  const url = request.nextUrl;
  const isSignIn =
    url.pathname.endsWith("/callback/credentials") ||
    url.searchParams.get("callbackUrl") !== null;

  if (isSignIn) {
    const rl = await authRateLimiter.checkLimit(request, "login");
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rl.resetTime - Date.now()) / 1000),
            ),
          },
        },
      );
    }
  }

  const response = await handlers.POST(request);
  // SEC-011: Ensure auth responses are never cached
  return withNoCache(response as NextResponse);
}
