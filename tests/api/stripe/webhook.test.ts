import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/stripe/webhook/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/stripe/client', () => ({
  stripe: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));
vi.mock('@/lib/stripe/subscription');
vi.mock('@/lib/db');

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle checkout.session.completed event', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          metadata: {
            userId: 'test-user-id',
          },
        },
      },
    };

    const { stripe: getStripe } = await import('@/lib/stripe/client');
    const mockStripe = getStripe();
    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as any);

    const { updateSubscriptionStatus } = await import('@/lib/stripe/subscription');
    vi.mocked(updateSubscriptionStatus).mockResolvedValueOnce(undefined);

    const body = JSON.stringify(mockEvent);
    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
        'Content-Type': 'application/json',
      },
      body,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
  });

  it('should reject requests with missing signature', async () => {
    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should reject requests with invalid signature', async () => {
    const { stripe: getStripe } = await import('@/lib/stripe/client');
    const mockStripe = getStripe();
    vi.mocked(mockStripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error('Signature verification failed');
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid-signature',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
