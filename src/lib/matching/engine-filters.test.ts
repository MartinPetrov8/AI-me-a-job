import { describe, it, expect, beforeEach, vi } from 'vitest';
import { findMatches } from './engine';
import { db } from '../db/index';

// Mock db
vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe('Matching Engine - Filters and Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile = {
    id: 'profile-1',
    yearsExperience: '5-9',
    educationLevel: 'Bachelors',
    fieldOfStudy: 'Computer Science',
    sphereOfExpertise: 'Software Development',
    seniorityLevel: 'Mid',
    industry: 'Technology',
    languages: ['English'],
    keySkills: ['JavaScript', 'TypeScript'],
    prefWorkMode: 'Any',
    prefEmploymentType: ['Full-time'],
    prefLocation: null,
    prefSalaryMin: null,
    lastSearchAt: null,
  };

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const mockJobs = [
    {
      id: 'job-high-salary',
      title: 'Senior Developer',
      company: 'Tech Corp',
      location: null,
      url: 'https://example.com/1',
      posted_at: sevenDaysAgo,
      salary_min: 80000,
      salary_max: 100000,
      salary_currency: 'USD',
      employment_type: 'Full-time',
      is_remote: null,
      years_experience: '5-9',
      education_level: 'Bachelors',
      field_of_study: 'Computer Science',
      sphere_of_expertise: 'Software Development',
      seniority_level: 'Mid',
      industry: 'Technology',
      languages: ['English'],
      key_skills: ['JavaScript', 'TypeScript', 'React'],
    },
    {
      id: 'job-low-salary',
      title: 'Junior Developer',
      company: 'Startup',
      location: null,
      url: 'https://example.com/2',
      posted_at: thirtyDaysAgo,
      salary_min: 30000,
      salary_max: 45000,
      salary_currency: 'USD',
      employment_type: 'Full-time',
      is_remote: null,
      years_experience: '2-4',
      education_level: 'Bachelors',
      field_of_study: 'Computer Science',
      sphere_of_expertise: 'Software Development',
      seniority_level: 'Junior',
      industry: 'Technology',
      languages: ['English'],
      key_skills: ['JavaScript', 'TypeScript', 'React'],
    },
    {
      id: 'job-recent',
      title: 'Mid Developer',
      company: 'Tech Inc',
      location: null,
      url: 'https://example.com/3',
      posted_at: now,
      salary_min: 60000,
      salary_max: 75000,
      salary_currency: 'USD',
      employment_type: 'Full-time',
      is_remote: null,
      years_experience: '5-9',
      education_level: 'Bachelors',
      field_of_study: 'Computer Science',
      sphere_of_expertise: 'Software Development',
      seniority_level: 'Mid',
      industry: 'Technology',
      languages: ['English'],
      key_skills: ['JavaScript', 'TypeScript', 'React'],
    },
  ];

  it('filters jobs by salary_min - excludes jobs with salary_max below threshold', async () => {
    const mockSelect = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    }));
    const mockLimit = vi.fn(() => [mockProfile]);
    const mockWhere = vi.fn(() => ({ limit: mockLimit }));
    const mockFrom = vi.fn(() => mockJobs);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({ where: mockWhere, limit: mockLimit })),
    } as any);

    vi.mocked(db.select).mockReturnValueOnce({
      from: mockFrom,
    } as any);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 'search-1' }]),
      })),
    } as any);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as any);

    const result = await findMatches('profile-1', { salaryMin: 60000 });

    // Should exclude job-low-salary (max 45000)
    expect(result.results.length).toBeLessThanOrEqual(2);
    const jobIds = result.results.map(r => r.job_id);
    expect(jobIds).not.toContain('job-low-salary');
  });

  it('filters jobs by salary_max - excludes jobs with salary_min above threshold', async () => {
    const mockLimit = vi.fn(() => [mockProfile]);
    const mockWhere = vi.fn(() => ({ limit: mockLimit }));
    const mockFrom = vi.fn(() => mockJobs);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({ where: mockWhere, limit: mockLimit })),
    } as any);

    vi.mocked(db.select).mockReturnValueOnce({
      from: mockFrom,
    } as any);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 'search-1' }]),
      })),
    } as any);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as any);

    const result = await findMatches('profile-1', { salaryMax: 50000 });

    // Should exclude job-high-salary (min 80000), may exclude job-recent (min 60000)
    const jobIds = result.results.map(r => r.job_id);
    expect(jobIds).not.toContain('job-high-salary');
  });

  it('filters jobs by posted_within - excludes jobs older than threshold', async () => {
    const mockLimit = vi.fn(() => [mockProfile]);
    const mockWhere = vi.fn(() => ({ limit: mockLimit }));
    const mockFrom = vi.fn(() => mockJobs);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({ where: mockWhere, limit: mockLimit })),
    } as any);

    vi.mocked(db.select).mockReturnValueOnce({
      from: mockFrom,
    } as any);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 'search-1' }]),
      })),
    } as any);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as any);

    const result = await findMatches('profile-1', { postedWithin: 14 });

    // Should exclude job-low-salary (posted 30 days ago)
    const jobIds = result.results.map(r => r.job_id);
    expect(jobIds).not.toContain('job-low-salary');
  });

  it('sorts jobs by posted_at when sort=posted_at', async () => {
    const mockLimit = vi.fn(() => [mockProfile]);
    const mockWhere = vi.fn(() => ({ limit: mockLimit }));
    const mockFrom = vi.fn(() => mockJobs);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({ where: mockWhere, limit: mockLimit })),
    } as any);

    vi.mocked(db.select).mockReturnValueOnce({
      from: mockFrom,
    } as any);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 'search-1' }]),
      })),
    } as any);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as any);

    const result = await findMatches('profile-1', { sort: 'posted_at' });

    // Results should be sorted by posted_at DESC (most recent first)
    if (result.results.length >= 2) {
      const dates = result.results.map(r => new Date(r.posted_at!).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    }
  });

  it('sorts jobs by salary_max when sort=salary_max', async () => {
    const mockLimit = vi.fn(() => [mockProfile]);
    const mockWhere = vi.fn(() => ({ limit: mockLimit }));
    const mockFrom = vi.fn(() => mockJobs);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({ where: mockWhere, limit: mockLimit })),
    } as any);

    vi.mocked(db.select).mockReturnValueOnce({
      from: mockFrom,
    } as any);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 'search-1' }]),
      })),
    } as any);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as any);

    const result = await findMatches('profile-1', { sort: 'salary_max' });

    // Results should be sorted by salary_max DESC (highest first)
    if (result.results.length >= 2) {
      const salaries = result.results.map(r => r.salary_max || 0);
      for (let i = 0; i < salaries.length - 1; i++) {
        expect(salaries[i]).toBeGreaterThanOrEqual(salaries[i + 1]);
      }
    }
  });
});
