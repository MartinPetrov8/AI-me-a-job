import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockConstructEvent, mockUpdateSubscriptionStatus, mockDbSelect } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockUpdateSubscriptionStatus: vi.fn(),
  mockDbSelect: vi.fn(),
}));

vi.mock('@/lib/stripe/client', () => ({
  stripe: () => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }),
}));

vi.mock('@/lib/stripe/subscription', () => ({
  updateSubscriptionStatus: mockUpdateSubscriptionStatus,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockDbSelect,
  },
}));

import { POST } from '@/app/api/stripe/webhook/route';
import { NextRequest } from 'next/server';

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
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

    mockConstructEvent.mockReturnValueOnce(mockEvent);
    mockUpdateSubscriptionStatus.mockResolvedValueOnce(undefined);

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
    expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(
      'test-user-id',
      'pro',
      'cus_test'
    );
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
    const data = await response.json();
    expect(data).toEqual({ error: 'Missing signature' });
  });

  it('should reject requests with invalid signature', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
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
    const data = await response.json();
    expect(data).toEqual({ error: 'Invalid signature' });
  });
});
