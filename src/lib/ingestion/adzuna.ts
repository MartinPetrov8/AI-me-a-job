import { RawJobPosting } from './types';

interface AdzunaJob {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  redirect_url: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  created: string;
  category?: { tag?: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

const ADZUNA_COUNTRIES = ['gb', 'us', 'de', 'fr', 'nl', 'au'] as const;

export async function fetchAdzunaJobs(
  country: string,
  page: number = 1
): Promise<RawJobPosting[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error('[adzuna] Missing ADZUNA_APP_ID or ADZUNA_APP_KEY');
    return [];
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=50`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[adzuna] ${country} page ${page}: HTTP ${res.status}`);
      return [];
    }

    const data = (await res.json()) as AdzunaResponse;

    return (data.results ?? []).map((job): RawJobPosting => ({
      external_id: String(job.id),
      source: 'adzuna',
      title: job.title,
      company: job.company?.display_name ?? null,
      location: job.location?.display_name ?? null,
      country: country,
      url: job.redirect_url,
      description_raw: job.description,
      salary_min: job.salary_min ?? null,
      salary_max: job.salary_max ?? null,
      salary_currency: country === 'us' ? 'USD' : country === 'gb' || country === 'au' ? (country === 'gb' ? 'GBP' : 'AUD') : 'EUR',
      employment_type: job.contract_type ?? null,
      is_remote: null,
      posted_at: job.created ? new Date(job.created) : null,
    }));
  } catch (err) {
    console.error(`[adzuna] ${country} page ${page}: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export { ADZUNA_COUNTRIES };

export async function fetchAllAdzunaJobs(): Promise<RawJobPosting[]> {
  const all: RawJobPosting[] = [];

  for (const country of ADZUNA_COUNTRIES) {
    const jobs = await fetchAdzunaJobs(country, 1);
    all.push(...jobs);
  }

  return all;
}
