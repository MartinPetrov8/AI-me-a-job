import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchEJobsJobs } from '@/lib/ingestion/ejobs';
import * as pythonRunner from '@/lib/ingestion/python-runner';

vi.mock('@/lib/ingestion/python-runner');

describe('fetchEJobsJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runPythonScraper with correct script path', async () => {
    const mockJobs = [
      {
        external_id: 'ejobs-123',
        source: 'ejobs' as const,
        title: 'Senior Software Engineer',
        company: 'Tech Company SRL',
        location: 'Bucharest, Romania',
        country: 'RO',
        url: 'https://www.ejobs.ro/en/job/123',
        description_raw: '',
        salary_min: 5000,
        salary_max: 8000,
        salary_currency: 'RON',
        employment_type: null,
        is_remote: false,
        posted_at: new Date('2026-03-20T10:00:00Z'),
      },
    ];

    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue(mockJobs);

    const result = await fetchEJobsJobs();

    expect(pythonRunner.runPythonScraper).toHaveBeenCalledWith(
      expect.stringContaining('ejobs_scraper.py')
    );
    expect(result).toEqual(mockJobs);
  });

  it('should return empty array on error', async () => {
    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue([]);

    const result = await fetchEJobsJobs();

    expect(result).toEqual([]);
  });

  it('should handle malformed JSON gracefully', async () => {
    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue([]);

    const result = await fetchEJobsJobs();

    expect(result).toEqual([]);
  });
});
