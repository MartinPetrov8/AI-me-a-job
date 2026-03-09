import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the entire db module with a fluent query builder
const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));
const mockUpdateWhere = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

vi.mock('@/lib/db', () => ({
  db: {
    get select() { return mockSelect; },
    get update() { return mockUpdate; },
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', email: 'email', restoreToken: 'restore_token', updatedAt: 'updated_at' },
  profiles: { id: 'id', userId: 'user_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col, _val) => `eq:${_col}:${_val}`),
  ne: vi.fn((_col, _val) => `ne:${_col}:${_val}`),
  and: vi.fn((...args) => `and:${args.join(':')}`),
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/save', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
    mockUpdateWhere.mockResolvedValue([]);
  });

  it('returns 200 with 12-char alphanumeric restore_token on valid input', async () => {
    mockLimit
      .mockResolvedValueOnce([{ userId: 'user-uuid-1' }]) // profile found
      .mockResolvedValueOnce([]); // no conflict

    const { POST } = await import('@/app/api/save/route');
    const req = makeRequest({ profile_id: '9a293017-6bd0-4fe6-a714-38f1a85f08a1', email: 'test@example.com' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.saved).toBe(true);
    // Token is now 32 chars (192-bit entropy — ISSUE-3 fix)
    expect(data.data.restore_token.length).toBeGreaterThanOrEqual(32);
    expect(data.data.restore_token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('returns 400 for invalid email format', async () => {
    const { POST } = await import('@/app/api/save/route');
    const req = makeRequest({ profile_id: '9a293017-6bd0-4fe6-a714-38f1a85f08a1', email: 'not-an-email' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 409 when email exists on a different user', async () => {
    mockLimit
      .mockResolvedValueOnce([{ userId: 'user-uuid-1' }]) // profile found
      .mockResolvedValueOnce([{ id: 'other-user-id' }]); // conflict!

    const { POST } = await import('@/app/api/save/route');
    const req = makeRequest({ profile_id: '9a293017-6bd0-4fe6-a714-38f1a85f08a1', email: 'taken@example.com' });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
