import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Payment system health check
export async function GET() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fallback_for_build';

    if (stripeSecretKey === 'sk_test_fallback_for_build') {
      return NextResponse.json({
        status: 'healthy',
        service: 'payments',
        provider: 'stripe',
        mode: 'fallback',
        message: 'Payment system running in fallback mode during build',
        timestamp: new Date().toISOString()
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil'
    });

    // Test Stripe connectivity
    const account = await stripe.accounts.retrieve();

    return NextResponse.json({
      status: 'healthy',
      service: 'payments',
      provider: 'stripe',
      mode: 'live',
      accountId: account.id,
      country: account.country,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Payment Health Check] Failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      service: 'payments',
      provider: 'stripe',
      error: error instanceof Error ? error.message : 'Unknown payment error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';