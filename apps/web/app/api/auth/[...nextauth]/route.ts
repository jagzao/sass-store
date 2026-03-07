import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { withNoCache } from "@/lib/cache-headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  // SEC-011: Ensure auth responses are never cached
  return withNoCache(response as NextResponse);
}

export async function POST(request: NextRequest) {
  const response = await handlers.POST(request);
  // SEC-011: Ensure auth responses are never cached
  return withNoCache(response as NextResponse);
}
