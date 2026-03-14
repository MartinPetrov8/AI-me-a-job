/**
 * Shared auth validation helper for restore_token ownership verification.
 * 
 * This function verifies that the X-Restore-Token header matches the restore token
 * for the specified profile. It's used by protected API routes to prevent IDOR attacks.
 * 
 * Usage in API routes:
 * ```ts
 * const token = request.headers.get('X-Restore-Token');
 * await validateRestoreToken(profileId, token);
 * // If we reach here, auth passed — continue with route logic
 * ```
 * 
 * TODO: Replace with NextAuth session-based auth before production.
 */

import { db } from '../db';
import { users, profiles } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Validate that the provided restore_token matches the one associated with the profile.
 * 
 * @param profileId - The profile ID to verify ownership for
 * @param token - The restore_token from the X-Restore-Token header (may be null)
 * @throws Response with 401 status if token is missing or mismatched
 * @returns void on success (allows route handler to continue)
 */
export async function validateRestoreToken(
  profileId: string,
  token: string | null
): Promise<void> {
  // Missing token → 401
  if (!token) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Query users table JOIN profiles to get the restore token for this profile
  const result = await db
    .select({
      restoreToken: users.restoreToken,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.id, profileId))
    .limit(1);

  // Profile not found or token mismatch → 401
  if (result.length === 0 || result[0].restoreToken !== token) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Success — return void, allow route handler to continue
}
