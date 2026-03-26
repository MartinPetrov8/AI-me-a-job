import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database - must be hoisted
const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

vi.mock('@/lib/db', () => ({
  db: {
    update: () => mockUpdate(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: {},
}));

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual('drizzle-orm');
  return {
    ...actual,
    eq: vi.fn((a: any, b: any) => ({ type: 'eq', a, b })),
  };
});

describe('api/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 HTML when token is missing', async () => {
    const { GET } = await import('@/app/api/unsubscribe/route');
    const request = new Request('http://localhost/api/unsubscribe');
    const response = await GET(request);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    expect(html).toContain('Invalid Request');
    expect(html).toContain('Missing unsubscribe token');
  });

  it('returns 400 HTML when token is invalid', async () => {
    mockReturning.mockResolvedValue([]);

    const { GET } = await import('@/app/api/unsubscribe/route');
    const request = new Request('http://localhost/api/unsubscribe?token=invalid-token');
    const response = await GET(request);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    expect(html).toContain('Invalid Token');
    expect(html).toContain('invalid or has already been used');
  });

  it('returns 200 HTML and unsubscribes user when token is valid', async () => {
    mockReturning.mockResolvedValue([{ id: 'user-123' }]);

    const { GET } = await import('@/app/api/unsubscribe/route');
    const request = new Request('http://localhost/api/unsubscribe?token=valid-token-abc');
    const response = await GET(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    expect(html).toContain('You have been unsubscribed from weekly job digests');
    expect(html).toContain('You will no longer receive weekly email notifications');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ email: null });
  });

  it('returns 500 HTML when database error occurs', async () => {
    mockReturning.mockRejectedValue(new Error('Database error'));

    const { GET } = await import('@/app/api/unsubscribe/route');
    const request = new Request('http://localhost/api/unsubscribe?token=some-token');
    const response = await GET(request);
    const html = await response.text();

    expect(response.status).toBe(500);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    expect(html).toContain('Error');
    expect(html).toContain('An error occurred while processing your request');
  });
});
