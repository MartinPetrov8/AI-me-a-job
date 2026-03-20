import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBulldogJobJobs } from '@/lib/ingestion/bulldogjob';
import * as pythonRunner from '@/lib/ingestion/python-runner';

vi.mock('@/lib/ingestion/python-runner');

describe('fetchBulldogJobJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runPythonScraper with correct script path', async () => {
    const mockJobs = [
      {
        external_id: 'bulldogjob-789',
        source: 'bulldogjob' as const,
        title: 'Frontend Developer',
        company: 'Tech Solutions Poland',
        location: 'Warsaw, Poland',
        country: 'PL',
        url: 'https://bulldogjob.com/companies/jobs/789',
        description_raw: '',
        salary_min: 8000,
        salary_max: 12000,
        salary_currency: 'PLN',
        employment_type: null,
        is_remote: false,
        posted_at: new Date('2026-03-18T14:00:00Z'),
      },
    ];

    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue(mockJobs);

    const result = await fetchBulldogJobJobs();

    expect(pythonRunner.runPythonScraper).toHaveBeenCalledWith(
      expect.stringContaining('bulldogjob_scraper.py')
    );
    expect(result).toEqual(mockJobs);
  });

  it('should return empty array on error', async () => {
    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue([]);

    const result = await fetchBulldogJobJobs();

    expect(result).toEqual([]);
  });

  it('should handle malformed JSON gracefully', async () => {
    vi.spyOn(pythonRunner, 'runPythonScraper').mockResolvedValue([]);

    const result = await fetchBulldogJobJobs();

    expect(result).toEqual([]);
  });
});
