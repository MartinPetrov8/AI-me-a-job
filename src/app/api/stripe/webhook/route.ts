import { NextRequest, NextResponse } from 'next/server';
import { stripe as getStripe } from '@/lib/stripe/client';
import { updateSubscriptionStatus } from '@/lib/stripe/subscription';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 },
      );
    }

    let event;
    try {
      const stripeClient = getStripe();
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 },
      );
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;

        if (userId && session.customer) {
          await updateSubscriptionStatus(userId, 'pro', session.customer);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // Get user by stripe customer ID
        const user = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (user && user.length > 0) {
          const status = subscription.status === 'active' ? 'pro' : 'free';
          const expiresAt =
            subscription.current_period_end ?
              new Date(subscription.current_period_end * 1000)
              : undefined;

          await updateSubscriptionStatus(user[0].id, status as any, customerId, expiresAt);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // Get user by stripe customer ID
        const user = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (user && user.length > 0) {
          await updateSubscriptionStatus(user[0].id, 'free', customerId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;

        // Get user by stripe customer ID
        const user = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (user && user.length > 0) {
          await updateSubscriptionStatus(user[0].id, 'past_due', customerId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
