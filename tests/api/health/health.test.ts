import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { execute: vi.fn().mockResolvedValue([]) },
}));

import { GET } from '../../../src/app/api/health/route';

describe('GET /api/health — service config status', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env
    Object.assign(process.env, originalEnv);
    Object.keys(process.env).forEach(k => {
      if (!(k in originalEnv)) delete process.env[k];
    });
  });

  it('returns missing for all services when env vars not set', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.RESEND_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('ok');
    expect(data.supabase).toBe('missing');
    expect(data.stripe).toBe('missing');
    expect(data.resend).toBe('missing');
  });

  it('returns configured for supabase when env var set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.RESEND_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(data.supabase).toBe('configured');
    expect(data.stripe).toBe('missing');
    expect(data.resend).toBe('missing');
  });

  it('returns configured for stripe when env var set', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    delete process.env.RESEND_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(data.supabase).toBe('missing');
    expect(data.stripe).toBe('configured');
  });

  it('returns configured for resend when env var set', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    process.env.RESEND_API_KEY = 're_test_123';

    const response = await GET();
    const data = await response.json();

    expect(data.resend).toBe('configured');
  });

  it('response includes timestamp and version', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.timestamp).toBeTruthy();
    expect(data.version).toBeTruthy();
  });
});
