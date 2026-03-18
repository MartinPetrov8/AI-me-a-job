import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { findMatches } from '@/lib/matching/engine';
import * as middlewareModule from '@/lib/auth/middleware';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/auth/middleware');
vi.mock('@/lib/matching/engine', () => ({
  findMatches: vi.fn(),
}));

describe('POST /api/search with authenticateRequest middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    max_score: 8,
  };

  it('returns 200 with valid X-Session-Token header', async () => {
    vi.spyOn(middlewareModule, 'authenticateRequest').mockResolvedValue();
    (findMatches as any).mockResolvedValue(mockResults);

    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': 'valid-session-token',
      },
      body: JSON.stringify({ profile_id: 'profile-1' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.results.length).toBe(1);
    expect(data.data.results[0].job_id).toBe('job-1');
    expect(middlewareModule.authenticateRequest).toHaveBeenCalledWith(
      expect.anything(),
      'profile-1'
    );
  });

  it('returns 200 with valid X-Restore-Token header (no session header)', async () => {
    vi.spyOn(middlewareModule, 'authenticateRequest').mockResolvedValue();
    (findMatches as any).mockResolvedValue(mockResults);

    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Restore-Token': 'valid-restore-token',
      },
      body: JSON.stringify({ profile_id: 'profile-1' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.results.length).toBe(1);
    expect(data.data.results[0].job_id).toBe('job-1');
    expect(middlewareModule.authenticateRequest).toHaveBeenCalledWith(
      expect.anything(),
      'profile-1'
    );
  });

  it('returns 401 with no auth headers', async () => {
    const mock401Response = new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );

    vi.spyOn(middlewareModule, 'authenticateRequest').mockRejectedValue(mock401Response);

    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile_id: 'profile-1' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(middlewareModule.authenticateRequest).toHaveBeenCalledWith(
      expect.anything(),
      'profile-1'
    );
  });
});
