import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('fetchAdzunaJobs', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.ADZUNA_APP_ID = 'test_id';
    process.env.ADZUNA_APP_KEY = 'test_key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('maps valid API response to RawJobPosting array', async () => {
    const mockResponse = {
      results: [
        {
          id: '12345',
          title: 'Senior Developer',
          company: { display_name: 'Acme Corp' },
          location: { display_name: 'London' },
          redirect_url: 'https://example.com/job/12345',
          description: 'A great job for developers.',
          salary_min: 50000,
          salary_max: 70000,
          contract_type: 'Full-time',
          created: '2026-03-01T10:00:00Z',
        },
      ],
      count: 1,
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { fetchAdzunaJobs } = await import('@/lib/ingestion/adzuna');
    const result = await fetchAdzunaJobs('gb', 1);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      external_id: '12345',
      source: 'adzuna',
      title: 'Senior Developer',
      company: 'Acme Corp',
      location: 'London',
      country: 'gb',
      url: 'https://example.com/job/12345',
      description_raw: 'A great job for developers.',
      salary_min: 50000,
      salary_max: 70000,
      employment_type: 'Full-time',
    });
    expect(result[0].posted_at).toBeInstanceOf(Date);
  });

  it('returns empty array on HTTP 429', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
    });

    const { fetchAdzunaJobs } = await import('@/lib/ingestion/adzuna');
    const result = await fetchAdzunaJobs('gb', 1);
    expect(result).toEqual([]);
  });

  it('returns empty array on timeout', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DOMException('The operation was aborted', 'AbortError')
    );

    const { fetchAdzunaJobs } = await import('@/lib/ingestion/adzuna');
    const result = await fetchAdzunaJobs('gb', 1);
    expect(result).toEqual([]);
  });

  it('returns empty array when env vars missing', async () => {
    delete process.env.ADZUNA_APP_ID;
    delete process.env.ADZUNA_APP_KEY;

    const { fetchAdzunaJobs } = await import('@/lib/ingestion/adzuna');
    const result = await fetchAdzunaJobs('gb', 1);
    expect(result).toEqual([]);
  });
});
