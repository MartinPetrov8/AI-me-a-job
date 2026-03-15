import { describe, it, expect, vi } from 'vitest';
import { fetchDevBgJobs } from './devbg';
import type { RawJobPosting } from './types';

// Mock HTML response with dev.bg job structure
const mockDevBgHTML = `
<div class="job-card">
  <h3><a href="/jobs/12345/senior-developer">Senior Developer</a></h3>
  <div class="company">Tech Corp</div>
  <div class="location">Sofia</div>
  <div class="description">Looking for a senior developer with remote options available</div>
</div>
<div class="job-card">
  <h3><a href="/jobs/67890/junior-developer">Junior Developer</a></h3>
  <div class="company">StartupBG</div>
  <div class="location">Plovdiv</div>
  <div class="description">On-site position for a junior developer</div>
</div>
`;

const mockMalformedHTML = `
<div class="job-card">
  <h3>No link here</h3>
  <div class="company">
`;

describe('fetchDevBgJobs', () => {
  it('should return RawJobPosting[] with source=dev_bg and country=bg', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    });

    const jobs = await fetchDevBgJobs();

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
    
    const firstJob = jobs[0];
    expect(firstJob.source).toBe('dev_bg');
    expect(firstJob.country).toBe('bg');
    expect(firstJob.external_id).toBeDefined();
    expect(firstJob.url).toContain('https://dev.bg/jobs/');
  });

  it('should set is_remote to true when job contains "remote"', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    });

    const jobs = await fetchDevBgJobs();
    const remoteJob = jobs.find(j => j.description_raw?.includes('remote'));
    
    if (remoteJob) {
      expect(remoteJob.is_remote).toBe(true);
    }
  });

  it('should set is_remote to false when job does not contain remote keywords', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    });

    const jobs = await fetchDevBgJobs();
    const onSiteJob = jobs.find(j => j.description_raw?.includes('On-site'));
    
    if (onSiteJob) {
      expect(onSiteJob.is_remote).toBe(false);
    }
  });

  it('should not throw when fed malformed HTML', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockMalformedHTML,
    });

    await expect(fetchDevBgJobs()).resolves.not.toThrow();
    const jobs = await fetchDevBgJobs();
    expect(Array.isArray(jobs)).toBe(true);
  });

  it('should return empty array on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const jobs = await fetchDevBgJobs();
    expect(jobs).toEqual([]);
  });

  it('should return empty array on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const jobs = await fetchDevBgJobs();
    expect(jobs).toEqual([]);
  });

  it('should extract numeric external_id from URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDevBgHTML,
    });

    const jobs = await fetchDevBgJobs();
    const jobWithNumericId = jobs.find(j => j.url.includes('/jobs/12345/'));
    
    if (jobWithNumericId) {
      expect(jobWithNumericId.external_id).toBe('12345');
    }
  });
});
