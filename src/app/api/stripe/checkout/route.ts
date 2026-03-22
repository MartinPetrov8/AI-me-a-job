import { NextRequest, NextResponse } from 'next/server';
import { stripe as getStripe } from '@/lib/stripe/client';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { verifyAuth } from '@/lib/auth/verify';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const userRecord = user[0];
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Create or retrieve Stripe customer
    let customerId = userRecord.stripeCustomerId;

    if (!customerId) {
      const stripeClient = getStripe();
      const customer = await stripeClient.customers.create({
        email: userRecord.email || undefined,
        metadata: {
          userId: auth.userId,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const stripeClient = getStripe();
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/results?checkout=success`,
      cancel_url: `${origin}/results?checkout=cancelled`,
      metadata: {
        userId: auth.userId,
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
