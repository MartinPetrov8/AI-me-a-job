import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { findMatches } from '@/lib/matching/engine';

// Create mock functions that will be used by the db mock
const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

// Mock db with select/from/where/limit chainable methods
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: mockLimit,
        })),
      })),
    })),
  },
}));

// Mock auth — bypass ownership check in unit tests
vi.mock('@/lib/auth/validate-restore-token', () => ({
  validateRestoreToken: vi.fn().mockResolvedValue(undefined),
}));

// Mock the matching engine
vi.mock('@/lib/matching/engine', () => ({
  findMatches: vi.fn(),
}));

describe('Delta Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract userId from profile and pass to findMatches with delta: true', async () => {
    const mockResults = {
      results: [],
      total: 0,
      search_id: 'search-delta-1',
      max_score: 8,
    };

    mockLimit.mockResolvedValue([{
      userId: 'user-B',
      lastSearchAt: new Date('2026-03-01T00:00:00Z'),
    }]);
    (findMatches as any).mockResolvedValue(mockResults);

    const request = new Request('http://localhost:3000/api/search/delta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: 'profile-delta' }),
    });

    await POST(request as any);

    expect(findMatches).toHaveBeenCalledWith(
      'profile-delta',
      expect.objectContaining({
        delta: true,
        userId: 'user-B',
      })
    );
  });

  it('should return 403 when findMatches throws scope error for mismatched userId', async () => {
    mockLimit.mockResolvedValue([{
      userId: 'user-B',
      lastSearchAt: new Date('2026-03-01T00:00:00Z'),
    }]);
    
    const scopeError = new Response(
      JSON.stringify({ error: 'Profile does not belong to authenticated user' }),
      { status: 403 }
    );
    (findMatches as any).mockRejectedValue(scopeError);

    const request = new Request('http://localhost:3000/api/search/delta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: 'profile-wrong-user' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Profile does not belong to authenticated user');
  });

  it('should return 404 when profile not found in database', async () => {
    mockLimit.mockResolvedValue([]);

    const request = new Request('http://localhost:3000/api/search/delta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: 'non-existent' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Profile not found');
  });

  it('should return delta results with is_delta: true and since timestamp', async () => {
    const mockResults = {
      results: [
        {
          job_id: 'job-new',
          title: 'New Job',
          company: 'New Corp',
          location: 'Paris',
          url: 'https://example.com/new-job',
          posted_at: new Date('2026-03-15T00:00:00Z'),
          match_score: 6,
          matched_criteria: ['industry', 'seniority_level'],
          unmatched_criteria: ['years_experience', 'field_of_study'],
          salary_min: 60000,
          salary_max: 90000,
          salary_currency: 'EUR',
          employment_type: 'Full-time',
          is_remote: false,
        },
      ],
      total: 1,
      search_id: 'search-delta-2',
      max_score: 8,
    };

    const lastSearchAt = new Date('2026-03-10T12:00:00Z');
    mockLimit.mockResolvedValue([{
      userId: 'user-C',
      lastSearchAt,
    }]);
    (findMatches as any).mockResolvedValue(mockResults);

    const request = new Request('http://localhost:3000/api/search/delta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: 'profile-2' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.results.length).toBe(1);
    expect(data.data.results[0].job_id).toBe('job-new');
    expect(data.meta.is_delta).toBe(true);
    expect(data.meta.since).toBe(lastSearchAt.toISOString());
  });

  it('should return 400 for missing profile_id', async () => {
    const request = new Request('http://localhost:3000/api/search/delta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('profile_id is required');
  });

  it('should pass delta: true along with other filter options', async () => {
    const mockResults = {
      results: [],
      total: 0,
      search_id: 'search-delta-3',
      max_score: 8,
    };

    mockLimit.mockResolvedValue([{
      userId: 'user-D',
      lastSearchAt: new Date('2026-03-01T00:00:00Z'),
    }]);
    (findMatches as any).mockResolvedValue(mockResults);

    const request = new Request('http://localhost:3000/api/search/delta?sort=posted_at', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: 'profile-3',
        salary_min: 50000,
        posted_within: 7,
      }),
    });

    await POST(request as any);

    expect(findMatches).toHaveBeenCalledWith(
      'profile-3',
      expect.objectContaining({
        delta: true,
        userId: 'user-D',
        sort: 'posted_at',
        salaryMin: 50000,
        postedWithin: 7,
      })
    );
  });
});
