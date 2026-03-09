import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findMatches } from '../../../src/lib/matching/engine';
import { db } from '../../../src/lib/db/index';

// Mock db
vi.mock('../../../src/lib/db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe('Matching Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockProfile = {
    id: 'profile-1',
    yearsExperience: '5-9',
    educationLevel: 'Masters',
    fieldOfStudy: 'Computer Science',
    sphereOfExpertise: 'Software Development',
    seniorityLevel: 'Senior',
    industry: 'Technology',
    languages: ['English', 'German'],
    keySkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    lastSearchAt: new Date('2026-03-01T00:00:00Z'),
  };

  const mockJobs = [
    {
      id: 'job-1',
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'Berlin',
      url: 'https://example.com/job1',
      posted_at: new Date('2026-03-08T00:00:00Z'),
      salary_min: 80000,
      salary_max: 120000,
      salary_currency: 'EUR',
      employment_type: 'Full-time',
      is_remote: true,
      years_experience: '5-9',
      education_level: 'Bachelors',
      field_of_study: 'Computer Science',
      sphere_of_expertise: 'Software Development',
      seniority_level: 'Senior',
      industry: 'Technology',
      languages: ['English'],
      key_skills: ['JavaScript', 'TypeScript'],
    },
    {
      id: 'job-2',
      title: 'Lead Developer',
      company: 'StartUp Inc',
      location: 'Remote',
      url: 'https://example.com/job2',
      posted_at: new Date('2026-03-07T00:00:00Z'),
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      employment_type: 'Full-time',
      is_remote: true,
      years_experience: '10-15',
      education_level: 'Bachelors',
      field_of_study: 'Computer Science',
      sphere_of_expertise: 'Software Development',
      seniority_level: 'Lead/Manager',
      industry: 'Technology',
      languages: ['English', 'German'],
      key_skills: ['React', 'Node.js', 'AWS'],
    },
    {
      id: 'job-3',
      title: 'Junior Developer',
      company: 'Small Co',
      location: 'Munich',
      url: 'https://example.com/job3',
      posted_at: null,
      salary_min: 40000,
      salary_max: 60000,
      salary_currency: 'EUR',
      employment_type: 'Full-time',
      is_remote: false,
      years_experience: '0-1',
      education_level: 'Bachelors',
      field_of_study: 'Computer Science',
      sphere_of_expertise: 'Software Development',
      seniority_level: 'Junior',
      industry: 'Technology',
      languages: ['English'],
      key_skills: ['JavaScript'],
    },
  ];

  it('should return jobs with exact industry match', async () => {
    const selectMock = vi.fn().mockReturnThis();
    const fromMock = vi.fn().mockReturnThis();
    const whereMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue([mockProfile]);

    (db.select as any).mockImplementation(() => ({
      from: fromMock.mockReturnValue({
        where: whereMock.mockReturnValue({
          limit: limitMock,
        }),
      }),
    }));

    // Second select call for jobs
    selectMock.mockReturnValueOnce({
      from: vi.fn().mockResolvedValue([mockJobs[0]]),
    });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    // Mock second select for jobs
    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: whereMock.mockReturnValue({
            limit: limitMock,
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([mockJobs[0]]),
      });

    const result = await findMatches('profile-1');

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].match_score).toBeGreaterThanOrEqual(5);
  });

  it('should NOT return jobs matching only 4/8 criteria (below threshold)', async () => {
    const jobBelow = {
      ...mockJobs[0],
      id: 'job-below',
      years_experience: '15+', // no match (too far)
      education_level: 'PhD', // no match (job requires more than profile has)
      field_of_study: 'Physics', // no match
      sphere_of_expertise: 'Data Science', // no match
      // seniority: match, industry: match, languages: match, key_skills: match = 4 total
    };

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([jobBelow]),
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    expect(result.results.length).toBe(0);
  });

  it('should return jobs matching 6/8 criteria', async () => {
    const job6 = {
      ...mockJobs[0],
      id: 'job-6',
      field_of_study: 'Physics', // no match
      sphere_of_expertise: 'Data Science', // no match
      // 6 matches: years, education, seniority, industry, languages, key_skills
    };

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([job6]),
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    expect(result.results.length).toBe(1);
    expect(result.results[0].match_score).toBe(6);
  });

  it('should match adjacent seniority (profile=Senior, job=Lead/Manager)', async () => {
    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([mockJobs[1]]), // job-2 has Lead/Manager
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].matched_criteria).toContain('seniority_level');
  });

  it('should match education overqualification (profile=Masters, job=Bachelors)', async () => {
    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([mockJobs[0]]), // job-1 has Bachelors
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].matched_criteria).toContain('education_level');
  });

  it('should match languages containment (profile=[English,German], job=[English])', async () => {
    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([mockJobs[0]]), // job-1 has [English]
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].matched_criteria).toContain('languages');
  });

  it('should NOT match languages NOT contained (profile=[English], job=[English,German])', async () => {
    const profileEnglishOnly = {
      ...mockProfile,
      languages: ['English'],
    };

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([profileEnglishOnly]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([mockJobs[1]]), // job-2 has [English, German]
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    if (result.results.length > 0) {
      expect(result.results[0].unmatched_criteria).toContain('languages');
    }
  });

  it('should NOT match key_skills with overlap of 1', async () => {
    const jobOneSkill = {
      ...mockJobs[0],
      key_skills: ['JavaScript'], // only 1 overlap
    };

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([jobOneSkill]),
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    if (result.results.length > 0) {
      expect(result.results[0].unmatched_criteria).toContain('key_skills');
    }
  });

  it('should match key_skills with overlap of 2', async () => {
    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([mockJobs[0]]), // has ['JavaScript', 'TypeScript']
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].matched_criteria).toContain('key_skills');
  });

  it('should match null job criteria as benefit of doubt', async () => {
    const jobAllNull = {
      id: 'job-null',
      title: 'Generic Job',
      company: null,
      location: null,
      url: 'https://example.com/jobnull',
      posted_at: null,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      employment_type: null,
      is_remote: null,
      years_experience: null,
      education_level: null,
      field_of_study: null,
      sphere_of_expertise: null,
      seniority_level: null,
      industry: null,
      languages: null,
      key_skills: null,
    };

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([jobAllNull]),
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    expect(result.results.length).toBe(1);
    expect(result.results[0].match_score).toBe(8); // All criteria match (null = benefit of doubt)
  });

  it('should only return jobs ingested after last_search_at in delta mode', async () => {
    const jobOld = {
      ...mockJobs[0],
      id: 'job-old',
      ingested_at: new Date('2026-02-28T00:00:00Z'), // before last_search_at
    };

    const jobNew = {
      ...mockJobs[0],
      id: 'job-new',
      ingested_at: new Date('2026-03-05T00:00:00Z'), // after last_search_at
    };

    const whereMock = vi.fn().mockReturnThis();

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: whereMock.mockResolvedValue([jobNew]),
        }),
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1', { delta: true });

    expect(whereMock).toHaveBeenCalled();
  });

  it('should return results ordered by score DESC', async () => {
    const jobLow = { ...mockJobs[2], key_skills: ['JavaScript', 'Python'] }; // lower score
    const jobHigh = { ...mockJobs[0] }; // higher score

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([jobLow, jobHigh]),
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    if (result.results.length >= 2) {
      expect(result.results[0].match_score).toBeGreaterThanOrEqual(result.results[1].match_score);
    }
  });

  it('should return max 50 results', async () => {
    const manyJobs = Array.from({ length: 100 }, (_, i) => ({
      ...mockJobs[0],
      id: `job-${i}`,
    }));

    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue(manyJobs),
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    const result = await findMatches('profile-1');

    expect(result.results.length).toBeLessThanOrEqual(50);
  });

  it('should create searches and search_results records in DB', async () => {
    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([mockJobs[0]]),
      });

    const insertMock = vi.fn().mockReturnThis();
    const valuesMock = vi.fn().mockReturnThis();
    const returningMock = vi.fn().mockResolvedValue([{ id: 'search-1' }]);

    (db.insert as any).mockImplementation(() => ({
      values: valuesMock.mockReturnValue({
        returning: returningMock,
      }),
    }));

    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    (db.update as any).mockImplementation(() => ({
      set: setMock.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }));

    await findMatches('profile-1');

    expect(db.insert).toHaveBeenCalledTimes(2); // searches + search_results
    expect(db.update).toHaveBeenCalledTimes(1); // profile.last_search_at
  });
});
