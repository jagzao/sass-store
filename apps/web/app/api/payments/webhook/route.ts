import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db/connection';
import { orders, payments, bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe with fallback for build-time
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fallback_for_build';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_fallback_for_build';

export async function POST(request: NextRequest) {
  try {
    // Self-healing fallback for build-time when secrets aren't available
    if (stripeSecretKey === 'sk_test_fallback_for_build') {
      console.warn('[Self-Healing] Stripe webhook disabled during build');
      return NextResponse.json({ message: 'Webhook disabled during build' }, { status: 200 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'invoice.payment_succeeded':
        // Handle subscription payments if implemented
        console.log('Invoice payment succeeded:', event.data.object);
        break;

      case 'customer.subscription.updated':
        // Handle subscription updates if implemented
        console.log('Subscription updated:', event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const tenantId = paymentIntent.metadata.tenantId;

    if (!orderId || !tenantId) {
      throw new Error('Missing order ID or tenant ID in payment intent metadata');
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Create payment record
    await db.insert(payments).values({
      id: crypto.randomUUID(),
      tenantId,
      orderId,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: 'completed',
      paymentMethod: paymentIntent.payment_method_types[0] || 'card',
      metadata: {
        stripeChargeId: paymentIntent.latest_charge as string || '',
        receiptUrl: null // Will be populated by separate charge webhook if needed
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // If this is a booking order, update booking status by customer email match
    if (updatedOrder.type === 'booking' && updatedOrder.customerEmail) {
      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          updatedAt: new Date()
        })
        .where(eq(bookings.customerEmail, updatedOrder.customerEmail));
    }

    // TODO: Send confirmation email to customer
    // TODO: Send notification to tenant
    // TODO: Update inventory if applicable

    console.log(`Payment succeeded for order ${orderId}`);

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const tenantId = paymentIntent.metadata.tenantId;

    if (!orderId || !tenantId) {
      throw new Error('Missing order ID or tenant ID in payment intent metadata');
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: 'payment_failed',
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    // Create payment record for failed payment
    await db.insert(payments).values({
      id: crypto.randomUUID(),
      tenantId,
      orderId,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'failed',
      paymentMethod: paymentIntent.payment_method_types[0] || 'card',
      metadata: {
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown error'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // TODO: Send payment failed email to customer
    // TODO: Notify tenant of failed payment

    console.log(`Payment failed for order ${orderId}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      throw new Error('Missing order ID in payment intent metadata');
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: 'canceled',
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    console.log(`Payment canceled for order ${orderId}`);

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    throw error;
  }
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  try {
    const chargeId = dispute.charge as string;

    // Find the payment record associated with this charge
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.metadata, { stripeChargeId: chargeId }))
      .limit(1);

    if (payment) {
      // Update order status to disputed
      await db
        .update(orders)
        .set({
          status: 'disputed',
          updatedAt: new Date()
        })
        .where(eq(orders.id, payment.orderId));

      // TODO: Notify tenant of dispute
      // TODO: Create dispute record for tracking
    }

    console.log(`Charge dispute created for charge ${chargeId}`);

  } catch (error) {
    console.error('Error handling charge dispute:', error);
    throw error;
  }
}