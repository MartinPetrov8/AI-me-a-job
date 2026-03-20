import { describe, it, expect, vi } from 'vitest';
import { fetchJustJoinItJobs } from '@/lib/ingestion/justjoinit';

vi.mock('@/lib/ingestion/python-runner', () => ({
  runPythonScraper: vi.fn(),
}));

describe('fetchJustJoinItJobs', () => {
  it('calls runPythonScraper with correct script path', async () => {
    const { runPythonScraper } = await import('@/lib/ingestion/python-runner');
    vi.mocked(runPythonScraper).mockResolvedValue([]);

    await fetchJustJoinItJobs();

    expect(runPythonScraper).toHaveBeenCalledWith(
      expect.stringContaining('scripts/scrapers/justjoinit_scraper.py')
    );
  });

  it('returns RawJobPosting array from Python scraper', async () => {
    const mockJobs = [
      {
        external_id: 'justjoinit-abc123',
        source: 'justjoinit' as const,
        title: 'Senior Frontend Developer',
        company: 'Polish Tech',
        location: 'Warsaw, PL',
        country: 'PL',
        url: 'https://justjoin.it/offers/abc123',
        description_raw: 'Salary: 15000 - 20000 PLN\nSkills: React, TypeScript',
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        employment_type: null,
        is_remote: true,
        posted_at: null,
      },
    ];

    const { runPythonScraper } = await import('@/lib/ingestion/python-runner');
    vi.mocked(runPythonScraper).mockResolvedValue(mockJobs);

    const result = await fetchJustJoinItJobs();

    expect(result).toEqual(mockJobs);
    expect(result[0].source).toBe('justjoinit');
    expect(result[0].country).toBe('PL');
  });

  it('handles empty results', async () => {
    const { runPythonScraper } = await import('@/lib/ingestion/python-runner');
    vi.mocked(runPythonScraper).mockResolvedValue([]);

    const result = await fetchJustJoinItJobs();

    expect(result).toEqual([]);
  });
});
