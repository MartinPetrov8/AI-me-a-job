import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

// Mock rate-limit
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, retryAfter: 0 }),
}));

import { createServerClient } from '@supabase/ssr';
import { middleware } from '../src/middleware';

function makeRequest(pathname: string, searchParams?: Record<string, string>): NextRequest {
  const url = new URL(`http://localhost${pathname}`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

function mockSupabase(user: object | null) {
  vi.mocked(createServerClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    cookies: {},
  } as unknown as ReturnType<typeof createServerClient>);
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set Supabase env vars so auth path is exercised
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('passes through public routes without auth check', async () => {
    mockSupabase(null);
    const req = makeRequest('/');
    const res = await middleware(req);
    // Should not redirect to login
    expect(res.status).not.toBe(307);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated user on protected route to /login', async () => {
    mockSupabase(null);
    const req = makeRequest('/results');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location') || '';
    expect(location).toContain('/login');
    expect(location).toContain('redirect=%2Fresults');
  });

  it('includes original path as redirect param', async () => {
    mockSupabase(null);
    const req = makeRequest('/profile');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location') || '';
    expect(location).toContain('redirect=%2Fprofile');
  });

  it('allows authenticated user through protected route', async () => {
    mockSupabase({ id: 'user-123', email: 'test@example.com' });
    const req = makeRequest('/results');
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
  });

  it('gracefully degrades when Supabase env vars missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const req = makeRequest('/results');
    const res = await middleware(req);
    // Should pass through without redirect (graceful degradation)
    expect(res.status).not.toBe(307);
  });

  it('applies rate limiting before auth check', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfter: 60 });
    const req = makeRequest('/results');
    const res = await middleware(req);
    expect(res.status).toBe(429);
  });

  // Business-critical: Stripe sends webhooks here — auth would silently break payments
  it('allows /api/stripe/webhook without auth (Stripe requirement)', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true });
    mockSupabase(null);
    const req = makeRequest('/api/stripe/webhook');
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
    expect(res.headers.get('location')).toBeNull();
  });

  // Business-critical: account page must be protected
  it('redirects unauthenticated user from /account to /login', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true });
    mockSupabase(null);
    const req = makeRequest('/account');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location') || '';
    expect(location).toContain('/login');
  });
});
