import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/ingestion/ingest', () => ({
  ingestAllSources: vi.fn().mockResolvedValue([
    { source: 'adzuna', fetched: 10, new: 5, errors: 0, deleted: 0 },
  ]),
  ingestAdzuna: vi.fn().mockResolvedValue({ source: 'adzuna', fetched: 10, new: 5, errors: 0, deleted: 0 }),
  ingestDevBg: vi.fn().mockResolvedValue({ source: 'dev_bg', fetched: 8, new: 4, errors: 0, deleted: 0 }),
  ingestJobsBg: vi.fn().mockResolvedValue({ source: 'jobs_bg', fetched: 6, new: 3, errors: 0, deleted: 0 }),
}));

vi.mock('@/lib/llm/batch-classify', () => ({
  classifyUnclassifiedJobs: vi.fn().mockResolvedValue({
    total: 5,
    classified: 5,
    failed: 0,
    errors: [],
  }),
}));

import { POST } from '@/app/api/pipeline/route';
import { ingestAllSources, ingestAdzuna, ingestDevBg, ingestJobsBg } from '@/lib/ingestion/ingest';

const CRON_SECRET = 'test-secret-123';

function makeRequest(secret?: string, queryParams?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret !== undefined) headers['x-cron-secret'] = secret;
  const url = queryParams ? `http://localhost/api/pipeline?${queryParams}` : 'http://localhost/api/pipeline';
  return new NextRequest(url, { method: 'POST', headers });
}

describe('POST /api/pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
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
});
