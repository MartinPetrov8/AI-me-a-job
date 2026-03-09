import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('fetchJoobleJobs', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.JOOBLE_API_KEY = 'test_key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('maps valid API response to RawJobPosting array', async () => {
    const mockResponse = {
      totalCount: 1,
      jobs: [
        {
          id: 'j-001',
          title: 'Data Scientist',
          location: 'Berlin',
          snippet: 'Exciting data science role with ML focus.',
          salary: '$80000 - $120000',
          source: 'jooble',
          type: 'Full-time',
          link: 'https://jooble.org/job/j-001',
          company: 'DataCo',
          updated: '2026-03-01T12:00:00Z',
        },
      ],
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { fetchJoobleJobs } = await import('@/lib/ingestion/jooble');
    const result = await fetchJoobleJobs('data scientist', 'Berlin');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      external_id: 'j-001',
      source: 'jooble',
      title: 'Data Scientist',
      company: 'DataCo',
      location: 'Berlin',
      url: 'https://jooble.org/job/j-001',
      description_raw: 'Exciting data science role with ML focus.',
      salary_min: 80000,
      salary_max: 120000,
      employment_type: 'Full-time',
    });
  });

  it('returns empty array on API error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { fetchJoobleJobs } = await import('@/lib/ingestion/jooble');
    const result = await fetchJoobleJobs('developer', '');
    expect(result).toEqual([]);
  });

  it('returns empty array when env var missing', async () => {
    delete process.env.JOOBLE_API_KEY;

    const { fetchJoobleJobs } = await import('@/lib/ingestion/jooble');
    const result = await fetchJoobleJobs('developer', '');
    expect(result).toEqual([]);
  });
});
