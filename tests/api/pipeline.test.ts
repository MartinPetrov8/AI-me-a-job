import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockSelect, mockFrom, mockWhere } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockWhere: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock('@/lib/ingestion/ingest', () => ({
  ingestAllSources: vi.fn().mockResolvedValue([
    { source: 'adzuna', fetched: 10, new: 5, errors: 0, deleted: 0 },
  ]),
  ingestAdzuna: vi.fn().mockResolvedValue({ source: 'adzuna', fetched: 10, new: 5, errors: 0, deleted: 0 }),
  ingestDevBg: vi.fn().mockResolvedValue({ source: 'dev_bg', fetched: 8, new: 4, errors: 0, deleted: 0 }),
  ingestJobsBg: vi.fn().mockResolvedValue({ source: 'jobs_bg', fetched: 6, new: 3, errors: 0, deleted: 0 }),
  ingestJooble: vi.fn().mockResolvedValue({ source: 'jooble', fetched: 12, new: 6, errors: 0, deleted: 0 }),
  ingestRemoteOk: vi.fn().mockResolvedValue({ source: 'remoteok', fetched: 200, new: 150, errors: 0, deleted: 0 }),
  ingestWeWorkRemotely: vi.fn().mockResolvedValue({ source: 'weworkremotely', fetched: 120, new: 90, errors: 0, deleted: 0 }),
  ingestNoFluffJobs: vi.fn().mockResolvedValue({ source: 'nofluffjobs', fetched: 180, new: 120, errors: 0, deleted: 0 }),
  ingestZaplata: vi.fn().mockResolvedValue({ source: 'zaplata', fetched: 15, new: 10, errors: 0, deleted: 0 }),
  ingestJustJoinIt: vi.fn().mockResolvedValue({ source: 'justjoinit', fetched: 100, new: 80, errors: 0, deleted: 0 }),
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
    
    mockSelect.mockReturnValue({
      from: mockFrom.mockReturnValue(Promise.resolve([{ count: 0 }])),
    });
    mockWhere.mockReturnValue(Promise.resolve([{ count: 0 }]));
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

  it('calls ingestAdzuna when source=adzuna', async () => {
    const res = await POST(makeRequest(CRON_SECRET, 'source=adzuna'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ingested).toHaveLength(1);
    expect(body.ingested[0].source).toBe('adzuna');
    expect(ingestAdzuna).toHaveBeenCalledOnce();
    expect(ingestAllSources).not.toHaveBeenCalled();
  });

  it('calls ingestDevBg when source=devbg', async () => {
    const res = await POST(makeRequest(CRON_SECRET, 'source=devbg'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ingested).toHaveLength(1);
    expect(body.ingested[0].source).toBe('dev_bg');
    expect(ingestDevBg).toHaveBeenCalledOnce();
    expect(ingestAllSources).not.toHaveBeenCalled();
  });

  it('calls ingestJobsBg when source=jobsbg', async () => {
    const res = await POST(makeRequest(CRON_SECRET, 'source=jobsbg'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ingested).toHaveLength(1);
    expect(body.ingested[0].source).toBe('jobs_bg');
    expect(ingestJobsBg).toHaveBeenCalledOnce();
    expect(ingestAllSources).not.toHaveBeenCalled();
  });

  it('calls classifyUnclassifiedJobs with batchSize 1000 when classify=true', async () => {
    mockSelect.mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: mockWhere.mockResolvedValue([{ count: 10 }]),
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
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockResolvedValue([{ count: 100 }]),
    });
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 80 }]),
      }),
    });
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 20 }]),
      }),
    });
    mockSelect.mockReturnValueOnce({
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
