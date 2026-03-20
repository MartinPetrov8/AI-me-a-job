import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBestJobsJobs } from '@/lib/ingestion/bestjobs';
import * as pythonRunner from '@/lib/ingestion/python-runner';

vi.mock('@/lib/ingestion/python-runner');

describe('fetchBestJobsJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runPythonScraper with correct script path', async () => {
    const mockJobs = [
      {
        external_id: 'bestjobs-456',
        source: 'bestjobs' as const,
        title: 'Data Scientist',
        company: 'Analytics Inc',
        location: 'Cluj-Napoca, Romania',
        country: 'RO',
        url: 'https://www.bestjobs.eu/en/job/456',
        description_raw: '',
        salary_min: 6000,
        salary_max: 10000,
        salary_currency: 'RON',
        employment_type: null,
        is_remote: true,
        posted_at: new Date('2026-03-19T08:00:00Z'),
      },
    ];

    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue(mockJobs);

    const result = await fetchBestJobsJobs();

    expect(pythonRunner.runPythonScraper).toHaveBeenCalledWith(
      expect.stringContaining('bestjobs_scraper.py')
    );
    expect(result).toEqual(mockJobs);
  });

  it('should return empty array on error', async () => {
    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue([]);

    const result = await fetchBestJobsJobs();

    expect(result).toEqual([]);
  });

  it('should handle malformed JSON gracefully', async () => {
    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue([]);

    const result = await fetchBestJobsJobs();

    expect(result).toEqual([]);
  });
});
