import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNoFluffJobs } from '@/lib/ingestion/nofluffjobs';

describe('NoFluffJobs Scraper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and maps jobs from NoFluffJobs API', async () => {
    const mockPage1 = {
      postings: [
        {
          id: 'job123',
          title: 'Senior Backend Developer',
          name: 'Acme Corp',
          location: {
            places: [{ city: 'Warsaw' }],
            fullyRemote: false,
          },
          salary: {
            from: 15000,
            to: 20000,
            currency: 'PLN',
          },
          posted: '2026-03-20T10:00:00Z',
          url: 'senior-backend-developer-acme',
          technology: 'Python',
          seniority: ['senior'],
        },
        {
          id: 'job456',
          title: 'Frontend Engineer',
          name: 'Tech Inc',
          location: {
            fullyRemote: true,
          },
          posted: '2026-03-19T15:00:00Z',
          url: 'frontend-engineer-tech',
          technology: 'React',
          seniority: ['mid', 'senior'],
        },
      ],
      totalCount: 100,
      totalPages: 5,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPage1,
    });

    const jobs = await fetchNoFluffJobs();

    expect(jobs.length).toBeGreaterThanOrEqual(2);

    const job1 = jobs.find(j => j.external_id === 'nofluffjobs-job123');
    expect(job1).toBeDefined();
    expect(job1).toMatchObject({
      external_id: 'nofluffjobs-job123',
      source: 'nofluffjobs',
      title: 'Senior Backend Developer',
      company: 'Acme Corp',
      location: 'Warsaw',
      country: 'PL',
      url: 'https://nofluffjobs.com/job/senior-backend-developer-acme',
      salary_min: 15000,
      salary_max: 20000,
      salary_currency: 'PLN',
      is_remote: false,
    });
    expect(job1?.description_raw).toContain('Python');
    expect(job1?.description_raw).toContain('senior');

    const job2 = jobs.find(j => j.external_id === 'nofluffjobs-job456');
    expect(job2).toBeDefined();
    expect(job2).toMatchObject({
      external_id: 'nofluffjobs-job456',
      source: 'nofluffjobs',
      title: 'Frontend Engineer',
      company: 'Tech Inc',
      location: 'Remote',
      country: 'PL',
      is_remote: true,
    });
  });

  it('fetches multiple pages with pagination', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      const pageNum = new URL(url).searchParams.get('page');
      
      return {
        ok: true,
        json: async () => ({
          postings: [
            {
              id: `job-page${pageNum}-${callCount}`,
              title: `Job ${pageNum}`,
              name: 'Company',
              location: { fullyRemote: true },
              url: `job-${pageNum}`,
              posted: '2026-03-20T10:00:00Z',
            },
          ],
        }),
      };
    });

    const jobs = await fetchNoFluffJobs();

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://nofluffjobs.com/api/posting?page=1',
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://nofluffjobs.com/api/posting?page=2',
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://nofluffjobs.com/api/posting?page=3',
      expect.anything()
    );
  });

  it('handles location mapping correctly', async () => {
    const mockData = {
      postings: [
        {
          id: 'job1',
          title: 'Remote Job',
          name: 'Company A',
          location: { fullyRemote: true },
          url: 'remote-job',
          posted: '2026-03-20T10:00:00Z',
        },
        {
          id: 'job2',
          title: 'On-site Job',
          name: 'Company B',
          location: {
            places: [{ city: 'Krakow' }],
            fullyRemote: false,
          },
          url: 'onsite-job',
          posted: '2026-03-20T10:00:00Z',
        },
        {
          id: 'job3',
          title: 'No Location Job',
          name: 'Company C',
          location: {},
          url: 'no-location-job',
          posted: '2026-03-20T10:00:00Z',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const jobs = await fetchNoFluffJobs();

    expect(jobs[0].location).toBe('Remote');
    expect(jobs[0].is_remote).toBe(true);

    expect(jobs[1].location).toBe('Krakow');
    expect(jobs[1].is_remote).toBe(false);

    expect(jobs[2].location).toBe('Poland');
    expect(jobs[2].is_remote).toBe(false);
  });

  it('handles empty response gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ postings: [] }),
    });

    const jobs = await fetchNoFluffJobs();

    expect(jobs).toHaveLength(0);
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const jobs = await fetchNoFluffJobs();

    expect(jobs).toHaveLength(0);
  });

  it('handles non-OK response gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const jobs = await fetchNoFluffJobs();

    expect(jobs).toHaveLength(0);
  });

  it('stops pagination on empty page', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          json: async () => ({
            postings: [
              {
                id: 'job1',
                title: 'Job',
                name: 'Company',
                location: { fullyRemote: true },
                url: 'job-1',
                posted: '2026-03-20T10:00:00Z',
              },
            ],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ postings: [] }),
      };
    });

    const jobs = await fetchNoFluffJobs();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(jobs).toHaveLength(1);
  });

  it('deduplicates jobs across pages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        postings: [
          {
            id: 'duplicate-job',
            title: 'Job',
            name: 'Company',
            location: { fullyRemote: true },
            url: 'job',
            posted: '2026-03-20T10:00:00Z',
          },
        ],
      }),
    });

    const jobs = await fetchNoFluffJobs();

    const uniqueIds = new Set(jobs.map(j => j.external_id));
    expect(uniqueIds.size).toBe(1);
  });
});
