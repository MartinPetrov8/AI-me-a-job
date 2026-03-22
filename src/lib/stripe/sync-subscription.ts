import { getSubscriptionStatus } from '@/lib/stripe/subscription';

export type AccessLevel = 'full' | 'paywall';

export interface SubscriptionSyncResult {
  userId: string;
  status: string;
  access: AccessLevel;
}

/**
 * Sync subscription status to determine profile access level.
 *
 * Reads the subscription_status from the users table (via getSubscriptionStatus)
 * and returns the derived access level.
 *
 * Called from: GET /api/subscription/status
 */
export async function syncSubscriptionToProfile(
  userId: string
): Promise<SubscriptionSyncResult> {
  const status = await getSubscriptionStatus(userId);

  let access: AccessLevel;
  if (status === 'pro') {
    // Pro users get full access — paywall bypassed
    access = 'full';
  } else {
    // free | past_due → paywall active
    access = 'paywall';
  }

  return { userId, status, access };
}
