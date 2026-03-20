import { describe, it, expect, vi } from 'vitest';
import { fetchZaplataJobs } from '@/lib/ingestion/zaplata';

vi.mock('@/lib/ingestion/python-runner', () => ({
  runPythonScraper: vi.fn(),
}));

describe('fetchZaplataJobs', () => {
  it('calls runPythonScraper with correct script path', async () => {
    const { runPythonScraper } = await import('@/lib/ingestion/python-runner');
    vi.mocked(runPythonScraper).mockResolvedValue([]);

    await fetchZaplataJobs();

    expect(runPythonScraper).toHaveBeenCalledWith(
      expect.stringContaining('scripts/scrapers/zaplata_scraper.py')
    );
  });

  it('returns RawJobPosting array from Python scraper', async () => {
    const mockJobs = [
      {
        external_id: 'zaplata-123',
        source: 'zaplata' as const,
        title: 'Software Developer',
        company: 'Tech Corp',
        location: 'Sofia',
        country: 'BG',
        url: 'https://zaplata.bg/job/123',
        description_raw: 'Salary: 2000 BGN\nJob description',
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        employment_type: null,
        is_remote: false,
        posted_at: null,
      },
    ];

    const { runPythonScraper } = await import('@/lib/ingestion/python-runner');
    vi.mocked(runPythonScraper).mockResolvedValue(mockJobs);

    const result = await fetchZaplataJobs();

    expect(result).toEqual(mockJobs);
    expect(result[0].source).toBe('zaplata');
    expect(result[0].country).toBe('BG');
  });

  it('handles empty results', async () => {
    const { runPythonScraper } = await import('@/lib/ingestion/python-runner');
    vi.mocked(runPythonScraper).mockResolvedValue([]);

    const result = await fetchZaplataJobs();

    expect(result).toEqual([]);
  });
});
