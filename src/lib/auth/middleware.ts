/**
 * Unified authentication middleware for protected API routes.
 * 
 * This middleware validates session tokens first, falling back to restore tokens.
 * It enables a gradual migration from URL-based restore tokens to session-based auth.
 * 
 * Usage in API routes:
 * ```ts
 * const request = new NextRequest(...);
 * await authenticateRequest(request, profileId);
 * // If we reach here, auth passed — continue with route logic
 * ```
 */

import { validateSession } from './session';
import { validateRestoreToken } from './validate-restore-token';

/**
 * Authenticate a request using session token first, restore token as fallback.
 * 
 * This function implements a two-tier auth strategy:
 * 1. Check X-Session-Token header and validate via validateSession
 * 2. If session validation fails (missing/invalid/expired), try X-Restore-Token
 * 3. If both fail, throw 401
 * 
 * @param request - The Next.js request object
 * @param profileId - The profile ID to authenticate for
 * @throws Response with 401 status if both session and restore token auth fail
 * @returns void on success (allows route handler to continue)
 */
export async function authenticateRequest(
  request: Request,
  profileId: string
): Promise<void> {
  const sessionToken = request.headers.get('X-Session-Token');
  const restoreToken = request.headers.get('X-Restore-Token');

  // Try session token first
  if (sessionToken) {
    try {
      await validateSession(profileId, sessionToken);
      return; // Session auth succeeded
    } catch (error) {
      // Session validation failed — fall through to restore token
    }
  }

  // Fallback to restore token
  try {
    await validateRestoreToken(profileId, restoreToken);
    return; // Restore token auth succeeded
  } catch (error) {
    // Both methods failed — rethrow the restore token error (it's a 401 Response)
    throw error;
  }
}
