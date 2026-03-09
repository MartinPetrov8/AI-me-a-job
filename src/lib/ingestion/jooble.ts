import { RawJobPosting } from './types';

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
  id: string;
}

interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

export async function fetchJoobleJobs(
  keywords: string,
  location: string
): Promise<RawJobPosting[]> {
  const apiKey = process.env.JOOBLE_API_KEY;

  if (!apiKey) {
    console.error('[jooble] Missing JOOBLE_API_KEY');
    return [];
  }

  const url = `https://jooble.org/api/${encodeURIComponent(apiKey)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location, page: 1 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[jooble] HTTP ${res.status}`);
      return [];
    }

    const data = (await res.json()) as JoobleResponse;

    return (data.jobs ?? []).map((job): RawJobPosting => ({
      external_id: job.id || `jooble-${Buffer.from(job.link).toString('base64').slice(0, 32)}`,
      source: 'jooble',
      title: job.title,
      company: job.company || null,
      location: job.location || null,
      country: null,
      url: job.link,
      description_raw: job.snippet,
      salary_min: parseSalaryMin(job.salary),
      salary_max: parseSalaryMax(job.salary),
      salary_currency: null,
      employment_type: job.type || null,
      is_remote: job.title?.toLowerCase().includes('remote') || job.snippet?.toLowerCase().includes('remote') ? true : null,
      posted_at: job.updated ? new Date(job.updated) : null,
    }));
  } catch (err) {
    console.error(`[jooble] ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

function parseSalaryMin(salary: string | undefined): number | null {
  if (!salary) return null;
  const nums = salary.replace(/[^0-9.-]/g, ' ').trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
  return nums.length > 0 ? nums[0] : null;
}

function parseSalaryMax(salary: string | undefined): number | null {
  if (!salary) return null;
  const nums = salary.replace(/[^0-9.-]/g, ' ').trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
  return nums.length > 1 ? nums[1] : null;
}
