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

  it('returns 0 configured services when no env vars set', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.RESEND_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('ok');
    expect(data.services).toBe(0);
    expect(data.servicesTotal).toBe(3);
    // Must NOT expose service names (stack enumeration prevention)
    expect(data.supabase).toBeUndefined();
    expect(data.stripe).toBeUndefined();
    expect(data.resend).toBeUndefined();
  });

  it('returns 1 configured when one env var set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.RESEND_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(data.services).toBe(1);
    expect(data.servicesTotal).toBe(3);
  });

  it('returns 2 configured when two env vars set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    delete process.env.RESEND_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(data.services).toBe(2);
  });

  it('returns 3 configured when all env vars set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.RESEND_API_KEY = 're_test_123';

    const response = await GET();
    const data = await response.json();

    expect(data.services).toBe(3);
  });

  it('response includes timestamp and version', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.timestamp).toBeTruthy();
    expect(data.version).toBeTruthy();
  });
});
