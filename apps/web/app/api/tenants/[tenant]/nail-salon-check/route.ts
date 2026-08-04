import { NextRequest, NextResponse } from "next/server";
import { isNailSalon } from "@/lib/customers/nail-quote-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const nailSalon = await isNailSalon(tenant);
  return NextResponse.json({ nailSalon });
}
