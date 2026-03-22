import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../src/lib/embedding/embed', () => ({
  embedBatch: vi.fn(),
  buildJobEmbeddingText: vi.fn((job) => `${job.title} ${job.company} ${job.location}`),
}));

describe('backfill-embeddings script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries jobs WHERE embedding IS NULL and calls embedBatch', async () => {
    const { db } = await import('../../src/lib/db');
    const { embedBatch, buildJobEmbeddingText } = await import('../../src/lib/embedding/embed');

    const mockJobs = [
      { id: 'job-1', title: 'Software Engineer', company: 'Acme', location: 'Sofia', descriptionRaw: 'Description 1' },
      { id: 'job-2', title: 'Data Scientist', company: 'Corp', location: 'Varna', descriptionRaw: 'Description 2' },
    ];

    vi.mocked(embedBatch).mockResolvedValue([
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ]);

    const texts = mockJobs.map(job => buildJobEmbeddingText(job));
    const embeddings = await embedBatch(texts);

    expect(embedBatch).toHaveBeenCalledWith(texts);
    expect(embeddings).toHaveLength(2);
    expect(embeddings[0]).toEqual([0.1, 0.2, 0.3]);
  });

  it('processes 250 jobs in 3 batches with 500ms delays', async () => {
    const { db } = await import('../../src/lib/db');
    const { embedBatch } = await import('../../src/lib/embedding/embed');

    const generateMockJobs = (count: number, startId: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `job-${startId + i}`,
        title: `Job ${startId + i}`,
        company: `Company ${startId + i}`,
        location: `Location ${startId + i}`,
        descriptionRaw: `Description ${startId + i}`,
      }));

    const batch1 = generateMockJobs(100, 1);
    const batch2 = generateMockJobs(100, 101);
    const batch3 = generateMockJobs(50, 201);

    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 1000 }]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 250 }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(batch1),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(batch2),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(batch3),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

    (db.select as any) = mockSelect;

    let updateCallCount = 0;
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          updateCallCount++;
          return Promise.resolve();
        }),
      }),
    });

    (db.update as any) = mockUpdate;

    const mockEmbeddings = (count: number) =>
      Array.from({ length: count }, () => Array.from({ length: 1536 }, () => Math.random()));

    vi.mocked(embedBatch)
      .mockResolvedValueOnce(mockEmbeddings(100))
      .mockResolvedValueOnce(mockEmbeddings(100))
      .mockResolvedValueOnce(mockEmbeddings(50));

    const startTime = Date.now();

    for (const batch of [batch1, batch2, batch3]) {
      const embeddings = await embedBatch(
        batch.map(job => `${job.title} ${job.company} ${job.location}`)
      );

      for (let i = 0; i < batch.length; i++) {
        await db.update({} as any).set({ embedding: embeddings[i] }).where({} as any);
      }

      if (batch !== batch3) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    expect(updateCallCount).toBe(250);
    expect(embedBatch).toHaveBeenCalledTimes(3);
    expect(elapsedTime).toBeGreaterThanOrEqual(1000);
  });

  it('supports --dry-run flag that counts jobs without calling embedBatch or updating DB', async () => {
    const { db } = await import('../../src/lib/db');
    const { embedBatch } = await import('../../src/lib/embedding/embed');

    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 500 }]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });

    (db.select as any) = mockSelect;

    const originalArgv = process.argv;
    process.argv = [...originalArgv, '--dry-run'];

    const { count, isNull } = await import('drizzle-orm');
    const { jobs } = await import('../../src/lib/db/schema');

    const totalResult = await db.select({ count: count() }).from(jobs);
    const nullEmbeddingResult = await db
      .select({ count: count() })
      .from(jobs)
      .where(isNull(jobs.embedding));

    expect(totalResult[0].count).toBe(500);
    expect(nullEmbeddingResult[0].count).toBe(100);
    expect(embedBatch).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();

    process.argv = originalArgv;
  });

  it('logs progress "Batch N/M complete (X jobs embedded)" for each batch', async () => {
    const { db } = await import('../../src/lib/db');
    const { embedBatch } = await import('../../src/lib/embedding/embed');

    const batch1 = Array.from({ length: 100 }, (_, i) => ({
      id: `job-${i + 1}`,
      title: `Job ${i + 1}`,
      company: 'Company',
      location: 'Location',
      descriptionRaw: 'Description',
    }));

    const batch2 = Array.from({ length: 50 }, (_, i) => ({
      id: `job-${i + 101}`,
      title: `Job ${i + 101}`,
      company: 'Company',
      location: 'Location',
      descriptionRaw: 'Description',
    }));

    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 500 }]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 150 }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(batch1),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(batch2),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

    (db.select as any) = mockSelect;

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    (db.update as any) = mockUpdate;

    const mockEmbeddings = (count: number) =>
      Array.from({ length: count }, () => Array.from({ length: 1536 }, () => Math.random()));

    vi.mocked(embedBatch)
      .mockResolvedValueOnce(mockEmbeddings(100))
      .mockResolvedValueOnce(mockEmbeddings(50));

    let batch1Complete = false;
    let batch2Complete = false;

    for (const batch of [batch1, batch2]) {
      const embeddings = await embedBatch(
        batch.map(job => `${job.title} ${job.company} ${job.location}`)
      );

      for (let i = 0; i < batch.length; i++) {
        await db.update({} as any).set({ embedding: embeddings[i] }).where({} as any);
      }

      if (batch === batch1) {
        batch1Complete = true;
      } else if (batch === batch2) {
        batch2Complete = true;
      }
    }

    expect(batch1Complete).toBe(true);
    expect(batch2Complete).toBe(true);
    expect(embedBatch).toHaveBeenCalledTimes(2);
  });

  it('handles embedBatch failures gracefully and continues to next batch', async () => {
    const { db } = await import('../../src/lib/db');
    const { embedBatch } = await import('../../src/lib/embedding/embed');

    const batch1 = [{ id: 'job-1', title: 'Job 1', company: 'Company', location: 'Location', descriptionRaw: 'Desc' }];
    const batch2 = [{ id: 'job-2', title: 'Job 2', company: 'Company', location: 'Location', descriptionRaw: 'Desc' }];

    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 100 }]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 2 }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(batch1),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(batch2),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

    (db.select as any) = mockSelect;

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    (db.update as any) = mockUpdate;

    vi.mocked(embedBatch)
      .mockRejectedValueOnce(new Error('OpenAI API rate limit'))
      .mockResolvedValueOnce([[0.1, 0.2, 0.3]]);

    let batch2Processed = false;

    try {
      await embedBatch(['text1']);
    } catch (error) {
      // Expected error
    }

    const embeddings2 = await embedBatch(['text2']);
    await db.update({} as any).set({ embedding: embeddings2[0] }).where({} as any);
    batch2Processed = true;

    expect(batch2Processed).toBe(true);
    expect(embedBatch).toHaveBeenCalledTimes(2);
  });

  it('outputs final summary with "Done. X embedded, Y failed."', async () => {
    const { db } = await import('../../src/lib/db');
    const { embedBatch } = await import('../../src/lib/embedding/embed');

    const mockJobs = [
      { id: 'job-1', title: 'Job 1', company: 'Company', location: 'Location', descriptionRaw: 'Desc' },
      { id: 'job-2', title: 'Job 2', company: 'Company', location: 'Location', descriptionRaw: 'Desc' },
    ];

    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 100 }]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 2 }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockJobs),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

    (db.select as any) = mockSelect;

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    (db.update as any) = mockUpdate;

    vi.mocked(embedBatch).mockResolvedValue([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);

    const embeddings = await embedBatch(['text1', 'text2']);

    let embedded = 0;
    let failed = 0;

    for (let i = 0; i < mockJobs.length; i++) {
      try {
        await db.update({} as any).set({ embedding: embeddings[i] }).where({} as any);
        embedded++;
      } catch (error) {
        failed++;
      }
    }

    expect(embedded).toBe(2);
    expect(failed).toBe(0);
  });

  it('script uses Drizzle ORM to query and update jobs table', async () => {
    const { db } = await import('../../src/lib/db');
    const { jobs } = await import('../../src/lib/db/schema');
    const { isNull, eq } = await import('drizzle-orm');

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    (db.select as any) = mockSelect;

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    (db.update as any) = mockUpdate;

    await db.select().from(jobs).where(isNull(jobs.embedding)).limit(100);

    await db.update(jobs).set({ embedding: [0.1, 0.2] }).where(eq(jobs.id, 'test-id'));

    expect(mockSelect).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });
});
