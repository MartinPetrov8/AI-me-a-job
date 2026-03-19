import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockUserAId = 'u1';
const mockUserBId = 'u2';
const mockProfileAId = 'p1';
const mockProfileBId = 'p2';
const mockRestoreTokenA = 'restore-token-user-a';
const mockRestoreTokenB = 'restore-token-user-b';

let mockDbSelectResult: unknown[] = [];
let mockDbJoinResult: unknown[] = [];

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve(mockDbSelectResult)),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve(mockDbJoinResult)),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', email: 'email', restoreToken: 'restore_token' },
  profiles: { id: 'id', userId: 'user_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val, op: 'eq' })),
}));

vi.mock('@/lib/matching/engine', () => ({
  findMatches: vi.fn(() => Promise.resolve({
    results: [],
    total: 0,
    search_id: 'search-mock-123',
    max_score: 8,
  })),
}));

function makeRequest(profileId: string, restoreToken: string, url = 'http://localhost/api/search') {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId }),
    headers: {
      'Content-Type': 'application/json',
      'X-Restore-Token': restoreToken,
    },
  });
}

describe('Search API IDOR Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelectResult = [];
    mockDbJoinResult = [];
  });

  describe('POST /api/search', () => {
    it('returns 200 when user queries their own profile with valid restore_token', async () => {
      mockDbJoinResult = [{ restoreToken: mockRestoreTokenA }];
      mockDbSelectResult = [{ userId: mockUserAId }];

      const { POST } = await import('@/app/api/search/route');
      const req = makeRequest(mockProfileAId, mockRestoreTokenA);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.results).toBeDefined();
      expect(data.data.search_id).toBe('search-mock-123');
    });

    it('returns 401 when user queries another users profile with valid restore_token', async () => {
      mockDbJoinResult = [];
      mockDbSelectResult = [];

      const { POST } = await import('@/app/api/search/route');
      const req = makeRequest(mockProfileBId, mockRestoreTokenA);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when restore_token is invalid', async () => {
      mockDbJoinResult = [];

      const { POST } = await import('@/app/api/search/route');
      const req = makeRequest(mockProfileAId, 'invalid-token-xyz');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when restore_token is missing', async () => {
      const { POST } = await import('@/app/api/search/route');
      const req = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({ profile_id: mockProfileAId }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 404 when profile_id does not exist in database', async () => {
      mockDbJoinResult = [{ restoreToken: mockRestoreTokenA }];
      mockDbSelectResult = [];

      const { POST } = await import('@/app/api/search/route');
      const req = makeRequest('nonexistent-profile-id', mockRestoreTokenA);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });
  });

  describe('POST /api/search/delta', () => {
    it('returns 200 when user queries their own profile with valid restore_token', async () => {
      mockDbJoinResult = [{ restoreToken: mockRestoreTokenA }];
      mockDbSelectResult = [{
        id: mockProfileAId,
        userId: mockUserAId,
        lastSearchAt: new Date('2026-03-01T00:00:00Z'),
      }];

      const { POST } = await import('@/app/api/search/delta/route');
      const req = makeRequest(mockProfileAId, mockRestoreTokenA, 'http://localhost/api/search/delta');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.results).toBeDefined();
      expect(data.meta.is_delta).toBe(true);
    });

    it('returns 401 when user queries another users profile with valid restore_token', async () => {
      mockDbJoinResult = [];
      mockDbSelectResult = [];

      const { POST } = await import('@/app/api/search/delta/route');
      const req = makeRequest(mockProfileBId, mockRestoreTokenA, 'http://localhost/api/search/delta');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when restore_token is invalid', async () => {
      mockDbJoinResult = [];

      const { POST } = await import('@/app/api/search/delta/route');
      const req = makeRequest(mockProfileAId, 'invalid-token-xyz', 'http://localhost/api/search/delta');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 404 when profile_id does not exist in database', async () => {
      mockDbJoinResult = [{ restoreToken: mockRestoreTokenA }];
      mockDbSelectResult = [];

      const { POST } = await import('@/app/api/search/delta/route');
      const req = makeRequest('nonexistent-profile-id', mockRestoreTokenA, 'http://localhost/api/search/delta');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });
  });
});
