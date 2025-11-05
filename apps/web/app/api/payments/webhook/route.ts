import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db/connection';
import { orders, payments, bookings, disputes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPaymentConfirmation, sendPaymentFailedNotification, sendDisputeNotification } from '@/lib/email/email-service';

// Initialize Stripe - fail fast if credentials are missing
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Validate required credentials
if (!stripeSecretKey) {
  console.error('[Stripe] STRIPE_SECRET_KEY is not configured');
}
if (!webhookSecret) {
  console.error('[Stripe] STRIPE_WEBHOOK_SECRET is not configured');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-08-27.basil' })
  : null;

export async function POST(request: NextRequest) {
  try {
    // Fail fast if Stripe is not properly configured
    if (!stripe || !webhookSecret) {
      console.error('[Stripe] Webhook endpoint called but Stripe is not configured');
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
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

    // Send confirmation email to customer
    if (updatedOrder.customerEmail) {
      await sendPaymentConfirmation({
        to: updatedOrder.customerEmail,
        orderId: updatedOrder.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        orderDetails: {
          items: updatedOrder.items as any[] || [],
          total: updatedOrder.total,
          tenantId
        }
      }).catch(err => console.error('Failed to send confirmation email:', err));
    }

    // Update inventory if applicable
    // Note: Inventory management would be implemented based on order items
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

    // Send payment failed email to customer
    const [failedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (failedOrder?.customerEmail) {
      await sendPaymentFailedNotification({
        to: failedOrder.customerEmail,
        orderId,
        reason: paymentIntent.last_payment_error?.message || 'Unknown error',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase()
      }).catch(err => console.error('Failed to send failure notification:', err));
    }

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
    const paymentResults = await db
      .select()
      .from(payments)
      .where(eq(payments.metadata, { stripeChargeId: chargeId }));

    if (paymentResults.length > 0) {
      const payment = paymentResults[0];
      
      // Update order status to disputed
      await db
        .update(orders)
        .set({
          status: 'disputed',
          updatedAt: new Date()
        })
        .where(eq(orders.id, payment.orderId));

      // Create dispute record for tracking
      await db.insert(disputes).values({
        id: dispute.id,
        tenantId: payment.tenantId,
        paymentId: payment.id,
        orderId: payment.orderId,
        status: dispute.status,
        reason: dispute.reason,
        amount: dispute.amount / 100, // Convert from cents
        currency: dispute.currency,
        evidenceDueBy: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null,
        metadata: {
          stripeDisputeId: dispute.id,
          stripeChargeId: chargeId,
          ...dispute.metadata
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Notify tenant of dispute
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .limit(1);

      if (order?.customerEmail) {
        await sendDisputeNotification({
          to: order.customerEmail,
          orderId: payment.orderId,
          disputeId: dispute.id,
          amount: dispute.amount / 100,
          currency: dispute.currency.toUpperCase(),
          reason: dispute.reason,
          status: dispute.status
        }).catch(err => console.error('Failed to send dispute notification:', err));
      }
    }

    console.log(`Charge dispute created for charge ${chargeId}`);

  } catch (error) {
    console.error('Error handling charge dispute:', error);
    throw error;
  }
}