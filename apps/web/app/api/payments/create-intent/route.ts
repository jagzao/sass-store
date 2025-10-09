import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { db } from "@/lib/db/connection";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe with fallback for build-time
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "sk_test_fallback_for_build";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-08-27.basil",
});

interface CreatePaymentIntentRequest {
  orderId: string;
  currency?: string;
  paymentMethodTypes?: string[];
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    // Self-healing fallback for build-time when secrets aren't available
    if (stripeSecretKey === "sk_test_fallback_for_build") {
      console.warn(
        "[Self-Healing] Stripe payment intent creation disabled during build"
      );
      return NextResponse.json(
        { message: "Payment intent creation disabled during build" },
        { status: 200 }
      );
    }

    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const body: CreatePaymentIntentRequest = await request.json();
    const {
      orderId,
      currency = "mxn",
      paymentMethodTypes = ["card"],
      metadata = {},
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch order details from database
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify order belongs to the current tenant
    if (order.tenantId !== tenantId) {
      return NextResponse.json(
        { error: "Order not found in tenant context" },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.status === "paid") {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 400 }
      );
    }

    // Fetch order items to calculate total
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.unitPrice as string) * item.quantity;
    }, 0);

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency,
      payment_method_types: paymentMethodTypes,
      metadata: {
        orderId,
        tenantId,
        ...metadata,
      },
      description: `Order ${order.orderNumber} - ${order.customerName}`,
      receipt_email: order.customerEmail || undefined,
      shipping: order.shippingAddress
        ? {
            name: order.customerName,
            address: {
              line1: order.shippingAddress.street || "",
              city: order.shippingAddress.city || "",
              state: order.shippingAddress.state || "",
              postal_code: order.shippingAddress.postalCode || "",
              country: order.shippingAddress.country || "MX",
            },
          }
        : undefined,
    });

    // Update order with payment intent ID
    await db
      .update(orders)
      .set({
        paymentIntentId: paymentIntent.id,
        status: "payment_pending",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Self-healing fallback for build-time when secrets aren't available
    if (stripeSecretKey === "sk_test_fallback_for_build") {
      console.warn(
        "[Self-Healing] Stripe payment intent retrieval disabled during build"
      );
      return NextResponse.json(
        { message: "Payment intent retrieval disabled during build" },
        { status: 200 }
      );
    }

    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("paymentIntentId");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID is required" },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify payment intent belongs to current tenant
    if (paymentIntent.metadata.tenantId !== tenantId) {
      return NextResponse.json(
        { error: "Payment intent not found in tenant context" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    console.error("Payment intent retrieval error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve payment intent" },
      { status: 500 }
    );
  }
}
