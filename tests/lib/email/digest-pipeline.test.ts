import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MatchResult } from '@/lib/matching/engine';

// Mock database query builder - must be hoisted
const mockWhere = vi.fn();
const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('@/lib/db', () => ({
  db: {
    select: () => mockSelect(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: {},
  profiles: {},
}));

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual('drizzle-orm');
  return {
    ...actual,
    eq: vi.fn((a: any, b: any) => ({ type: 'eq', a, b })),
    and: vi.fn((...args: any[]) => ({ type: 'and', args })),
    isNotNull: vi.fn((field: any) => ({ type: 'isNotNull', field })),
  };
});

const mockFindMatches = vi.fn();
vi.mock('@/lib/matching/engine', () => ({
  findMatches: (...args: any[]) => mockFindMatches(...args),
}));

const mockSendEmail = vi.fn();
vi.mock('@/lib/email/client', () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
}));

describe('email/digest-pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero counts when no Pro users exist', async () => {
    mockWhere.mockResolvedValue([]);
    const { runWeeklyDigest } = await import('@/lib/email/digest-pipeline');

    const result = await runWeeklyDigest();

    expect(result).toEqual({
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: [],
    });
  });

  it('skips user when 0 matches found', async () => {
    const mockUser = {
      userId: 'user-1',
      userEmail: 'user1@example.com',
      restoreToken: 'token1',
      profileId: 'profile-1',
    };

    mockWhere.mockResolvedValue([mockUser]);
    mockFindMatches.mockResolvedValue({
      results: [],
      total: 0,
      search_id: 'search-1',
      max_score: 9,
    } as MatchResult);

    const { runWeeklyDigest } = await import('@/lib/email/digest-pipeline');
    const result = await runWeeklyDigest();

    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('sends email when matches found', async () => {
    const mockUser = {
      userId: 'user-2',
      userEmail: 'user2@example.com',
      restoreToken: 'token2',
      profileId: 'profile-2',
    };

    const mockMatches = Array.from({ length: 5 }, (_, i) => ({
      job_id: `job-${i}`,
      title: `Job ${i}`,
      company: `Company ${i}`,
      location: 'Remote',
      url: `https://example.com/job-${i}`,
      posted_at: new Date(),
      match_score: 7,
      matched_criteria: ['years_experience'],
      unmatched_criteria: [],
      salary_min: 50000,
      salary_max: 80000,
      salary_currency: 'USD',
      employment_type: 'Full-time',
      is_remote: true,
    }));

    mockWhere.mockResolvedValue([mockUser]);
    mockFindMatches.mockResolvedValue({
      results: mockMatches,
      total: 5,
      search_id: 'search-2',
      max_score: 9,
    } as MatchResult);
    mockSendEmail.mockResolvedValue({ ok: true });

    const { runWeeklyDigest } = await import('@/lib/email/digest-pipeline');
    const result = await runWeeklyDigest();

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'user2@example.com',
      expect.stringContaining('5 new roles found'),
      expect.any(String)
    );
  });

  it('continues processing after error for one user', async () => {
    const mockUsers = [
      {
        userId: 'user-3',
        userEmail: 'user3@example.com',
        restoreToken: 'token3',
        profileId: 'profile-3',
      },
      {
        userId: 'user-4',
        userEmail: 'user4@example.com',
        restoreToken: 'token4',
        profileId: 'profile-4',
      },
    ];

    const mockMatch = {
      job_id: 'job-1',
      title: 'Job 1',
      company: 'Company 1',
      location: 'Remote',
      url: 'https://example.com/job-1',
      posted_at: new Date(),
      match_score: 8,
      matched_criteria: [],
      unmatched_criteria: [],
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      employment_type: null,
      is_remote: true,
    };

    mockWhere.mockResolvedValue(mockUsers);
    
    // First user: findMatches throws error
    // Second user: succeeds
    mockFindMatches
      .mockRejectedValueOnce(new Error('Database error'))
      .mockResolvedValueOnce({
        results: [mockMatch],
        total: 1,
        search_id: 'search-4',
        max_score: 9,
      } as MatchResult);

    mockSendEmail.mockResolvedValue({ ok: true });

    const { runWeeklyDigest } = await import('@/lib/email/digest-pipeline');
    const result = await runWeeklyDigest();

    expect(result.processed).toBe(2);
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('user3@example.com');
    expect(result.errors[0]).toContain('Database error');
  });

  it('records error when email send fails', async () => {
    const mockUser = {
      userId: 'user-5',
      userEmail: 'user5@example.com',
      restoreToken: 'token5',
      profileId: 'profile-5',
    };

    const mockMatch = {
      job_id: 'job-1',
      title: 'Job 1',
      company: 'Company 1',
      location: 'Remote',
      url: 'https://example.com/job-1',
      posted_at: new Date(),
      match_score: 7,
      matched_criteria: [],
      unmatched_criteria: [],
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      employment_type: null,
      is_remote: false,
    };

    mockWhere.mockResolvedValue([mockUser]);
    mockFindMatches.mockResolvedValue({
      results: [mockMatch],
      total: 1,
      search_id: 'search-5',
      max_score: 9,
    } as MatchResult);
    mockSendEmail.mockResolvedValue({ ok: false, error: 'API rate limit' });

    const { runWeeklyDigest } = await import('@/lib/email/digest-pipeline');
    const result = await runWeeklyDigest();

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('user5@example.com');
    expect(result.errors[0]).toContain('API rate limit');
  });
});
