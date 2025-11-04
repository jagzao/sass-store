import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mercadoPagoService } from "@/lib/mercadopago";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";

// Validation schemas
const getPaymentsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("50"),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("0"),
});

/**
 * GET /api/mercadopago/payments
 * Fetch payments from Mercado Pago
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(
      tenant.id,
      "mercadopago:payments"
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const params = getPaymentsSchema.parse(queryParams);

    // Check if Mercado Pago is connected
    const isConnected = await mercadoPagoService.isConnected(tenant.id);
    if (!isConnected) {
      return NextResponse.json(
        {
          error: "Mercado Pago not connected",
          connectUrl: `/api/mercadopago/connect`,
        },
        { status: 403 }
      );
    }

    // Build options
    const options: any = {
      limit: params.limit,
      offset: params.offset,
    };

    if (params.from) options.from = new Date(params.from);
    if (params.to) options.to = new Date(params.to);
    if (params.status) options.status = params.status;

    // Fetch payments from Mercado Pago
    const payments = await mercadoPagoService.getPayments(tenant.id, options);

    return NextResponse.json({
      data: payments,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        hasMore: payments.length === params.limit,
      },
    });
  } catch (error) {
    console.error("Mercado Pago payments error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
