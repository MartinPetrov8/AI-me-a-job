import { RawJobPosting } from './types';

interface RemoteOkJob {
  id: string;
  epoch: number;
  company: string;
  position: string;
  description: string;
  location: string;
  tags?: string[];
  url?: string;
  slug?: string;
}

function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export async function fetchRemoteOkJobs(): Promise<RawJobPosting[]> {
  const url = 'https://remoteok.com/api';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as RemoteOkJob[];

    const jobs = data.slice(1);

    return jobs.map((job): RawJobPosting => ({
      external_id: `remoteok-${job.id}`,
      source: 'remoteok',
      title: job.position,
      company: job.company || null,
      location: 'Remote',
      country: 'REMOTE',
      url: job.url || `https://remoteok.com/remote-jobs/${job.slug || job.id}`,
      description_raw: stripTags(job.description),
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      employment_type: null,
      is_remote: true,
      posted_at: new Date(job.epoch * 1000),
    }));
  } catch (err) {
    return [];
  }
}
