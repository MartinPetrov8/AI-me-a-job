import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/search/route';
import { findMatches } from '../../src/lib/matching/engine';

// Mock db to prevent DATABASE_URL module-level throw in test environment
vi.mock('../../src/lib/db', () => ({ db: {} }));

// Mock auth — bypass ownership check in unit tests (ISSUE-1 fix applied)
vi.mock('../../src/lib/auth', () => ({
  verifyProfileOwnership: vi.fn().mockResolvedValue({ ok: true, userId: 'test-user-id' }),
}));

vi.mock('../../src/lib/auth/validate-restore-token', () => ({
  validateRestoreToken: vi.fn().mockResolvedValue(undefined),
}));

// Mock the matching engine
vi.mock('../../src/lib/matching/engine', () => ({
  findMatches: vi.fn(),
}));

describe('Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with results array for valid profile_id', async () => {
    const mockResults = {
      results: [
        {
          job_id: 'job-1',
          title: 'Senior Developer',
          company: 'Tech Corp',
          location: 'Berlin',
          url: 'https://example.com/job1',
          posted_at: new Date('2026-03-08T00:00:00Z'),
          match_score: 7,
          matched_criteria: ['industry', 'seniority_level', 'years_experience'],
          unmatched_criteria: ['field_of_study'],
          salary_min: 80000,
          salary_max: 120000,
          salary_currency: 'EUR',
          employment_type: 'Full-time',
          is_remote: true,
        },
      ],
      total: 1,
      search_id: 'search-123',
      max_score: 8, // no prefLocation set → 8 base criteria
    };

    (findMatches as any).mockResolvedValue(mockResults);

    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: 'profile-1' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.results.length).toBe(1);
    expect(data.data.results[0].job_id).toBe('job-1');
    expect(data.data.results[0].title).toBe('Senior Developer');
    expect(data.data.results[0].match_score).toBe(7);
    expect(data.data.total).toBe(1);
    expect(data.data.search_id).toBe('search-123');
    expect(data.meta.threshold).toBe(5);
    expect(data.meta.max_score).toBe(8); // 8 base criteria (no location preference)
    expect(data.meta.searched_at).toBeDefined();
  });

  it('should return 404 for non-existent profile_id', async () => {
    (findMatches as any).mockRejectedValue(new Error('Profile not found'));

    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: 'non-existent' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Profile not found');
  });

  it('should return 400 for missing profile_id', async () => {
    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('profile_id is required');
  });

  it('should return 400 for invalid profile_id type', async () => {
    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: 123 }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('must be a string');
  });
});
