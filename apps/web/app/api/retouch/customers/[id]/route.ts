import { NextRequest, NextResponse } from "next/server";
import { RetouchService } from "@/lib/retouch-service";
import { isSuccess, getError } from "@sass-store/core";

/**
 * GET /api/retouch/customers/[id]
 * Get a specific customer's retouch information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // For testing purposes, we'll use a fixed tenant ID
    // In production, this should come from authentication
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID
    const { id: customerId } = await params;

    const result = await RetouchService.calculateNextRetouchDate(
      tenantId,
      customerId,
    );

    if (!isSuccess(result)) {
      const error = getError(result);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in GET /api/retouch/customers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/retouch/customers/[id]
 * Update a customer's next retouch date
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // For testing purposes, we'll use a fixed tenant ID
    // In production, this should come from authentication
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID
    const { id: customerId } = await params;
    const body = await request.json();
    const serviceId = body.serviceId;

    const result = await RetouchService.updateCustomerRetouchDate(
      tenantId,
      customerId,
      serviceId,
    );

    if (!isSuccess(result)) {
      const error = getError(result);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in POST /api/retouch/customers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
