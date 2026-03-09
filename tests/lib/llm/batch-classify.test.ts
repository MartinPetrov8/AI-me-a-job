import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyUnclassifiedJobs } from '../../../src/lib/llm/batch-classify';
import * as classifyJobModule from '../../../src/lib/llm/classify-job';

vi.mock('../../../src/lib/llm/client', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock('../../../src/lib/llm/classify-job');

vi.mock('../../../src/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('classifyUnclassifiedJobs', () => {
  const mockJobs = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      externalId: 'test-1',
      source: 'test',
      title: 'Job 1',
      descriptionRaw: 'Description 1',
      url: 'https://example.com/1',
      ingestedAt: new Date(),
      company: null,
      location: null,
      country: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      employmentType: null,
      isRemote: null,
      postedAt: null,
      expiresAt: null,
      yearsExperience: null,
      educationLevel: null,
      fieldOfStudy: null,
      sphereOfExpertise: null,
      seniorityLevel: null,
      industry: null,
      languages: null,
      keySkills: null,
      classifiedAt: null,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      externalId: 'test-2',
      source: 'test',
      title: 'Job 2',
      descriptionRaw: 'Description 2',
      url: 'https://example.com/2',
      ingestedAt: new Date(),
      company: null,
      location: null,
      country: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      employmentType: null,
      isRemote: null,
      postedAt: null,
      expiresAt: null,
      yearsExperience: null,
      educationLevel: null,
      fieldOfStudy: null,
      sphereOfExpertise: null,
      seniorityLevel: null,
      industry: null,
      languages: null,
      keySkills: null,
      classifiedAt: null,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      externalId: 'test-3',
      source: 'test',
      title: 'Job 3',
      descriptionRaw: 'Description 3',
      url: 'https://example.com/3',
      ingestedAt: new Date(),
      company: null,
      location: null,
      country: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      employmentType: null,
      isRemote: null,
      postedAt: null,
      expiresAt: null,
      yearsExperience: null,
      educationLevel: null,
      fieldOfStudy: null,
      sphereOfExpertise: null,
      seniorityLevel: null,
      industry: null,
      languages: null,
      keySkills: null,
      classifiedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('classifies 3 unclassified jobs and sets classified_at', async () => {
    const { db } = await import('../../../src/lib/db');
    
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockJobs),
        }),
      }),
    });
    
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    
    (db.select as any) = mockSelect;
    (db.update as any) = mockUpdate;

    const mockClassifiedCriteria = {
      years_experience: '2-4',
      education_level: 'Bachelors',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Engineering',
      seniority_level: 'Junior',
      languages: ['English'],
      industry: 'Technology',
      key_skills: ['JavaScript'],
    };

    vi.mocked(classifyJobModule.classifyJob).mockResolvedValue(mockClassifiedCriteria);

    const result = await classifyUnclassifiedJobs(50);

    expect(result.total).toBe(3);
    expect(result.classified).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });

  it('handles partial failure with 1 of 3 jobs failing classification', async () => {
    const { db } = await import('../../../src/lib/db');
    
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockJobs),
        }),
      }),
    });
    
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    
    (db.select as any) = mockSelect;
    (db.update as any) = mockUpdate;

    const mockClassifiedCriteria = {
      years_experience: '2-4',
      education_level: 'Bachelors',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Engineering',
      seniority_level: 'Junior',
      languages: ['English'],
      industry: 'Technology',
      key_skills: ['JavaScript'],
    };

    vi.mocked(classifyJobModule.classifyJob)
      .mockResolvedValueOnce(mockClassifiedCriteria)
      .mockRejectedValueOnce(new Error('Classification failed'))
      .mockResolvedValueOnce(mockClassifiedCriteria);

    const result = await classifyUnclassifiedJobs(50);

    expect(result.total).toBe(3);
    expect(result.classified).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Classification failed');
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('returns empty result when no unclassified jobs exist', async () => {
    const { db } = await import('../../../src/lib/db');
    
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    
    (db.select as any) = mockSelect;

    const result = await classifyUnclassifiedJobs(50);

    expect(result.total).toBe(0);
    expect(result.classified).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
