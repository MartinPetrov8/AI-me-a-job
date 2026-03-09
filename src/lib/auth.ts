/**
 * Lightweight ownership verification for MVP (no full auth system yet).
 * 
 * The restore_token acts as a bearer credential: once a user saves their profile,
 * they receive a token that proves ownership. Protected endpoints require this token
 * in the Authorization header: `Authorization: Bearer <restore_token>`
 *
 * This is NOT a substitute for proper session auth — it's a temporary MVP guard
 * that prevents IDOR attacks until a real auth system is built.
 * 
 * TODO: Replace with proper session-based auth (NextAuth / Supabase Auth) before scaling.
 */

import { db } from './db';
import { users, profiles } from './db/schema';
import { eq, and } from 'drizzle-orm';

export interface OwnershipResult {
  ok: boolean;
  userId?: string;
  error?: string;
  status?: number;
}

/**
 * Verify that the bearer token in the Authorization header belongs to the owner
 * of the given profile_id. Returns { ok: true, userId } on success.
 */
export async function verifyProfileOwnership(
  authHeader: string | null,
  profileId: string
): Promise<OwnershipResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Authorization header required', status: 401 };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, error: 'Invalid authorization token', status: 401 };
  }

  // Look up the user by token
  const userRow = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.restoreToken, token))
    .limit(1);

  if (userRow.length === 0) {
    return { ok: false, error: 'Invalid or expired token', status: 401 };
  }

  const userId = userRow[0].id;

  // Verify the profile belongs to this user
  const profileRow = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (profileRow.length === 0) {
    return { ok: false, error: 'Access denied', status: 403 };
  }

  return { ok: true, userId };
}
