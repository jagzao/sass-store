import { NextRequest } from "next/server";
import { RetouchService } from "@/lib/retouch-service";
import { withResultHandler } from "@/lib/middleware/result-handler";
import { getCurrentTenant } from "@/lib/auth-utils";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/retouch/customers/[id]
 * Update a customer's next retouch date
 */
export const POST = withResultHandler(
  async (request: NextRequest, { params }: RouteParams): Promise<any> => {
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      throw new Error("Unauthorized: No tenant found");
    }

    const customerId = params.id;
    const body = await request.json();
    const { serviceId } = body;

    return await RetouchService.updateCustomerRetouchDate(
      tenant.id,
      customerId,
      serviceId,
    );
  },
);
