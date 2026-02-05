import { NextRequest } from "next/server";
import { RetouchService } from "@/lib/retouch-service";
import { withResultHandler } from "@/lib/middleware/result-handler";
import { getCurrentTenant } from "@/lib/auth-utils";

/**
 * GET /api/retouch/config
 * Get all service retouch configurations for the current tenant
 */
export const GET = withResultHandler(
  async (request: NextRequest): Promise<any> => {
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      throw new Error("Unauthorized: No tenant found");
    }

    return await RetouchService.getServiceRetouchConfigs(tenant.id);
  },
);

/**
 * POST /api/retouch/config
 * Create or update a service retouch configuration
 */
export const POST = withResultHandler(
  async (request: NextRequest): Promise<any> => {
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      throw new Error("Unauthorized: No tenant found");
    }

    const body = await request.json();
    const {
      serviceId,
      frequencyType,
      frequencyValue,
      businessDaysOnly,
      isDefault,
    } = body;

    // Validate required fields
    if (!serviceId || !frequencyType || !frequencyValue) {
      throw new Error(
        "Missing required fields: serviceId, frequencyType, frequencyValue",
      );
    }

    // Validate frequency type
    const validFrequencyTypes = ["days", "weeks", "months"];
    if (!validFrequencyTypes.includes(frequencyType)) {
      throw new Error(
        `Invalid frequency type: ${frequencyType}. Must be one of: ${validFrequencyTypes.join(", ")}`,
      );
    }

    // Validate frequency value
    if (frequencyValue < 1) {
      throw new Error("Frequency value must be greater than 0");
    }

    return await RetouchService.upsertServiceRetouchConfig(
      tenant.id,
      serviceId,
      frequencyType,
      frequencyValue,
      businessDaysOnly || false,
      isDefault || false,
    );
  },
);
