import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/connection";
import { orders, orderItems } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      total,
      type = "purchase",
    } = body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order
    const [newOrder] = await db
      .insert(orders)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        orderNumber,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        status: "pending",
        type,
        total,
        currency: "MXN",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create order items
    const orderItemsToInsert = items.map((item: any) => ({
      id: crypto.randomUUID(),
      orderId: newOrder.id,
      type: item.type,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(orderItems).values(orderItemsToInsert);

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const tenantOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      orders: tenantOrders,
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
