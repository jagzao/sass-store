import { NextRequest, NextResponse } from "next/server";
import { withTenantContextFromParams } from "@/lib/db/tenant-context";
import { getTenantNailQuoteCatalog } from "@/lib/customers/nail-quote-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  return withTenantContextFromParams(
    request,
    params,
    async (_req, tenantId) => {
      const catalog = await getTenantNailQuoteCatalog(tenantId);
      return NextResponse.json({
        success: true,
        data: catalog.map((o) => ({
          id: o.id,
          category: o.category,
          key: o.key,
          label: o.label,
          basePrice: o.basePrice,
          baseDurationMinutes: o.baseDurationMinutes,
          imageUrl: o.imageUrl,
          order: o.order,
        })),
      });
    },
  );
}
