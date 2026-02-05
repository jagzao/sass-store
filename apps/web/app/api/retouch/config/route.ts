import { NextRequest, NextResponse } from "next/server";
import { RetouchService } from "@/lib/retouch-service";
import { isSuccess, getError } from "@sass-store/core";

/**
 * GET /api/retouch/config
 * Get all retouch configurations for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    // For testing purposes, we'll use a fixed tenant ID
    // In production, this should come from authentication
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID

    const result = await RetouchService.getServiceRetouchConfigs(tenantId);

    if (!isSuccess(result)) {
      const error = getError(result);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in GET /api/retouch/config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/retouch/config
 * Create or update a retouch configuration
 */
export async function POST(request: NextRequest) {
  try {
    // For testing purposes, we'll use a fixed tenant ID
    // In production, this should come from authentication
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID

    const body = await request.json();
    const {
      serviceId,
      frequencyType,
      frequencyValue,
      businessDaysOnly,
      isDefault,
    } = body;

    // Validate required fields
    if (!serviceId || !frequencyType || frequencyValue === undefined) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: serviceId, frequencyType, frequencyValue",
        },
        { status: 400 },
      );
    }

    // Validate frequency type
    const validFrequencyTypes = ["days", "weeks", "months"];
    if (!validFrequencyTypes.includes(frequencyType)) {
      return NextResponse.json(
        {
          error: `Invalid frequency type. Must be one of: ${validFrequencyTypes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate frequency value
    if (typeof frequencyValue !== "number" || frequencyValue <= 0) {
      return NextResponse.json(
        { error: "Frequency value must be a positive number" },
        { status: 400 },
      );
    }

    const result = await RetouchService.upsertServiceRetouchConfig(
      tenantId,
      serviceId,
      frequencyType,
      frequencyValue,
      businessDaysOnly || false,
      isDefault || false,
    );

    if (!isSuccess(result)) {
      const error = getError(result);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/retouch/config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
