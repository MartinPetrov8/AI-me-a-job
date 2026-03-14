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

// Location → country code inference for Eastern Europe
const LOCATION_TO_COUNTRY: Record<string, string> = {
  'Bulgaria': 'bg',
  'Poland': 'pl',
  'Romania': 'ro',
  'Czech Republic': 'cz',
};

function inferCountry(location: string): string | null {
  for (const [loc, code] of Object.entries(LOCATION_TO_COUNTRY)) {
    if (location.includes(loc)) {
      return code;
    }
  }
  return null;
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

    const inferredCountry = inferCountry(location);

    return (data.jobs ?? []).map((job): RawJobPosting => ({
      external_id: job.id || `jooble-${Buffer.from(job.link).toString('base64').slice(0, 32)}`,
      source: 'jooble',
      title: job.title,
      company: job.company || null,
      location: job.location || null,
      country: inferredCountry,
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

// Generic + location-targeted search configs for Eastern Europe
const JOOBLE_SEARCHES = [
  // Existing generic searches
  { keywords: 'software engineer', location: '' },
  { keywords: 'data scientist', location: '' },
  { keywords: 'product manager', location: '' },
  // Eastern Europe targeted (BG, PL, RO, CZ) — 12 configs
  { keywords: 'software developer', location: 'Bulgaria' },
  { keywords: 'data scientist', location: 'Bulgaria' },
  { keywords: 'software engineer', location: 'Bulgaria' },
  { keywords: 'data analyst', location: 'Bulgaria' },
  { keywords: 'product manager', location: 'Bulgaria' },
  { keywords: 'software developer', location: 'Poland' },
  { keywords: 'software engineer', location: 'Poland' },
  { keywords: 'data scientist', location: 'Poland' },
  { keywords: 'software developer', location: 'Romania' },
  { keywords: 'data analyst', location: 'Romania' },
  { keywords: 'software engineer', location: 'Czech Republic' },
  { keywords: 'data analyst', location: 'Czech Republic' },
] as const;

export async function fetchAllJoobleJobs(): Promise<RawJobPosting[]> {
  const all: RawJobPosting[] = [];
  const seen = new Set<string>();

  for (const { keywords, location } of JOOBLE_SEARCHES) {
    console.log(`[jooble] Fetching "${keywords}" in "${location || 'global'}"`);
    const jobs = await fetchJoobleJobs(keywords, location);
    // Deduplicate by external_id
    for (const job of jobs) {
      if (!seen.has(job.external_id)) {
        seen.add(job.external_id);
        all.push(job);
      }
    }
  }

  console.log(`[jooble] Total unique jobs fetched: ${all.length}`);
  return all;
}

export { JOOBLE_SEARCHES };
