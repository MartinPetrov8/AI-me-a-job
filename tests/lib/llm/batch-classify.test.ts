import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyUnclassifiedJobs, classifyJobsById } from '../../../src/lib/llm/batch-classify';
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
vi.mock('../../../src/lib/embedding/embed');

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
      embedding: null,
      canonicalUrl: null,
      contentHash: null,
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
      embedding: null,
      canonicalUrl: null,
      contentHash: null,
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
      embedding: null,
      canonicalUrl: null,
      contentHash: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('classifies 3 unclassified jobs and sets classified_at', async () => {
    const { db } = await import('../../../src/lib/db');
    const { embedText } = await import('../../../src/lib/embedding/embed');
    
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

    vi.mocked(classifyJobModule.classifyJob).mockResolvedValue(mockClassifiedCriteria as any);
    vi.mocked(embedText).mockResolvedValue(new Array(1536).fill(0.1));

    const result = await classifyUnclassifiedJobs(50);

    expect(result.total).toBe(3);
    expect(result.classified).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });

  it('handles partial failure with 1 of 3 jobs failing classification', async () => {
    const { db } = await import('../../../src/lib/db');
    const { embedText } = await import('../../../src/lib/embedding/embed');
    
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
      .mockResolvedValueOnce(mockClassifiedCriteria as any)
      .mockRejectedValueOnce(new Error('Classification failed'))
      .mockResolvedValueOnce(mockClassifiedCriteria as any);
    
    vi.mocked(embedText).mockResolvedValue(new Array(1536).fill(0.1));

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

describe('classifyJobsById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes 25 unclassified jobs in chunks of 20 and calls classifyJob exactly 25 times', async () => {
    const { db } = await import('../../../src/lib/db');
    const { embedText } = await import('../../../src/lib/embedding/embed');
    
    const jobIds = Array.from({ length: 25 }, (_, i) => `job-${i + 1}`);
    const unclassifiedJobs = jobIds.map((id, index) => ({
      id,
      externalId: `ext-${index}`,
      source: 'test',
      title: `Job ${index + 1}`,
      descriptionRaw: `Description ${index + 1}`,
      url: `https://example.com/${index}`,
      company: 'Test Co',
      location: 'Remote',
      country: 'US',
      ingestedAt: new Date(),
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
      embedding: null,
      canonicalUrl: null,
      contentHash: null,
    }));

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn()
          .mockResolvedValueOnce(unclassifiedJobs.slice(0, 20))
          .mockResolvedValueOnce(unclassifiedJobs.slice(20, 25)),
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

    vi.mocked(classifyJobModule.classifyJob).mockResolvedValue(mockClassifiedCriteria as any);
    vi.mocked(embedText).mockResolvedValue(new Array(1536).fill(0.1));

    const result = await classifyJobsById(jobIds);

    expect(result.total).toBe(25);
    expect(result.classified).toBe(25);
    expect(result.failed).toBe(0);
    expect(classifyJobModule.classifyJob).toHaveBeenCalledTimes(25);
    expect(mockUpdate).toHaveBeenCalledTimes(25);
  });

  it('skips already-classified jobs and calls classifyJob 0 times when all jobs have classified_at set', async () => {
    const { db } = await import('../../../src/lib/db');
    
    const jobIds = ['job-1', 'job-2', 'job-3'];
    const classifiedJobs = jobIds.map((id, index) => ({
      id,
      externalId: `ext-${index}`,
      source: 'test',
      title: `Job ${index + 1}`,
      descriptionRaw: `Description ${index + 1}`,
      url: `https://example.com/${index}`,
      company: 'Test Co',
      location: 'Remote',
      country: 'US',
      ingestedAt: new Date(),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      employmentType: null,
      isRemote: null,
      postedAt: null,
      expiresAt: null,
      yearsExperience: '2-4',
      educationLevel: 'Bachelors',
      fieldOfStudy: 'STEM',
      sphereOfExpertise: 'Engineering',
      seniorityLevel: 'Junior',
      industry: 'Technology',
      languages: ['English'],
      keySkills: ['JavaScript'],
      classifiedAt: new Date(),
      embedding: new Array(1536).fill(0.1),
      canonicalUrl: null,
      contentHash: null,
    }));

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(classifiedJobs),
      }),
    });

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    (db.select as any) = mockSelect;
    (db.update as any) = mockUpdate;

    const result = await classifyJobsById(jobIds);

    expect(result.total).toBe(3);
    expect(result.classified).toBe(3);
    expect(result.failed).toBe(0);
    expect(classifyJobModule.classifyJob).toHaveBeenCalledTimes(0);
  });

  it('handles classification errors and continues processing remaining jobs', async () => {
    const { db } = await import('../../../src/lib/db');
    const { embedText } = await import('../../../src/lib/embedding/embed');
    
    const jobIds = ['job-1', 'job-2', 'job-3', 'job-4'];
    const jobs = jobIds.map((id, index) => ({
      id,
      externalId: `ext-${index}`,
      source: 'test',
      title: `Job ${index + 1}`,
      descriptionRaw: `Description ${index + 1}`,
      url: `https://example.com/${index}`,
      company: 'Test Co',
      location: 'Remote',
      country: 'US',
      ingestedAt: new Date(),
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
      embedding: null,
      canonicalUrl: null,
      contentHash: null,
    }));

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(jobs),
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
      .mockResolvedValueOnce(mockClassifiedCriteria as any)
      .mockRejectedValueOnce(new Error('LLM timeout'))
      .mockResolvedValueOnce(mockClassifiedCriteria as any)
      .mockRejectedValueOnce(new Error('Invalid JSON response'));

    vi.mocked(embedText).mockResolvedValue(new Array(1536).fill(0.1));

    const result = await classifyJobsById(jobIds);

    expect(result.total).toBe(4);
    expect(result.classified).toBe(2);
    expect(result.failed).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain('LLM timeout');
    expect(result.errors[1]).toContain('Invalid JSON response');
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('returns empty result when given an empty ID array', async () => {
    const result = await classifyJobsById([]);

    expect(result.total).toBe(0);
    expect(result.classified).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
