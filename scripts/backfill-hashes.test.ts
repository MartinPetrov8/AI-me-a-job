import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeUrl, computeContentHash } from '../src/lib/ingestion/dedup';

const mockJobs = [
  {
    id: 'test-job-1',
    url: 'https://example.com/job/123?utm_source=test',
    title: 'Senior Software Engineer',
    company: 'Test Company',
    country: 'DE',
    postedAt: new Date('2026-03-01'),
    canonicalUrl: null,
    contentHash: null,
  },
];

const mockSelect = vi.fn(() => ({
  from: vi.fn(() => ({
    where: vi.fn().mockResolvedValue(mockJobs),
  })),
}));

const mockUpdate = vi.fn(() => ({
  set: vi.fn(() => ({
    where: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
  })),
}));

vi.mock('postgres', () => ({
  default: vi.fn(() => ({
    end: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  or: vi.fn((...args) => ({ or: args })),
  isNull: vi.fn((col) => ({ isNull: col })),
}));

async function runBackfillScript() {
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const postgres = (await import('postgres')).default;
  const { jobs } = await import('../src/lib/db/schema');
  const { eq, or, isNull } = await import('drizzle-orm');

  const sql = postgres('mock-connection-string');
  const db = drizzle(sql);

  const jobsNeedingBackfill = await db
    .select()
    .from(jobs)
    .where(or(isNull(jobs.canonicalUrl), isNull(jobs.contentHash)));

  if (jobsNeedingBackfill.length === 0) {
    return 0;
  }

  const batchSize = 100;
  let updatedCount = 0;

  for (let i = 0; i < jobsNeedingBackfill.length; i += batchSize) {
    const batch = jobsNeedingBackfill.slice(i, i + batchSize);

    for (const job of batch) {
      const canonicalUrl = normalizeUrl(job.url);
      const contentHash = computeContentHash(
        job.title,
        job.company,
        job.country,
        job.postedAt
      );

      await db
        .update(jobs)
        .set({
          canonicalUrl,
          contentHash,
        })
        .where(eq(jobs.id, job.id));

      updatedCount++;
    }
  }

  return updatedCount;
}

describe('backfill-hashes script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJobs[0].canonicalUrl = null;
    mockJobs[0].contentHash = null;
  });

  it('should backfill NULL canonicalUrl and contentHash', async () => {
    const updatedCount = await runBackfillScript();

    expect(updatedCount).toBe(1);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should compute canonicalUrl matching normalizeUrl', async () => {
    const expectedCanonicalUrl = normalizeUrl(mockJobs[0].url);

    await runBackfillScript();

    const setCall = mockUpdate.mock.results[0].value.set.mock.calls[0][0];
    expect(setCall.canonicalUrl).toBe(expectedCanonicalUrl);
  });

  it('should be idempotent when re-run on empty dataset', async () => {
    mockSelect.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    });

    const updatedCount = await runBackfillScript();

    expect(updatedCount).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should compute contentHash using existing function', async () => {
    const expectedContentHash = computeContentHash(
      mockJobs[0].title,
      mockJobs[0].company,
      mockJobs[0].country,
      mockJobs[0].postedAt
    );

    await runBackfillScript();

    const setCall = mockUpdate.mock.results[0].value.set.mock.calls[0][0];
    expect(setCall.contentHash).toBe(expectedContentHash);
  });
});
