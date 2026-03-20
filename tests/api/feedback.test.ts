import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockInsert = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
  },
}));

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores feedback successfully', async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const { POST } = await import('@/app/api/feedback/route');

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_result_id: '123e4567-e89b-12d3-a456-426614174000',
        useful: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({ success: true });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('validates search_result_id as UUID', async () => {
    const { POST } = await import('@/app/api/feedback/route');

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_result_id: 'invalid-uuid',
        useful: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
    expect(data.errors.length).toBeGreaterThan(0);
  });

  it('validates useful field as boolean', async () => {
    const { POST } = await import('@/app/api/feedback/route');

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_result_id: '123e4567-e89b-12d3-a456-426614174000',
        useful: 'yes',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it('handles database insert errors', async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('Foreign key violation')),
    });

    const { POST } = await import('@/app/api/feedback/route');

    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_result_id: '123e4567-e89b-12d3-a456-426614174000',
        useful: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.errors).toEqual([
      { code: 'FEEDBACK_INSERT_ERROR', message: 'Failed to store feedback' },
    ]);
  });
});

describe('GET /api/feedback', () => {
  it('returns 405 Method Not Allowed', async () => {
    const { GET } = await import('@/app/api/feedback/route');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.errors).toEqual([
      { code: 'METHOD_NOT_ALLOWED', message: 'GET not allowed on this endpoint' },
    ]);
  });
});
