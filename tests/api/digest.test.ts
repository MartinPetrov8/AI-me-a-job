import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/digest/route';

// Mock digest pipeline
vi.mock('@/lib/email/digest-pipeline', () => ({
  runWeeklyDigest: vi.fn(),
}));

describe('api/digest', () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret-123';
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it('returns 401 when Authorization header is missing', async () => {
    const request = new Request('http://localhost/api/digest', {
      method: 'POST',
      headers: {},
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when Authorization header is incorrect', async () => {
    const request = new Request('http://localhost/api/digest', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wrong-token',
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET;

    const request = new Request('http://localhost/api/digest', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-secret-123',
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('returns 200 with digest results when auth is correct', async () => {
    const { runWeeklyDigest } = await import('@/lib/email/digest-pipeline');

    const mockResult = {
      processed: 10,
      sent: 8,
      skipped: 2,
      errors: [],
    };

    (runWeeklyDigest as any).mockResolvedValue(mockResult);

    const request = new Request('http://localhost/api/digest', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-secret-123',
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ data: mockResult });
    expect(runWeeklyDigest).toHaveBeenCalledOnce();
  });

  it('returns 500 when digest pipeline throws error', async () => {
    const { runWeeklyDigest } = await import('@/lib/email/digest-pipeline');
    (runWeeklyDigest as any).mockRejectedValue(new Error('Database connection failed'));

    const request = new Request('http://localhost/api/digest', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-secret-123',
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
    expect(json.message).toBe('Database connection failed');
  });
});
