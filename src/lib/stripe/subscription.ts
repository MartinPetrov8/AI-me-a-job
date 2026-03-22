import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type SubscriptionStatus = 'free' | 'pro' | 'past_due';

/**
 * Get user subscription status from database
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const user = await db
      .select({
        subscriptionStatus: users.subscriptionStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return 'free';
    }

    const status = user[0].subscriptionStatus as SubscriptionStatus;
    return status || 'free';
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return 'free';
  }
}

/**
 * Update user subscription status
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: SubscriptionStatus,
  stripeCustomerId?: string,
  expiresAt?: Date,
) {
  try {
    const updateData: Record<string, unknown> = {
      subscriptionStatus: status,
      updatedAt: new Date(),
    };

    if (stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }

    if (expiresAt) {
      updateData.subscriptionExpiresAt = expiresAt;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

/**
 * Check if user is pro subscriber
 */
export async function isProSubscriber(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  return status === 'pro';
}
