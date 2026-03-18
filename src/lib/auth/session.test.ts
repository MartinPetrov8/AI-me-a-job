import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSessionToken, createSession, validateSession } from './session';
import { db } from '../db';
import { sessions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

vi.mock('../db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}));

describe('session utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSessionToken', () => {
    it('returns a 32-character base64url string', () => {
      const token = generateSessionToken();
      expect(token).toHaveLength(32);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates unique tokens on consecutive calls', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('createSession', () => {
    it('inserts a session row with 7-day expiry and returns the token', async () => {
      const mockProfileId = 'profile-123';
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      (db.insert as any) = mockInsert;

      const token = await createSession(mockProfileId);

      expect(token).toHaveLength(32);
      expect(mockInsert).toHaveBeenCalledWith(sessions);
      
      const insertCall = mockInsert.mock.results[0].value.values.mock.calls[0][0];
      expect(insertCall.profileId).toBe(mockProfileId);
      expect(insertCall.sessionToken).toBe(token);
      
      const expiresAt = insertCall.expiresAt;
      const expectedExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe('validateSession', () => {
    it('throws 401 when session token is null', async () => {
      await expect(
        validateSession('profile-123', null)
      ).rejects.toThrow(Response);

      try {
        await validateSession('profile-123', null);
      } catch (error) {
        expect((error as Response).status).toBe(401);
        const body = await (error as Response).json();
        expect(body.error).toBe('Unauthorized');
      }
    });

    it('throws 401 when session is not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.select as any) = mockSelect;

      await expect(
        validateSession('profile-123', 'invalid-token')
      ).rejects.toThrow(Response);

      try {
        await validateSession('profile-123', 'invalid-token');
      } catch (error) {
        expect((error as Response).status).toBe(401);
        const body = await (error as Response).json();
        expect(body.error).toBe('Unauthorized');
      }
    });

    it('throws 401 when session is expired', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { expiresAt: expiredDate },
            ]),
          }),
        }),
      });
      (db.select as any) = mockSelect;

      await expect(
        validateSession('profile-123', 'expired-token')
      ).rejects.toThrow(Response);

      try {
        await validateSession('profile-123', 'expired-token');
      } catch (error) {
        expect((error as Response).status).toBe(401);
        const body = await (error as Response).json();
        expect(body.error).toBe('Unauthorized');
      }
    });

    it('returns void when session is valid and not expired', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { expiresAt: futureDate },
            ]),
          }),
        }),
      });
      (db.select as any) = mockSelect;

      await expect(
        validateSession('profile-123', 'valid-token')
      ).resolves.toBeUndefined();
    });
  });
});
