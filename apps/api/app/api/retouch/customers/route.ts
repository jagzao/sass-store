import { NextRequest } from "next/server";
import { RetouchService } from "@/lib/retouch-service";
import { withResultHandler } from "@/lib/middleware/result-handler";
import { getCurrentTenant } from "@/lib/auth-utils";

/**
 * GET /api/retouch/customers
 * Get customers ordered by next retouch date
 */
export const GET = withResultHandler(
  async (request: NextRequest): Promise<any> => {
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      throw new Error("Unauthorized: No tenant found");
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    return await RetouchService.getCustomersByRetouchDate(
      tenant.id,
      limit,
      offset,
    );
  },
);
