import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeWorkRemotelyJobs } from '@/lib/ingestion/weworkremotely';

describe('WeWorkRemotely Scraper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses jobs from RSS feeds', async () => {
    const mockRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Acme Corp: Senior Developer]]></title>
      <link>https://weworkremotely.com/remote-jobs/acme-senior-developer</link>
      <pubDate>Wed, 20 Mar 2026 10:00:00 +0000</pubDate>
      <description><![CDATA[<p>Great opportunity</p>]]></description>
    </item>
    <item>
      <title><![CDATA[Tech Inc: Data Engineer]]></title>
      <link>https://weworkremotely.com/remote-jobs/tech-data-engineer</link>
      <pubDate>Tue, 19 Mar 2026 15:00:00 +0000</pubDate>
      <description><![CDATA[Work with big data]]></description>
    </item>
  </channel>
</rss>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockRss,
    });

    const jobs = await fetchWeWorkRemotelyJobs();

    expect(jobs.length).toBeGreaterThanOrEqual(2);
    
    const job1 = jobs.find(j => j.title === 'Senior Developer');
    expect(job1).toBeDefined();
    expect(job1).toMatchObject({
      source: 'weworkremotely',
      title: 'Senior Developer',
      company: 'Acme Corp',
      location: 'Remote',
      country: 'REMOTE',
      url: 'https://weworkremotely.com/remote-jobs/acme-senior-developer',
      description_raw: 'Great opportunity',
      is_remote: true,
    });
    expect(job1?.external_id).toContain('weworkremotely-');

    const job2 = jobs.find(j => j.title === 'Data Engineer');
    expect(job2).toBeDefined();
    expect(job2).toMatchObject({
      source: 'weworkremotely',
      title: 'Data Engineer',
      company: 'Tech Inc',
      location: 'Remote',
      country: 'REMOTE',
      is_remote: true,
    });
  });

  it('handles title without colon format', async () => {
    const mockRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Just A Title Without Company]]></title>
      <link>https://weworkremotely.com/remote-jobs/some-job</link>
      <pubDate>Wed, 20 Mar 2026 10:00:00 +0000</pubDate>
      <description><![CDATA[Description]]></description>
    </item>
  </channel>
</rss>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockRss,
    });

    const jobs = await fetchWeWorkRemotelyJobs();

    expect(jobs.length).toBeGreaterThanOrEqual(1);
    const job = jobs.find(j => j.title === 'Just A Title Without Company');
    expect(job).toBeDefined();
    expect(job?.title).toBe('Just A Title Without Company');
    expect(job?.company).toBeNull();
  });

  it('strips HTML tags from description', async () => {
    const mockRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Company: Job]]></title>
      <link>https://weworkremotely.com/remote-jobs/job1</link>
      <pubDate>Wed, 20 Mar 2026 10:00:00 +0000</pubDate>
      <description><![CDATA[<div><strong>Bold</strong> and <em>italic</em></div>]]></description>
    </item>
  </channel>
</rss>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockRss,
    });

    const jobs = await fetchWeWorkRemotelyJobs();

    expect(jobs[0].description_raw).toBe('Bold and italic');
  });

  it('handles empty RSS feed gracefully', async () => {
    const mockRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
  </channel>
</rss>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockRss,
    });

    const jobs = await fetchWeWorkRemotelyJobs();

    expect(jobs).toHaveLength(0);
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const jobs = await fetchWeWorkRemotelyJobs();

    expect(jobs).toHaveLength(0);
  });

  it('handles non-OK response gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const jobs = await fetchWeWorkRemotelyJobs();

    expect(jobs).toHaveLength(0);
  });

  it('deduplicates jobs across multiple feeds', async () => {
    const mockRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Company: Job]]></title>
      <link>https://weworkremotely.com/remote-jobs/unique-id-123</link>
      <pubDate>Wed, 20 Mar 2026 10:00:00 +0000</pubDate>
      <description><![CDATA[Description]]></description>
    </item>
  </channel>
</rss>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockRss,
    });

    const jobs = await fetchWeWorkRemotelyJobs();

    const uniqueIds = new Set(jobs.map(j => j.external_id));
    expect(uniqueIds.size).toBe(jobs.length);
  });

  it('fetches from all 4 category feeds', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel></channel>
</rss>`,
    });

    await fetchWeWorkRemotelyJobs();

    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://weworkremotely.com/categories/remote-programming-jobs.rss',
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://weworkremotely.com/categories/remote-data-jobs.rss',
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://weworkremotely.com/categories/remote-product-jobs.rss',
      expect.anything()
    );
  });
});
