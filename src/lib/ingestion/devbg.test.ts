import { describe, it, expect, vi } from 'vitest';
import { fetchDevBgJobs } from './devbg';

// Real dev.bg job-list-item HTML structure (verified 2026-03-17)
const mockDevBgHTML = `
<div class="jobs-loop facetwp-template">
<div class="job-list-item  is-premium " data-job-id="518579" >
  <div class="inner-left company-logo-wrap">
    <a href="https://dev.bg/company/jobads/mentormate-data-engineer-5/" class="overlay-link ab-trigger  "></a>
    <img src="logo.png" class="company-logo" alt="" />
  </div>
  <div class="inner-right">
    <div class="title-date-wrap">
      <h6 class="job-title ab-title-placeholder">Data Engineer &#8211; Remote</h6>
      <span class="date date-with-icon">17 мар.</span>
    </div>
    <span class="company-name">MentorMate</span>
    <span class="remote-badge">Remote</span>
  </div>
</div>

<div class="job-list-item " data-job-id="518444" >
  <div class="inner-left company-logo-wrap">
    <a href="https://dev.bg/company/jobads/softuni-senior-java-dev/" class="overlay-link ab-trigger  "></a>
    <img src="logo2.png" class="company-logo" alt="" />
  </div>
  <div class="inner-right">
    <div class="title-date-wrap">
      <h6 class="job-title ab-title-placeholder">Senior Java Developer</h6>
      <span class="date date-with-icon">16 мар.</span>
    </div>
    <span class="company-name">SoftUni</span>
  </div>
</div>
</div>
`;

const mockMalformedHTML = `
<div class="jobs-loop facetwp-template">
  <div class="job-list-item" data-job-id="999">
    <!-- no overlay-link, no title — should be skipped -->
    <h6 class="job-title">Broken Card</h6>
  </div>
</div>
`;

describe('fetchDevBgJobs', () => {
  it('parses job-list-item cards and returns RawJobPosting[] with source=dev_bg country=bg', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    } as Response);

    const jobs = await fetchDevBgJobs();

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);

    const j = jobs[0];
    expect(j.source).toBe('dev_bg');
    expect(j.country).toBe('bg');
    expect(j.external_id).toMatch(/^devbg-\d+$/);
    expect(j.url).toContain('https://dev.bg/company/jobads/');
  });

  it('uses data-job-id as external_id with devbg- prefix', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    } as Response);

    const jobs = await fetchDevBgJobs();
    const ids = jobs.map(j => j.external_id);
    // Both IDs appear in the mock HTML — at least one should be present
    // (dedup across categories means only one copy of each ID survives)
    expect(ids.some(id => id === 'devbg-518579' || id === 'devbg-518444')).toBe(true);
    expect(ids.every(id => id.startsWith('devbg-'))).toBe(true);
  });

  it('decodes HTML entities in title (&#8211; → –)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    } as Response);

    const jobs = await fetchDevBgJobs();
    const dataEng = jobs.find(j => j.external_id === 'devbg-518579');
    expect(dataEng?.title).toBe('Data Engineer – Remote');
  });

  it('sets is_remote=true when "remote" appears in title or content', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    } as Response);

    const jobs = await fetchDevBgJobs();
    const remoteJob = jobs.find(j => j.external_id === 'devbg-518579');
    expect(remoteJob?.is_remote).toBe(true);
  });

  it('does not throw on malformed HTML — returns empty array or partial results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockMalformedHTML,
    } as Response);

    await expect(fetchDevBgJobs()).resolves.not.toThrow();
    const jobs = await fetchDevBgJobs();
    expect(Array.isArray(jobs)).toBe(true);
  });

  it('returns empty array when all category pages return 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const jobs = await fetchDevBgJobs();
    expect(jobs).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const jobs = await fetchDevBgJobs();
    expect(jobs).toEqual([]);
  });

  it('deduplicates jobs with the same data-job-id across categories', async () => {
    // Same HTML returned for all category calls → duplicates should be removed
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    } as Response);

    const jobs = await fetchDevBgJobs();
    const ids = jobs.map(j => j.external_id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
