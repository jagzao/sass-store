import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { Result, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { POSService } from "@/lib/services/POSService";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

const CreateSaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(["cash", "card", "mercadopago"]),
  customerName: z.string().optional(),
  tenantSlug: z.string().min(1, "Tenant slug is required"),
});

const posService = new POSService();

/**
 * POST /api/finance/pos/sales
 * Create a POS sale using Result Pattern.
 */
export const POST = withResultHandler(
  async (request: NextRequest) => {
    const body = await request.json();

    const validated = validateWithZod(CreateSaleSchema, body);
    if (!validated.success) {
      return validated;
    }

    const { tenantSlug, items, paymentMethod, customerName } = validated.data;

    // Resolve tenant from slug
    const tenantRow = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (tenantRow.length === 0) {
      return Err(ErrorFactories.notFound("Tenant", tenantSlug));
    }

    const tenantId = tenantRow[0].id;

    const result = await posService.createSale(tenantId, {
      items,
      paymentMethod,
      customerName,
    });

    return result;
  },
);
