import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock Resend as a class - must be hoisted before imports
const mockSend = vi.fn().mockResolvedValue({ id: 'test-id' });

vi.mock('resend', () => {
  class MockResend {
    emails = {
      send: mockSend,
    };
  }
  return { Resend: MockResend };
});

describe('email/client', () => {
  const originalEnv = process.env.RESEND_API_KEY;

  afterEach(() => {
    process.env.RESEND_API_KEY = originalEnv;
    vi.clearAllMocks();
  });

  describe('isEmailEnabled', () => {
    it('returns true when RESEND_API_KEY is set', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      vi.resetModules();
      const { isEmailEnabled } = await import('@/lib/email/client');
      expect(isEmailEnabled()).toBe(true);
    });

    it('returns false when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
      const { isEmailEnabled } = await import('@/lib/email/client');
      expect(isEmailEnabled()).toBe(false);
    });
  });

  describe('sendEmail', () => {
    it('returns ok:true in stub mode when RESEND_API_KEY not set', async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/client');
      const result = await sendEmail('test@example.com', 'Subject', '<p>HTML</p>');
      expect(result).toEqual({ ok: true });
    });

    it('sends email successfully when RESEND_API_KEY is set', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      mockSend.mockResolvedValue({ id: 'test-id' });
      
      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/client');
      
      const result = await sendEmail('test@example.com', 'Test Subject', '<p>HTML</p>');
      expect(result).toEqual({ ok: true });
      expect(mockSend).toHaveBeenCalledWith({
        from: 'aimeajob <digest@aimeajob.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>HTML</p>',
      });
    });

    it('returns ok:false with error message on send failure', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      mockSend.mockRejectedValue(new Error('API error'));
      
      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/client');
      const result = await sendEmail('test@example.com', 'Subject', '<p>HTML</p>');
      
      expect(result.ok).toBe(false);
      expect(result.error).toBe('API error');
    });
  });
});
