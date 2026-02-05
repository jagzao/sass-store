import { NextRequest, NextResponse } from "next/server";
import { RetouchService } from "@/lib/retouch-service";

/**
 * GET /api/retouch/customers
 * Get customers ordered by next retouch date
 */
export async function GET(request: NextRequest) {
  try {
    // For testing purposes, we'll use a fixed tenant ID
    // In production, this should come from authentication
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await RetouchService.getCustomersByRetouchDate(
      tenantId,
      limit,
      offset,
    );

    if (result.isErr) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    console.error("Error in GET /api/retouch/customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
