import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/stripe/checkout/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/stripe/client', () => ({
  stripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    customers: {
      create: vi.fn(),
    },
  })),
}));
vi.mock('@/lib/auth/verify');
vi.mock('@/lib/db');

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a checkout session for authenticated user', async () => {
    const mockSession = {
      url: 'https://checkout.stripe.com/pay/test',
    };

    const { stripe: getStripe } = await import('@/lib/stripe/client');
    const mockStripe = getStripe();
    vi.mocked(mockStripe.checkout.sessions.create).mockResolvedValueOnce(mockSession as any);

    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
    });

    // Mock auth
    const verifyAuth = require('@/lib/auth/verify').verifyAuth;
    verifyAuth.mockResolvedValueOnce({ userId: 'test-user-id' });

    // Mock db
    const db = require('@/lib/db').db;
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([
            {
              email: 'test@example.com',
              stripeCustomerId: 'cus_test',
            },
          ]),
        }),
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('url');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const { verifyAuth } = await import('@/lib/auth/verify');
    vi.mocked(verifyAuth).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});
