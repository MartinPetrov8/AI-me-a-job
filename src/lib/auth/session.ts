/**
 * Session generation and validation utilities for API route authentication.
 * 
 * This module provides functions to generate session tokens, create session records,
 * and validate sessions for authenticated API routes. Sessions expire after 7 days.
 * 
 * Usage in API routes:
 * ```ts
 * const sessionToken = request.headers.get('X-Session-Token');
 * await validateSession(profileId, sessionToken);
 * // If we reach here, session is valid — continue with route logic
 * ```
 */

import { randomBytes } from 'crypto';
import { db } from '../db';
import { sessions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a cryptographically secure session token.
 * 
 * @returns 32-character base64url string (24 random bytes encoded)
 */
export function generateSessionToken(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Create a new session for a profile with 7-day expiry.
 * 
 * @param profileId - The profile ID to create a session for
 * @returns The generated session token
 */
export async function createSession(profileId: string): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await db.insert(sessions).values({
    profileId,
    sessionToken,
    expiresAt,
  });

  return sessionToken;
}

/**
 * Validate that a session token is valid and not expired for the given profile.
 * 
 * @param profileId - The profile ID to verify session for
 * @param sessionToken - The session token from the X-Session-Token header (may be null)
 * @throws Response with 401 status if token is missing, invalid, or expired
 * @returns void on success (allows route handler to continue)
 */
export async function validateSession(
  profileId: string,
  sessionToken: string | null
): Promise<void> {
  // Missing token → 401
  if (!sessionToken) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Query session by profileId and sessionToken
  const result = await db
    .select({
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.profileId, profileId),
        eq(sessions.sessionToken, sessionToken)
      )
    )
    .limit(1);

  // Session not found → 401
  if (result.length === 0) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Session expired → 401
  const now = new Date();
  if (result[0].expiresAt < now) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Success — return void, allow route handler to continue
}
