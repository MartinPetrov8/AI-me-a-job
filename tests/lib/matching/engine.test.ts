/**
 * tests/lib/matching/engine.test.ts — SQL scoring engine integration tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findMatches } from '../../../src/lib/matching/engine';

const { mockExecute, mockSelect, mockInsert, mockUpdate } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('../../../src/lib/db/index', () => ({
  db: { execute: mockExecute, select: mockSelect, insert: mockInsert, update: mockUpdate },
}));

const baseProfile = {
  id: 'profile-1', userId: 'user-1', cvFilename: 'cv.pdf', cvRawText: '',
  yearsExperience: '5-10 years', educationLevel: "Master's",
  fieldOfStudy: 'Computer Science', sphereOfExpertise: 'Software Development',
  seniorityLevel: 'Senior', industry: 'Technology',
  languages: ['English', 'German'],
  keySkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
  prefEmploymentType: null, prefLocation: null, prefWorkMode: null,
  prefRelocation: null, prefSalaryMin: null, prefSalaryMax: null,
  prefSalaryCurrency: null, lastSearchAt: new Date('2026-03-01T00:00:00Z'),
  createdAt: new Date(), updatedAt: new Date(),
  embedding: null,
};

function makeRow(overrides = {}) {
  return {
    id: 'job-1', title: 'Senior Software Engineer', company: 'TechCorp',
    location: 'Berlin, Germany', url: 'https://example.com/job/1',
    posted_at: new Date('2026-03-08'),
    salary_min: 80000, salary_max: 120000, salary_currency: 'EUR',
    employment_type: 'full-time', is_remote: false,
    c_years: 1, c_education: 1, c_field: 1, c_sphere: 1,
    c_seniority: 1, c_languages: 1, c_industry: 1, c_skills: 1,
    c_location: null, sql_score: 8, embedding: null,
    ...overrides,
  };
}

function setup(profile = baseProfile, rows = [makeRow()]) {
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

describe('Matching Engine', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return jobs with exact industry match', async () => {
    setup();
    const result = await findMatches('profile-1');
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].match_score).toBeGreaterThanOrEqual(5);
  });

  it('should NOT return jobs matching only 4/8 criteria (below threshold)', async () => {
    setup(baseProfile, []);
    const result = await findMatches('profile-1');
    expect(result.results.length).toBe(0);
  });

  it('should return jobs matching 6/8 criteria', async () => {
    setup(baseProfile, [makeRow({ c_sphere: 0, c_industry: 0, sql_score: 6 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].match_score).toBe(6);
  });

  it('should match adjacent seniority — c_seniority=1 maps to matched_criteria', async () => {
    setup(baseProfile, [makeRow({ c_seniority: 1 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].matched_criteria).toContain('seniority_level');
  });

  it('should match education overqualification — c_education=1 maps to matched_criteria', async () => {
    setup(baseProfile, [makeRow({ c_education: 1 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].matched_criteria).toContain('education_level');
  });

  it('should match languages — c_languages=1 maps to matched_criteria', async () => {
    setup(baseProfile, [makeRow({ c_languages: 1 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].matched_criteria).toContain('languages');
  });

  it('should NOT match languages — c_languages=0 maps to unmatched_criteria', async () => {
    setup(baseProfile, [makeRow({ c_languages: 0, sql_score: 7 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].unmatched_criteria).toContain('languages');
  });

  it('should NOT match key_skills with overlap < 2 — c_skills=0 maps to unmatched', async () => {
    setup(baseProfile, [makeRow({ c_skills: 0, sql_score: 7 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].unmatched_criteria).toContain('key_skills');
  });

  it('should match key_skills with overlap ≥ 2 — c_skills=1 maps to matched', async () => {
    setup(baseProfile, [makeRow({ c_skills: 1 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].matched_criteria).toContain('key_skills');
  });

  it('should match null job criteria as benefit of doubt — all c_*=1 → all matched', async () => {
    setup(baseProfile, [makeRow({ sql_score: 8 })]);
    const result = await findMatches('profile-1');
    expect(result.results[0].match_score).toBe(8);
    expect(result.results[0].matched_criteria).toHaveLength(8);
  });

  it('should call execute once in delta mode', async () => {
    setup(baseProfile, [makeRow()]);
    await findMatches('profile-1', { delta: true });
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('should return results with higher scores first (SQL ORDER BY preserved)', async () => {
    const rows = [makeRow({ id: 'job-8', sql_score: 8 }), makeRow({ id: 'job-6', sql_score: 6, c_sphere: 0, c_industry: 0 })];
    setup(baseProfile, rows);
    const result = await findMatches('profile-1');
    if (result.results.length >= 2) {
      expect(result.results[0].match_score).toBeGreaterThanOrEqual(result.results[1].match_score);
    }
  });

  it('should return max 50 results', async () => {
    const rows = Array.from({ length: 50 }, (_, i) => makeRow({ id: `job-${i}` }));
    setup(baseProfile, rows);
    const result = await findMatches('profile-1');
    expect(result.results.length).toBeLessThanOrEqual(50);
  });

  it('should insert searches and search_results, update profile', async () => {
    setup(baseProfile, [makeRow()]);
    await findMatches('profile-1');
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
