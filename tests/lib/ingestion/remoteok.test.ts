import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRemoteOkJobs } from '@/lib/ingestion/remoteok';

describe('RemoteOK Scraper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and maps jobs from RemoteOK API', async () => {
    const mockData = [
      { id: 'metadata' },
      {
        id: '123456',
        epoch: 1710950400,
        company: 'Acme Corp',
        position: 'Senior Software Engineer',
        description: '<p>Build great things</p>',
        location: 'Anywhere',
        tags: ['javascript', 'remote'],
        url: 'https://remoteok.com/remote-jobs/123456-senior-software-engineer',
      },
      {
        id: '789012',
        epoch: 1710864000,
        company: 'Tech Inc',
        position: 'Data Scientist',
        description: 'Work with data',
        location: 'Remote',
        slug: 'data-scientist-tech-inc',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const jobs = await fetchRemoteOkJobs();

    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      external_id: 'remoteok-123456',
      source: 'remoteok',
      title: 'Senior Software Engineer',
      company: 'Acme Corp',
      location: 'Remote',
      country: 'REMOTE',
      url: 'https://remoteok.com/remote-jobs/123456-senior-software-engineer',
      description_raw: 'Build great things',
      is_remote: true,
    });
    expect(jobs[0].posted_at).toBeInstanceOf(Date);
    expect(jobs[0].posted_at?.getTime()).toBe(1710950400 * 1000);

    expect(jobs[1]).toMatchObject({
      external_id: 'remoteok-789012',
      source: 'remoteok',
      title: 'Data Scientist',
      company: 'Tech Inc',
      location: 'Remote',
      country: 'REMOTE',
      url: 'https://remoteok.com/remote-jobs/data-scientist-tech-inc',
      description_raw: 'Work with data',
      is_remote: true,
    });
  });

  it('handles empty response gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'metadata' }],
    });

    const jobs = await fetchRemoteOkJobs();

    expect(jobs).toHaveLength(0);
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const jobs = await fetchRemoteOkJobs();

    expect(jobs).toHaveLength(0);
  });

  it('handles non-OK response gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    const jobs = await fetchRemoteOkJobs();

    expect(jobs).toHaveLength(0);
  });

  it('strips HTML tags from description', async () => {
    const mockData = [
      { id: 'metadata' },
      {
        id: '111',
        epoch: 1710950400,
        company: 'Test Co',
        position: 'Engineer',
        description: '<strong>Bold text</strong> and <em>italic</em>',
        location: 'Anywhere',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const jobs = await fetchRemoteOkJobs();

    expect(jobs[0].description_raw).toBe('Bold text and italic');
  });

  it('includes User-Agent header in request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'metadata' }],
    });

    await fetchRemoteOkJobs();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://remoteok.com/api',
      expect.objectContaining({
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
        },
      })
    );
  });
});
