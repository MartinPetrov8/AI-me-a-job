import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set Supabase env vars so middleware doesn't skip auth
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('allows access to public routes without auth', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    (createServerClient as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);

    expect(response.status).not.toBe(307);
  });

  it('redirects unauthenticated users from /results to /login', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    (createServerClient as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/results');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('allows authenticated users to access protected routes', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
    };
    (createServerClient as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/results');
    const response = await middleware(request);

    expect(response.status).not.toBe(307);
  });

  it('allows /api/stripe/webhook through without session (public route)', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    (createServerClient as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook');
    const response = await middleware(request);

    // Should NOT redirect — webhook is always public
    expect(response.status).not.toBe(307);
  });

  it('allows /login access without session (public route)', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
    };
    (createServerClient as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/login');
    const response = await middleware(request);

    // /login is public — no redirect regardless of session state
    expect(response.status).not.toBe(307);
  });

  it('redirects unauthenticated users from /account to /login (new protected route)', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    (createServerClient as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/account');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('redirect URL includes original path as redirect param', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    (createServerClient as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/results');
    const response = await middleware(request);

    const location = response.headers.get('location') ?? '';
    expect(location).toContain('redirect=%2Fresults');
  });
});
