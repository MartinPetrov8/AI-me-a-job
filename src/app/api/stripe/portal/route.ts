import { NextRequest, NextResponse } from 'next/server';
import { stripe as getStripe } from '@/lib/stripe/client';
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

    if (!userRecord.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 },
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Create billing portal session
    const stripeClient = getStripe();
    const session = await stripeClient.billingPortal.sessions.create({
      customer: userRecord.stripeCustomerId,
      return_url: `${origin}/results`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 },
    );
  }
}
