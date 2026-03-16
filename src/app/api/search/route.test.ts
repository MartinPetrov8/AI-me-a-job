import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { findMatches } from '@/lib/matching/engine';

// Mock the matching engine
vi.mock('@/lib/matching/engine', () => ({
  findMatches: vi.fn(),
}));

// Mock auth validation
vi.mock('@/lib/auth/validate-restore-token', () => ({
  validateRestoreToken: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/search with sort and filter params', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const mockResults = {
    results: [
      {
        job_id: 'job-1',
        title: 'High Salary Job',
        company: 'Tech Corp',
        location: 'New York',
        url: 'https://example.com/1',
        posted_at: fourteenDaysAgo,
        match_score: 8,
        matched_criteria: ['years_experience', 'education_level'],
        unmatched_criteria: [],
        salary_max: 100000,
        salary_min: 80000,
        salary_currency: 'USD',
        employment_type: 'Full-time',
        is_remote: false,
      },
      {
        job_id: 'job-2',
        title: 'Mid Salary Job',
        company: 'Startup Inc',
        location: 'San Francisco',
        url: 'https://example.com/2',
        posted_at: sevenDaysAgo,
        match_score: 7,
        matched_criteria: ['years_experience'],
        unmatched_criteria: ['education_level'],
        salary_max: 70000,
        salary_min: 50000,
        salary_currency: 'USD',
        employment_type: 'Full-time',
        is_remote: true,
      },
      {
        job_id: 'job-3',
        title: 'Recent Job',
        company: 'Remote Co',
        location: null,
        url: 'https://example.com/3',
        posted_at: now,
        match_score: 6,
        matched_criteria: ['years_experience', 'key_skills'],
        unmatched_criteria: [],
        salary_max: 75000,
        salary_min: 60000,
        salary_currency: 'USD',
        employment_type: 'Contract',
        is_remote: true,
      },
    ],
    total: 3,
    search_id: 'search-123',
  };

  it('passes sort parameter to findMatches', async () => {
    vi.mocked(findMatches).mockResolvedValue(mockResults);

    const request = new NextRequest(
      'http://localhost:3000/api/search?sort=posted_at',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-restore-token': 'test-token',
        },
        body: JSON.stringify({ profile_id: 'profile-123' }),
      }
    );

    await POST(request);

    expect(findMatches).toHaveBeenCalledWith('profile-123', {
      sort: 'posted_at',
      salaryMin: undefined,
      salaryMax: undefined,
      postedWithin: undefined,
    });
  });

  it('passes salary_min parameter to findMatches', async () => {
    vi.mocked(findMatches).mockResolvedValue(mockResults);

    const request = new NextRequest(
      'http://localhost:3000/api/search?salary_min=60000',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-restore-token': 'test-token',
        },
        body: JSON.stringify({ profile_id: 'profile-123' }),
      }
    );

    await POST(request);

    expect(findMatches).toHaveBeenCalledWith('profile-123', {
      sort: undefined,
      salaryMin: 60000,
      salaryMax: undefined,
      postedWithin: undefined,
    });
  });

  it('passes salary_max parameter to findMatches', async () => {
    vi.mocked(findMatches).mockResolvedValue(mockResults);

    const request = new NextRequest(
      'http://localhost:3000/api/search?salary_max=50000',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-restore-token': 'test-token',
        },
        body: JSON.stringify({ profile_id: 'profile-123' }),
      }
    );

    await POST(request);

    expect(findMatches).toHaveBeenCalledWith('profile-123', {
      sort: undefined,
      salaryMin: undefined,
      salaryMax: 50000,
      postedWithin: undefined,
    });
  });

  it('passes posted_within parameter to findMatches', async () => {
    vi.mocked(findMatches).mockResolvedValue(mockResults);

    const request = new NextRequest(
      'http://localhost:3000/api/search?posted_within=7',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-restore-token': 'test-token',
        },
        body: JSON.stringify({ profile_id: 'profile-123' }),
      }
    );

    await POST(request);

    expect(findMatches).toHaveBeenCalledWith('profile-123', {
      sort: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      postedWithin: 7,
    });
  });

  it('passes multiple filter parameters to findMatches', async () => {
    vi.mocked(findMatches).mockResolvedValue(mockResults);

    const request = new NextRequest(
      'http://localhost:3000/api/search?salary_min=60000&posted_within=14&sort=salary_max',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-restore-token': 'test-token',
        },
        body: JSON.stringify({ profile_id: 'profile-123' }),
      }
    );

    await POST(request);

    expect(findMatches).toHaveBeenCalledWith('profile-123', {
      sort: 'salary_max',
      salaryMin: 60000,
      salaryMax: undefined,
      postedWithin: 14,
    });
  });

  it('returns results from findMatches', async () => {
    vi.mocked(findMatches).mockResolvedValue(mockResults);

    const request = new NextRequest(
      'http://localhost:3000/api/search',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-restore-token': 'test-token',
        },
        body: JSON.stringify({ profile_id: 'profile-123' }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.total).toBe(3);
    expect(data.data.results.length).toBe(3);
    expect(data.data.results[0].job_id).toBe('job-1');
    expect(data.data.results[0].title).toBe('High Salary Job');
  });
});
