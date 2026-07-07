import { NextResponse, type NextRequest } from "next/server";
import { match } from "@sass-store/core/src/result";
import {
  getHttpStatusCode,
  type DomainError,
} from "@sass-store/core/src/errors/types";
import { subscribeToPush } from "@/lib/push/pushService";

export const dynamic = "force-dynamic";

// STRY-026 — Suscripción push por tenant (Result Pattern).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
): Promise<NextResponse> {
  const { tenant } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Invalid JSON body", type: "ValidationError" },
      },
      { status: 400 },
    );
  }

  const result = await subscribeToPush(tenant, body);

  return match(result, {
    ok: (data): NextResponse =>
      NextResponse.json({ success: true, data }, { status: 201 }),
    err: (error): NextResponse =>
      NextResponse.json(
        {
          success: false,
          error: { message: error.message, type: error.type },
        },
        { status: getHttpStatusCode(error as DomainError) },
      ),
  });
}
