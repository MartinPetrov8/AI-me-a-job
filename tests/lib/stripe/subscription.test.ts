import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSubscriptionStatus, updateSubscriptionStatus, isProSubscriber } from '@/lib/stripe/subscription';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

vi.mock('@/lib/db');

describe('Subscription utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubscriptionStatus', () => {
    it('should return pro status from database', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([
              {
                subscriptionStatus: 'pro',
              },
            ]),
          }),
        }),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const status = await getSubscriptionStatus('test-user-id');
      expect(status).toBe('pro');
    });

    it('should return free as default for missing user', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const status = await getSubscriptionStatus('nonexistent-user');
      expect(status).toBe('free');
    });

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValueOnce(new Error('DB error')),
          }),
        }),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const status = await getSubscriptionStatus('test-user-id');
      expect(status).toBe('free');
    });
  });

  describe('updateSubscriptionStatus', () => {
    it('should update subscription status', async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValueOnce(undefined),
        }),
      };

      vi.mocked(db.update).mockReturnValueOnce(mockUpdate as any);

      await updateSubscriptionStatus('test-user-id', 'pro', 'cus_test');

      expect(db.update).toHaveBeenCalledWith(users);
      expect(mockUpdate.set).toHaveBeenCalled();
    });
  });

  describe('isProSubscriber', () => {
    it('should return true for pro subscribers', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([
              {
                subscriptionStatus: 'pro',
              },
            ]),
          }),
        }),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const isPro = await isProSubscriber('test-user-id');
      expect(isPro).toBe(true);
    });

    it('should return false for free tier', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([
              {
                subscriptionStatus: 'free',
              },
            ]),
          }),
        }),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const isPro = await isProSubscriber('test-user-id');
      expect(isPro).toBe(false);
    });
  });
});
