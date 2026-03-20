import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestAllSources } from './ingest';
import * as adzuna from './adzuna';
import * as jooble from './jooble';
import * as devbg from './devbg';
import * as jobsbg from './jobsbg';
import * as remoteok from './remoteok';
import * as weworkremotely from './weworkremotely';
import * as nofluffjobs from './nofluffjobs';
import * as zaplata from './zaplata';
import * as justjoinit from './justjoinit';
import * as ejobs from './ejobs';
import * as bestjobs from './bestjobs';
import * as bulldogjob from './bulldogjob';
import type { RawJobPosting } from './types';

// Mock all source modules
vi.mock('./adzuna');
vi.mock('./jooble');
vi.mock('./devbg');
vi.mock('./jobsbg');
vi.mock('./remoteok');
vi.mock('./weworkremotely');
vi.mock('./nofluffjobs');
vi.mock('./zaplata');
vi.mock('./justjoinit');
vi.mock('./ejobs');
vi.mock('./bestjobs');
vi.mock('./bulldogjob');
// Mock playwright dynamic import — not available in test env
vi.mock('playwright', () => ({ chromium: { launch: vi.fn() } }));
vi.mock('../db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'mock-id-1', classifiedAt: null }])),
        })),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
}));

// Mock batch-classify to avoid LLM calls in tests
vi.mock('../llm/batch-classify', () => ({
  classifyJobsById: vi.fn(() => Promise.resolve({ total: 0, classified: 0, failed: 0, errors: [] })),
  classifyUnclassifiedJobs: vi.fn(() => Promise.resolve({ total: 0, classified: 0, failed: 0, errors: [] })),
}));

describe('ingestAllSources with dev.bg and jobs.bg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should ingest dev.bg jobs and include in results', async () => {
    const mockDevBgJobs: RawJobPosting[] = [
      {
        external_id: 'devbg-123',
        source: 'dev_bg',
        title: 'Senior Developer',
        company: 'TechCo',
        location: 'Sofia',
        country: 'bg',
        url: 'https://dev.bg/jobs/123',
        description_raw: 'Great job',
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        employment_type: null,
        is_remote: false,
        posted_at: new Date('2026-03-15'),
      },
    ];

    vi.mocked(adzuna.fetchAllAdzunaJobs).mockResolvedValue([]);
    vi.mocked(jooble.fetchJoobleJobs).mockResolvedValue([]);
    vi.mocked(devbg.fetchDevBgJobs).mockResolvedValue(mockDevBgJobs);
    vi.mocked(jobsbg.fetchJobsBgJobs).mockResolvedValue([]);
    vi.mocked(remoteok.fetchRemoteOkJobs).mockResolvedValue([]);
    vi.mocked(weworkremotely.fetchWeWorkRemotelyJobs).mockResolvedValue([]);
    vi.mocked(nofluffjobs.fetchNoFluffJobs).mockResolvedValue([]);
    vi.mocked(zaplata.fetchZaplataJobs).mockResolvedValue([]);
    vi.mocked(justjoinit.fetchJustJoinItJobs).mockResolvedValue([]);
    vi.mocked(ejobs.fetchEJobsJobs).mockResolvedValue([]);
    vi.mocked(bestjobs.fetchBestJobsJobs).mockResolvedValue([]);
    vi.mocked(bulldogjob.fetchBulldogJobJobs).mockResolvedValue([]);

    const results = await ingestAllSources();

    const devBgResult = results.find(r => r.source === 'dev_bg');
    expect(devBgResult).toBeDefined();
    expect(devBgResult?.fetched).toBe(1);
    expect(devBgResult?.new).toBeGreaterThanOrEqual(0);
  });

  it('should ingest jobs.bg jobs and include in results', async () => {
    const mockJobsBgJobs: RawJobPosting[] = [
      {
        external_id: 'jobsbg-456',
        source: 'jobs_bg',
        title: 'Data Scientist',
        company: 'DataCorp',
        location: 'Plovdiv',
        country: 'bg',
        url: 'https://www.jobs.bg/job/456',
        description_raw: 'ML role',
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        employment_type: null,
        is_remote: true,
        posted_at: new Date('2026-03-14'),
      },
    ];

    vi.mocked(adzuna.fetchAllAdzunaJobs).mockResolvedValue([]);
    vi.mocked(jooble.fetchJoobleJobs).mockResolvedValue([]);
    vi.mocked(devbg.fetchDevBgJobs).mockResolvedValue([]);
    vi.mocked(jobsbg.fetchJobsBgJobs).mockResolvedValue(mockJobsBgJobs);
    vi.mocked(remoteok.fetchRemoteOkJobs).mockResolvedValue([]);
    vi.mocked(weworkremotely.fetchWeWorkRemotelyJobs).mockResolvedValue([]);
    vi.mocked(nofluffjobs.fetchNoFluffJobs).mockResolvedValue([]);
    vi.mocked(zaplata.fetchZaplataJobs).mockResolvedValue([]);
    vi.mocked(justjoinit.fetchJustJoinItJobs).mockResolvedValue([]);
    vi.mocked(ejobs.fetchEJobsJobs).mockResolvedValue([]);
    vi.mocked(bestjobs.fetchBestJobsJobs).mockResolvedValue([]);
    vi.mocked(bulldogjob.fetchBulldogJobJobs).mockResolvedValue([]);

    const results = await ingestAllSources();

    const jobsBgResult = results.find(r => r.source === 'jobs_bg');
    expect(jobsBgResult).toBeDefined();
    expect(jobsBgResult?.fetched).toBe(1);
    expect(jobsBgResult?.new).toBeGreaterThanOrEqual(0);
  });

  it('should handle dev.bg scraper failures gracefully', async () => {
    vi.mocked(adzuna.fetchAllAdzunaJobs).mockResolvedValue([]);
    vi.mocked(jooble.fetchJoobleJobs).mockResolvedValue([]);
    vi.mocked(devbg.fetchDevBgJobs).mockRejectedValue(new Error('Network error'));
    vi.mocked(jobsbg.fetchJobsBgJobs).mockResolvedValue([]);
    vi.mocked(remoteok.fetchRemoteOkJobs).mockResolvedValue([]);
    vi.mocked(weworkremotely.fetchWeWorkRemotelyJobs).mockResolvedValue([]);
    vi.mocked(nofluffjobs.fetchNoFluffJobs).mockResolvedValue([]);
    vi.mocked(zaplata.fetchZaplataJobs).mockResolvedValue([]);
    vi.mocked(justjoinit.fetchJustJoinItJobs).mockResolvedValue([]);
    vi.mocked(ejobs.fetchEJobsJobs).mockResolvedValue([]);
    vi.mocked(bestjobs.fetchBestJobsJobs).mockResolvedValue([]);
    vi.mocked(bulldogjob.fetchBulldogJobJobs).mockResolvedValue([]);

    const results = await ingestAllSources();

    const devBgResult = results.find(r => r.source === 'dev_bg');
    expect(devBgResult).toBeDefined();
    expect(devBgResult?.errors).toBe(1);
    expect(devBgResult?.fetched).toBe(0);
  });

  it('should handle jobs.bg scraper failures gracefully', async () => {
    vi.mocked(adzuna.fetchAllAdzunaJobs).mockResolvedValue([]);
    vi.mocked(jooble.fetchJoobleJobs).mockResolvedValue([]);
    vi.mocked(devbg.fetchDevBgJobs).mockResolvedValue([]);
    vi.mocked(jobsbg.fetchJobsBgJobs).mockRejectedValue(new Error('Cloudflare block'));
    vi.mocked(remoteok.fetchRemoteOkJobs).mockResolvedValue([]);
    vi.mocked(weworkremotely.fetchWeWorkRemotelyJobs).mockResolvedValue([]);
    vi.mocked(nofluffjobs.fetchNoFluffJobs).mockResolvedValue([]);
    vi.mocked(zaplata.fetchZaplataJobs).mockResolvedValue([]);
    vi.mocked(justjoinit.fetchJustJoinItJobs).mockResolvedValue([]);
    vi.mocked(ejobs.fetchEJobsJobs).mockResolvedValue([]);
    vi.mocked(bestjobs.fetchBestJobsJobs).mockResolvedValue([]);
    vi.mocked(bulldogjob.fetchBulldogJobJobs).mockResolvedValue([]);

    const results = await ingestAllSources();

    const jobsBgResult = results.find(r => r.source === 'jobs_bg');
    expect(jobsBgResult).toBeDefined();
    expect(jobsBgResult?.errors).toBe(1);
    expect(jobsBgResult?.fetched).toBe(0);
  });
});
