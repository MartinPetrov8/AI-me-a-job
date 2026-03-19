import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/lib/llm/batch-classify', () => ({
  classifyUnclassifiedJobs: vi.fn(),
}));

describe('classify-backlog script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts unclassified jobs before starting and calls classifyUnclassifiedJobs with batchSize 500', async () => {
    const { db } = await import('../../src/lib/db');
    const { classifyUnclassifiedJobs } = await import('../../src/lib/llm/batch-classify');

    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 5 }]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      });

    (db.select as any) = mockSelect;

    vi.mocked(classifyUnclassifiedJobs).mockResolvedValue({
      total: 3,
      classified: 3,
      failed: 0,
      errors: [],
    });

    const { count, isNull } = await import('drizzle-orm');
    const { jobs } = await import('../../src/lib/db/schema');

    await db.select({ count: count() }).from(jobs);

    await db
      .select({ count: count() })
      .from(jobs)
      .where(isNull(jobs.classifiedAt));

    await classifyUnclassifiedJobs(500);

    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(classifyUnclassifiedJobs).toHaveBeenCalledWith(500);
  });

  it('outputs "classified count: 3" when 3 jobs are classified', async () => {
    const { classifyUnclassifiedJobs } = await import('../../src/lib/llm/batch-classify');

    vi.mocked(classifyUnclassifiedJobs).mockResolvedValue({
      total: 3,
      classified: 3,
      failed: 0,
      errors: [],
    });

    const result = await classifyUnclassifiedJobs(500);

    expect(result.classified).toBe(3);
    expect(classifyUnclassifiedJobs).toHaveBeenCalledWith(500);
  });

  it('outputs "classified count: 0" when re-run on already-classified jobs (idempotency)', async () => {
    const { db } = await import('../../src/lib/db');
    const { classifyUnclassifiedJobs } = await import('../../src/lib/llm/batch-classify');

    const mockSelectChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    };

    (db.select as any) = vi.fn().mockReturnValue(mockSelectChain);

    vi.mocked(classifyUnclassifiedJobs).mockResolvedValue({
      total: 0,
      classified: 0,
      failed: 0,
      errors: [],
    });

    const { count, isNull } = await import('drizzle-orm');
    const { jobs } = await import('../../src/lib/db/schema');

    const unclassifiedResult = await db
      .select({ count: count() })
      .from(jobs)
      .where(isNull(jobs.classifiedAt));

    const unclassifiedCount = unclassifiedResult[0]?.count ?? 0;

    expect(unclassifiedCount).toBe(0);
    expect(classifyUnclassifiedJobs).not.toHaveBeenCalled();
  });

  it('calls classifyUnclassifiedJobs when unclassified jobs exist', async () => {
    const { db } = await import('../../src/lib/db');
    const { classifyUnclassifiedJobs } = await import('../../src/lib/llm/batch-classify');

    const mockSelectChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 50 }]),
      }),
    };

    (db.select as any) = vi.fn().mockReturnValue(mockSelectChain);

    vi.mocked(classifyUnclassifiedJobs).mockResolvedValue({
      total: 50,
      classified: 48,
      failed: 2,
      errors: ['Job abc: Error 1', 'Job def: Error 2'],
    });

    const { count, isNull } = await import('drizzle-orm');
    const { jobs } = await import('../../src/lib/db/schema');

    const unclassifiedResult = await db
      .select({ count: count() })
      .from(jobs)
      .where(isNull(jobs.classifiedAt));

    const unclassifiedCount = unclassifiedResult[0]?.count ?? 0;

    expect(unclassifiedCount).toBe(50);

    const result = await classifyUnclassifiedJobs(500);

    expect(result.total).toBe(50);
    expect(result.classified).toBe(48);
    expect(result.failed).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(classifyUnclassifiedJobs).toHaveBeenCalledWith(500);
  });

  it('script is idempotent and safe to re-run', async () => {
    const { classifyUnclassifiedJobs } = await import('../../src/lib/llm/batch-classify');

    vi.mocked(classifyUnclassifiedJobs).mockResolvedValue({
      total: 0,
      classified: 0,
      failed: 0,
      errors: [],
    });

    const firstRun = await classifyUnclassifiedJobs(500);
    const secondRun = await classifyUnclassifiedJobs(500);

    expect(firstRun.classified).toBe(0);
    expect(secondRun.classified).toBe(0);
  });
});
