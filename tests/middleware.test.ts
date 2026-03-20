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

  it('redirects unauthenticated users from protected routes', async () => {
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
});
