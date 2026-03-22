import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreateSession, mockCreateCustomer, mockVerifyAuth, mockDbSelect, mockDbUpdate } = vi.hoisted(() => ({
  mockCreateSession: vi.fn(),
  mockCreateCustomer: vi.fn(),
  mockVerifyAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbUpdate: vi.fn(),
}));

vi.mock('@/lib/stripe/client', () => ({
  stripe: () => ({
    checkout: {
      sessions: {
        create: mockCreateSession,
      },
    },
    customers: {
      create: mockCreateCustomer,
    },
  }),
}));

vi.mock('@/lib/auth/verify', () => ({
  verifyAuth: mockVerifyAuth,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockDbSelect,
    update: mockDbUpdate,
  },
}));

import { POST } from '@/app/api/stripe/checkout/route';
import { NextRequest } from 'next/server';

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.NEXT_PUBLIC_URL = 'http://localhost:3000';
    
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
  });

  it('should create a checkout session for authenticated user', async () => {
    const mockSession = {
      url: 'https://checkout.stripe.com/pay/test',
    };

    mockVerifyAuth.mockResolvedValueOnce({ userId: 'test-user-id' });
    mockCreateSession.mockResolvedValueOnce(mockSession);
    
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([
            {
              id: 'test-user-id',
              email: 'test@example.com',
              stripeCustomerId: 'cus_test',
            },
          ]),
        }),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('url');
    expect(data.url).toBe('https://checkout.stripe.com/pay/test');
  });

  it('should return 401 for unauthenticated requests', async () => {
    mockVerifyAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});
