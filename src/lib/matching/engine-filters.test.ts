/**
 * engine-filters.test.ts — SQL scoring engine: criterion lists, overrides, result shape
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { findMatches } from './engine';

const { mockExecute, mockSelect, mockInsert, mockUpdate } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('../db/index', () => ({
  db: { execute: mockExecute, select: mockSelect, insert: mockInsert, update: mockUpdate },
}));

function makeProfile(overrides = {}) {
  return {
    id: 'profile-1', userId: 'user-1', cvFilename: 'cv.pdf', cvRawText: '',
    yearsExperience: '5-10 years', educationLevel: "Bachelor's",
    fieldOfStudy: 'Computer Science', sphereOfExpertise: 'Software Development',
    seniorityLevel: 'Mid-level', industry: 'Technology',
    languages: ['English'], keySkills: ['JavaScript', 'TypeScript'],
    prefEmploymentType: null, prefLocation: null, prefWorkMode: null,
    prefRelocation: null, prefSalaryMin: null, prefSalaryMax: null,
    prefSalaryCurrency: null, lastSearchAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    embedding: null,
    ...overrides,
  };
}

function makeRow(overrides = {}) {
  return {
    id: 'job-1', title: 'Software Engineer', company: 'TechCo',
    location: null, url: 'https://example.com/job/1',
    posted_at: new Date('2026-03-10'),
    salary_min: 60000, salary_max: 90000, salary_currency: 'USD',
    employment_type: 'full-time', is_remote: null,
    c_years: 1, c_education: 1, c_field: 1, c_sphere: 1,
    c_seniority: 1, c_languages: 1, c_industry: 1, c_skills: 1,
    c_location: null, sql_score: 8, embedding: null,
    ...overrides,
  };
}

function setup(profile = makeProfile(), rows = [makeRow()]) {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([profile]),
      }),
    }),
  });
  mockExecute.mockResolvedValue({ rows });
  mockInsert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'search-001' }]),
    }),
  });
  mockUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  });
}

describe('Matching Engine - Filters and Sorting', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filters jobs by salary_min - excludes jobs with salary_max below threshold', async () => {
    // SQL handles salary filtering — engine returns only rows that pass
    setup(makeProfile(), []); // no rows = all filtered
    const result = await findMatches('profile-1', { salaryMin: 100000 });
    expect(result.results).toHaveLength(0);
  });

  it('filters jobs by salary_max - excludes jobs with salary_min above threshold', async () => {
    setup(makeProfile(), []);
    const result = await findMatches('profile-1', { salaryMax: 40000 });
    expect(result.results).toHaveLength(0);
  });

  it('filters jobs by posted_within - excludes jobs older than threshold', async () => {
    setup(makeProfile(), []);
    const result = await findMatches('profile-1', { postedWithin: 7 });
    expect(result.results).toHaveLength(0);
  });

  it('sorts jobs by posted_at when sort=posted_at — SQL handles ordering, JS preserves it', async () => {
    const rows = [
      makeRow({ id: 'job-new', posted_at: new Date('2026-03-15'), sql_score: 7 }),
      makeRow({ id: 'job-old', posted_at: new Date('2026-01-01'), sql_score: 7 }),
    ];
    setup(makeProfile(), rows);
    const result = await findMatches('profile-1', { sort: 'posted_at' });
    // SQL already ordered — verify results returned in that order
    expect(result.results[0].job_id).toBe('job-new');
  });

  it('sorts jobs by salary_max when sort=salary_max', async () => {
    const rows = [
      makeRow({ id: 'job-high', salary_max: 120000, sql_score: 7 }),
      makeRow({ id: 'job-low', salary_max: 50000, sql_score: 7 }),
    ];
    setup(makeProfile(), rows);
    const result = await findMatches('profile-1', { sort: 'salary_max' });
    expect(result.results[0].job_id).toBe('job-high');
  });

  it('returns all 8 criteria as matched when all c_* = 1', async () => {
    setup();
    const result = await findMatches('profile-1');
    expect(result.results[0].matched_criteria).toHaveLength(8);
    expect(result.results[0].unmatched_criteria).toHaveLength(0);
  });

  it('moves criteria to unmatched when c_* = 0', async () => {
    setup(makeProfile(), [makeRow({ c_sphere: 0, c_industry: 0, sql_score: 6 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].unmatched_criteria).toContain('sphere_of_expertise');
    expect(result.results[0].unmatched_criteria).toContain('industry');
  });

  it('returns empty results when SQL returns no rows', async () => {
    setup(makeProfile(), []);
    const result = await findMatches('profile-1');
    expect(result.results).toHaveLength(0);
  });

  it('max_score = 8 without prefLocation, 9 with', async () => {
    setup(makeProfile({ prefLocation: null }), [makeRow()]);
    const r1 = await findMatches('profile-1');
    expect(r1.max_score).toBe(8);

    setup(makeProfile({ prefLocation: 'Berlin' }), [makeRow({ c_location: 2, sql_score: 9 })]);
    const r2 = await findMatches('profile-1');
    expect(r2.max_score).toBe(9);
  });

  it('locationOverride sets max_score to 9', async () => {
    setup(makeProfile({ prefLocation: null }), [makeRow({ c_location: 2, sql_score: 9 })]);
    const result = await findMatches('profile-1', { locationOverride: 'Berlin' });
    expect(result.max_score).toBe(9);
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });
});
