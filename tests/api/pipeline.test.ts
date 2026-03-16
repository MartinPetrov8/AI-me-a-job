import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/pipeline/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/ingestion/ingest', () => ({
  ingestAllSources: vi.fn().mockResolvedValue([
    { source: 'adzuna', fetched: 10, new: 5, errors: 0, deleted: 0 },
  ]),
}));

vi.mock('@/lib/llm/batch-classify', () => ({
  classifyUnclassifiedJobs: vi.fn().mockResolvedValue({
    total: 5,
    classified: 5,
    failed: 0,
    errors: [],
  }),
}));

const CRON_SECRET = 'test-secret-123';

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret !== undefined) headers['x-cron-secret'] = secret;
  return new NextRequest('http://localhost/api/pipeline', { method: 'POST', headers });
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
  });
});
