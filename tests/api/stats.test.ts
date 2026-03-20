import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
  },
}));

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stats with total_jobs, countries, sources, last_updated', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            totalJobs: 150,
            countries: 5,
            sources: 3,
            lastUpdated: new Date('2026-03-20T10:00:00Z'),
          },
        ]),
      }),
    });

    const { GET } = await import('@/app/api/stats/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      total_jobs: 150,
      countries: 5,
      sources: 3,
      last_updated: '2026-03-20T10:00:00.000Z',
    });

    const headers = Object.fromEntries(response.headers.entries());
    expect(headers['cache-control']).toContain('max-age=3600');
  });

  it('returns zero stats when no jobs exist', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const { GET } = await import('@/app/api/stats/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      total_jobs: 0,
      countries: 0,
      sources: 0,
      last_updated: null,
    });
  });

  it('handles database errors gracefully', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('DB connection failed')),
      }),
    });

    const { GET } = await import('@/app/api/stats/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.errors).toEqual([
      { code: 'STATS_FETCH_ERROR', message: 'Failed to fetch stats' },
    ]);
  });
});
