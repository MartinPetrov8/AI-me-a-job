import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/ingestion/ingest', () => ({
  ingestAllSources: vi.fn().mockResolvedValue([
    { source: 'adzuna', fetched: 10, new: 5, errors: 0, deleted: 0 },
  ]),
  ingestAdzuna: vi.fn().mockResolvedValue({ source: 'adzuna', fetched: 10, new: 5, errors: 0, deleted: 0 }),
  ingestDevBg: vi.fn().mockResolvedValue({ source: 'dev_bg', fetched: 8, new: 3, errors: 0, deleted: 0 }),
  ingestJobsBg: vi.fn().mockResolvedValue({ source: 'jobs_bg', fetched: 6, new: 2, errors: 0, deleted: 0 }),
}));

vi.mock('@/lib/llm/batch-classify', () => ({
  classifyUnclassifiedJobs: vi.fn().mockResolvedValue({
    total: 5,
    classified: 5,
    failed: 0,
    errors: [],
  }),
}));

import { POST, GET } from '@/app/api/pipeline/route';
import { ingestAllSources, ingestAdzuna, ingestDevBg, ingestJobsBg } from '@/lib/ingestion/ingest';
import { classifyUnclassifiedJobs } from '@/lib/llm/batch-classify';
import { db } from '@/lib/db';

const CRON_SECRET = 'test-secret-123';

function makeRequest(secret?: string, queryParams?: string, method: 'GET' | 'POST' = 'POST'): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret !== undefined) headers['x-cron-secret'] = secret;
  const url = queryParams ? `http://localhost/api/pipeline?${queryParams}` : 'http://localhost/api/pipeline';
  return new NextRequest(url, { method, headers });
}

describe('POST /api/pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue(Promise.resolve([{ count: 0 }])),
    });
  });

  it('returns 401 when X-Cron-Secret header is missing', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 401 when X-Cron-Secret is wrong', async () => {
    const res = await POST(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with ingested when secret is correct', async () => {
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('ingested');
    expect(Array.isArray(body.ingested)).toBe(true);
    expect(ingestAllSources).toHaveBeenCalledOnce();
  });

  it('calls classifyUnclassifiedJobs with batchSize 1000 when classify=true', async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 10 }]),
      }),
    });

    const res = await POST(makeRequest(CRON_SECRET, 'classify=true'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classified).toEqual({
      total: 5,
      success: 5,
      failed: 0,
      remaining: 10,
    });
    expect(classifyUnclassifiedJobs).toHaveBeenCalledWith(1000);
    expect(ingestAllSources).not.toHaveBeenCalled();
  });

  it('calls ingestAdzuna when source=adzuna', async () => {
    const res = await POST(makeRequest(CRON_SECRET, 'source=adzuna'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ingested).toEqual([{ source: 'adzuna', fetched: 10, new: 5, errors: 0, deleted: 0 }]);
    expect(ingestAdzuna).toHaveBeenCalledOnce();
    expect(ingestAllSources).not.toHaveBeenCalled();
  });

  it('calls ingestDevBg when source=devbg', async () => {
    const res = await POST(makeRequest(CRON_SECRET, 'source=devbg'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ingested).toEqual([{ source: 'dev_bg', fetched: 8, new: 3, errors: 0, deleted: 0 }]);
    expect(ingestDevBg).toHaveBeenCalledOnce();
    expect(ingestAllSources).not.toHaveBeenCalled();
  });

  it('calls ingestJobsBg when source=jobsbg', async () => {
    const res = await POST(makeRequest(CRON_SECRET, 'source=jobsbg'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ingested).toEqual([{ source: 'jobs_bg', fetched: 6, new: 2, errors: 0, deleted: 0 }]);
    expect(ingestJobsBg).toHaveBeenCalledOnce();
    expect(ingestAllSources).not.toHaveBeenCalled();
  });
});

describe('GET /api/pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
  });

  it('returns 401 when X-Cron-Secret header is missing', async () => {
    const res = await GET(makeRequest(undefined, undefined, 'GET'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when X-Cron-Secret is wrong', async () => {
    const res = await GET(makeRequest('wrong-secret', undefined, 'GET'));
    expect(res.status).toBe(401);
  });

  it('returns stats when secret is correct', async () => {
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockResolvedValue([{ count: 100 }]),
    });
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 80 }]),
      }),
    });
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 20 }]),
      }),
    });
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockResolvedValue([
          { source: 'adzuna', total: 50, classified: 40 },
          { source: 'devbg', total: 30, classified: 25 },
        ]),
      }),
    });

    const res = await GET(makeRequest(CRON_SECRET, undefined, 'GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      total: 100,
      classified: 80,
      unclassified: 20,
      by_source: [
        { source: 'adzuna', total: 50, classified: 40 },
        { source: 'devbg', total: 30, classified: 25 },
      ],
    });
  });
});
