import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import {
  orders,
  orderItems,
  payments,
  products,
  posTerminals,
} from "@sass-store/database";
import { eq, and, sql } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { getActorId } from "@/lib/api-auth";

// Validation schemas
const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const createSaleSchema = z.object({
  terminalId: z.string().min(1).max(50),
  items: z.array(saleItemSchema).min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  paymentMethod: z.enum(["cash", "card", "mercadopago"]),
  notes: z.string().optional(),
});

/**
 * POST /api/finance/pos/sales
 * Create a new POS sale
 */
export async function POST(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "pos:sales:create");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const saleData = createSaleSchema.parse(body);

    // Validate terminal exists and is active
    const terminal = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select()
          .from(posTerminals)
          .where(
            and(
              eq(posTerminals.terminalId, saleData.terminalId),
              eq(posTerminals.status, "active")
            )
          )
          .limit(1);
      }
    )) as any[];

    if (terminal.length === 0) {
      return NextResponse.json(
        { error: "Terminal not found or inactive" },
        { status: 404 }
      );
    }

    // Validate all products exist and get their details
    const productIds = saleData.items.map((item) => item.productId);
    const productsData = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select({
            id: products.id,
            sku: products.sku,
            name: products.name,
            price: products.price,
          })
          .from(products)
          .where(sql`${products.id} = ANY(${productIds})`);
      }
    )) as any[];

    if (productsData.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    // Calculate totals
    const itemsWithDetails = saleData.items.map((item) => {
      const product = productsData.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      return {
        ...item,
        name: product.name,
        totalPrice: item.quantity * item.unitPrice,
      };
    });

    const totalAmount = itemsWithDetails.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // Generate order number
    const orderNumber = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          tenantId: tenant.id,
          orderNumber,
          customerName: saleData.customerName || "Cliente POS",
          customerEmail: saleData.customerEmail || null,
          status: "completed", // POS sales are immediately completed
          type: "purchase",
          total: totalAmount.toString(),
          currency: "MXN",
          metadata: {
            terminalId: saleData.terminalId,
            paymentMethod: saleData.paymentMethod,
            posSale: true,
            notes: saleData.notes,
          },
        })
        .returning();

      // Create order items
      const orderItemsData = itemsWithDetails.map((item) => ({
        orderId: newOrder.id,
        type: "product" as const,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
        metadata: {
          productId: item.productId,
        },
      }));

      await tx.insert(orderItems).values(orderItemsData);

      // Create payment record
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId: newOrder.id,
          tenantId: tenant.id,
          amount: totalAmount.toString(),
          currency: "MXN",
          status: "paid", // POS payments are immediately paid
          metadata: {
            paymentMethod: saleData.paymentMethod,
            terminalId: saleData.terminalId,
            posPayment: true,
          },
        })
        .returning();

      // Update terminal last sync
      await tx
        .update(posTerminals)
        .set({ lastSync: new Date() })
        .where(eq(posTerminals.terminalId, saleData.terminalId));

      return { order: newOrder, payment, items: orderItemsData };
    });

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: await getActorId(request),
      action: "pos_sale.created",
      targetTable: "orders",
      targetId: result.order.id,
      data: {
        terminalId: saleData.terminalId,
        totalAmount,
        itemCount: saleData.items.length,
        paymentMethod: saleData.paymentMethod,
      },
    });

    return NextResponse.json(
      {
        data: {
          order: result.order,
          payment: result.payment,
          items: result.items,
        },
        message: "POS sale completed successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POS sales POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
