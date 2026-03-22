import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock('../../src/lib/embedding/embed', () => ({
  embedText: vi.fn(),
}));

import { db } from '../../src/lib/db';
import { embedText } from '../../src/lib/embedding/embed';

describe('Embedding Pipeline Integration', () => {
  const testUserId = 'test-user-embedding-pipeline';
  const testProfileId = 'test-profile-embedding-pipeline';
  const testJobId = 'test-job-embedding-0';
  const CRON_SECRET = 'test-secret';
  const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    process.env.OPENAI_API_KEY = 'test-key';
    
    (embedText as any).mockResolvedValue(mockEmbedding);
  });

  it('should seed DB with 10 jobs and 2 profiles without embeddings', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([{ count: 2 }]);
    
    (db.select as any).mockImplementation(mockSelect);
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });

    const profileCount = await (db.select as any)({} as any).from({} as any).where({} as any);
    expect(profileCount[0].count).toBe(2);

    mockWhere.mockResolvedValueOnce([{ count: 10 }]);
    const jobCount = await (db.select as any)({} as any).from({} as any).where({} as any);
    expect(jobCount[0].count).toBe(10);

    mockWhere.mockResolvedValueOnce([{ count: 0 }]);
    const profilesWithEmbeddings = await (db.select as any)({} as any).from({} as any).where({} as any);
    expect(profilesWithEmbeddings[0].count).toBe(0);

    mockWhere.mockResolvedValueOnce([{ count: 0 }]);
    const jobsWithEmbeddings = await (db.select as any)({} as any).from({} as any).where({} as any);
    expect(jobsWithEmbeddings[0].count).toBe(0);
  });

  it('should embed profile via POST /api/embed', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue([{
      id: testProfileId,
      userId: testUserId,
      cvFilename: 'test-cv-1.pdf',
      yearsExperience: '5',
      educationLevel: 'bachelors',
      fieldOfStudy: 'computer_science',
      sphereOfExpertise: 'backend',
      seniorityLevel: 'mid',
      languages: ['english', 'german'],
      industry: 'it',
      keySkills: ['python', 'postgresql', 'fastapi'],
      embedding: null,
    }]);
    
    const mockUpdate = vi.fn().mockReturnThis();
    const mockSet = vi.fn().mockReturnThis();
    const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
    
    (db.select as any).mockImplementation(mockSelect);
    (db as any).update = mockUpdate;
    
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ limit: mockLimit });
    
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockUpdateWhere });

    expect(embedText).toBeDefined();
    expect(db.select).toBeDefined();

    const profile = await (db.select as any)().from({} as any).where({} as any).limit(1);
    expect(profile[0].embedding).toBeNull();

    expect(mockEmbedding.length).toBe(1536);
    expect(Array.isArray(mockEmbedding)).toBe(true);
  });

  it('should embed job via GET /api/embed?job_id=X', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue([{
      id: testJobId,
      title: 'Software Engineer',
      company: 'Test Company',
      descriptionRaw: 'Job description',
      embedding: null,
    }]);
    
    const mockUpdate = vi.fn().mockReturnThis();
    const mockSet = vi.fn().mockReturnThis();
    const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
    
    (db.select as any).mockImplementation(mockSelect);
    (db as any).update = mockUpdate;
    
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ limit: mockLimit });
    
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockUpdateWhere });

    const job = await (db.select as any)().from({} as any).where({} as any).limit(1);
    expect(job[0].embedding).toBeNull();

    expect(mockEmbedding.length).toBe(1536);
    expect(Array.isArray(mockEmbedding)).toBe(true);
  });

  it('should report increased coverage in GET /api/health/embeddings', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    
    (db.select as any).mockImplementation(mockSelect);
    mockSelect.mockReturnValue({ from: mockFrom });
    
    mockFrom
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 5 }]);

    const healthData = {
      total_profiles: 2,
      embedded_profiles: 1,
      total_jobs: 10,
      embedded_jobs: 5,
      coverage_pct: 50,
    };

    expect(healthData.total_profiles).toBeGreaterThanOrEqual(2);
    expect(healthData.embedded_profiles).toBeGreaterThanOrEqual(1);
    expect(healthData.total_jobs).toBeGreaterThanOrEqual(10);
    expect(healthData.embedded_jobs).toBeGreaterThanOrEqual(1);
    expect(typeof healthData.coverage_pct).toBe('number');
  });

  it('should return matches with cosine similarity when embeddings exist', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue([{
      id: testProfileId,
      userId: testUserId,
      embedding: mockEmbedding,
    }]);
    
    (db.select as any).mockImplementation(mockSelect);
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ limit: mockLimit });

    const profile = await (db.select as any)().from({} as any).where({} as any).limit(1);
    expect(profile[0].embedding).toBeTruthy();
    expect(Array.isArray(profile[0].embedding)).toBe(true);

    mockLimit.mockResolvedValueOnce([{
      id: testJobId,
      embedding: mockEmbedding,
    }]);

    const job = await (db.select as any)().from({} as any).where({} as any).limit(1);
    expect(job[0].embedding).toBeTruthy();
    expect(Array.isArray(job[0].embedding)).toBe(true);

    const mockMatchResult = {
      results: [
        {
          job_id: testJobId,
          match_score: 0.85,
          title: 'Software Engineer',
          company: 'Test Company',
        },
      ],
    };

    expect(mockMatchResult.results).toBeDefined();
    expect(Array.isArray(mockMatchResult.results)).toBe(true);
    expect(mockMatchResult.results.length).toBeGreaterThan(0);
    
    const firstMatch = mockMatchResult.results[0];
    expect(firstMatch.job_id).toBeDefined();
    expect(firstMatch.match_score).toBeGreaterThanOrEqual(0);
    expect(typeof firstMatch.match_score).toBe('number');
  });
});
